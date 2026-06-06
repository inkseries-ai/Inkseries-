import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
  getCurrentUser,
} from "@getmocha/users-service/backend";

const app = new Hono<{ Bindings: Env }>();

// ===================
// EMAIL TEMPLATES
// ===================

const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #1a1a1a; font-family: Arial, Helvetica, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #262626; border-radius: 12px; border: 1px solid #3d3d3d;">
    ${content}
  </div>
  <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #737373;">
    © ${new Date().getFullYear()} Inkseries. All rights reserved.
  </p>
</body>
</html>
`;

const emailHeader = (title: string) => `
<div style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #3d3d3d; text-align: center;">
  <img src="https://sitmr2etn6sue.mochausercontent.com/favicon.png" alt="Inkseries" style="width: 48px; height: 48px; margin-bottom: 16px;">
  <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #f5f5f5;">${title}</h1>
</div>
`;

const emailBody = (content: string) => `
<div style="padding: 32px 40px;">
  ${content}
</div>
`;

const emailButton = (text: string, url: string) => `
<a href="${url}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background-color: #d97706; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 8px;">${text}</a>
`;

const emailFooter = (text: string) => `
<div style="padding: 24px 40px; border-top: 1px solid #3d3d3d; text-align: center;">
  <p style="margin: 0; font-size: 12px; color: #a3a3a3;">${text}</p>
</div>
`;

// Helper to count words accurately
const countWords = (text: string | null | undefined): number => {
  if (!text || typeof text !== 'string') return 0;
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (normalized === '') return 0;
  return normalized.split(' ').length;
};

// Helper to convert R2 avatar paths to API URLs
const convertAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("avatars/")) {
    const parts = avatarUrl.split("/");
    if (parts.length >= 3) {
      return `/api/avatars/${parts[1]}/${parts[2]}`;
    }
  }
  return avatarUrl;
};

// ===================
// NOVELS API
// ===================

// Get all novels (with optional filters)
app.get("/api/novels", async (c) => {
  const genre = c.req.query("genre");
  const status = c.req.query("status");
  const featured = c.req.query("featured");
  const search = c.req.query("search");
  const sort = c.req.query("sort") || "newest";
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  let query = `
    SELECT n.*, COALESCE(n.author_name, up.display_name) as author_name, up.avatar_url as author_avatar,
           (SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id AND c.is_published = 1) as total_chapters,
           (SELECT COUNT(*) FROM novel_ratings nr WHERE nr.novel_id = n.id) as rating_count,
           (SELECT AVG(nr.rating) FROM novel_ratings nr WHERE nr.novel_id = n.id) as avg_rating
    FROM novels n
    LEFT JOIN user_profiles up ON n.author_id = up.id
    WHERE n.status != 'draft'
  `;
  const params: (string | number)[] = [];

  if (genre && genre !== "all") {
    query += ` AND n.genre = ?`;
    params.push(genre);
  }
  if (status && status !== "all") {
    query += ` AND n.status = ?`;
    params.push(status);
  }
  if (featured === "true") {
    query += ` AND n.is_featured = 1`;
  }
  if (search) {
    query += ` AND (n.title LIKE ? OR n.synopsis LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  // Sorting
  switch (sort) {
    case "popular":
      query += ` ORDER BY n.total_reads DESC`;
      break;
    case "rating":
      query += ` ORDER BY n.rating DESC`;
      break;
    case "oldest":
      query += ` ORDER BY n.created_at ASC`;
      break;
    default:
      query += ` ORDER BY n.created_at DESC`;
  }

  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const novels = await c.env.DB.prepare(query).bind(...params).all();
  
  // Convert avatar URLs for all novels
  const processedNovels = novels.results.map((novel: any) => ({
    ...novel,
    author_avatar: convertAvatarUrl(novel.author_avatar),
  }));
  
  // Cache novels list for 60 seconds (fast loading on repeat visits)
  return c.json({ novels: processedNovels }, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    }
  });
});

// Get single novel by slug
app.get("/api/novels/:slug", async (c) => {
  const slugOrId = c.req.param("slug");
  
  // Check if user is admin (optional auth)
  let isAdmin = false;
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (sessionToken) {
    try {
      const user = await getCurrentUser(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
      if (user) {
        isAdmin = await isUserAdmin(user.id, c.env.DB);
      }
    } catch {
      // Not logged in, that's fine
    }
  }
  
  // Try to find by slug first, then by numeric ID as fallback
  let novel = await c.env.DB.prepare(`
    SELECT n.*, COALESCE(n.author_name, up.display_name) as author_name, up.avatar_url as author_avatar, up.bio as author_bio
    FROM novels n
    LEFT JOIN user_profiles up ON n.author_id = up.id
    WHERE n.slug = ?
  `).bind(slugOrId).first();
  
  // If not found by slug and input looks like a number, try by ID
  if (!novel && /^\d+$/.test(slugOrId)) {
    novel = await c.env.DB.prepare(`
      SELECT n.*, COALESCE(n.author_name, up.display_name) as author_name, up.avatar_url as author_avatar, up.bio as author_bio
      FROM novels n
      LEFT JOIN user_profiles up ON n.author_id = up.id
      WHERE n.id = ?
    `).bind(parseInt(slugOrId)).first();
  }

  if (!novel) {
    return c.json({ error: "Novel not found" }, 404);
  }

  // Get chapters list (without content)
  // For admins: show all published chapters
  // For users: show released chapters + upcoming scheduled chapters (with locked status)
  
  const chaptersQuery = `
    SELECT id, chapter_number, part_number, season_id, title, word_count, is_premium, is_published, audio_url, published_at, scheduled_release_at, content
    FROM chapters
    WHERE novel_id = ? AND is_published = 1
    ORDER BY season_id ASC NULLS FIRST, part_number ASC, chapter_number ASC
  `;
  
  const chapters = await c.env.DB.prepare(chaptersQuery).bind(novel.id).all();

  // Get seasons for this novel
  const seasonsQuery = `
    SELECT id, season_number, title, synopsis, cover_image_url, release_date,
      (SELECT COUNT(*) FROM chapters WHERE season_id = seasons.id AND is_published = 1) as episode_count
    FROM seasons
    WHERE novel_id = ?
    ORDER BY season_number ASC
  `;
  const seasons = await c.env.DB.prepare(seasonsQuery).bind(novel.id).all();
  
  // Mark chapters as locked/unlocked based on scheduled_release_at
  const processedChapters = chapters.results.map((ch: Record<string, unknown>) => {
    const scheduledAt = ch.scheduled_release_at as string | null;
    const isLocked = scheduledAt ? new Date(scheduledAt) > new Date() : false;
    const content = ch.content as string | null;
    const isPremium = ch.is_premium === 1;
    const chapterNum = ch.chapter_number as number;
    const isFirstThree = chapterNum <= 3;
    
    // Generate preview for premium locked chapters (not first 3, not scheduled)
    let preview = null;
    if (isPremium && !isFirstThree && !isLocked && content) {
      // Get first ~200 chars as preview
      const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      preview = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
    }
    
    return {
      ...ch,
      content: undefined, // Don't send full content in list
      is_locked: isLocked,
      scheduled_release_at: scheduledAt,
      season_id: ch.season_id,
      preview: preview,
      // Hide word_count for locked chapters
      word_count: isLocked && !isAdmin ? null : ch.word_count,
    };
  });
  
  // Find next upcoming episode for countdown
  const nextEpisode = processedChapters.find((ch) => ch.is_locked);

  return c.json({ 
    novel: {
      ...novel,
      author_avatar: convertAvatarUrl(novel.author_avatar as string | null),
    }, 
    chapters: processedChapters,
    seasons: seasons.results,
    next_episode_release: nextEpisode ? nextEpisode.scheduled_release_at : null,
  });
});

// ===================
// CHAPTERS API
// ===================

// Get chapter content
app.get("/api/novels/:slug/chapters/:chapterNum", async (c) => {
  const slugOrId = c.req.param("slug");
  const chapterNum = parseInt(c.req.param("chapterNum"));
  
  // Optional auth - try to get user if logged in
  let user = null;
  let isAdmin = false;
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (sessionToken) {
    try {
      user = await getCurrentUser(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
      if (user) {
        isAdmin = await isUserAdmin(user.id, c.env.DB);
      }
    } catch {
      // Not logged in, that's fine
    }
  }

  // Get the novel first - try by slug, then by numeric ID
  let novel = await c.env.DB.prepare(`SELECT id, title, slug FROM novels WHERE slug = ?`).bind(slugOrId).first() as { id: number; title: string; slug: string | null } | null;
  if (!novel && /^\d+$/.test(slugOrId)) {
    novel = await c.env.DB.prepare(`SELECT id, title, slug FROM novels WHERE id = ?`).bind(parseInt(slugOrId)).first() as { id: number; title: string; slug: string | null } | null;
  }
  if (!novel) {
    return c.json({ error: "Novel not found" }, 404);
  }

  // Get the chapter
  const chapter = await c.env.DB.prepare(`
    SELECT * FROM chapters
    WHERE novel_id = ? AND chapter_number = ? AND is_published = 1
  `).bind(novel.id, chapterNum).first();

  if (!chapter) {
    return c.json({ error: "Chapter not found" }, 404);
  }

  // Check if chapter is scheduled for the future (locked)
  const scheduledAt = chapter.scheduled_release_at as string | null;
  const isLocked = scheduledAt ? new Date(scheduledAt) > new Date() : false;
  
  if (isLocked && !isAdmin) {
    return c.json({ 
      error: "Episode not yet released", 
      is_locked: true,
      scheduled_release_at: scheduledAt,
      chapter_number: chapterNum,
      title: chapter.title,
    }, 403);
  }

  // Check if premium and user has access
  // First 3 chapters are always free regardless of is_premium flag
  // Admins can read all episodes without restrictions
  const isFirstThreeChapters = chapterNum <= 3;
  
  if (chapter.is_premium && !isFirstThreeChapters && !isAdmin) {
    // Check if user has access (logged-in users with subscription/trial)
    let hasAccess = false;
    
    if (user) {
      // Check user's subscription or trial
      const profile = await c.env.DB.prepare(`
        SELECT subscription_tier, subscription_expires_at, trial_started_at FROM user_profiles WHERE auth_user_id = ?
      `).bind(user.id).first() as { subscription_tier: string | null; subscription_expires_at: string | null; trial_started_at: string | null } | null;

      // Check active subscription
      const hasSubscription = profile && 
        profile.subscription_tier !== 'free' && 
        profile.subscription_expires_at && 
        new Date(profile.subscription_expires_at) > new Date();
      
      // Check active 3-day trial
      let hasActiveTrial = false;
      if (profile?.trial_started_at && !hasSubscription) {
        const trialStart = new Date(profile.trial_started_at);
        const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        hasActiveTrial = new Date() < trialEnd;
      }

      hasAccess = hasSubscription || hasActiveTrial;
    }

    // For non-logged-in users OR logged-in users without subscription, show subscribe prompt
    if (!hasAccess) {
      return c.json({ error: "Subscription required for premium content", requiresSubscription: true, isLoggedIn: !!user }, 403);
    }
  }

  // Get adjacent chapters for navigation (only released ones)
  const now = new Date().toISOString();
  const prevChapter = await c.env.DB.prepare(`
    SELECT chapter_number, title FROM chapters
    WHERE novel_id = ? AND chapter_number < ? AND is_published = 1
      AND (scheduled_release_at IS NULL OR scheduled_release_at <= ?)
    ORDER BY chapter_number DESC LIMIT 1
  `).bind(novel.id, chapterNum, now).first();

  const nextChapter = await c.env.DB.prepare(`
    SELECT chapter_number, title, scheduled_release_at FROM chapters
    WHERE novel_id = ? AND chapter_number > ? AND is_published = 1
      AND (scheduled_release_at IS NULL OR scheduled_release_at <= ?)
    ORDER BY chapter_number ASC LIMIT 1
  `).bind(novel.id, chapterNum, now).first();
  
  // Also get the next scheduled episode for countdown
  const nextScheduled = await c.env.DB.prepare(`
    SELECT chapter_number, title, scheduled_release_at FROM chapters
    WHERE novel_id = ? AND chapter_number > ? AND is_published = 1
      AND scheduled_release_at > ?
    ORDER BY chapter_number ASC LIMIT 1
  `).bind(novel.id, chapterNum, now).first();

  // Increment read count only for unique readers (first episode read per novel)
  if (user) {
    // Check if this user has read any chapter from this novel before
    const hasReadNovel = await c.env.DB.prepare(`
      SELECT 1 FROM chapters_read cr
      JOIN chapters ch ON cr.chapter_id = ch.id
      WHERE cr.user_id = ? AND ch.novel_id = ?
      LIMIT 1
    `).bind(user.id, novel.id).first();
    
    if (!hasReadNovel) {
      await c.env.DB.prepare(`UPDATE novels SET total_reads = total_reads + 1 WHERE id = ?`).bind(novel.id).run();
    }
  }

  return c.json({
    chapter,
    novel: { id: novel.id, title: novel.title, slug: novel.slug || slugOrId },
    navigation: { prev: prevChapter, next: nextChapter },
    next_scheduled: nextScheduled,
  });
});

// ===================
// USER LIBRARY API
// ===================

// Get user's library (bookmarked novels)
app.get("/api/library", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  if (!profile) {
    return c.json({ library: [] });
  }

  const library = await c.env.DB.prepare(`
    SELECT ul.*, n.title, COALESCE(n.slug, CAST(n.id AS TEXT)) as slug, n.cover_image_url, n.genre,
           COALESCE(n.author_name, up.display_name) as author_name,
           (SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id AND c.is_published = 1) as total_chapters
    FROM user_libraries ul
    JOIN novels n ON ul.novel_id = n.id
    LEFT JOIN user_profiles up ON n.author_id = up.id
    WHERE ul.user_id = ? AND (ul.is_bookmarked = 1 OR ul.last_read_chapter > 0)
    ORDER BY ul.updated_at DESC
  `).bind(profile.id).all();

  return c.json({ library: library.results });
});

// Add/update library entry
app.post("/api/library/:novelId", authMiddleware, async (c) => {
  const user = c.get("user");
  const novelId = parseInt(c.req.param("novelId"));
  const body = await c.req.json();

  // Get or create user profile
  let profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  if (!profile) {
    await c.env.DB.prepare(`INSERT INTO user_profiles (auth_user_id, display_name, avatar_url, email, trial_started_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .bind(user!.id, user!.google_user_data?.name || "Reader", user!.google_user_data?.picture || null, user!.google_user_data?.email || null).run();
    profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  }

  // Check if entry exists
  const existing = await c.env.DB.prepare(`
    SELECT id FROM user_libraries WHERE user_id = ? AND novel_id = ?
  `).bind(profile!.id, novelId).first();

  if (existing) {
    // Update existing entry
    const updates: string[] = [];
    const params: (string | number | boolean)[] = [];
    
    if (body.is_bookmarked !== undefined) {
      updates.push("is_bookmarked = ?");
      params.push(body.is_bookmarked ? 1 : 0);
    }
    if (body.last_read_chapter !== undefined) {
      updates.push("last_read_chapter = ?");
      params.push(body.last_read_chapter);
    }
    if (body.scroll_position !== undefined) {
      updates.push("scroll_position = ?");
      params.push(body.scroll_position);
    }
    updates.push("updated_at = CURRENT_TIMESTAMP");

    await c.env.DB.prepare(`UPDATE user_libraries SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params, existing.id).run();
  } else {
    // Create new entry
    await c.env.DB.prepare(`
      INSERT INTO user_libraries (user_id, novel_id, is_bookmarked, last_read_chapter, scroll_position)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      profile!.id,
      novelId,
      body.is_bookmarked ? 1 : 0,
      body.last_read_chapter || 0,
      body.scroll_position || 0
    ).run();
  }

  return c.json({ success: true });
});

// ===================
// READING STREAKS API
// ===================

// Get user's streak data
app.get("/api/streaks", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get or create streak record
  let streak = await c.env.DB.prepare(`
    SELECT * FROM user_streaks WHERE user_id = ?
  `).bind(user!.id).first();
  
  if (!streak) {
    await c.env.DB.prepare(`
      INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_days_read)
      VALUES (?, 0, 0, 0)
    `).bind(user!.id).run();
    streak = { current_streak: 0, longest_streak: 0, total_days_read: 0, last_read_date: null };
  }
  
  // Get reading activity for last 7 days for the calendar display
  const recentActivity = await c.env.DB.prepare(`
    SELECT read_date, chapters_read, minutes_read
    FROM reading_activity
    WHERE user_id = ?
    ORDER BY read_date DESC
    LIMIT 30
  `).bind(user!.id).all();
  
  return c.json({
    currentStreak: streak.current_streak,
    longestStreak: streak.longest_streak,
    totalDaysRead: streak.total_days_read,
    lastReadDate: streak.last_read_date,
    recentActivity: recentActivity.results
  });
});

// Record reading activity (call when user reads a chapter)
app.post("/api/streaks/record", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const chapterId = body.chapter_id as number | undefined;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Check if this specific chapter was already read (only count unique chapters)
  let isNewChapter = false;
  if (chapterId) {
    const alreadyRead = await c.env.DB.prepare(`
      SELECT id FROM chapters_read WHERE user_id = ? AND chapter_id = ?
    `).bind(user!.id, chapterId).first();
    
    if (!alreadyRead) {
      // Mark this chapter as read
      await c.env.DB.prepare(`
        INSERT INTO chapters_read (user_id, chapter_id) VALUES (?, ?)
      `).bind(user!.id, chapterId).run();
      isNewChapter = true;
    }
  }
  
  // Check if already recorded today for streaks
  const existingActivity = await c.env.DB.prepare(`
    SELECT * FROM reading_activity WHERE user_id = ? AND read_date = ?
  `).bind(user!.id, today).first() as { id: number; chapters_read: number } | null;
  
  // Only update daily chapters count if this is a new unique chapter
  if (isNewChapter) {
    if (existingActivity) {
      await c.env.DB.prepare(`
        UPDATE reading_activity 
        SET chapters_read = chapters_read + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(existingActivity.id).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO reading_activity (user_id, read_date, chapters_read)
        VALUES (?, ?, 1)
      `).bind(user!.id, today).run();
    }
  } else if (!existingActivity) {
    // Still record the day even if not a new chapter (for streak tracking)
    await c.env.DB.prepare(`
      INSERT INTO reading_activity (user_id, read_date, chapters_read)
      VALUES (?, ?, 0)
    `).bind(user!.id, today).run();
  }
  
  // Now update the streak
  let streak = await c.env.DB.prepare(`
    SELECT * FROM user_streaks WHERE user_id = ?
  `).bind(user!.id).first() as { current_streak: number; longest_streak: number; total_days_read: number; last_read_date: string | null } | null;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let newCurrentStreak = 1;
  let newLongestStreak = streak?.longest_streak || 0;
  let newTotalDays = streak?.total_days_read || 0;
  
  // Only increment total days if this is a new day
  if (!existingActivity) {
    newTotalDays += 1;
  }
  
  if (streak?.last_read_date === today) {
    // Already read today, don't change streak
    newCurrentStreak = streak.current_streak;
  } else if (streak?.last_read_date === yesterdayStr) {
    // Continuing streak from yesterday
    newCurrentStreak = (streak.current_streak || 0) + 1;
  }
  // else: streak broken or first time, start at 1
  
  if (newCurrentStreak > newLongestStreak) {
    newLongestStreak = newCurrentStreak;
  }
  
  if (streak) {
    await c.env.DB.prepare(`
      UPDATE user_streaks 
      SET current_streak = ?, longest_streak = ?, total_days_read = ?, last_read_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(newCurrentStreak, newLongestStreak, newTotalDays, today, user!.id).run();
  } else {
    await c.env.DB.prepare(`
      INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_days_read, last_read_date)
      VALUES (?, ?, ?, ?, ?)
    `).bind(user!.id, newCurrentStreak, newLongestStreak, newTotalDays, today).run();
  }
  
  // Only increment total chapters read if this is a new unique chapter
  if (isNewChapter) {
    await c.env.DB.prepare(`
      UPDATE user_streaks 
      SET total_chapters_read = COALESCE(total_chapters_read, 0) + 1,
          reading_level = CASE
            WHEN COALESCE(total_chapters_read, 0) + 1 >= 1000 THEN 'legend'
            WHEN COALESCE(total_chapters_read, 0) + 1 >= 500 THEN 'master'
            WHEN COALESCE(total_chapters_read, 0) + 1 >= 200 THEN 'scholar'
            WHEN COALESCE(total_chapters_read, 0) + 1 >= 100 THEN 'avid_reader'
            WHEN COALESCE(total_chapters_read, 0) + 1 >= 50 THEN 'story_lover'
            WHEN COALESCE(total_chapters_read, 0) + 1 >= 20 THEN 'page_turner'
            WHEN COALESCE(total_chapters_read, 0) + 1 >= 5 THEN 'bookworm'
            ELSE 'new_reader'
          END
      WHERE user_id = ?
    `).bind(user!.id).run();
    
    // Trigger referral completion on first chapter read
    await completeReferralOnFirstRead(user!.id, c.env.DB, c.env);
  }

  return c.json({
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    totalDaysRead: newTotalDays,
    lastReadDate: today,
    newChapterRecorded: isNewChapter
  });
});

// Get reading level
app.get("/api/reading-level", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get accurate count from chapters_read table (unique episodes actually read)
  const actualCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM chapters_read WHERE user_id = ?
  `).bind(user!.id).first() as { count: number } | null;
  
  const chaptersRead = actualCount?.count || 0;
  
  // Calculate current level based on actual count
  const levels = [
    { id: 'new_reader', name: 'New Reader', min: 0 },
    { id: 'bookworm', name: 'Bookworm', min: 5 },
    { id: 'page_turner', name: 'Page Turner', min: 20 },
    { id: 'story_lover', name: 'Story Lover', min: 50 },
    { id: 'avid_reader', name: 'Avid Reader', min: 100 },
    { id: 'scholar', name: 'Scholar', min: 200 },
    { id: 'master', name: 'Master', min: 500 },
    { id: 'legend', name: 'Legend', min: 1000 },
  ];
  
  // Find current level based on actual count
  let currentLevelIndex = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (chaptersRead >= levels[i].min) {
      currentLevelIndex = i;
      break;
    }
  }
  
  const level = levels[currentLevelIndex].id;
  const currentLevel = levels[currentLevelIndex];
  const nextLevel = levels[currentLevelIndex + 1] || null;
  
  let progress = 100;
  let chaptersToNextLevel = null;
  
  if (nextLevel) {
    const chaptersInLevel = nextLevel.min - currentLevel.min;
    const chaptersProgress = chaptersRead - currentLevel.min;
    progress = Math.min(100, Math.floor((chaptersProgress / chaptersInLevel) * 100));
    chaptersToNextLevel = nextLevel.min - chaptersRead;
  }
  
  return c.json({
    level: level,
    levelName: currentLevel.name,
    totalChaptersRead: chaptersRead,
    chaptersToNextLevel,
    nextLevelName: nextLevel?.name || null,
    progress
  });
});

// ===================
// BADGES API
// ===================

// Get user badges and progress
app.get("/api/badges", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get earned badges
  const earnedBadges = await c.env.DB.prepare(`
    SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?
  `).bind(user!.id).all();
  
  // Get streak data
  const streak = await c.env.DB.prepare(`
    SELECT current_streak, longest_streak, total_chapters_read FROM user_streaks WHERE user_id = ?
  `).bind(user!.id).first() as { current_streak: number; longest_streak: number; total_chapters_read: number } | null;
  
  // Get comments count
  const commentsRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM chapter_comments WHERE user_id = ?
  `).bind(user!.id).first() as { count: number } | null;
  
  // Get ratings count
  const ratingsRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM novel_ratings WHERE user_id = ?
  `).bind(user!.id).first() as { count: number } | null;
  
  // Get referrals count (converted only)
  const referralsRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ? AND status = 'converted'
  `).bind(user!.id).first() as { count: number } | null;
  
  // Get library count
  const libraryRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM user_libraries WHERE user_id = ? AND is_bookmarked = 1
  `).bind(user!.id).first() as { count: number } | null;
  
  // Get completed novels count (compare against actual published chapters)
  const completedRes = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT ul.novel_id) as count 
    FROM user_libraries ul
    WHERE ul.user_id = ? 
      AND ul.last_read_chapter >= (SELECT COUNT(*) FROM chapters WHERE novel_id = ul.novel_id AND is_published = 1)
      AND (SELECT COUNT(*) FROM chapters WHERE novel_id = ul.novel_id AND is_published = 1) > 0
  `).bind(user!.id).first() as { count: number } | null;
  
  // Get unique genres read
  const genresRes = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT n.genre) as count 
    FROM user_libraries ul
    JOIN novels n ON ul.novel_id = n.id
    WHERE ul.user_id = ? AND ul.last_read_chapter > 0
  `).bind(user!.id).first() as { count: number } | null;
  
  // Calculate total XP from earned badges
  const badgeXPMap: Record<string, number> = {
    welcome_aboard: 20, first_bookmark: 15,
    first_chapter: 10, bookworm: 50, voracious_reader: 150, literary_legend: 500, story_master: 1000,
    first_finish: 100, trilogy_complete: 250, series_slayer: 600,
    getting_started: 30, week_warrior: 75, fortnight_force: 150, monthly_master: 400, eternal_reader: 1500,
    first_comment: 15, conversationalist: 100, community_pillar: 350, first_rating: 10, taste_maker: 80,
    friend_maker: 200, ambassador: 750,
    library_started: 25, collector: 100, archivist: 300, genre_explorer: 50, genre_master: 250,
    early_bird: 500, night_owl: 25, binge_reader: 100, subscriber: 200, annual_member: 500, competition_winner: 2000
  };
  
  const totalXP = ((earnedBadges.results || []) as { badge_id: string }[]).reduce((sum, b) => {
    return sum + (badgeXPMap[b.badge_id] || 0);
  }, 0);
  
  return c.json({
    badges: earnedBadges.results || [],
    progress: {
      chapters_read: streak?.total_chapters_read || 0,
      novels_completed: completedRes?.count || 0,
      current_streak: streak?.current_streak || 0,
      longest_streak: streak?.longest_streak || 0,
      comments: commentsRes?.count || 0,
      ratings: ratingsRes?.count || 0,
      referrals: referralsRes?.count || 0,
      library_count: libraryRes?.count || 0,
      genres_read: genresRes?.count || 0,
      total_xp: totalXP
    }
  });
});

// Check and award badges (called after reading activity)
app.post("/api/badges/check", authMiddleware, async (c) => {
  const user = c.get("user");
  const newlyEarned: string[] = [];
  
  // Get current stats
  const streak = await c.env.DB.prepare(`
    SELECT current_streak, longest_streak, total_chapters_read FROM user_streaks WHERE user_id = ?
  `).bind(user!.id).first() as { current_streak: number; longest_streak: number; total_chapters_read: number } | null;
  
  const commentsRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM chapter_comments WHERE user_id = ?
  `).bind(user!.id).first() as { count: number } | null;
  
  const ratingsRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM novel_ratings WHERE user_id = ?
  `).bind(user!.id).first() as { count: number } | null;
  
  const referralsRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ? AND status = 'converted'
  `).bind(user!.id).first() as { count: number } | null;
  
  const libraryRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM user_libraries WHERE user_id = ? AND is_bookmarked = 1
  `).bind(user!.id).first() as { count: number } | null;
  
  const completedRes = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT ul.novel_id) as count 
    FROM user_libraries ul
    WHERE ul.user_id = ? 
      AND ul.last_read_chapter >= (SELECT COUNT(*) FROM chapters WHERE novel_id = ul.novel_id AND is_published = 1)
      AND (SELECT COUNT(*) FROM chapters WHERE novel_id = ul.novel_id AND is_published = 1) > 0
  `).bind(user!.id).first() as { count: number } | null;
  
  const genresRes = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT n.genre) as count 
    FROM user_libraries ul
    JOIN novels n ON ul.novel_id = n.id
    WHERE ul.user_id = ? AND ul.last_read_chapter > 0
  `).bind(user!.id).first() as { count: number } | null;
  
  const subscriptionRes = await c.env.DB.prepare(`
    SELECT plan_type FROM subscriptions WHERE user_id = ? AND is_active = 1 ORDER BY expires_at DESC LIMIT 1
  `).bind(user!.id).first() as { plan_type: string } | null;
  
  // Check if user completed onboarding
  const onboardingRes = await c.env.DB.prepare(`
    SELECT has_completed_onboarding FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { has_completed_onboarding: number } | null;
  
  // Check for binge reader (10+ chapters in one day)
  const bingeRes = await c.env.DB.prepare(`
    SELECT MAX(chapters_read) as max_daily FROM reading_activity WHERE user_id = ?
  `).bind(user!.id).first() as { max_daily: number } | null;
  
  // Check for night owl (reading between midnight-5am) - check reading_activity created times
  const nightOwlRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM reading_activity 
    WHERE user_id = ? 
    AND (strftime('%H', created_at) >= '00' AND strftime('%H', created_at) < '05')
  `).bind(user!.id).first() as { count: number } | null;
  
  // Badge requirements
  const badgeChecks = [
    // Quick win badges
    { id: "welcome_aboard", check: onboardingRes?.has_completed_onboarding === 1 },
    { id: "first_bookmark", check: (libraryRes?.count || 0) >= 1 },
    { id: "first_chapter", check: (streak?.total_chapters_read || 0) >= 1 },
    { id: "bookworm", check: (streak?.total_chapters_read || 0) >= 10 },
    { id: "voracious_reader", check: (streak?.total_chapters_read || 0) >= 50 },
    { id: "literary_legend", check: (streak?.total_chapters_read || 0) >= 200 },
    { id: "story_master", check: (streak?.total_chapters_read || 0) >= 500 },
    { id: "first_finish", check: (completedRes?.count || 0) >= 1 },
    { id: "trilogy_complete", check: (completedRes?.count || 0) >= 3 },
    { id: "series_slayer", check: (completedRes?.count || 0) >= 10 },
    { id: "getting_started", check: (streak?.longest_streak || 0) >= 3 },
    { id: "week_warrior", check: (streak?.longest_streak || 0) >= 7 },
    { id: "fortnight_force", check: (streak?.longest_streak || 0) >= 14 },
    { id: "monthly_master", check: (streak?.longest_streak || 0) >= 30 },
    { id: "eternal_reader", check: (streak?.longest_streak || 0) >= 100 },
    { id: "first_comment", check: (commentsRes?.count || 0) >= 1 },
    { id: "conversationalist", check: (commentsRes?.count || 0) >= 25 },
    { id: "community_pillar", check: (commentsRes?.count || 0) >= 100 },
    { id: "first_rating", check: (ratingsRes?.count || 0) >= 1 },
    { id: "taste_maker", check: (ratingsRes?.count || 0) >= 10 },
    { id: "friend_maker", check: (referralsRes?.count || 0) >= 1 },
    { id: "ambassador", check: (referralsRes?.count || 0) >= 5 },
    { id: "library_started", check: (libraryRes?.count || 0) >= 5 },
    { id: "collector", check: (libraryRes?.count || 0) >= 20 },
    { id: "archivist", check: (libraryRes?.count || 0) >= 50 },
    { id: "genre_explorer", check: (genresRes?.count || 0) >= 3 },
    { id: "genre_master", check: (genresRes?.count || 0) >= 6 },
    { id: "subscriber", check: !!subscriptionRes },
    { id: "annual_member", check: subscriptionRes?.plan_type === "yearly" },
    // Special badges
    { id: "binge_reader", check: (bingeRes?.max_daily || 0) >= 10 },
    { id: "night_owl", check: (nightOwlRes?.count || 0) >= 1 },
  ];
  
  // Get already earned badges
  const earnedRes = await c.env.DB.prepare(`
    SELECT badge_id FROM user_badges WHERE user_id = ?
  `).bind(user!.id).all();
  const earnedSet = new Set(((earnedRes.results || []) as { badge_id: string }[]).map((b) => b.badge_id));
  
  // Award new badges
  for (const badge of badgeChecks) {
    if (badge.check && !earnedSet.has(badge.id)) {
      await c.env.DB.prepare(`
        INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind(user!.id, badge.id).run();
      newlyEarned.push(badge.id);
    }
  }
  
  return c.json({ newlyEarned });
});

// ===================
// COMMENTS API
// ===================

// Get comments for a chapter
app.get("/api/chapters/:chapterId/comments", async (c) => {
  const chapterId = parseInt(c.req.param("chapterId"));
  const hideSpoilers = c.req.query("hideSpoilers") === "true";

  // Check if user is logged in to get their likes
  let userId: string | null = null;
  const sessionToken = getCookie(c, "mocha_session");
  if (sessionToken) {
    const user = await getCurrentUser(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
    if (user) {
      userId = user.id;
    }
  }

  let query = `
    SELECT cc.*, up.display_name as author_name, up.avatar_url as author_avatar, up.auth_user_id as author_auth_id, cc.reply_to_name
    FROM chapter_comments cc
    LEFT JOIN user_profiles up ON cc.user_id = up.id
    WHERE cc.chapter_id = ?
  `;
  
  if (hideSpoilers) {
    query += ` AND cc.is_spoiler = 0`;
  }
  
  query += ` ORDER BY cc.created_at DESC`;

  const comments = await c.env.DB.prepare(query).bind(chapterId).all();
  
  // Get user's likes if logged in
  let userLikes: Set<number> = new Set();
  if (userId) {
    const likes = await c.env.DB.prepare(`SELECT comment_id FROM comment_likes WHERE user_id = ?`).bind(userId).all();
    userLikes = new Set(likes.results.map((l: any) => l.comment_id));
  }

  // Add has_liked field and convert avatar URL to each comment
  const commentsWithLikes = comments.results.map((comment: any) => ({
    ...comment,
    author_avatar: convertAvatarUrl(comment.author_avatar),
    has_liked: userLikes.has(comment.id),
  }));

  return c.json({ comments: commentsWithLikes });
});

// Post a comment
app.post("/api/chapters/:chapterId/comments", authMiddleware, async (c) => {
  const user = c.get("user");
  const chapterId = parseInt(c.req.param("chapterId"));
  const body = await c.req.json();

  if (!body.content || body.content.trim().length === 0) {
    return c.json({ error: "Comment content is required" }, 400);
  }

  // Get user profile
  let profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  if (!profile) {
    await c.env.DB.prepare(`INSERT INTO user_profiles (auth_user_id, display_name, avatar_url, email, trial_started_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .bind(user!.id, user!.google_user_data?.name || "Reader", user!.google_user_data?.picture || null, user!.google_user_data?.email || null).run();
    profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  }

  await c.env.DB.prepare(`
    INSERT INTO chapter_comments (chapter_id, user_id, parent_id, content, is_spoiler, reply_to_name)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    chapterId,
    profile!.id,
    body.parent_id || null,
    body.content.trim(),
    body.is_spoiler ? 1 : 0,
    body.reply_to_name || null
  ).run();

  return c.json({ success: true });
});

// Like/unlike a comment
app.post("/api/comments/:commentId/like", authMiddleware, async (c) => {
  const user = c.get("user");
  const commentId = parseInt(c.req.param("commentId"));

  // Check if already liked
  const existingLike = await c.env.DB.prepare(`
    SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?
  `).bind(commentId, user!.id).first();

  if (existingLike) {
    // Unlike
    await c.env.DB.prepare(`DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`)
      .bind(commentId, user!.id).run();
    await c.env.DB.prepare(`UPDATE chapter_comments SET likes_count = likes_count - 1 WHERE id = ?`)
      .bind(commentId).run();
    return c.json({ liked: false });
  } else {
    // Like
    await c.env.DB.prepare(`INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)`)
      .bind(commentId, user!.id).run();
    await c.env.DB.prepare(`UPDATE chapter_comments SET likes_count = likes_count + 1 WHERE id = ?`)
      .bind(commentId).run();
    return c.json({ liked: true });
  }
});

// ===================
// CHAPTER REACTIONS API
// ===================

// Get reactions for a chapter
app.get("/api/chapters/:chapterId/reactions", async (c) => {
  const chapterId = parseInt(c.req.param("chapterId"));
  
  // Get reaction counts grouped by type
  const counts = await c.env.DB.prepare(`
    SELECT reaction_type, COUNT(*) as count
    FROM chapter_reactions
    WHERE chapter_id = ?
    GROUP BY reaction_type
  `).bind(chapterId).all();
  
  // Check if current user has reacted (optional auth)
  let userReaction = null;
  const sessionToken = getCookie(c, "mocha_session");
  if (sessionToken) {
    const user = await getCurrentUser(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
    if (user) {
      const existing = await c.env.DB.prepare(`
        SELECT reaction_type FROM chapter_reactions WHERE chapter_id = ? AND user_id = ?
      `).bind(chapterId, user.id).first();
      userReaction = existing?.reaction_type || null;
    }
  }
  
  return c.json({ 
    reactions: counts.results,
    userReaction
  });
});

// Add or update a reaction
app.post("/api/chapters/:chapterId/reactions", authMiddleware, async (c) => {
  const user = c.get("user");
  const chapterId = parseInt(c.req.param("chapterId"));
  const body = await c.req.json();
  
  const validReactions = ['shock', 'heartbreak', 'laughter', 'anger', 'love', 'fire'];
  if (!body.reaction_type || !validReactions.includes(body.reaction_type)) {
    return c.json({ error: "Invalid reaction type" }, 400);
  }
  
  // Check if user already has a reaction
  const existing = await c.env.DB.prepare(`
    SELECT id, reaction_type FROM chapter_reactions WHERE chapter_id = ? AND user_id = ?
  `).bind(chapterId, user!.id).first();
  
  if (existing) {
    if (existing.reaction_type === body.reaction_type) {
      // Same reaction - remove it (toggle off)
      await c.env.DB.prepare(`DELETE FROM chapter_reactions WHERE id = ?`).bind(existing.id).run();
      return c.json({ success: true, action: 'removed' });
    } else {
      // Different reaction - update it
      await c.env.DB.prepare(`
        UPDATE chapter_reactions SET reaction_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(body.reaction_type, existing.id).run();
      return c.json({ success: true, action: 'updated' });
    }
  } else {
    // No existing reaction - add new one
    await c.env.DB.prepare(`
      INSERT INTO chapter_reactions (chapter_id, user_id, reaction_type) VALUES (?, ?, ?)
    `).bind(chapterId, user!.id, body.reaction_type).run();
    return c.json({ success: true, action: 'added' });
  }
});

// ===================
// COMMUNITY DISCUSSIONS API
// ===================

// Get discussions with pagination
app.get("/api/community/discussions", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;
  
  // Check if user is logged in to get their likes
  let userId: string | null = null;
  const sessionToken = getCookie(c, "mocha_session");
  if (sessionToken) {
    const user = await getCurrentUser(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
    if (user) userId = user.id;
  }
  
  const discussions = await c.env.DB.prepare(`
    SELECT cd.*, 
           up.display_name as author_name, 
           up.avatar_url as author_avatar,
           n.title as novel_title,
           COALESCE(n.slug, CAST(n.id AS TEXT)) as novel_slug
    FROM community_discussions cd
    LEFT JOIN user_profiles up ON cd.user_id = up.id
    LEFT JOIN novels n ON cd.novel_id = n.id
    ORDER BY cd.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();
  
  // Get user's likes if logged in
  let userLikes: Set<number> = new Set();
  if (userId) {
    const likes = await c.env.DB.prepare(`SELECT discussion_id FROM discussion_likes WHERE user_id = ?`).bind(userId).all();
    userLikes = new Set(likes.results.map((l: any) => l.discussion_id));
  }
  
  const discussionsWithLikes = discussions.results.map((d: any) => ({
    ...d,
    author_avatar: convertAvatarUrl(d.author_avatar),
    has_liked: userLikes.has(d.id),
  }));
  
  return c.json({ discussions: discussionsWithLikes });
});

// Create a discussion
app.post("/api/community/discussions", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  if (!body.content || body.content.trim().length < 10) {
    return c.json({ error: "Discussion must be at least 10 characters" }, 400);
  }
  
  // Get user profile id
  const profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO community_discussions (user_id, novel_id, chapter_number, content, is_spoiler)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    profile.id,
    body.novel_id || null,
    body.chapter_number || null,
    body.content.trim(),
    body.is_spoiler ? 1 : 0
  ).run();
  
  return c.json({ success: true, id: result.meta?.last_row_id });
});

// Like/unlike a discussion
app.post("/api/community/discussions/:id/like", authMiddleware, async (c) => {
  const user = c.get("user");
  const discussionId = parseInt(c.req.param("id"));
  
  const existing = await c.env.DB.prepare(`
    SELECT id FROM discussion_likes WHERE discussion_id = ? AND user_id = ?
  `).bind(discussionId, user!.id).first();
  
  if (existing) {
    await c.env.DB.prepare(`DELETE FROM discussion_likes WHERE id = ?`).bind(existing.id).run();
    await c.env.DB.prepare(`UPDATE community_discussions SET likes_count = likes_count - 1 WHERE id = ?`).bind(discussionId).run();
    return c.json({ liked: false });
  } else {
    await c.env.DB.prepare(`INSERT INTO discussion_likes (discussion_id, user_id) VALUES (?, ?)`).bind(discussionId, user!.id).run();
    await c.env.DB.prepare(`UPDATE community_discussions SET likes_count = likes_count + 1 WHERE id = ?`).bind(discussionId).run();
    return c.json({ liked: true });
  }
});

// Get replies for a discussion
app.get("/api/community/discussions/:id/replies", async (c) => {
  const discussionId = parseInt(c.req.param("id"));
  
  const replies = await c.env.DB.prepare(`
    SELECT dr.*, up.display_name as author_name, up.avatar_url as author_avatar
    FROM discussion_replies dr
    LEFT JOIN user_profiles up ON dr.user_id = up.id
    WHERE dr.discussion_id = ?
    ORDER BY dr.created_at ASC
  `).bind(discussionId).all();
  
  const repliesWithAvatars = replies.results.map((r: any) => ({
    ...r,
    author_avatar: convertAvatarUrl(r.author_avatar),
  }));
  
  return c.json({ replies: repliesWithAvatars });
});

// Add a reply to a discussion
app.post("/api/community/discussions/:id/replies", authMiddleware, async (c) => {
  const user = c.get("user");
  const discussionId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  if (!body.content || body.content.trim().length < 2) {
    return c.json({ error: "Reply must be at least 2 characters" }, 400);
  }
  
  // Get user profile id
  const profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  
  await c.env.DB.prepare(`
    INSERT INTO discussion_replies (discussion_id, user_id, content)
    VALUES (?, ?, ?)
  `).bind(discussionId, profile.id, body.content.trim()).run();
  
  // Update reply count
  await c.env.DB.prepare(`UPDATE community_discussions SET replies_count = replies_count + 1 WHERE id = ?`).bind(discussionId).run();
  
  return c.json({ success: true });
});

// Get recent episode comments across all novels (for Community page)
app.get("/api/community/recent-comments", async (c) => {
  const limit = parseInt(c.req.query("limit") || "20");
  
  const comments = await c.env.DB.prepare(`
    SELECT 
      cc.id,
      cc.content,
      cc.created_at,
      cc.is_spoiler,
      ch.id as chapter_id,
      ch.chapter_number,
      ch.title as chapter_title,
      n.id as novel_id,
      n.title as novel_title,
      n.slug as novel_slug,
      up.display_name as author_name,
      up.avatar_url as author_avatar
    FROM chapter_comments cc
    JOIN chapters ch ON cc.chapter_id = ch.id
    JOIN novels n ON ch.novel_id = n.id
    JOIN user_profiles up ON cc.user_id = up.id
    WHERE cc.is_hidden = 0
    ORDER BY cc.created_at DESC
    LIMIT ?
  `).bind(limit).all();
  
  return c.json({ comments: comments.results || [] });
});

// Get most active episodes this week (most commented)
app.get("/api/community/most-active-episodes", async (c) => {
  const limit = parseInt(c.req.query("limit") || "3");
  
  const episodes = await c.env.DB.prepare(`
    SELECT 
      ch.id as chapter_id,
      ch.chapter_number,
      ch.title as chapter_title,
      n.id as novel_id,
      n.title as novel_title,
      n.slug as novel_slug,
      n.cover_image_url,
      COUNT(cc.id) as comment_count
    FROM chapter_comments cc
    JOIN chapters ch ON cc.chapter_id = ch.id
    JOIN novels n ON ch.novel_id = n.id
    WHERE cc.created_at >= datetime('now', '-7 days')
      AND cc.is_hidden = 0
    GROUP BY ch.id
    ORDER BY comment_count DESC
    LIMIT ?
  `).bind(limit).all();
  
  return c.json({ episodes: episodes.results || [] });
});

// ===================
// USER PROFILE API
// ===================

// Get user profile
app.get("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  
  let profile = await c.env.DB.prepare(`SELECT * FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  
  if (!profile) {
    // Create profile if doesn't exist
    await c.env.DB.prepare(`INSERT INTO user_profiles (auth_user_id, display_name, avatar_url, email, trial_started_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .bind(user!.id, user!.google_user_data?.name || "Reader", user!.google_user_data?.picture || null, user!.google_user_data?.email || null).run();
    profile = await c.env.DB.prepare(`SELECT * FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  }

  return c.json({ profile });
});

// ===================
// ONBOARDING API
// ===================

// Check onboarding status
app.get("/api/onboarding/status", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(`
    SELECT has_completed_onboarding FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first();
  
  return c.json({ 
    hasCompletedOnboarding: profile ? profile.has_completed_onboarding === 1 : false 
  });
});

// Complete onboarding
app.post("/api/onboarding/complete", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  const { displayName, favoriteGenres, referralSource, birthDate, isNewsletterSubscribed, referralCode } = body;
  
  // Get existing profile or create new one
  let profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  
  if (profile) {
    // Update existing profile
    await c.env.DB.prepare(`
      UPDATE user_profiles SET 
        display_name = ?,
        favorite_genres = ?,
        referral_source = ?,
        birth_date = ?,
        is_newsletter_subscribed = ?,
        has_completed_onboarding = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE auth_user_id = ?
    `).bind(
      displayName || user!.google_user_data?.name || "Reader",
      JSON.stringify(favoriteGenres || []),
      referralSource || null,
      birthDate || null,
      isNewsletterSubscribed ? 1 : 0,
      user!.id
    ).run();
  } else {
    // Create new profile with onboarding data (trial starts now)
    await c.env.DB.prepare(`
      INSERT INTO user_profiles (
        auth_user_id, display_name, avatar_url, email, favorite_genres, 
        referral_source, birth_date, is_newsletter_subscribed, has_completed_onboarding, trial_started_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `).bind(
      user!.id,
      displayName || user!.google_user_data?.name || "Reader",
      user!.google_user_data?.picture || null,
      user!.google_user_data?.email || null,
      JSON.stringify(favoriteGenres || []),
      referralSource || null,
      birthDate || null,
      isNewsletterSubscribed ? 1 : 0
    ).run();
  }
  
  // Apply referral code if provided
  if (referralCode) {
    const code = referralCode.toUpperCase();
    
    // Find referrer by code
    const referrer = await c.env.DB.prepare(`
      SELECT id, auth_user_id FROM user_profiles WHERE referral_code = ?
    `).bind(code).first() as { id: number; auth_user_id: string } | null;
    
    if (referrer && referrer.auth_user_id !== user!.id) {
      // Update current user's referred_by_code
      await c.env.DB.prepare(`
        UPDATE user_profiles SET referred_by_code = ? WHERE auth_user_id = ?
      `).bind(code, user!.id).run();
      
      // Create referral record
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO referrals (referrer_user_id, referred_user_id, referral_code, status, created_at, updated_at)
        VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(referrer.auth_user_id, user!.id, code).run();
      
      // Send notification email to referrer
      const referrerProfile = await c.env.DB.prepare(`
        SELECT display_name, email FROM user_profiles WHERE auth_user_id = ?
      `).bind(referrer.auth_user_id).first() as { display_name: string; email: string } | null;
      
      if (referrerProfile?.email) {
        const newUserName = displayName || user!.google_user_data?.name || "A new reader";
        c.executionCtx.waitUntil(
          c.env.EMAILS.send({
            to: referrerProfile.email,
            subject: "🎉 Someone joined Inkseries using your referral!",
            html_body: emailTemplate(`
              ${emailHeader("Your Referral Worked!")}
              ${emailBody(`
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                  Hi ${referrerProfile.display_name || "Reader"},
                </p>
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                  Great news! <strong style="color: #d4af37;">${newUserName}</strong> just signed up using your referral code.
                </p>
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                  When they subscribe, you'll both earn rewards! Keep sharing your code to unlock more benefits.
                </p>
                <div style="background: #262626; text-align: center; padding: 20px; border-radius: 8px; margin: 0 0 16px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Your referral code</p>
                  <span style="font-size: 20px; font-weight: bold; color: #d4af37; letter-spacing: 2px;">${code}</span>
                </div>
                ${emailButton("View Your Referrals", "https://sitmr2etn6sue.mocha.app/settings")}
              `)}
              ${emailFooter("Thank you for spreading the love for African stories!")}
            `)
          })
        );
      }
    }
  }
  
  // Send welcome email to new user (fire and forget, don't block response)
  const userEmail = user!.google_user_data?.email;
  const userName = displayName || user!.google_user_data?.name || "Reader";
  
  if (userEmail) {
    c.executionCtx.waitUntil(
      c.env.EMAILS.send({
        to: userEmail,
        subject: "Welcome to Inkseries!",
        html_body: emailTemplate(`
          ${emailHeader(`Welcome to Inkseries, ${userName}!`)}
          ${emailBody(`
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #d4d4d4;">
              We're thrilled to have you join our community of readers and storytellers. Inkseries is where stories of African teenagers come alive weekly — and you're now part of that journey.
            </p>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #d4d4d4;">
              Here's what you can explore:
            </p>
            <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 16px; line-height: 26px; color: #d4d4d4;">
              <li style="margin-bottom: 8px;"><strong style="color: #f5f5f5;">50+ Original Stories</strong> — From school drama to African fantasy</li>
              <li style="margin-bottom: 8px;"><strong style="color: #f5f5f5;">Weekly Episodes</strong> — New chapters drop every week</li>
              <li style="margin-bottom: 8px;"><strong style="color: #f5f5f5;">First 3 Chapters Free</strong> — Try any story before subscribing</li>
            </ul>
            <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 26px; color: #d4d4d4;">
              Ready to dive in?
            </p>
            <div style="text-align: center;">
              ${emailButton("Start Reading", "https://sitmr2etn6sue.mocha.app/explore")}
            </div>
          `)}
          ${emailFooter("Questions? Reply to this email or visit our FAQ page.")}
        `),
        text_body: `Welcome to Inkseries, ${userName}!\n\nWe're thrilled to have you join our community of readers and storytellers. Inkseries is where stories of African teenagers come alive weekly — and you're now part of that journey.\n\nHere's what you can explore:\n- 50+ Original Stories — From school drama to African fantasy\n- Weekly Episodes — New chapters drop every week\n- First 3 Chapters Free — Try any story before subscribing\n\nStart reading at: https://sitmr2etn6sue.mocha.app/explore\n\nQuestions? Reply to this email or visit our FAQ page.`
      }).catch(err => console.error("Failed to send welcome email:", err))
    );
  }
  
  return c.json({ success: true });
});

// Check admin status (and auto-promote first user to admin)
app.get("/api/admin/check", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get or create profile
  let profile = await c.env.DB.prepare(`SELECT * FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  
  if (!profile) {
    await c.env.DB.prepare(`INSERT INTO user_profiles (auth_user_id, display_name, avatar_url, email, trial_started_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .bind(user!.id, user!.google_user_data?.name || "Reader", user!.google_user_data?.picture || null, user!.google_user_data?.email || null).run();
    profile = await c.env.DB.prepare(`SELECT * FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  }

  // If user is already admin, return true
  if (profile && profile.is_admin === 1) {
    // Trigger automatic expiry notification check (runs in background, doesn't block response)
    c.executionCtx.waitUntil(checkExpiryNotifications(c.env));
    return c.json({ isAdmin: true });
  }

  // Check if any admin exists
  const existingAdmin = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE is_admin = 1 LIMIT 1`).first();
  
  if (!existingAdmin) {
    // No admin exists - make this user the first admin
    await c.env.DB.prepare(`UPDATE user_profiles SET is_admin = 1, updated_at = CURRENT_TIMESTAMP WHERE auth_user_id = ?`)
      .bind(user!.id).run();
    // Trigger automatic expiry notification check
    c.executionCtx.waitUntil(checkExpiryNotifications(c.env));
    return c.json({ isAdmin: true, promoted: true });
  }

  return c.json({ isAdmin: false });
});

// ===================
// ADMIN MANAGEMENT API
// ===================

// Get all admins
app.get("/api/admin/admins", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const admins = await c.env.DB.prepare(`
    SELECT id, auth_user_id, display_name, avatar_url, created_at 
    FROM user_profiles 
    WHERE is_admin = 1 
    ORDER BY created_at ASC
  `).all();

  return c.json({ admins: admins.results });
});

// Search users to grant admin
app.get("/api/admin/users/search", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const query = c.req.query("q") || "";
  if (query.length < 2) {
    return c.json({ users: [] });
  }

  const users = await c.env.DB.prepare(`
    SELECT id, auth_user_id, display_name, email, avatar_url, is_admin 
    FROM user_profiles 
    WHERE email LIKE ? OR display_name LIKE ?
    ORDER BY display_name ASC
    LIMIT 20
  `).bind(`%${query}%`, `%${query}%`).all();

  return c.json({ users: users.results });
});

// Grant admin access
app.post("/api/admin/admins/:profileId", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const profileId = parseInt(c.req.param("profileId"));

  // Check if profile exists
  const profile = await c.env.DB.prepare(`SELECT id, is_admin FROM user_profiles WHERE id = ?`).bind(profileId).first();
  if (!profile) {
    return c.json({ error: "User not found" }, 404);
  }

  if (profile.is_admin === 1) {
    return c.json({ error: "User is already an admin" }, 400);
  }

  await c.env.DB.prepare(`UPDATE user_profiles SET is_admin = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(profileId).run();

  return c.json({ success: true });
});

// Revoke admin access
app.delete("/api/admin/admins/:profileId", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const profileId = parseInt(c.req.param("profileId"));

  // Get current user's profile
  const currentProfile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  
  // Prevent removing yourself as admin
  if (currentProfile && currentProfile.id === profileId) {
    return c.json({ error: "You cannot remove your own admin access" }, 400);
  }

  // Count remaining admins
  const adminCount = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM user_profiles WHERE is_admin = 1`).first();
  if (adminCount && (adminCount.count as number) <= 1) {
    return c.json({ error: "Cannot remove the last admin" }, 400);
  }

  // Check if profile exists and is admin
  const profile = await c.env.DB.prepare(`SELECT id, is_admin FROM user_profiles WHERE id = ?`).bind(profileId).first();
  if (!profile) {
    return c.json({ error: "User not found" }, 404);
  }

  if (profile.is_admin !== 1) {
    return c.json({ error: "User is not an admin" }, 400);
  }

  await c.env.DB.prepare(`UPDATE user_profiles SET is_admin = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(profileId).run();

  return c.json({ success: true });
});

// Admin referral analytics
app.get("/api/admin/referrals/analytics", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await c.env.DB.prepare(`SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`)
    .bind(user!.id).first();
  if (!profile || profile.is_admin !== 1) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  // Total successful referrals
  const totalReferrals = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM referrals WHERE is_trial_activated = 1 AND reward_revoked = 0
  `).first() as { count: number };

  // Total bonus days awarded
  const totalBonusDays = await c.env.DB.prepare(`
    SELECT SUM(reward_days_given) as total FROM referrals WHERE is_trial_activated = 1 AND reward_revoked = 0
  `).first() as { total: number | null };

  // Referral click count for conversion rate
  const totalClicks = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM referral_clicks
  `).first() as { count: number };

  // Conversion rate
  const conversionRate = totalClicks.count > 0 
    ? ((totalReferrals.count / totalClicks.count) * 100).toFixed(1)
    : "0.0";

  // Top 10 referrers
  const topReferrers = await c.env.DB.prepare(`
    SELECT 
      up.display_name,
      up.email,
      up.successful_referrals_count as referrals,
      up.total_referral_days_earned as days_earned,
      up.has_early_access
    FROM user_profiles up
    WHERE up.successful_referrals_count > 0
    ORDER BY up.successful_referrals_count DESC
    LIMIT 10
  `).all();

  return c.json({
    total_successful_referrals: totalReferrals.count,
    total_bonus_days_awarded: totalBonusDays.total || 0,
    total_link_clicks: totalClicks.count,
    conversion_rate: conversionRate,
    top_referrers: topReferrers.results || []
  });
});

// Admin: Flag user as fraudulent and revoke referral rewards
app.post("/api/admin/users/:userId/flag-fraud", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await c.env.DB.prepare(`SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`)
    .bind(user!.id).first();
  if (!profile || profile.is_admin !== 1) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const userId = c.req.param("userId");

  // Flag the user
  await c.env.DB.prepare(`
    UPDATE user_profiles SET fraud_flagged_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE auth_user_id = ?
  `).bind(userId).run();

  // Revoke any referral rewards given for this user within 7 days
  const referral = await c.env.DB.prepare(`
    SELECT r.*, up.auth_user_id as referrer_auth_id
    FROM referrals r
    JOIN user_profiles up ON up.id = r.referrer_user_id
    WHERE r.referred_user_id = (SELECT id FROM user_profiles WHERE auth_user_id = ?)
      AND r.is_trial_activated = 1
      AND r.reward_revoked = 0
      AND datetime(r.updated_at) > datetime('now', '-7 days')
  `).bind(userId).first() as { id: number; referrer_auth_id: string; reward_days_given: number } | null;

  if (referral) {
    // Mark referral as revoked
    await c.env.DB.prepare(`
      UPDATE referrals SET reward_revoked = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(referral.id).run();

    // Deduct days from referrer's account
    if (referral.reward_days_given > 0) {
      // First try to deduct from bonus days stored
      await c.env.DB.prepare(`
        UPDATE user_profiles 
        SET referral_bonus_days = MAX(0, referral_bonus_days - ?),
            total_referral_days_earned = MAX(0, total_referral_days_earned - ?),
            successful_referrals_count = MAX(0, successful_referrals_count - 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE auth_user_id = ?
      `).bind(referral.reward_days_given, referral.reward_days_given, referral.referrer_auth_id).run();

      // Check if we need to revoke early access badge (if now below 5 referrals)
      const referrerProfile = await c.env.DB.prepare(`
        SELECT successful_referrals_count FROM user_profiles WHERE auth_user_id = ?
      `).bind(referral.referrer_auth_id).first() as { successful_referrals_count: number };

      if (referrerProfile.successful_referrals_count < 5) {
        await c.env.DB.prepare(`
          UPDATE user_profiles SET has_early_access = 0, updated_at = CURRENT_TIMESTAMP WHERE auth_user_id = ?
        `).bind(referral.referrer_auth_id).run();
        
        // Remove ambassador badge
        await c.env.DB.prepare(`
          DELETE FROM user_badges WHERE user_id = (SELECT id FROM user_profiles WHERE auth_user_id = ?) AND badge_id = 'inkseries_ambassador'
        `).bind(referral.referrer_auth_id).run();
      }

      if (referrerProfile.successful_referrals_count < 3) {
        // Remove top referrer badge
        await c.env.DB.prepare(`
          DELETE FROM user_badges WHERE user_id = (SELECT id FROM user_profiles WHERE auth_user_id = ?) AND badge_id = 'top_referrer'
        `).bind(referral.referrer_auth_id).run();
      }
    }
  }

  return c.json({ success: true, referral_revoked: !!referral });
});

// ===================
// PAYMENTS API (Flutterwave)
// ===================

const SUBSCRIPTION_PLANS = {
  weekly: { amount: 50000, duration: 7, label: "Weekly" }, // Amount in kobo (₦500)
  monthly: { amount: 150000, duration: 30, label: "Monthly" }, // Amount in kobo (₦1,500)
  quarterly: { amount: 400000, duration: 90, label: "3 Months" }, // ₦4,000
  biannual: { amount: 700000, duration: 180, label: "6 Months" }, // ₦7,000
  yearly: { amount: 1440000, duration: 365, label: "Yearly" }, // ₦14,400
};

// Flutterwave Plan IDs for recurring subscriptions (weekly/monthly only)
const FLUTTERWAVE_PLAN_IDS: Record<string, number> = {
  weekly: 159106,
  monthly: 159107,
  family_weekly: 159111,
  family_monthly: 159112,
};

// Plans that use recurring billing (card payments only)
const RECURRING_PLANS = ["weekly", "monthly", "family_weekly", "family_monthly"];

// Initialize payment
app.post("/api/payments/initialize", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const planType = body.plan as keyof typeof SUBSCRIPTION_PLANS;
  const paymentMethod = body.payment_method as string | undefined; // "card", "banktransfer", "ussd"

  if (!planType || !SUBSCRIPTION_PLANS[planType]) {
    return c.json({ error: "Invalid subscription plan" }, 400);
  }

  const plan = SUBSCRIPTION_PLANS[planType];
  const reference = `inkseries_${planType}_${user!.id}_${Date.now()}`;

  // Get callback URL from request origin or use default
  const origin = c.req.header("origin") || "https://inkseries.mocha.app";
  const returnTo = body.return_to ? encodeURIComponent(body.return_to) : "";
  const callbackUrl = `${origin}/payment-callback?reference=${reference}${returnTo ? `&return_to=${returnTo}` : ""}`;

  try {
    // Check if this is a recurring plan AND using card payment
    const isRecurringPlan = RECURRING_PLANS.includes(planType);
    const useRecurringBilling = isRecurringPlan && (!paymentMethod || paymentMethod === "card");
    const planId = FLUTTERWAVE_PLAN_IDS[planType];

    if (useRecurringBilling && planId) {
      // Use Flutterwave subscription API for recurring billing
      const response = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${c.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount: plan.amount / 100,
          currency: "NGN",
          redirect_url: callbackUrl,
          payment_plan: planId, // This enables recurring subscription
          customer: {
            email: user!.email,
          },
          meta: {
            user_id: user!.id,
            plan_type: planType,
            plan_label: plan.label,
            duration_days: plan.duration,
            is_recurring: true,
          },
          customizations: {
            title: "Inkseries Subscription",
            logo: "https://mochausercontent.com/68476787-c76e-4a74-af9a-22c5c3c44b1b/favicon.png",
          },
          payment_options: "card", // Only card for recurring
        }),
      });

      const data = await response.json() as { status: string; message?: string; data?: { link: string } };

      if (data.status !== "success") {
        return c.json({ error: data.message || "Payment initialization failed" }, 400);
      }

      return c.json({
        authorization_url: data.data?.link,
        reference,
        is_recurring: true,
      });
    } else {
      // One-time payment (for longer plans OR bank/USSD payments)
      const response = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${c.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount: plan.amount / 100,
          currency: "NGN",
          redirect_url: callbackUrl,
          customer: {
            email: user!.email,
          },
          meta: {
            user_id: user!.id,
            plan_type: planType,
            plan_label: plan.label,
            duration_days: plan.duration,
            is_recurring: false,
          },
          customizations: {
            title: "Inkseries Subscription",
            logo: "https://mochausercontent.com/68476787-c76e-4a74-af9a-22c5c3c44b1b/favicon.png",
          },
        }),
      });

      const data = await response.json() as { status: string; message?: string; data?: { link: string } };

      if (data.status !== "success") {
        return c.json({ error: data.message || "Payment initialization failed" }, 400);
      }

      return c.json({
        authorization_url: data.data?.link,
        reference,
        is_recurring: false,
      });
    }
  } catch (error) {
    console.error("Flutterwave initialization error:", error);
    return c.json({ error: "Payment service unavailable" }, 500);
  }
});

// Verify payment and activate subscription
app.get("/api/payments/verify/:reference", authMiddleware, async (c) => {
  const user = c.get("user");
  const reference = c.req.param("reference");

  try {
    // Flutterwave uses transaction_id, but we can verify by tx_ref
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${c.env.FLUTTERWAVE_SECRET_KEY}`,
      },
    });

    const data = await response.json() as {
      status: string;
      data?: {
        status: string;
        amount: number;
        meta?: { user_id: string; plan_type: string; duration_days: number };
      };
    };

    if (data.status !== "success" || data.data?.status !== "successful") {
      return c.json({ error: "Payment not successful", verified: false }, 400);
    }

    const metadata = data.data.meta;
    if (!metadata || metadata.user_id !== user!.id) {
      return c.json({ error: "Payment verification mismatch", verified: false }, 400);
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + metadata.duration_days);

    // Get or create user profile
    let profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
    if (!profile) {
      await c.env.DB.prepare(`INSERT INTO user_profiles (auth_user_id, display_name, avatar_url, trial_started_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`)
        .bind(user!.id, user!.google_user_data?.name || "Reader", user!.google_user_data?.picture || null).run();
      profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
    }

    // Update subscription
    await c.env.DB.prepare(`
      UPDATE user_profiles 
      SET subscription_tier = ?, subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE auth_user_id = ?
    `).bind(metadata.plan_type, expiresAt.toISOString(), user!.id).run();

    // Get episodes read count for refund eligibility tracking
    const episodesRead = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM chapters_read WHERE user_id = ?
    `).bind(profile!.id).first() as { count: number } | null;

    // Record the subscription payment with first charge tracking
    await c.env.DB.prepare(`
      INSERT INTO subscriptions (user_id, plan_type, amount, payment_provider, payment_reference, starts_at, expires_at, first_charge_at, episodes_read_at_first_charge)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, ?)
    `).bind(profile!.id, metadata.plan_type, data.data.amount, "flutterwave", reference, expiresAt.toISOString(), episodesRead?.count || 0).run();

    return c.json({
      verified: true,
      plan: metadata.plan_type,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Flutterwave verification error:", error);
    return c.json({ error: "Verification failed", verified: false }, 500);
  }
});

// Flutterwave webhook handler
app.post("/api/webhooks/flutterwave", async (c) => {
  const signature = c.req.header("verif-hash");
  const body = await c.req.text();

  // Verify webhook signature (Flutterwave sends the secret hash in verif-hash header)
  // You configure this secret in Flutterwave dashboard
  if (signature !== c.env.FLUTTERWAVE_SECRET_KEY) {
    return c.json({ error: "Invalid signature" }, 400);
  }

  const event = JSON.parse(body) as {
    event: string;
    data: {
      tx_ref: string;
      amount: number;
      status: string;
      meta?: { user_id: string; plan_type: string; duration_days: number };
    };
  };

  // Handle successful charge
  if (event.event === "charge.completed" && event.data.status === "successful") {
    const { tx_ref: reference, amount, meta: metadata } = event.data as {
      tx_ref: string;
      amount: number;
      status: string;
      meta?: {
        type?: string;
        user_id?: string;
        plan_type?: string;
        duration_days?: number;
        // Gift subscription fields
        purchaser_id?: string;
        gift_code?: string;
        recipient_email?: string;
        days?: number;
        // Family plan fields
        owner_id?: string;
        // Upgrade fields
        current_plan_type?: string;
        new_plan_type?: string;
        current_plan_label?: string;
        new_plan_label?: string;
        new_plan_amount?: number;
        proration_credit?: number;
        subscription_id?: number;
      };
    };

    // Handle gift subscription payment
    if (metadata?.type === "gift_subscription" && metadata.gift_code) {
      await c.env.DB.prepare(`
        UPDATE gift_subscriptions SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE gift_code = ?
      `).bind(metadata.gift_code).run();
      
      // Send gift subscription email to recipient
      if (metadata.recipient_email) {
        const giftDetails = await c.env.DB.prepare(`
          SELECT gs.*, up.display_name as sender_name 
          FROM gift_subscriptions gs
          LEFT JOIN user_profiles up ON gs.purchaser_user_id = up.auth_user_id
          WHERE gs.gift_code = ?
        `).bind(metadata.gift_code).first() as { gift_code: string; gift_message: string; plan_type: string; sender_name: string } | null;
        
        const planLabels: Record<string, string> = {
          weekly: "1 Week", monthly: "1 Month", quarterly: "3 Months", biannual: "6 Months", yearly: "1 Year"
        };
        const planLabel = planLabels[giftDetails?.plan_type || "monthly"] || giftDetails?.plan_type;
        
        c.executionCtx.waitUntil(
          c.env.EMAILS.send({
            to: metadata.recipient_email,
            subject: "🎁 You've received an Inkseries gift subscription!",
            html_body: emailTemplate(`
              ${emailHeader("Someone Special Sent You a Gift!")}
              ${emailBody(`
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                  Great news! <strong style="color: #d4af37;">${giftDetails?.sender_name || "A friend"}</strong> has gifted you a <strong style="color: #d4af37;">${planLabel}</strong> subscription to Inkseries.
                </p>
                ${giftDetails?.gift_message ? `
                <div style="background: #262626; border-left: 3px solid #d4af37; padding: 16px; margin: 0 0 16px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0; font-style: italic; color: #d4d4d4;">"${giftDetails.gift_message}"</p>
                </div>
                ` : ""}
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                  Your gift code is:
                </p>
                <div style="background: #262626; text-align: center; padding: 20px; border-radius: 8px; margin: 0 0 16px 0;">
                  <span style="font-size: 24px; font-weight: bold; color: #d4af37; letter-spacing: 2px;">${giftDetails?.gift_code}</span>
                </div>
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                  To activate your gift, sign up or log in and enter this code in your Settings page.
                </p>
                ${emailButton("Redeem Your Gift", "https://sitmr2etn6sue.mocha.app/settings")}
              `)}
              ${emailFooter("This gift doesn't expire. You can redeem it anytime.")}
            `)
          })
        );
      }
    }
    // Handle plan upgrade payment
    else if (metadata?.type === "upgrade" && metadata.user_id) {
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + (metadata.duration_days || 30));
      
      // Update subscription
      if (metadata.subscription_id) {
        await c.env.DB.prepare(`
          UPDATE subscriptions SET plan_type = ?, amount = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(metadata.new_plan_type, metadata.new_plan_amount || amount, newExpiresAt.toISOString(), metadata.subscription_id).run();
      }
      
      // Update user profile
      await c.env.DB.prepare(`
        UPDATE user_profiles SET subscription_tier = ?, subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE auth_user_id = ?
      `).bind(metadata.new_plan_type, newExpiresAt.toISOString(), metadata.user_id).run();

      // Record in scheduled_plan_changes as processed upgrade
      await c.env.DB.prepare(`
        INSERT INTO scheduled_plan_changes (user_id, current_plan_type, new_plan_type, change_type, effective_at, is_processed, processed_at)
        VALUES (?, ?, ?, 'upgrade', CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
      `).bind(metadata.user_id, metadata.current_plan_type, metadata.new_plan_type).run();

      // Send upgrade confirmation email
      const userProfile = await c.env.DB.prepare(`
        SELECT display_name, email FROM user_profiles WHERE auth_user_id = ?
      `).bind(metadata.user_id).first() as { display_name: string; email: string } | null;
      
      if (userProfile?.email) {
        c.executionCtx.waitUntil(
          c.env.EMAILS.send({
            to: userProfile.email,
            subject: "🎉 Your Inkseries Plan Has Been Upgraded!",
            html_body: `
              <div style="font-family: 'Source Sans 3', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
                <img src="https://sitmr2etn6sue.mochausercontent.com/favicon.png" alt="Inkseries" style="width: 48px; height: 48px; margin-bottom: 16px;" />
                <h1 style="color: #f5a623; margin: 0 0 16px;">Plan Upgraded Successfully!</h1>
                <p>Hi ${userProfile.display_name || "there"},</p>
                <p>Great news! Your Inkseries subscription has been upgraded.</p>
                <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>Previous Plan:</strong> ${metadata.current_plan_label}</p>
                  <p style="margin: 4px 0;"><strong>New Plan:</strong> ${metadata.new_plan_label} (₦${(metadata.new_plan_amount || amount).toLocaleString()})</p>
                  <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₦${amount.toLocaleString()}</p>
                  ${metadata.proration_credit ? `<p style="margin: 4px 0; color: #4ade80;"><strong>Credit Applied:</strong> ₦${metadata.proration_credit.toLocaleString()}</p>` : ""}
                  <p style="margin: 4px 0;"><strong>New Expiry Date:</strong> ${newExpiresAt.toLocaleDateString()}</p>
                </div>
                <p>Enjoy unlimited access to all episodes and exclusive features!</p>
                <a href="https://sitmr2etn6sue.mocha.app/explore" style="display: inline-block; background: #f5a623; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Continue Reading</a>
                <p style="color: #888; font-size: 14px; margin-top: 24px;">— The Inkseries Team</p>
              </div>
            `
          })
        );
      }
    }
    // Handle family plan payment
    else if (metadata?.type === "family_plan" && metadata.owner_id) {
      const startsAt = new Date();
      const expiresAt = new Date();
      
      if (metadata.plan_type === "family_weekly") {
        expiresAt.setDate(expiresAt.getDate() + 7);
      } else if (metadata.plan_type === "family_monthly") {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (metadata.plan_type === "family_quarterly") {
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else if (metadata.plan_type === "family_biannual") {
        expiresAt.setMonth(expiresAt.getMonth() + 6);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      await c.env.DB.prepare(`
        INSERT INTO family_plans (owner_user_id, plan_type, max_members, amount, payment_reference, starts_at, expires_at, is_active)
        VALUES (?, ?, 4, ?, ?, ?, ?, 1)
      `).bind(metadata.owner_id, metadata.plan_type || 'family_annual', amount, reference, startsAt.toISOString(), expiresAt.toISOString()).run();

      // Give owner subscription access
      await c.env.DB.prepare(`
        UPDATE user_profiles SET subscription_tier = 'yearly', subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE auth_user_id = ?
      `).bind(expiresAt.toISOString(), metadata.owner_id).run();
    }
    // Handle regular subscription payment
    else if (metadata?.user_id && metadata?.plan_type) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (metadata.duration_days || 30));

      // Update user subscription
      await c.env.DB.prepare(`
        UPDATE user_profiles 
        SET subscription_tier = ?, subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE auth_user_id = ?
      `).bind(metadata.plan_type, expiresAt.toISOString(), metadata.user_id).run();

      // Convert any pending referrals
      await convertReferral(metadata.user_id, c.env.DB);

      // Get profile for subscription record
      const profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`)
        .bind(metadata.user_id).first();

      if (profile) {
        // Check if subscription record already exists (from verify endpoint)
        const existingRecord = await c.env.DB.prepare(`SELECT id FROM subscriptions WHERE payment_reference = ?`)
          .bind(reference).first();
        
        if (!existingRecord) {
          await c.env.DB.prepare(`
            INSERT INTO subscriptions (user_id, plan_type, amount, payment_provider, payment_reference, starts_at, expires_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
          `).bind(profile.id, metadata.plan_type, amount, "flutterwave", reference, expiresAt.toISOString()).run();
        }
      }
      
      // Send subscription confirmation email
      const userProfile = await c.env.DB.prepare(`
        SELECT display_name, email FROM user_profiles WHERE auth_user_id = ?
      `).bind(metadata.user_id).first() as { display_name: string; email: string } | null;
      
      if (userProfile?.email) {
        const planLabels: Record<string, string> = {
          weekly: "Weekly", monthly: "Monthly", quarterly: "3-Month", biannual: "6-Month", yearly: "Yearly"
        };
        const planLabel = planLabels[metadata.plan_type] || metadata.plan_type;
        const formattedExpiry = expiresAt.toLocaleDateString("en-NG", { 
          weekday: "long", year: "numeric", month: "long", day: "numeric" 
        });
        
        c.executionCtx.waitUntil(
          c.env.EMAILS.send({
            to: userProfile.email,
            subject: "✨ Your Inkseries subscription is active!",
            html_body: emailTemplate(`
              ${emailHeader("Welcome to Premium!")}
              ${emailBody(`
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                  Hi ${userProfile.display_name || "Reader"},
                </p>
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                  Your <strong style="color: #d4af37;">${planLabel}</strong> subscription is now active! You have unlimited access to all premium episodes.
                </p>
                <div style="background: #262626; padding: 20px; border-radius: 8px; margin: 0 0 16px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Valid until</p>
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: #d4af37;">${formattedExpiry}</p>
                </div>
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                  What you can now enjoy:
                </p>
                <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 16px; line-height: 26px; color: #d4d4d4;">
                  <li style="margin-bottom: 8px;">All premium episodes across every novel</li>
                  <li style="margin-bottom: 8px;">Early access to new releases</li>
                  <li style="margin-bottom: 8px;">Ad-free reading experience</li>
                  <li style="margin-bottom: 8px;">Exclusive community features</li>
                </ul>
                ${emailButton("Start Reading", "https://sitmr2etn6sue.mocha.app/explore")}
              `)}
              ${emailFooter("Thank you for supporting African storytelling!")}
            `)
          })
        );
      }
    }
  }

  // Handle subscription renewal (recurring billing)
  if (event.event === "subscription.charge" || event.event === "subscription.renewed") {
    const subscriptionData = event.data as {
      tx_ref?: string;
      amount: number;
      status: string;
      customer?: { email: string };
      meta?: { 
        user_id?: string; 
        owner_id?: string; // For family plans
        plan_type: string; 
        duration_days: number; 
        is_recurring?: boolean;
        type?: string;
      };
    };

    if (subscriptionData.status === "successful" && subscriptionData.meta) {
      const { plan_type, duration_days, type, owner_id, user_id } = subscriptionData.meta;
      const effectiveUserId = owner_id || user_id;
      const transactionId = (event.data as { id?: number }).id;
      const txRef = subscriptionData.tx_ref || `renewal_${Date.now()}`;
      
      // AUTO-REFUND CHECK 1: Post-cancellation charge
      if (effectiveUserId) {
        const profile = await c.env.DB.prepare(`
          SELECT up.id, up.email, up.display_name, s.is_cancelled
          FROM user_profiles up
          LEFT JOIN subscriptions s ON s.user_id = up.id AND s.is_cancelled = 1
          WHERE up.auth_user_id = ?
          ORDER BY s.cancelled_at DESC LIMIT 1
        `).bind(effectiveUserId).first() as { id: number; email: string; display_name: string; is_cancelled: number } | null;
        
        if (profile?.is_cancelled === 1 && transactionId) {
          // User cancelled but was still charged - auto refund
          const refundResult = await processFlutterwaveRefund(String(transactionId), subscriptionData.amount, c.env);
          
          // Record the refund
          await c.env.DB.prepare(`
            INSERT INTO refunds (user_id, payment_reference, amount, refund_type, refund_reason, status, flutterwave_refund_id, created_at, updated_at)
            VALUES (?, ?, ?, 'automatic', 'post_cancellation', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(profile.id, txRef, subscriptionData.amount, refundResult.success ? 'completed' : 'failed', refundResult.refund_id || null).run();
          
          // Send refund email
          if (profile.email && refundResult.success) {
            c.executionCtx.waitUntil(sendRefundEmail(profile.email, profile.display_name, subscriptionData.amount, "post_cancellation", c.env));
          }
          
          return c.json({ received: true, action: "auto_refunded_post_cancellation" });
        }
      }
      
      // AUTO-REFUND CHECK 2: Duplicate charge in same billing cycle
      if (effectiveUserId && transactionId) {
        const profile = await c.env.DB.prepare(`SELECT id, email, display_name FROM user_profiles WHERE auth_user_id = ?`)
          .bind(effectiveUserId).first() as { id: number; email: string; display_name: string } | null;
        
        if (profile) {
          // Check for existing charge in this billing cycle
          const billingWindow = plan_type === "weekly" || plan_type === "family_weekly" ? 7 : 30;
          const existingCharge = await c.env.DB.prepare(`
            SELECT id FROM payment_charges 
            WHERE user_id = ? AND plan_type = ? AND created_at > datetime('now', '-' || ? || ' days')
            LIMIT 1
          `).bind(profile.id, plan_type, billingWindow).first();
          
          if (existingCharge) {
            // Duplicate charge detected - auto refund
            const refundResult = await processFlutterwaveRefund(String(transactionId), subscriptionData.amount, c.env);
            
            await c.env.DB.prepare(`
              INSERT INTO refunds (user_id, payment_reference, amount, refund_type, refund_reason, status, flutterwave_refund_id, created_at, updated_at)
              VALUES (?, ?, ?, 'automatic', 'duplicate_charge', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `).bind(profile.id, txRef, subscriptionData.amount, refundResult.success ? 'completed' : 'failed', refundResult.refund_id || null).run();
            
            if (profile.email && refundResult.success) {
              c.executionCtx.waitUntil(sendRefundEmail(profile.email, profile.display_name, subscriptionData.amount, "duplicate_charge", c.env));
            }
            
            return c.json({ received: true, action: "auto_refunded_duplicate" });
          }
          
          // Record this charge for future duplicate detection
          await c.env.DB.prepare(`
            INSERT INTO payment_charges (user_id, transaction_id, payment_reference, amount, plan_type, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(profile.id, String(transactionId), txRef, subscriptionData.amount, plan_type).run();
        }
      }
      
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + (duration_days || 30));

      // Handle family plan renewal
      if (type === "family_plan" && owner_id) {
        // Extend family plan
        await c.env.DB.prepare(`
          UPDATE family_plans 
          SET expires_at = ?, updated_at = CURRENT_TIMESTAMP
          WHERE owner_user_id = ? AND is_active = 1
        `).bind(newExpiresAt.toISOString(), owner_id).run();

        // Extend owner's subscription
        await c.env.DB.prepare(`
          UPDATE user_profiles 
          SET subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE auth_user_id = ?
        `).bind(newExpiresAt.toISOString(), owner_id).run();

        // Extend all family members' subscriptions
        const familyPlan = await c.env.DB.prepare(`
          SELECT id FROM family_plans WHERE owner_user_id = ? AND is_active = 1
        `).bind(owner_id).first() as { id: number } | null;

        if (familyPlan) {
          const members = await c.env.DB.prepare(`
            SELECT user_id FROM family_plan_members WHERE family_plan_id = ? AND status = 'active'
          `).bind(familyPlan.id).all();

          for (const member of members.results as { user_id: string }[]) {
            if (member.user_id) {
              await c.env.DB.prepare(`
                UPDATE user_profiles 
                SET subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE auth_user_id = ?
              `).bind(newExpiresAt.toISOString(), member.user_id).run();
            }
          }
        }

        // Send renewal email to owner
        const ownerProfile = await c.env.DB.prepare(`SELECT email, display_name FROM user_profiles WHERE auth_user_id = ?`)
          .bind(owner_id).first() as { email: string; display_name: string } | null;

        if (ownerProfile?.email) {
          const planLabels: Record<string, string> = {
            family_weekly: "Family Weekly", family_monthly: "Family Monthly"
          };
          const planLabel = planLabels[plan_type] || plan_type;
          const formattedExpiry = newExpiresAt.toLocaleDateString("en-NG", { 
            weekday: "long", year: "numeric", month: "long", day: "numeric" 
          });

          c.executionCtx.waitUntil(
            c.env.EMAILS.send({
              to: ownerProfile.email,
              subject: "✅ Your Inkseries Family Plan has been renewed!",
              html_body: emailTemplate(`
                ${emailHeader("Family Plan Renewed!")}
                ${emailBody(`
                  <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                    Hi ${ownerProfile.display_name || "Reader"},
                  </p>
                  <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                    Your <strong style="color: #d4af37;">${planLabel}</strong> plan has been automatically renewed for you and your family members.
                  </p>
                  <div style="background: #262626; padding: 20px; border-radius: 8px; margin: 0 0 16px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Amount charged</p>
                    <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #d4af37;">₦${subscriptionData.amount.toLocaleString()}</p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Valid until</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #d4af37;">${formattedExpiry}</p>
                  </div>
                  ${emailButton("Continue Reading", "https://sitmr2etn6sue.mocha.app/explore")}
                `)}
                ${emailFooter("To cancel auto-renewal, visit your Settings page.")}
              `)
            })
          );
        }
      }
      // Handle individual subscription renewal
      else if (user_id) {
        // Extend user subscription
        await c.env.DB.prepare(`
          UPDATE user_profiles 
          SET subscription_tier = ?, subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE auth_user_id = ?
        `).bind(plan_type, newExpiresAt.toISOString(), user_id).run();

        // Record renewal in subscriptions table
        const profile = await c.env.DB.prepare(`SELECT id, email, display_name FROM user_profiles WHERE auth_user_id = ?`)
          .bind(user_id).first() as { id: number; email: string; display_name: string } | null;

        if (profile) {
          const renewalRef = `renewal_${plan_type}_${user_id}_${Date.now()}`;
          await c.env.DB.prepare(`
            INSERT INTO subscriptions (user_id, plan_type, amount, payment_provider, payment_reference, starts_at, expires_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
          `).bind(profile.id, plan_type, subscriptionData.amount, "flutterwave_recurring", renewalRef, newExpiresAt.toISOString()).run();

          // Send renewal confirmation email
          if (profile.email) {
            const planLabels: Record<string, string> = {
              weekly: "Weekly", monthly: "Monthly", family_weekly: "Family Weekly", family_monthly: "Family Monthly"
            };
            const planLabel = planLabels[plan_type] || plan_type;
            const formattedExpiry = newExpiresAt.toLocaleDateString("en-NG", { 
              weekday: "long", year: "numeric", month: "long", day: "numeric" 
            });

            c.executionCtx.waitUntil(
              c.env.EMAILS.send({
                to: profile.email,
                subject: "✅ Your Inkseries subscription has been renewed!",
                html_body: emailTemplate(`
                  ${emailHeader("Subscription Renewed!")}
                  ${emailBody(`
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                      Hi ${profile.display_name || "Reader"},
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                      Your <strong style="color: #d4af37;">${planLabel}</strong> subscription has been automatically renewed.
                    </p>
                    <div style="background: #262626; padding: 20px; border-radius: 8px; margin: 0 0 16px 0;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Amount charged</p>
                      <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold; color: #d4af37;">₦${subscriptionData.amount.toLocaleString()}</p>
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Valid until</p>
                      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #d4af37;">${formattedExpiry}</p>
                    </div>
                    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #888888;">
                      To cancel auto-renewal, visit your Settings page. You'll keep access until your current billing period ends.
                    </p>
                    ${emailButton("Continue Reading", "https://sitmr2etn6sue.mocha.app/explore")}
                  `)}
                  ${emailFooter("Questions? Reply to this email.")}
                `)
              })
            );
          }
        }
      }
    }
  }

  return c.json({ received: true });
});

// ===================
// REFUND SYSTEM
// ===================

// Helper to process Flutterwave refunds
async function processFlutterwaveRefund(
  transactionId: string,
  amount: number,
  env: Env
): Promise<{ success: boolean; refund_id?: string; error?: string }> {
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/refund`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount })
    });
    
    const data = await response.json() as { status: string; data?: { id: number }; message?: string };
    
    if (data.status === "success" && data.data) {
      return { success: true, refund_id: String(data.data.id) };
    }
    return { success: false, error: data.message || "Refund failed" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Send refund confirmation email
async function sendRefundEmail(
  email: string,
  name: string,
  amount: number,
  reason: string,
  env: Env
): Promise<void> {
  const reasonMessages: Record<string, string> = {
    "post_cancellation": "You were charged after cancelling your subscription.",
    "duplicate_charge": "You were charged twice in the same billing period.",
    "48_hour_refund": "You requested a refund within 48 hours of your first charge."
  };
  
  await env.EMAILS.send({
    to: email,
    subject: "💰 Your Inkseries refund has been processed",
    html_body: emailTemplate(`
      ${emailHeader("Refund Processed")}
      ${emailBody(`
        <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
          Hi ${name || "Reader"},
        </p>
        <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
          We've processed a refund to your account.
        </p>
        <div style="background: #262626; padding: 20px; border-radius: 8px; margin: 0 0 16px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Amount refunded</p>
          <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #22c55e;">₦${amount.toLocaleString()}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Reason</p>
          <p style="margin: 0; font-size: 16px; color: #d4d4d4;">${reasonMessages[reason] || reason}</p>
        </div>
        <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
          The refund will be credited to your original payment method within 3-5 business days.
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: #888888;">
          If you have any questions, please don't hesitate to contact us.
        </p>
        ${emailButton("Contact Support", "https://sitmr2etn6sue.mocha.app/contact")}
      `)}
      ${emailFooter("Thank you for being part of Inkseries.")}
    `)
  });
}

// ===================
// ADMIN NOVELS API
// ===================

// Helper to check admin status
async function isUserAdmin(userId: string, db: D1Database): Promise<boolean> {
  const profile = await db.prepare(`SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`).bind(userId).first();
  return profile?.is_admin === 1;
}

// Get all novels for admin (including drafts)
app.get("/api/admin/novels", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const novels = await c.env.DB.prepare(`
    SELECT n.*, COALESCE(n.author_name, up.display_name) as author_display_name
    FROM novels n
    LEFT JOIN user_profiles up ON n.author_id = up.id
    ORDER BY n.created_at DESC
  `).all();

  return c.json({ novels: novels.results });
});

// Create a new novel
app.post("/api/admin/novels", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json();
  
  if (!body.title || !body.slug) {
    return c.json({ error: "Title and slug are required" }, 400);
  }

  // Check if slug already exists
  const existing = await c.env.DB.prepare(`SELECT id FROM novels WHERE slug = ?`).bind(body.slug).first();
  if (existing) {
    return c.json({ error: "A novel with this slug already exists" }, 400);
  }

  // Get admin's profile ID for author
  const profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();

  await c.env.DB.prepare(`
    INSERT INTO novels (title, slug, author_id, author_name, cover_image_url, synopsis, genre, tags, status, is_featured, chapter_format)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.title,
    body.slug,
    body.author_id || profile?.id || null,
    body.author_name || null,
    body.cover_image_url || null,
    body.synopsis || null,
    body.genre || "Drama",
    body.tags ? JSON.stringify(body.tags) : null,
    body.status || "ongoing",
    body.is_featured ? 1 : 0,
    body.chapter_format || "chapter"
  ).run();

  const novel = await c.env.DB.prepare(`SELECT * FROM novels WHERE slug = ?`).bind(body.slug).first();
  return c.json({ success: true, novel });
});

// Update a novel
app.patch("/api/admin/novels/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const novelId = parseInt(c.req.param("id"));
  const body = await c.req.json();

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (body.title !== undefined) { updates.push("title = ?"); params.push(body.title); }
  if (body.slug !== undefined) { updates.push("slug = ?"); params.push(body.slug); }
  if (body.author_name !== undefined) { updates.push("author_name = ?"); params.push(body.author_name); }
  if (body.cover_image_url !== undefined) { updates.push("cover_image_url = ?"); params.push(body.cover_image_url); }
  if (body.synopsis !== undefined) { updates.push("synopsis = ?"); params.push(body.synopsis); }
  if (body.genre !== undefined) { updates.push("genre = ?"); params.push(body.genre); }
  if (body.tags !== undefined) { updates.push("tags = ?"); params.push(Array.isArray(body.tags) ? JSON.stringify(body.tags) : "[]"); }
  if (body.status !== undefined) { updates.push("status = ?"); params.push(body.status); }
  if (body.is_featured !== undefined) { updates.push("is_featured = ?"); params.push(body.is_featured ? 1 : 0); }
  if (body.chapter_format !== undefined) { updates.push("chapter_format = ?"); params.push(body.chapter_format); }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");

  await c.env.DB.prepare(`UPDATE novels SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params, novelId).run();

  const novel = await c.env.DB.prepare(`SELECT * FROM novels WHERE id = ?`).bind(novelId).first();
  return c.json({ success: true, novel });
});

// Delete a novel
app.delete("/api/admin/novels/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const novelId = parseInt(c.req.param("id"));
  
  // Delete associated chapters first
  await c.env.DB.prepare(`DELETE FROM chapters WHERE novel_id = ?`).bind(novelId).run();
  // Delete the novel
  await c.env.DB.prepare(`DELETE FROM novels WHERE id = ?`).bind(novelId).run();

  return c.json({ success: true });
});

// ===================
// ADMIN SEASONS API
// ===================

// Get all seasons for a novel
app.get("/api/admin/novels/:novelId/seasons", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const novelId = parseInt(c.req.param("novelId"));
  const seasons = await c.env.DB.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM chapters WHERE season_id = s.id) as episode_count
    FROM seasons s
    WHERE s.novel_id = ?
    ORDER BY s.season_number ASC
  `).bind(novelId).all();

  return c.json({ seasons: seasons.results });
});

// Create a season
app.post("/api/admin/novels/:novelId/seasons", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const novelId = parseInt(c.req.param("novelId"));
  const body = await c.req.json();

  if (!body.title) {
    return c.json({ error: "Season title is required" }, 400);
  }

  // Get next season number
  const lastSeason = await c.env.DB.prepare(`
    SELECT MAX(season_number) as max_num FROM seasons WHERE novel_id = ?
  `).bind(novelId).first();
  const nextSeasonNum = ((lastSeason?.max_num as number) || 0) + 1;

  const result = await c.env.DB.prepare(`
    INSERT INTO seasons (novel_id, season_number, title, synopsis, cover_image_url, release_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    novelId,
    body.season_number || nextSeasonNum,
    body.title,
    body.synopsis || null,
    body.cover_image_url || null,
    body.release_date || null
  ).run();

  return c.json({ success: true, season_id: result.meta.last_row_id });
});

// Update a season
app.patch("/api/admin/seasons/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const seasonId = parseInt(c.req.param("id"));
  const body = await c.req.json();

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (body.season_number !== undefined) {
    updates.push("season_number = ?");
    values.push(body.season_number);
  }
  if (body.title !== undefined) {
    updates.push("title = ?");
    values.push(body.title);
  }
  if (body.synopsis !== undefined) {
    updates.push("synopsis = ?");
    values.push(body.synopsis || null);
  }
  if (body.cover_image_url !== undefined) {
    updates.push("cover_image_url = ?");
    values.push(body.cover_image_url || null);
  }
  if (body.release_date !== undefined) {
    updates.push("release_date = ?");
    values.push(body.release_date || null);
  }

  if (updates.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  values.push(seasonId);

  await c.env.DB.prepare(`
    UPDATE seasons SET ${updates.join(", ")} WHERE id = ?
  `).bind(...values).run();

  return c.json({ success: true });
});

// Delete a season
app.delete("/api/admin/seasons/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const seasonId = parseInt(c.req.param("id"));

  // Update chapters to remove season_id reference
  await c.env.DB.prepare(`
    UPDATE chapters SET season_id = NULL WHERE season_id = ?
  `).bind(seasonId).run();

  // Delete the season
  await c.env.DB.prepare(`DELETE FROM seasons WHERE id = ?`).bind(seasonId).run();

  return c.json({ success: true });
});

// ===================
// ADMIN CHAPTERS API
// ===================

// Get all chapters for a novel (admin)
app.get("/api/admin/novels/:novelId/chapters", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const novelId = parseInt(c.req.param("novelId"));
  const chapters = await c.env.DB.prepare(`
    SELECT c.*, s.title as season_title, s.season_number as season_num
    FROM chapters c
    LEFT JOIN seasons s ON c.season_id = s.id
    WHERE c.novel_id = ? 
    ORDER BY c.season_id ASC NULLS FIRST, c.part_number ASC, c.chapter_number ASC
  `).bind(novelId).all();

  return c.json({ chapters: chapters.results });
});

// Create a chapter
app.post("/api/admin/novels/:novelId/chapters", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const novelId = parseInt(c.req.param("novelId"));
  const body = await c.req.json();

  if (!body.title) {
    return c.json({ error: "Chapter title is required" }, 400);
  }

  // Get next chapter number
  const lastChapter = await c.env.DB.prepare(`
    SELECT MAX(chapter_number) as max_num FROM chapters WHERE novel_id = ?
  `).bind(novelId).first();
  const nextChapterNum = ((lastChapter?.max_num as number) || 0) + 1;

  const wordCount = countWords(body.content);

  await c.env.DB.prepare(`
    INSERT INTO chapters (novel_id, season_id, chapter_number, part_number, title, content, word_count, is_premium, is_published, audio_url, published_at, scheduled_release_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    novelId,
    body.season_id || null,
    body.chapter_number || nextChapterNum,
    body.part_number || 1,
    body.title,
    body.content || "",
    wordCount,
    body.is_premium ? 1 : 0,
    body.is_published ? 1 : 0,
    body.audio_url || null,
    body.is_published ? new Date().toISOString() : null,
    body.scheduled_release_at || null
  ).run();

  // Update novel's total chapters count (only count released chapters)
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    UPDATE novels SET total_chapters = (
      SELECT COUNT(*) FROM chapters 
      WHERE novel_id = ? AND is_published = 1 
        AND (scheduled_release_at IS NULL OR scheduled_release_at <= ?)
    ), updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(novelId, now, novelId).run();

  // Send new chapter notifications if published
  if (body.is_published) {
    try {
      // Get novel details
      const novel = await c.env.DB.prepare(`SELECT title, slug FROM novels WHERE id = ?`)
        .bind(novelId).first() as { title: string; slug: string } | null;
      
      if (novel) {
        // Get users who have this novel in their library and have notifications enabled
        const followers = await c.env.DB.prepare(`
          SELECT up.email, up.display_name 
          FROM user_libraries ul
          JOIN user_profiles up ON ul.user_id = up.auth_user_id
          WHERE ul.novel_id = ? 
            AND ul.is_bookmarked = 1
            AND up.email IS NOT NULL
            AND (up.is_chapter_notifications_enabled = 1 OR up.is_chapter_notifications_enabled IS NULL)
        `).bind(novelId).all();
        
        const chapterNum = body.chapter_number || 1;
        
        // Send emails (limit to prevent timeout)
        const emails = followers.results?.slice(0, 50) || [];
        for (const follower of emails) {
          const email = follower.email as string;
          const name = (follower.display_name as string) || "Reader";
          
          await c.env.EMAILS.send({
            to: email,
            subject: `New Chapter: ${novel.title}`,
            html_body: emailTemplate(`
              ${emailHeader(`New Chapter Available!`)}
              ${emailBody(`
                <p style="margin: 0 0 16px 0;">Hi ${name},</p>
                <p style="margin: 0 0 16px 0;">Great news! <strong>${novel.title}</strong> just got a new chapter.</p>
                <p style="margin: 0 0 24px 0;"><strong>Chapter ${chapterNum}: ${body.title}</strong> is now available to read.</p>
                ${emailButton("Read Now", `https://inkseries.com/read/${novel.slug}/${chapterNum}`)}
                <p style="margin: 24px 0 0 0; font-size: 13px; color: #9ca3af;">
                  You're receiving this because you have "${novel.title}" in your library. 
                  <a href="https://inkseries.com/settings" style="color: #d97706;">Manage notifications</a>
                </p>
              `)}
              ${emailFooter("© 2025 Inkseries. Serialized African Teenage fiction. New episodes every week.")}
            `),
            text_body: `Hi ${name}, ${novel.title} just got a new chapter: Chapter ${chapterNum}: ${body.title}. Read it now at https://inkseries.com/read/${novel.slug}/${chapterNum}`
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send chapter notifications:", emailError);
      // Don't fail the request if emails fail
    }
  }

  return c.json({ success: true });
});

// Bulk import chapters
app.post("/api/admin/novels/:novelId/chapters/bulk", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const novelId = parseInt(c.req.param("novelId"));
  const body = await c.req.json();
  const { chapters, is_premium, is_published } = body as {
    chapters: Array<{ title: string; content: string; part_number?: number; chapter_number?: number }>;
    is_premium: boolean;
    is_published: boolean;
  };

  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
    return c.json({ error: "No chapters provided" }, 400);
  }

  // Get next chapter number
  const lastChapter = await c.env.DB.prepare(`
    SELECT MAX(chapter_number) as max_num FROM chapters WHERE novel_id = ?
  `).bind(novelId).first();
  let nextChapterNum = ((lastChapter?.max_num as number) || 0) + 1;

  let importedCount = 0;
  for (const chapter of chapters) {
    if (!chapter.title || !chapter.content) continue;
    
    const wordCount = countWords(chapter.content);
    const partNum = chapter.part_number || 1;
    const chapterNum = chapter.chapter_number || nextChapterNum;
    
    await c.env.DB.prepare(`
      INSERT INTO chapters (novel_id, chapter_number, title, content, word_count, is_premium, is_published, published_at, part_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      novelId,
      chapterNum,
      chapter.title,
      chapter.content,
      wordCount,
      is_premium ? 1 : 0,
      is_published ? 1 : 0,
      is_published ? new Date().toISOString() : null,
      partNum
    ).run();
    
    nextChapterNum++;
    importedCount++;
  }

  // Update novel's total chapters count
  const now = new Date().toISOString();
  await c.env.DB.prepare(`
    UPDATE novels SET total_chapters = (
      SELECT COUNT(*) FROM chapters 
      WHERE novel_id = ? AND is_published = 1 
        AND (scheduled_release_at IS NULL OR scheduled_release_at <= ?)
    ), updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(novelId, now, novelId).run();

  return c.json({ success: true, imported: importedCount });
});

// Update a chapter
app.patch("/api/admin/chapters/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const chapterId = parseInt(c.req.param("id"));
  const body = await c.req.json();

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (body.title !== undefined) { updates.push("title = ?"); params.push(body.title); }
  if (body.content !== undefined) { 
    updates.push("content = ?"); 
    params.push(body.content);
    updates.push("word_count = ?");
    params.push(countWords(body.content));
  }
  if (body.part_number !== undefined) { updates.push("part_number = ?"); params.push(body.part_number); }
  if (body.chapter_number !== undefined) { updates.push("chapter_number = ?"); params.push(body.chapter_number); }
  if (body.is_premium !== undefined) { updates.push("is_premium = ?"); params.push(body.is_premium ? 1 : 0); }
  if (body.is_published !== undefined) { 
    updates.push("is_published = ?"); 
    params.push(body.is_published ? 1 : 0);
    if (body.is_published) {
      updates.push("published_at = CURRENT_TIMESTAMP");
    }
  }
  if (body.audio_url !== undefined) { updates.push("audio_url = ?"); params.push(body.audio_url); }
  if (body.scheduled_release_at !== undefined) { 
    updates.push("scheduled_release_at = ?"); 
    params.push(body.scheduled_release_at || null); 
  }
  if (body.season_id !== undefined) { 
    updates.push("season_id = ?"); 
    params.push(body.season_id || null); 
  }
  
  updates.push("updated_at = CURRENT_TIMESTAMP");

  await c.env.DB.prepare(`UPDATE chapters SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params, chapterId).run();

  // Update novel's total chapters count (only count released chapters)
  const chapter = await c.env.DB.prepare(`SELECT novel_id FROM chapters WHERE id = ?`).bind(chapterId).first();
  if (chapter) {
    const now = new Date().toISOString();
    await c.env.DB.prepare(`
      UPDATE novels SET total_chapters = (
        SELECT COUNT(*) FROM chapters 
        WHERE novel_id = ? AND is_published = 1 
          AND (scheduled_release_at IS NULL OR scheduled_release_at <= ?)
      ), updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(chapter.novel_id, now, chapter.novel_id).run();
  }

  return c.json({ success: true });
});

// Delete a chapter
app.delete("/api/admin/chapters/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const chapterId = parseInt(c.req.param("id"));
  
  // Get novel_id before deleting
  const chapter = await c.env.DB.prepare(`SELECT novel_id FROM chapters WHERE id = ?`).bind(chapterId).first();
  
  await c.env.DB.prepare(`DELETE FROM chapters WHERE id = ?`).bind(chapterId).run();

  // Update novel's total chapters count
  if (chapter) {
    await c.env.DB.prepare(`
      UPDATE novels SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE novel_id = ? AND is_published = 1), updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(chapter.novel_id, chapter.novel_id).run();
  }

  return c.json({ success: true });
});

// Bulk delete chapters (admin)
app.post("/api/admin/chapters/bulk-delete", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const { chapterIds } = await c.req.json<{ chapterIds: number[] }>();
  
  if (!chapterIds || chapterIds.length === 0) {
    return c.json({ error: "No chapters specified" }, 400);
  }

  // Get novel_ids before deleting to update counts
  const novelIds = new Set<number>();
  for (const id of chapterIds) {
    const chapter = await c.env.DB.prepare(`SELECT novel_id FROM chapters WHERE id = ?`).bind(id).first();
    if (chapter) novelIds.add(chapter.novel_id as number);
  }

  // Delete all chapters
  const placeholders = chapterIds.map(() => "?").join(",");
  await c.env.DB.prepare(`DELETE FROM chapters WHERE id IN (${placeholders})`).bind(...chapterIds).run();

  // Update novel chapter counts
  for (const novelId of novelIds) {
    await c.env.DB.prepare(`
      UPDATE novels SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE novel_id = ? AND is_published = 1), updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(novelId, novelId).run();
  }

  return c.json({ success: true, deleted: chapterIds.length });
});

// Get user subscription status
app.get("/api/subscription", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(`
    SELECT subscription_tier, subscription_expires_at FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first();

  if (!profile) {
    return c.json({ plan: "free", active: false });
  }

  const expiresAt = profile.subscription_expires_at as string | null;
  const isActive = expiresAt && new Date(expiresAt) > new Date();

  return c.json({
    plan: isActive ? profile.subscription_tier : "free",
    expires_at: expiresAt,
    active: isActive,
  });
});

// Check subscription status (optional auth - for gated content checks)
app.get("/api/subscriptions/status", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  
  if (!sessionToken) {
    return c.json({ isActive: false, plan: null, isTrial: false });
  }

  try {
    const user = await getCurrentUser(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    if (!user) {
      return c.json({ isActive: false, plan: null, isTrial: false });
    }

    // Check if user is admin - admins have full access
    const isAdmin = await isUserAdmin(user.id, c.env.DB);
    if (isAdmin) {
      return c.json({
        isActive: true,
        plan: 'admin',
        expiresAt: null,
        isTrial: false,
        trialExpiresAt: null,
      });
    }

    const profile = await c.env.DB.prepare(`
      SELECT subscription_tier, subscription_expires_at, trial_started_at FROM user_profiles WHERE auth_user_id = ?
    `).bind(user.id).first() as { subscription_tier: string | null; subscription_expires_at: string | null; trial_started_at: string | null } | null;

    if (!profile) {
      return c.json({ isActive: false, plan: null, isTrial: false });
    }

    const expiresAt = profile.subscription_expires_at;
    const isSubscriptionActive = expiresAt && new Date(expiresAt) > new Date();

    // Check for active 3-day trial
    const trialStartedAt = profile.trial_started_at;
    let isTrialActive = false;
    let trialExpiresAt: string | null = null;
    
    if (trialStartedAt && !isSubscriptionActive) {
      const trialStart = new Date(trialStartedAt);
      const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
      isTrialActive = new Date() < trialEnd;
      trialExpiresAt = trialEnd.toISOString();
    }

    return c.json({
      isActive: !!isSubscriptionActive || isTrialActive,
      plan: isSubscriptionActive ? profile.subscription_tier : (isTrialActive ? 'trial' : null),
      expiresAt: isSubscriptionActive ? expiresAt : (isTrialActive ? trialExpiresAt : null),
      isTrial: isTrialActive,
      trialExpiresAt: isTrialActive ? trialExpiresAt : null,
    });
  } catch {
    return c.json({ isActive: false, plan: null, isTrial: false });
  }
});

// Get detailed subscription info for settings page
app.get("/api/subscriptions/details", authMiddleware, async (c) => {
  const user = c.get("user");

  const profile = await c.env.DB.prepare(`
    SELECT subscription_tier, subscription_expires_at, trial_started_at FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { subscription_tier: string | null; subscription_expires_at: string | null; trial_started_at: string | null } | null;

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  // Get latest subscription record with recurring info
  const subscription = await c.env.DB.prepare(`
    SELECT plan_type, amount, starts_at, expires_at, is_recurring, flutterwave_subscription_id, is_cancelled, cancelled_at, payment_provider
    FROM subscriptions 
    WHERE user_id = (SELECT id FROM user_profiles WHERE auth_user_id = ?) 
    ORDER BY created_at DESC LIMIT 1
  `).bind(user!.id).first() as {
    plan_type: string;
    amount: number;
    starts_at: string;
    expires_at: string;
    is_recurring: number;
    flutterwave_subscription_id: string | null;
    is_cancelled: number;
    cancelled_at: string | null;
    payment_provider: string;
  } | null;

  const expiresAt = profile.subscription_expires_at;
  const isActive = expiresAt && new Date(expiresAt) > new Date();

  // Check for active trial
  const trialStartedAt = profile.trial_started_at;
  let isTrialActive = false;
  let trialExpiresAt: string | null = null;
  
  if (trialStartedAt && !isActive) {
    const trialStart = new Date(trialStartedAt);
    const trialEnd = new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000);
    isTrialActive = new Date() < trialEnd;
    trialExpiresAt = trialEnd.toISOString();
  }

  return c.json({
    isActive: !!isActive || isTrialActive,
    isTrial: isTrialActive,
    trialExpiresAt,
    plan: isActive ? profile.subscription_tier : null,
    expiresAt: isActive ? expiresAt : null,
    subscription: subscription ? {
      planType: subscription.plan_type,
      amount: subscription.amount,
      startsAt: subscription.starts_at,
      expiresAt: subscription.expires_at,
      isRecurring: !!subscription.is_recurring,
      isCancelled: !!subscription.is_cancelled,
      cancelledAt: subscription.cancelled_at,
      paymentProvider: subscription.payment_provider,
      flutterwaveSubscriptionId: subscription.flutterwave_subscription_id
    } : null
  });
});

// Cancel subscription
app.post("/api/subscriptions/cancel", authMiddleware, async (c) => {
  const user = c.get("user");
  const { reason, acceptedSaveOffer } = await c.req.json() as { reason?: string; acceptedSaveOffer?: boolean };

  // Get profile and latest subscription
  const profile = await c.env.DB.prepare(`
    SELECT id, subscription_tier, subscription_expires_at, display_name, email FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { id: number; subscription_tier: string; subscription_expires_at: string; display_name: string; email: string } | null;

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  const subscription = await c.env.DB.prepare(`
    SELECT id, plan_type, amount, expires_at, is_recurring, flutterwave_subscription_id
    FROM subscriptions 
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC LIMIT 1
  `).bind(profile.id).first() as {
    id: number;
    plan_type: string;
    amount: number;
    expires_at: string;
    is_recurring: number;
    flutterwave_subscription_id: string | null;
  } | null;

  if (!subscription) {
    return c.json({ error: "No active subscription found" }, 404);
  }

  // If it's a recurring subscription with Flutterwave, cancel it there
  if (subscription.is_recurring && subscription.flutterwave_subscription_id) {
    try {
      const cancelRes = await fetch(`https://api.flutterwave.com/v3/subscriptions/${subscription.flutterwave_subscription_id}/cancel`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${c.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!cancelRes.ok) {
        console.error("Flutterwave cancel failed:", await cancelRes.text());
      }
    } catch (err) {
      console.error("Flutterwave cancel error:", err);
    }
  }

  // Mark subscription as cancelled (user keeps access until expires_at)
  await c.env.DB.prepare(`
    UPDATE subscriptions 
    SET is_cancelled = 1, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(subscription.id).run();

  // Record cancellation
  await c.env.DB.prepare(`
    INSERT INTO subscription_cancellations (user_id, plan_type, amount, cancellation_reason, access_expires_at, flutterwave_subscription_id, save_offer_shown, save_offer_accepted)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).bind(
    user!.id,
    subscription.plan_type,
    subscription.amount,
    reason || null,
    subscription.expires_at,
    subscription.flutterwave_subscription_id || null,
    acceptedSaveOffer ? 1 : 0
  ).run();

  // Send cancellation confirmation email
  const planLabels: Record<string, string> = {
    weekly: "Weekly", monthly: "Monthly", quarterly: "3-Month", 
    biannual: "6-Month", yearly: "Yearly",
    family_weekly: "Family Weekly", family_monthly: "Family Monthly",
    family_quarterly: "Family 3-Month", family_biannual: "Family 6-Month", family_annual: "Family Yearly"
  };
  const planLabel = planLabels[subscription.plan_type] || subscription.plan_type;
  const expiryDate = new Date(subscription.expires_at).toLocaleDateString("en-NG", { 
    weekday: "long", year: "numeric", month: "long", day: "numeric" 
  });
  const firstName = profile.display_name?.split(' ')[0] || 'there';

  try {
    await c.env.EMAILS.send({
      to: profile.email,
      subject: "Your Inkseries subscription has been cancelled",
      html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #0a0a0a; font-family: Arial, Helvetica, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #d4af37, #f5a623); padding: 24px; text-align: center;">
      <img src="https://sitmr2etn6sue.mochausercontent.com/favicon.png" alt="Inkseries" style="width: 48px; height: 48px;" />
    </div>
    <div style="padding: 32px;">
      <h1 style="margin: 0 0 24px 0; font-size: 22px; color: #f5f5f5; text-align: center;">We're sorry to see you go</h1>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #e5e5e5;">Hi ${firstName},</p>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #e5e5e5;">Your <strong style="color: #d4af37;">${planLabel}</strong> subscription has been cancelled.</p>
      <div style="background: #0a0a0a; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; border: 1px solid #333;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #888;">Your access continues until</p>
        <p style="margin: 0; font-size: 20px; font-weight: bold; color: #d4af37;">${expiryDate}</p>
      </div>
      <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #e5e5e5;">You can still read all premium episodes until then. After that, you'll have access to free episodes only.</p>
      <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e5e5e5;">Changed your mind? You can resubscribe anytime from Settings.</p>
      <div style="text-align: center;">
        <a href="https://sitmr2etn6sue.mocha.app/settings" style="display: inline-block; background: linear-gradient(135deg, #d4af37, #f5a623); color: #000; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Resubscribe</a>
      </div>
    </div>
    <div style="padding: 20px; border-top: 1px solid #333; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #666;">We hope to see you again soon! 📚</p>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #555;">© ${new Date().getFullYear()} Inkseries. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
      text_body: `Hi ${firstName},\n\nYour ${planLabel} subscription has been cancelled.\n\nYour access continues until ${expiryDate}. You can still read all premium episodes until then.\n\nChanged your mind? Resubscribe anytime at https://sitmr2etn6sue.mocha.app/settings\n\nWe hope to see you again soon!\n\n© ${new Date().getFullYear()} Inkseries`
    });
  } catch (err) {
    console.error("Failed to send cancellation email:", err);
  }

  return c.json({ 
    success: true, 
    message: "Subscription cancelled",
    accessExpiresAt: subscription.expires_at
  });
});

// Accept save offer (extends subscription at discounted rate)
app.post("/api/subscriptions/save-offer", authMiddleware, async (c) => {
  const user = c.get("user");
  const { offerType } = await c.req.json() as { offerType: "pause" | "discount" };

  const profile = await c.env.DB.prepare(`
    SELECT id, subscription_tier, subscription_expires_at, display_name, email FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { id: number; subscription_tier: string; subscription_expires_at: string; display_name: string; email: string } | null;

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  const subscription = await c.env.DB.prepare(`
    SELECT id, plan_type, expires_at FROM subscriptions 
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC LIMIT 1
  `).bind(profile.id).first() as { id: number; plan_type: string; expires_at: string } | null;

  if (!subscription) {
    return c.json({ error: "No active subscription found" }, 404);
  }

  if (offerType === "pause") {
    // Add 7 days free pause extension
    const currentExpiry = new Date(subscription.expires_at);
    currentExpiry.setDate(currentExpiry.getDate() + 7);
    
    await c.env.DB.prepare(`
      UPDATE subscriptions SET expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(currentExpiry.toISOString(), subscription.id).run();

    await c.env.DB.prepare(`
      UPDATE user_profiles SET subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE auth_user_id = ?
    `).bind(currentExpiry.toISOString(), user!.id).run();

    return c.json({ 
      success: true, 
      message: "Your subscription has been paused for 1 week free",
      newExpiresAt: currentExpiry.toISOString()
    });
  } else if (offerType === "discount") {
    // Create a 50% discount payment link for renewal
    const discountAmounts: Record<string, number> = {
      weekly: 250, monthly: 750, quarterly: 2000, biannual: 3500, yearly: 7200
    };
    const amount = discountAmounts[subscription.plan_type] || 750;

    const tx_ref = `SAVE_${user!.id}_${Date.now()}`;
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${c.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency: "NGN",
        redirect_url: `https://sitmr2etn6sue.mocha.app/settings?payment=verify&reference=${tx_ref}`,
        customer: { email: profile.email, name: profile.display_name || "Reader" },
        customizations: { title: "Inkseries - 50% Off Renewal", logo: "https://sitmr2etn6sue.mochausercontent.com/favicon.png" },
        meta: { user_id: user!.id, plan_type: subscription.plan_type, is_save_offer: true, is_recurring: false },
        payment_options: "card,banktransfer,ussd"
      })
    });

    const data = await response.json() as { status: string; data?: { link: string } };
    if (data.status === "success" && data.data?.link) {
      return c.json({ success: true, authorization_url: data.data.link });
    }

    return c.json({ error: "Failed to create discount payment" }, 500);
  }

  return c.json({ error: "Invalid offer type" }, 400);
});

// Request subscription refund (48-hour for recurring, 7-day for one-time)
app.post("/api/subscriptions/refund", authMiddleware, async (c) => {
  const user = c.get("user");
  const { reason } = await c.req.json() as { reason?: string };

  // Get profile
  const profile = await c.env.DB.prepare(`
    SELECT id, display_name, email FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { id: number; display_name: string; email: string } | null;

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  // Get active subscription with first charge info
  const subscription = await c.env.DB.prepare(`
    SELECT id, plan_type, amount, payment_reference, first_charge_at, episodes_read_at_first_charge, is_recurring
    FROM subscriptions 
    WHERE user_id = ? AND is_active = 1 AND is_cancelled = 0
    ORDER BY created_at DESC LIMIT 1
  `).bind(profile.id).first() as {
    id: number;
    plan_type: string;
    amount: number;
    payment_reference: string;
    first_charge_at: string | null;
    episodes_read_at_first_charge: number | null;
    is_recurring: number;
  } | null;

  if (!subscription) {
    return c.json({ error: "No active subscription found" }, 404);
  }

  // Determine refund policy based on plan type
  const isOneTimePlan = ["quarterly", "biannual", "yearly"].includes(subscription.plan_type);
  const isRecurringPlan = ["weekly", "monthly"].includes(subscription.plan_type);
  const refundWindowHours = isOneTimePlan ? 168 : 48; // 7 days vs 48 hours
  const maxEpisodes = isOneTimePlan ? 10 : 5;
  const refundType = isOneTimePlan ? "7_day_onetime" : "48_hour_satisfaction";
  const planDisplayName = subscription.plan_type === "quarterly" ? "3-Month" :
                          subscription.plan_type === "biannual" ? "6-Month" :
                          subscription.plan_type === "yearly" ? "Yearly" :
                          subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1);

  // Recurring plans don't get refunds, only cancellation
  if (isRecurringPlan && subscription.is_recurring) {
    return c.json({ error: "Recurring plans can be cancelled but do not qualify for refunds. No refunds are issued for recurring plan payments already processed." }, 400);
  }

  // Check if they already got a refund before
  const previousRefund = await c.env.DB.prepare(`
    SELECT id FROM refunds WHERE user_id = ? AND status = 'completed'
  `).bind(profile.id).first();

  if (previousRefund) {
    return c.json({ error: "You have already received a refund. Each account is eligible for one refund only." }, 400);
  }

  // Check refund window from first charge
  if (!subscription.first_charge_at) {
    return c.json({ error: "Unable to verify charge timing. Please contact support." }, 400);
  }

  const firstChargeTime = new Date(subscription.first_charge_at).getTime();
  const now = Date.now();
  const hoursSinceCharge = (now - firstChargeTime) / (1000 * 60 * 60);

  if (hoursSinceCharge > refundWindowHours) {
    const windowDescription = isOneTimePlan ? "7-day" : "48-hour";
    return c.json({ 
      error: `The ${windowDescription} refund window has expired`,
      hoursAgo: Math.floor(hoursSinceCharge)
    }, 400);
  }

  // Check episodes read
  const episodesAtCharge = subscription.episodes_read_at_first_charge || 0;
  const currentEpisodes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM chapters_read WHERE user_id = ?
  `).bind(profile.id).first() as { count: number };
  
  const episodesReadSinceCharge = currentEpisodes.count - episodesAtCharge;

  if (episodesReadSinceCharge >= maxEpisodes) {
    return c.json({ 
      error: `You have read ${episodesReadSinceCharge} episodes since subscribing. Refunds are available if you've read fewer than ${maxEpisodes} episodes.`,
      episodesRead: episodesReadSinceCharge
    }, 400);
  }

  // Get the Flutterwave transaction ID from payment_charges table
  const charge = await c.env.DB.prepare(`
    SELECT flutterwave_transaction_id FROM payment_charges 
    WHERE subscription_id = ? ORDER BY charged_at DESC LIMIT 1
  `).bind(subscription.id).first() as { flutterwave_transaction_id: string } | null;

  if (!charge?.flutterwave_transaction_id) {
    return c.json({ 
      error: "Unable to process automatic refund. Please contact support for assistance.",
      code: "NO_TRANSACTION_ID"
    }, 400);
  }

  // Process the refund via Flutterwave
  const refundResult = await processFlutterwaveRefund(
    charge.flutterwave_transaction_id,
    subscription.amount,
    c.env
  );

  if (!refundResult.success) {
    await c.env.DB.prepare(`
      INSERT INTO refunds (user_id, subscription_id, amount, refund_type, status, refund_reason, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'failed', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(profile.id, subscription.id, subscription.amount, refundType, refundResult.error || "Unknown error").run();

    return c.json({ 
      error: "Refund processing failed. Our team has been notified.",
      details: refundResult.error
    }, 500);
  }

  // Record successful refund with episodes read count
  await c.env.DB.prepare(`
    INSERT INTO refunds (user_id, subscription_id, amount, refund_type, status, flutterwave_refund_id, refund_reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(profile.id, subscription.id, subscription.amount, refundType, refundResult.refund_id || null, reason || null).run();

  // Cancel the subscription immediately
  await c.env.DB.prepare(`
    UPDATE subscriptions 
    SET is_active = 0, is_cancelled = 1, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(subscription.id).run();

  // Downgrade user to free
  await c.env.DB.prepare(`
    UPDATE user_profiles 
    SET subscription_tier = 'free', subscription_expires_at = NULL, updated_at = CURRENT_TIMESTAMP 
    WHERE auth_user_id = ?
  `).bind(user!.id).run();

  // Send refund confirmation email with plan name
  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #d4a853 0%, #f5a623 100%); padding: 32px; text-align: center;">
        <img src="https://sitmr2etn6sue.mochausercontent.com/favicon.png" alt="Inkseries" style="width: 48px; height: 48px; margin-bottom: 16px;">
        <h1 style="margin: 0; font-size: 24px; color: #0a0a0a;">Refund Request Received</h1>
      </div>
      <div style="padding: 32px;">
        <p style="margin: 0 0 16px; font-size: 16px;">Hi ${profile.display_name || "there"},</p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #a1a1aa;">Your refund request for your Inkseries <strong style="color: #ffffff;">${planDisplayName}</strong> subscription has been received.</p>
        <p style="margin: 0 0 16px; font-size: 16px; color: #a1a1aa;">Your access has been deactivated.</p>
        <div style="background: #18181b; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #a1a1aa;">Refund Amount</p>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: #d4a853;">₦${subscription.amount.toLocaleString()}</p>
        </div>
        <p style="margin: 0 0 16px; font-size: 16px; color: #a1a1aa;">Your refund will be processed within <strong style="color: #ffffff;">3 to 5 business days</strong> back to your original payment method.</p>
        <p style="margin: 24px 0 0; font-size: 14px; color: #71717a;">We're sorry to see you go. You're always welcome back!</p>
      </div>
      <div style="background: #18181b; padding: 24px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #71717a;">© ${new Date().getFullYear()} Inkseries. All rights reserved.</p>
      </div>
    </div>
  `;

  c.executionCtx.waitUntil(
    c.env.EMAILS.send({
      to: profile.email,
      subject: "Your Inkseries Refund Request",
      html_body: emailHtml
    })
  );

  return c.json({ 
    success: true, 
    message: "Refund processed successfully. Your access has been deactivated.",
    amount: subscription.amount,
    planName: planDisplayName
  });
});

// Check refund eligibility (48-hour for recurring, 7-day for one-time plans)
app.get("/api/subscriptions/refund-eligibility", authMiddleware, async (c) => {
  const user = c.get("user");

  const profile = await c.env.DB.prepare(`
    SELECT id FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { id: number } | null;

  if (!profile) {
    return c.json({ eligible: false, reason: "No profile" });
  }

  // Check for previous completed refund (any type)
  const previousRefund = await c.env.DB.prepare(`
    SELECT id FROM refunds WHERE user_id = ? AND status = 'completed'
  `).bind(profile.id).first();

  if (previousRefund) {
    return c.json({ eligible: false, reason: "You have already received a refund on this account" });
  }

  // Get active subscription
  const subscription = await c.env.DB.prepare(`
    SELECT id, plan_type, amount, first_charge_at, episodes_read_at_first_charge, is_recurring
    FROM subscriptions 
    WHERE user_id = ? AND is_active = 1 AND is_cancelled = 0
    ORDER BY created_at DESC LIMIT 1
  `).bind(profile.id).first() as {
    id: number;
    plan_type: string;
    amount: number;
    first_charge_at: string | null;
    episodes_read_at_first_charge: number | null;
    is_recurring: number;
  } | null;

  if (!subscription) {
    return c.json({ eligible: false, reason: "No active subscription" });
  }

  // Determine refund policy based on plan type
  const isOneTimePlan = ["quarterly", "biannual", "yearly"].includes(subscription.plan_type);
  const isRecurringPlan = ["weekly", "monthly"].includes(subscription.plan_type);
  
  // Recurring plans don't get refunds
  if (isRecurringPlan && subscription.is_recurring) {
    return c.json({ 
      eligible: false, 
      reason: "Recurring plans can be cancelled anytime but do not qualify for refunds",
      isRecurring: true,
      planType: subscription.plan_type
    });
  }

  if (!subscription.first_charge_at) {
    return c.json({ eligible: false, reason: "Unable to verify charge timing" });
  }

  const refundWindowHours = isOneTimePlan ? 168 : 48; // 7 days vs 48 hours
  const maxEpisodes = isOneTimePlan ? 10 : 5;
  const refundWindowDays = isOneTimePlan ? 7 : 2;
  const planDisplayName = subscription.plan_type === "quarterly" ? "3-Month" :
                          subscription.plan_type === "biannual" ? "6-Month" :
                          subscription.plan_type === "yearly" ? "Yearly" :
                          subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1);

  const firstChargeTime = new Date(subscription.first_charge_at).getTime();
  const now = Date.now();
  const hoursSinceCharge = (now - firstChargeTime) / (1000 * 60 * 60);
  const hoursRemaining = Math.max(0, refundWindowHours - hoursSinceCharge);
  const daysRemaining = Math.ceil(hoursRemaining / 24);

  if (hoursSinceCharge > refundWindowHours) {
    return c.json({ 
      eligible: false, 
      reason: `${refundWindowDays}-day refund window expired`,
      windowExpired: true,
      planType: subscription.plan_type,
      isOneTimePlan
    });
  }

  const episodesAtCharge = subscription.episodes_read_at_first_charge || 0;
  const currentEpisodes = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM chapters_read WHERE user_id = ?
  `).bind(profile.id).first() as { count: number };
  
  const episodesReadSinceCharge = currentEpisodes.count - episodesAtCharge;

  if (episodesReadSinceCharge >= maxEpisodes) {
    return c.json({ 
      eligible: false, 
      reason: `Read ${episodesReadSinceCharge} episodes (max ${maxEpisodes - 1} allowed)`,
      episodesRead: episodesReadSinceCharge,
      maxEpisodes,
      planType: subscription.plan_type
    });
  }

  return c.json({ 
    eligible: true, 
    hoursRemaining: Math.floor(hoursRemaining),
    daysRemaining,
    episodesRead: episodesReadSinceCharge,
    maxEpisodes,
    refundAmount: subscription.amount,
    planType: subscription.plan_type,
    planDisplayName,
    isOneTimePlan,
    refundWindowDays
  });
});

// Plan upgrade/downgrade system
const INDIVIDUAL_PLANS = {
  weekly: { amount: 500, duration: 7, label: "Weekly", order: 1 },
  monthly: { amount: 1500, duration: 30, label: "Monthly", order: 2 },
  quarterly: { amount: 4000, duration: 90, label: "3-Month", order: 3 },
  biannual: { amount: 7000, duration: 180, label: "6-Month", order: 4 },
  yearly: { amount: 14400, duration: 365, label: "Yearly", order: 5 }
};

const FAMILY_PLANS = {
  family_weekly: { amount: 1500, duration: 7, label: "Family Weekly", order: 1 },
  family_monthly: { amount: 4500, duration: 30, label: "Family Monthly", order: 2 },
  family_quarterly: { amount: 11000, duration: 90, label: "Family 3-Month", order: 3 },
  family_biannual: { amount: 20000, duration: 180, label: "Family 6-Month", order: 4 },
  family_yearly: { amount: 40000, duration: 365, label: "Family Yearly", order: 5 }
};

// Get available plans for upgrade/downgrade
app.get("/api/subscriptions/plans", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await c.env.DB.prepare(`SELECT id FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first();
  
  // Check individual subscription
  const currentSub = await c.env.DB.prepare(`
    SELECT plan_type, expires_at, amount FROM subscriptions 
    WHERE user_id = ? AND is_active = 1 AND is_cancelled = 0
    ORDER BY expires_at DESC LIMIT 1
  `).bind(profile!.id).first() as { plan_type: string; expires_at: string; amount: number } | null;

  // Check family plan membership
  const familyMember = await c.env.DB.prepare(`
    SELECT fpm.id, fp.plan_type, fp.expires_at, fp.owner_user_id
    FROM family_plan_members fpm
    JOIN family_plans fp ON fpm.family_plan_id = fp.id
    WHERE fpm.user_id = ? AND fp.is_active = 1
  `).bind(user!.id).first() as { id: number; plan_type: string; expires_at: string; owner_user_id: string } | null;

  // Check if user owns a family plan
  const familyOwner = await c.env.DB.prepare(`
    SELECT id, plan_type, expires_at FROM family_plans 
    WHERE owner_user_id = ? AND is_active = 1
  `).bind(user!.id).first() as { id: number; plan_type: string; expires_at: string } | null;

  const currentPlanType = familyOwner?.plan_type || familyMember?.plan_type || currentSub?.plan_type || null;
  const isCurrentlyFamily = !!(familyOwner || familyMember);
  const isFamilyOwner = !!familyOwner;
  const currentExpires = familyOwner?.expires_at || familyMember?.expires_at || currentSub?.expires_at || null;

  // Get current plan order for comparison
  const getCurrentOrder = () => {
    if (!currentPlanType) return 0;
    if (isCurrentlyFamily) {
      return FAMILY_PLANS[currentPlanType as keyof typeof FAMILY_PLANS]?.order || 0;
    }
    return INDIVIDUAL_PLANS[currentPlanType as keyof typeof INDIVIDUAL_PLANS]?.order || 0;
  };
  const currentOrder = getCurrentOrder();

  const individualPlans = Object.entries(INDIVIDUAL_PLANS).map(([key, plan]) => ({
    planType: key,
    amount: plan.amount,
    duration: plan.duration,
    label: plan.label,
    category: "individual" as const,
    isCurrent: currentPlanType === key && !isCurrentlyFamily,
    isUpgrade: !isCurrentlyFamily && currentSub ? plan.order > currentOrder : false,
    isDowngrade: !isCurrentlyFamily && currentSub ? plan.order < currentOrder : false,
    isCategorySwitch: isCurrentlyFamily // switching from family to individual
  }));

  const familyPlans = Object.entries(FAMILY_PLANS).map(([key, plan]) => ({
    planType: key,
    amount: plan.amount,
    duration: plan.duration,
    label: plan.label,
    category: "family" as const,
    isCurrent: currentPlanType === key && isCurrentlyFamily,
    isUpgrade: isCurrentlyFamily && (familyOwner || familyMember) ? plan.order > currentOrder : false,
    isDowngrade: isCurrentlyFamily && (familyOwner || familyMember) ? plan.order < currentOrder : false,
    isCategorySwitch: !isCurrentlyFamily && !!currentSub // switching from individual to family
  }));

  return c.json({ 
    individualPlans,
    familyPlans,
    currentPlan: currentPlanType,
    currentCategory: isCurrentlyFamily ? "family" : currentSub ? "individual" : null,
    currentExpires,
    isFamilyOwner,
    isFamilyMember: !!familyMember && !familyOwner
  });
});

// Check for scheduled plan change
app.get("/api/subscriptions/scheduled-change", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const scheduled = await c.env.DB.prepare(`
    SELECT * FROM scheduled_plan_changes 
    WHERE user_id = ? AND is_processed = 0
    ORDER BY created_at DESC LIMIT 1
  `).bind(user!.id).first();

  if (!scheduled) {
    return c.json({ hasScheduledChange: false });
  }

  const newPlanInfo = INDIVIDUAL_PLANS[scheduled.new_plan_type as keyof typeof INDIVIDUAL_PLANS];
  
  return c.json({
    hasScheduledChange: true,
    scheduledChange: {
      id: scheduled.id,
      currentPlan: scheduled.current_plan_type,
      newPlan: scheduled.new_plan_type,
      newPlanLabel: newPlanInfo?.label || scheduled.new_plan_type,
      changeType: scheduled.change_type,
      effectiveAt: scheduled.effective_at,
      prorationCredit: scheduled.proration_credit
    }
  });
});

// Upgrade subscription (immediate with proration)
app.post("/api/subscriptions/upgrade", authMiddleware, async (c) => {
  const user = c.get("user");
  const { newPlanType } = await c.req.json();

  if (!INDIVIDUAL_PLANS[newPlanType as keyof typeof INDIVIDUAL_PLANS]) {
    return c.json({ error: "Invalid plan type" }, 400);
  }

  const profile = await c.env.DB.prepare(`SELECT id, email, display_name FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first() as { id: number; email: string; display_name: string } | null;
  
  const currentSub = await c.env.DB.prepare(`
    SELECT id, plan_type, amount, expires_at, starts_at FROM subscriptions 
    WHERE user_id = ? AND is_active = 1 AND is_cancelled = 0
    ORDER BY expires_at DESC LIMIT 1
  `).bind(profile!.id).first() as { id: number; plan_type: string; amount: number; expires_at: string; starts_at: string } | null;

  if (!currentSub) {
    return c.json({ error: "No active subscription found" }, 400);
  }

  const currentPlan = INDIVIDUAL_PLANS[currentSub.plan_type as keyof typeof INDIVIDUAL_PLANS];
  const newPlan = INDIVIDUAL_PLANS[newPlanType as keyof typeof INDIVIDUAL_PLANS];

  if (!currentPlan || newPlan.order <= currentPlan.order) {
    return c.json({ error: "Can only upgrade to a higher tier plan" }, 400);
  }

  // Calculate proration
  const now = new Date();
  const expiresAt = new Date(currentSub.expires_at);
  const startsAt = new Date(currentSub.starts_at || now);
  const totalDays = Math.max(1, (expiresAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Credit for unused portion of current plan
  const dailyRate = currentSub.amount / totalDays;
  const prorationCredit = Math.round(dailyRate * remainingDays);
  
  // Amount due for upgrade
  const upgradeCost = Math.max(0, newPlan.amount - prorationCredit);

  // If no payment needed (full credit covers upgrade), apply immediately
  if (upgradeCost <= 0) {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + newPlan.duration);
    
    // Update subscription
    await c.env.DB.prepare(`
      UPDATE subscriptions SET plan_type = ?, amount = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newPlanType, newPlan.amount, newExpiresAt.toISOString(), currentSub.id).run();
    
    await c.env.DB.prepare(`
      UPDATE user_profiles SET subscription_tier = ?, subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE auth_user_id = ?
    `).bind(newPlanType, newExpiresAt.toISOString(), user!.id).run();

    // Send upgrade confirmation email
    if (profile?.email) {
      c.executionCtx.waitUntil(
        c.env.EMAILS.send({
          to: profile.email,
          subject: "🎉 Your Inkseries Plan Has Been Upgraded!",
          html_body: `
            <div style="font-family: 'Source Sans 3', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
              <img src="https://sitmr2etn6sue.mochausercontent.com/favicon.png" alt="Inkseries" style="width: 48px; height: 48px; margin-bottom: 16px;" />
              <h1 style="color: #f5a623; margin: 0 0 16px;">Plan Upgraded Successfully!</h1>
              <p>Hi ${profile.display_name || "there"},</p>
              <p>Great news! Your Inkseries subscription has been upgraded.</p>
              <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Previous Plan:</strong> ${currentPlan.label}</p>
                <p style="margin: 4px 0;"><strong>New Plan:</strong> ${newPlan.label} (₦${newPlan.amount.toLocaleString()})</p>
                <p style="margin: 4px 0;"><strong>New Expiry Date:</strong> ${newExpiresAt.toLocaleDateString()}</p>
              </div>
              <p>Enjoy unlimited access to all episodes and exclusive features!</p>
              <a href="https://sitmr2etn6sue.mocha.app/explore" style="display: inline-block; background: #f5a623; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Continue Reading</a>
              <p style="color: #888; font-size: 14px; margin-top: 24px;">— The Inkseries Team</p>
            </div>
          `
        })
      );
    }
    
    return c.json({
      success: true,
      message: "Plan upgraded successfully!",
      newPlan: newPlanType,
      newPlanLabel: newPlan.label,
      expiresAt: newExpiresAt.toISOString()
    });
  }

  // Initiate Flutterwave payment for upgrade
  const reference = `upgrade_${user!.id}_${Date.now()}`;
  const callbackUrl = `https://sitmr2etn6sue.mocha.app/payment-callback`;

  try {
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${c.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: upgradeCost / 100, // Convert to Naira
        currency: "NGN",
        redirect_url: callbackUrl,
        customer: {
          email: user!.email,
        },
        meta: {
          type: "upgrade",
          user_id: user!.id,
          current_plan_type: currentSub.plan_type,
          new_plan_type: newPlanType,
          current_plan_label: currentPlan.label,
          new_plan_label: newPlan.label,
          duration_days: newPlan.duration,
          new_plan_amount: newPlan.amount,
          proration_credit: prorationCredit,
          subscription_id: currentSub.id,
        },
        customizations: {
          title: "Inkseries Plan Upgrade",
          logo: "https://mochausercontent.com/68476787-c76e-4a74-af9a-22c5c3c44b1b/favicon.png",
        },
      }),
    });

    const data = await response.json() as { status: string; message?: string; data?: { link: string } };

    if (data.status !== "success") {
      return c.json({ error: data.message || "Payment initialization failed" }, 400);
    }

    return c.json({
      authorization_url: data.data?.link,
      reference,
      currentPlan: currentSub.plan_type,
      currentPlanLabel: currentPlan.label,
      newPlan: newPlanType,
      newPlanLabel: newPlan.label,
      remainingDays: Math.round(remainingDays),
      prorationCredit,
      newPlanCost: newPlan.amount,
      amountDue: upgradeCost,
    });
  } catch (error) {
    console.error("Flutterwave upgrade error:", error);
    return c.json({ error: "Payment service unavailable" }, 500);
  }
});

// Schedule downgrade (takes effect at renewal)
app.post("/api/subscriptions/downgrade", authMiddleware, async (c) => {
  const user = c.get("user");
  const { newPlanType } = await c.req.json();

  if (!INDIVIDUAL_PLANS[newPlanType as keyof typeof INDIVIDUAL_PLANS]) {
    return c.json({ error: "Invalid plan type" }, 400);
  }

  const profile = await c.env.DB.prepare(`SELECT id, email, display_name FROM user_profiles WHERE auth_user_id = ?`).bind(user!.id).first() as { id: number; email: string; display_name: string } | null;
  
  const currentSub = await c.env.DB.prepare(`
    SELECT id, plan_type, expires_at FROM subscriptions 
    WHERE user_id = ? AND is_active = 1 AND is_cancelled = 0
    ORDER BY expires_at DESC LIMIT 1
  `).bind(profile!.id).first() as { id: number; plan_type: string; expires_at: string } | null;

  if (!currentSub) {
    return c.json({ error: "No active subscription found" }, 400);
  }

  const currentPlan = INDIVIDUAL_PLANS[currentSub.plan_type as keyof typeof INDIVIDUAL_PLANS];
  const newPlan = INDIVIDUAL_PLANS[newPlanType as keyof typeof INDIVIDUAL_PLANS];

  if (!currentPlan || newPlan.order >= currentPlan.order) {
    return c.json({ error: "Can only downgrade to a lower tier plan" }, 400);
  }

  // Check for existing scheduled change
  const existing = await c.env.DB.prepare(`
    SELECT id FROM scheduled_plan_changes WHERE user_id = ? AND is_processed = 0
  `).bind(user!.id).first();

  if (existing) {
    // Update existing scheduled change
    await c.env.DB.prepare(`
      UPDATE scheduled_plan_changes 
      SET new_plan_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newPlanType, existing.id).run();
  } else {
    // Create new scheduled change
    await c.env.DB.prepare(`
      INSERT INTO scheduled_plan_changes (user_id, current_plan_type, new_plan_type, change_type, effective_at)
      VALUES (?, ?, ?, 'downgrade', ?)
    `).bind(user!.id, currentSub.plan_type, newPlanType, currentSub.expires_at).run();
  }

  // Send confirmation email
  if (profile?.email) {
    try {
      await c.env.EMAILS.send({
        to: profile.email,
        subject: "Your Inkseries Plan Change is Scheduled",
        html_body: `
          <div style="font-family: 'Source Sans 3', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
            <img src="https://sitmr2etn6sue.mochausercontent.com/favicon.png" alt="Inkseries" style="width: 48px; height: 48px; margin-bottom: 16px;" />
            <h1 style="color: #f5a623; margin: 0 0 16px;">Plan Change Scheduled</h1>
            <p>Hi ${profile.display_name || "there"},</p>
            <p>Your plan change has been scheduled:</p>
            <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Current Plan:</strong> ${currentPlan.label} (₦${currentPlan.amount.toLocaleString()})</p>
              <p style="margin: 4px 0;"><strong>New Plan:</strong> ${newPlan.label} (₦${newPlan.amount.toLocaleString()})</p>
              <p style="margin: 4px 0;"><strong>Effective Date:</strong> ${new Date(currentSub.expires_at).toLocaleDateString()}</p>
            </div>
            <p>You'll continue to enjoy your current plan until the change takes effect. You can cancel this change anytime from your settings.</p>
            <p style="color: #888; font-size: 14px; margin-top: 24px;">— The Inkseries Team</p>
          </div>
        `
      });
    } catch (e) {
      console.error("Failed to send downgrade email:", e);
    }
  }

  return c.json({ 
    success: true,
    currentPlan: currentSub.plan_type,
    currentPlanLabel: currentPlan.label,
    newPlan: newPlanType,
    newPlanLabel: newPlan.label,
    effectiveAt: currentSub.expires_at
  });
});

// Cancel scheduled plan change
app.delete("/api/subscriptions/scheduled-change", authMiddleware, async (c) => {
  const user = c.get("user");

  const scheduled = await c.env.DB.prepare(`
    SELECT id FROM scheduled_plan_changes WHERE user_id = ? AND is_processed = 0
  `).bind(user!.id).first();

  if (!scheduled) {
    return c.json({ error: "No scheduled change found" }, 404);
  }

  await c.env.DB.prepare(`
    DELETE FROM scheduled_plan_changes WHERE id = ?
  `).bind(scheduled.id).run();

  return c.json({ success: true });
});

// Switch between individual and family plans
app.post("/api/subscriptions/switch-category", authMiddleware, async (c) => {
  const user = c.get("user");
  const { newPlanType, targetCategory } = await c.req.json() as { newPlanType: string; targetCategory: "individual" | "family" };

  const profile = await c.env.DB.prepare(`SELECT id, email, display_name FROM user_profiles WHERE auth_user_id = ?`)
    .bind(user!.id).first() as { id: number; email: string; display_name: string } | null;

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  // Check current subscription status
  const currentIndividualSub = await c.env.DB.prepare(`
    SELECT id, plan_type, expires_at, amount FROM subscriptions 
    WHERE user_id = ? AND is_active = 1 AND is_cancelled = 0
    ORDER BY expires_at DESC LIMIT 1
  `).bind(profile.id).first() as { id: number; plan_type: string; expires_at: string; amount: number } | null;

  const familyOwner = await c.env.DB.prepare(`
    SELECT id, plan_type, expires_at FROM family_plans 
    WHERE owner_user_id = ? AND is_active = 1
  `).bind(user!.id).first() as { id: number; plan_type: string; expires_at: string } | null;

  const familyMember = await c.env.DB.prepare(`
    SELECT fpm.id, fp.plan_type, fp.expires_at, fp.owner_user_id
    FROM family_plan_members fpm
    JOIN family_plans fp ON fpm.family_plan_id = fp.id
    WHERE fpm.user_id = ? AND fp.is_active = 1
  `).bind(user!.id).first();

  // Determine current state
  const isCurrentlyFamily = !!(familyOwner || familyMember);

  if (targetCategory === "family") {
    // Individual → Family: Schedule switch or start new family plan
    if (!FAMILY_PLANS[newPlanType as keyof typeof FAMILY_PLANS]) {
      return c.json({ error: "Invalid family plan type" }, 400);
    }

    if (isCurrentlyFamily) {
      return c.json({ error: "You're already on a family plan" }, 400);
    }

    if (familyMember) {
      return c.json({ error: "You're part of another family plan. Leave it first to create your own." }, 400);
    }

    const newPlan = FAMILY_PLANS[newPlanType as keyof typeof FAMILY_PLANS];

    // If they have an active individual subscription, schedule the switch
    if (currentIndividualSub) {
      // Check for existing scheduled change
      const existing = await c.env.DB.prepare(`
        SELECT id FROM scheduled_plan_changes WHERE user_id = ? AND is_processed = 0
      `).bind(user!.id).first();

      if (existing) {
        await c.env.DB.prepare(`
          UPDATE scheduled_plan_changes 
          SET new_plan_type = ?, change_type = 'category_switch', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(newPlanType, existing.id).run();
      } else {
        await c.env.DB.prepare(`
          INSERT INTO scheduled_plan_changes (user_id, current_plan_type, new_plan_type, change_type, effective_at)
          VALUES (?, ?, ?, 'category_switch', ?)
        `).bind(user!.id, currentIndividualSub.plan_type, newPlanType, currentIndividualSub.expires_at).run();
      }

      // Send email
      if (profile.email) {
        try {
          await c.env.EMAILS.send({
            to: profile.email,
            subject: "Family Plan Switch Scheduled",
            html_body: `
              <div style="font-family: 'Source Sans 3', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
                <img src="https://sitmr2etn6sue.mochausercontent.com/favicon.png" alt="Inkseries" style="width: 48px; height: 48px; margin-bottom: 16px;" />
                <h1 style="color: #f5a623; margin: 0 0 16px;">Family Plan Switch Scheduled</h1>
                <p>Hi ${profile.display_name || "there"},</p>
                <p>Your switch to a Family Plan has been scheduled:</p>
                <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 4px 0;"><strong>New Plan:</strong> ${newPlan.label} (₦${newPlan.amount.toLocaleString()})</p>
                  <p style="margin: 4px 0;"><strong>Effective Date:</strong> ${new Date(currentIndividualSub.expires_at).toLocaleDateString()}</p>
                </div>
                <p>Once active, you'll be able to invite up to 4 family members to share your subscription.</p>
                <p style="color: #888; font-size: 14px; margin-top: 24px;">— The Inkseries Team</p>
              </div>
            `
          });
        } catch (e) {
          console.error("Failed to send category switch email:", e);
        }
      }

      return c.json({
        success: true,
        scheduled: true,
        newPlan: newPlanType,
        newPlanLabel: newPlan.label,
        effectiveAt: currentIndividualSub.expires_at
      });
    }

    // No current subscription - redirect to create family plan
    return c.json({
      success: false,
      requiresPayment: true,
      newPlan: newPlanType,
      newPlanLabel: newPlan.label,
      amount: newPlan.amount
    });

  } else {
    // Family → Individual: Only owner can do this
    if (!INDIVIDUAL_PLANS[newPlanType as keyof typeof INDIVIDUAL_PLANS]) {
      return c.json({ error: "Invalid individual plan type" }, 400);
    }

    if (!isCurrentlyFamily) {
      return c.json({ error: "You're not on a family plan" }, 400);
    }

    if (!familyOwner) {
      return c.json({ error: "Only the family plan owner can switch to an individual plan" }, 400);
    }

    const newPlan = INDIVIDUAL_PLANS[newPlanType as keyof typeof INDIVIDUAL_PLANS];

    // Schedule the switch
    const existing = await c.env.DB.prepare(`
      SELECT id FROM scheduled_plan_changes WHERE user_id = ? AND is_processed = 0
    `).bind(user!.id).first();

    if (existing) {
      await c.env.DB.prepare(`
        UPDATE scheduled_plan_changes 
        SET new_plan_type = ?, change_type = 'category_switch', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newPlanType, existing.id).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO scheduled_plan_changes (user_id, current_plan_type, new_plan_type, change_type, effective_at)
        VALUES (?, ?, ?, 'category_switch', ?)
      `).bind(user!.id, familyOwner.plan_type, newPlanType, familyOwner.expires_at).run();
    }

    // Send email
    if (profile.email) {
      try {
        await c.env.EMAILS.send({
          to: profile.email,
          subject: "Individual Plan Switch Scheduled",
          html_body: `
            <div style="font-family: 'Source Sans 3', sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
              <img src="https://sitmr2etn6sue.mochausercontent.com/favicon.png" alt="Inkseries" style="width: 48px; height: 48px; margin-bottom: 16px;" />
              <h1 style="color: #f5a623; margin: 0 0 16px;">Individual Plan Switch Scheduled</h1>
              <p>Hi ${profile.display_name || "there"},</p>
              <p>Your switch to an Individual Plan has been scheduled:</p>
              <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>New Plan:</strong> ${newPlan.label} (₦${newPlan.amount.toLocaleString()})</p>
                <p style="margin: 4px 0;"><strong>Effective Date:</strong> ${new Date(familyOwner.expires_at).toLocaleDateString()}</p>
              </div>
              <p><strong>Important:</strong> When your family plan expires, all family members will lose access. Make sure to inform them.</p>
              <p style="color: #888; font-size: 14px; margin-top: 24px;">— The Inkseries Team</p>
            </div>
          `
        });
      } catch (e) {
        console.error("Failed to send category switch email:", e);
      }
    }

    return c.json({
      success: true,
      scheduled: true,
      newPlan: newPlanType,
      newPlanLabel: newPlan.label,
      effectiveAt: familyOwner.expires_at
    });
  }
});

// Admin: Get cancellation stats
app.get("/api/admin/cancellations", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const cancellations = await c.env.DB.prepare(`
    SELECT 
      sc.*,
      up.display_name,
      up.email
    FROM subscription_cancellations sc
    LEFT JOIN user_profiles up ON up.auth_user_id = sc.user_id
    ORDER BY sc.created_at DESC
    LIMIT 100
  `).all();

  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_cancellations,
      SUM(CASE WHEN save_offer_accepted = 1 THEN 1 ELSE 0 END) as save_offers_accepted,
      SUM(amount) as total_lost_revenue
    FROM subscription_cancellations
    WHERE created_at > datetime('now', '-30 days')
  `).first() as { total_cancellations: number; save_offers_accepted: number; total_lost_revenue: number };

  return c.json({ 
    cancellations: cancellations.results,
    stats: {
      totalCancellations: stats.total_cancellations || 0,
      saveOffersAccepted: stats.save_offers_accepted || 0,
      totalLostRevenue: stats.total_lost_revenue || 0,
      saveRate: stats.total_cancellations > 0 
        ? Math.round((stats.save_offers_accepted / stats.total_cancellations) * 100) 
        : 0
    }
  });
});

// Admin Refunds Management
app.get("/api/admin/refunds", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const refunds = await c.env.DB.prepare(`
    SELECT 
      r.*,
      up.display_name,
      up.email
    FROM refunds r
    LEFT JOIN user_profiles up ON up.auth_user_id = r.user_id
    ORDER BY r.created_at DESC
    LIMIT 100
  `).all();

  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_refunds,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_refunds,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_refunds,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_refunded_amount
    FROM refunds
  `).first() as { total_refunds: number; pending_refunds: number; completed_refunds: number; total_refunded_amount: number };

  return c.json({ 
    refunds: refunds.results,
    stats: {
      totalRefunds: stats.total_refunds || 0,
      pendingRefunds: stats.pending_refunds || 0,
      completedRefunds: stats.completed_refunds || 0,
      totalRefundedAmount: stats.total_refunded_amount || 0,
    }
  });
});

app.patch("/api/admin/refunds/:refundId/status", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const refundId = parseInt(c.req.param("refundId"));
  const { status } = await c.req.json<{ status: string }>();

  if (!["pending", "processing", "completed", "failed"].includes(status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  await c.env.DB.prepare(`
    UPDATE refunds 
    SET status = ?, 
        processed_at = CASE WHEN ? IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE processed_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(status, status, refundId).run();

  return c.json({ success: true });
});

// Admin Plan Changes Management
app.get("/api/admin/plan-changes", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const changes = await c.env.DB.prepare(`
    SELECT 
      spc.*,
      up.display_name,
      up.email
    FROM scheduled_plan_changes spc
    LEFT JOIN user_profiles up ON up.auth_user_id = spc.user_id
    ORDER BY spc.created_at DESC
    LIMIT 200
  `).all();

  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_changes,
      SUM(CASE WHEN is_processed = 0 THEN 1 ELSE 0 END) as pending_changes,
      SUM(CASE WHEN is_processed = 1 THEN 1 ELSE 0 END) as processed_changes,
      SUM(CASE WHEN change_type = 'upgrade' AND is_processed = 0 THEN 1 ELSE 0 END) as pending_upgrades,
      SUM(CASE WHEN change_type = 'downgrade' AND is_processed = 0 THEN 1 ELSE 0 END) as pending_downgrades,
      SUM(CASE WHEN change_type = 'category_switch' AND is_processed = 0 THEN 1 ELSE 0 END) as pending_category_switches
    FROM scheduled_plan_changes
  `).first() as { 
    total_changes: number; 
    pending_changes: number; 
    processed_changes: number;
    pending_upgrades: number;
    pending_downgrades: number;
    pending_category_switches: number;
  };

  return c.json({ 
    changes: changes.results,
    stats: {
      totalChanges: stats.total_changes || 0,
      pendingChanges: stats.pending_changes || 0,
      processedChanges: stats.processed_changes || 0,
      pendingUpgrades: stats.pending_upgrades || 0,
      pendingDowngrades: stats.pending_downgrades || 0,
      pendingCategorySwitches: stats.pending_category_switches || 0,
    }
  });
});

app.delete("/api/admin/plan-changes/:changeId", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const changeId = parseInt(c.req.param("changeId"));

  const change = await c.env.DB.prepare(`
    SELECT id, is_processed FROM scheduled_plan_changes WHERE id = ?
  `).bind(changeId).first();

  if (!change) {
    return c.json({ error: "Plan change not found" }, 404);
  }

  if (change.is_processed) {
    return c.json({ error: "Cannot cancel an already processed change" }, 400);
  }

  await c.env.DB.prepare(`
    DELETE FROM scheduled_plan_changes WHERE id = ?
  `).bind(changeId).run();

  return c.json({ success: true });
});

// ===================
// REFERRAL SYSTEM API
// ===================

// Generate unique referral code
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "INK";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Complete referral when referred user reads first episode
async function completeReferralOnFirstRead(userId: string, db: D1Database, env: Env): Promise<void> {
  // Check if user has a pending referral that hasn't been activated
  const referral = await db.prepare(`
    SELECT r.id, r.referrer_user_id, r.is_trial_activated
    FROM referrals r
    WHERE r.referred_user_id = ? AND r.status = 'pending' AND r.is_trial_activated = 0
  `).bind(userId).first() as { id: number; referrer_user_id: string; is_trial_activated: number } | null;

  if (!referral) return;

  // Mark trial as activated and referral as converted
  await db.prepare(`
    UPDATE referrals 
    SET is_trial_activated = 1, status = 'converted', converted_at = CURRENT_TIMESTAMP, 
        reward_days_given = 2, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(referral.id).run();

  // Get referrer's current subscription info
  const referrerProfile = await db.prepare(`
    SELECT subscription_tier, subscription_expires_at, trial_started_at, referral_bonus_days,
           total_referral_days_earned, successful_referrals_count, display_name, email
    FROM user_profiles WHERE auth_user_id = ?
  `).bind(referral.referrer_user_id).first() as {
    subscription_tier: string | null;
    subscription_expires_at: string | null;
    trial_started_at: string | null;
    referral_bonus_days: number;
    total_referral_days_earned: number;
    successful_referrals_count: number;
    display_name: string | null;
    email: string | null;
  } | null;

  if (!referrerProfile) return;

  const now = new Date();
  const hasActiveSubscription = referrerProfile.subscription_expires_at && 
    new Date(referrerProfile.subscription_expires_at) > now;
  const hasActiveTrial = referrerProfile.trial_started_at && 
    (now.getTime() - new Date(referrerProfile.trial_started_at).getTime()) < 3 * 24 * 60 * 60 * 1000;

  const newSuccessfulCount = (referrerProfile.successful_referrals_count || 0) + 1;
  const newTotalDaysEarned = (referrerProfile.total_referral_days_earned || 0) + 2;

  if (hasActiveSubscription) {
    // Add 2 days to existing subscription
    const currentExpiry = new Date(referrerProfile.subscription_expires_at!);
    currentExpiry.setDate(currentExpiry.getDate() + 2);
    await db.prepare(`
      UPDATE user_profiles 
      SET subscription_expires_at = ?, total_referral_days_earned = ?, successful_referrals_count = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE auth_user_id = ?
    `).bind(currentExpiry.toISOString(), newTotalDaysEarned, newSuccessfulCount, referral.referrer_user_id).run();
  } else if (hasActiveTrial) {
    // Extend trial by 2 days (adjust trial_started_at backwards to give 2 more days)
    const currentTrialStart = new Date(referrerProfile.trial_started_at!);
    currentTrialStart.setDate(currentTrialStart.getDate() - 2);
    await db.prepare(`
      UPDATE user_profiles 
      SET trial_started_at = ?, total_referral_days_earned = ?, successful_referrals_count = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE auth_user_id = ?
    `).bind(currentTrialStart.toISOString(), newTotalDaysEarned, newSuccessfulCount, referral.referrer_user_id).run();
  } else {
    // Store as bonus days to apply on next subscription
    await db.prepare(`
      UPDATE user_profiles 
      SET referral_bonus_days = referral_bonus_days + 2, total_referral_days_earned = ?, 
          successful_referrals_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE auth_user_id = ?
    `).bind(newTotalDaysEarned, newSuccessfulCount, referral.referrer_user_id).run();
  }

  // Check and award milestone badges
  const milestones = [
    { count: 3, badgeId: 'top_referrer', earlyAccess: false },
    { count: 5, badgeId: 'inkseries_ambassador', earlyAccess: true },
    { count: 10, badgeId: 'referral_champion', earlyAccess: true },
  ];

  for (const milestone of milestones) {
    if (newSuccessfulCount >= milestone.count) {
      // Check if badge already earned
      const hasBadge = await db.prepare(`
        SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?
      `).bind(referral.referrer_user_id, milestone.badgeId).first();

      if (!hasBadge) {
        await db.prepare(`
          INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, CURRENT_TIMESTAMP)
        `).bind(referral.referrer_user_id, milestone.badgeId).run();

        // Grant early access at 5+ referrals
        if (milestone.earlyAccess) {
          await db.prepare(`
            UPDATE user_profiles SET has_early_access = 1, updated_at = CURRENT_TIMESTAMP
            WHERE auth_user_id = ?
          `).bind(referral.referrer_user_id).run();
        }
      }
    }
  }

  // Get referred user's name for the email
  const referredUser = await db.prepare(`
    SELECT display_name FROM user_profiles WHERE auth_user_id = ?
  `).bind(userId).first() as { display_name: string | null } | null;

  // Send notification email to referrer
  if (referrerProfile.email) {
    const bonusMessage = hasActiveSubscription || hasActiveTrial
      ? "We've added 2 free days to your account."
      : "We've stored 2 bonus days for you — they'll be applied when you next subscribe.";

    env.EMAILS?.send({
      to: referrerProfile.email,
      subject: "🎉 Your friend just joined Inkseries!",
      html_body: emailTemplate(`
        ${emailHeader("Referral Reward Earned!")}
        ${emailBody(`
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            Hi ${referrerProfile.display_name || "Reader"},
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            Great news! <strong style="color: #d4af37;">${referredUser?.display_name || 'Your friend'}</strong> just joined Inkseries using your referral link and started reading.
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            ${bonusMessage}
          </p>
          <div style="background: #262626; padding: 20px; border-radius: 8px; margin: 0 0 16px 0;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #888888;">Your referral stats</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #d4af37;">${newSuccessfulCount} successful referral${newSuccessfulCount > 1 ? 's' : ''} • ${newTotalDaysEarned} days earned</p>
          </div>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            Keep sharing — every successful referral earns you 2 more free days!
          </p>
          ${emailButton("Share Your Link", "https://sitmr2etn6sue.mocha.app/settings")}
        `)}
      `)
    }).catch(console.error);
  }
}

// Track referral link click (for conversion rate analytics)
app.post("/api/referrals/click", async (c) => {
  const { code } = await c.req.json().catch(() => ({ code: null }));
  if (!code) return c.json({ success: false });

  // Find referrer
  const referrer = await c.env.DB.prepare(`
    SELECT auth_user_id FROM user_profiles WHERE referral_code = ?
  `).bind(code.toUpperCase()).first() as { auth_user_id: string } | null;

  if (!referrer) return c.json({ success: false });

  // Record click
  const ipHash = c.req.header('CF-Connecting-IP') || 'unknown';
  const userAgent = c.req.header('User-Agent') || 'unknown';

  await c.env.DB.prepare(`
    INSERT INTO referral_clicks (referral_code, referrer_user_id, ip_hash, user_agent)
    VALUES (?, ?, ?, ?)
  `).bind(code.toUpperCase(), referrer.auth_user_id, ipHash, userAgent.substring(0, 200)).run();

  return c.json({ success: true });
})

// Get user's referral info and stats
app.get("/api/referrals", authMiddleware, async (c) => {
  const user = c.get("user");

  // Get or create referral code
  let profile = await c.env.DB.prepare(`
    SELECT id, referral_code, referral_bonus_days, total_referral_days_earned, successful_referrals_count, has_early_access
    FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { 
    id: number; 
    referral_code: string | null;
    referral_bonus_days: number;
    total_referral_days_earned: number;
    successful_referrals_count: number;
    has_early_access: number;
  } | null;

  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  // Generate referral code if not exists
  if (!profile.referral_code) {
    const code = generateReferralCode();
    await c.env.DB.prepare(`
      UPDATE user_profiles SET referral_code = ?, updated_at = CURRENT_TIMESTAMP WHERE auth_user_id = ?
    `).bind(code, user!.id).run();
    profile.referral_code = code;
  }

  // Get detailed referral stats
  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_referrals,
      SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_referrals,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_referrals
    FROM referrals WHERE referrer_user_id = ?
  `).bind(user!.id).first() as { total_referrals: number; converted_referrals: number; pending_referrals: number };

  // Get list of friends who joined (first name only for privacy)
  const friends = await c.env.DB.prepare(`
    SELECT up.display_name, r.converted_at
    FROM referrals r
    JOIN user_profiles up ON up.auth_user_id = r.referred_user_id
    WHERE r.referrer_user_id = ? AND r.status = 'converted'
    ORDER BY r.converted_at DESC
    LIMIT 20
  `).bind(user!.id).all();

  const friendsList = (friends.results as Array<{ display_name: string | null; converted_at: string }>).map(f => ({
    firstName: f.display_name ? f.display_name.split(' ')[0] : 'Friend',
    joinedAt: f.converted_at
  }));

  // Calculate milestone progress
  const successfulCount = profile.successful_referrals_count || 0;
  let currentMilestone = { target: 3, name: "Top Referrer badge" };
  if (successfulCount >= 3 && successfulCount < 5) {
    currentMilestone = { target: 5, name: "Ambassador badge + early access" };
  } else if (successfulCount >= 5 && successfulCount < 10) {
    currentMilestone = { target: 10, name: "Featured on our social channels" };
  } else if (successfulCount >= 10) {
    currentMilestone = { target: successfulCount, name: "Champion status achieved!" };
  }

  return c.json({
    referral_code: profile.referral_code,
    referral_path: `/?ref=${profile.referral_code}`,
    total_referrals: stats.total_referrals || 0,
    successful_referrals: stats.converted_referrals || 0,
    pending_referrals: stats.pending_referrals || 0,
    bonus_days_stored: profile.referral_bonus_days || 0,
    total_days_earned: profile.total_referral_days_earned || 0,
    has_early_access: !!profile.has_early_access,
    milestone_progress: {
      current: successfulCount,
      target: currentMilestone.target,
      reward: currentMilestone.name
    },
    friends: friendsList
  });
});

// Apply referral code (called during signup/onboarding)
app.post("/api/referrals/apply", authMiddleware, async (c) => {
  const user = c.get("user");
  const { code } = await c.req.json();

  if (!code) {
    return c.json({ error: "Referral code required" }, 400);
  }

  // Check if user already used a referral
  const existing = await c.env.DB.prepare(`
    SELECT id FROM referrals WHERE referred_user_id = ?
  `).bind(user!.id).first();

  if (existing) {
    return c.json({ error: "You've already used a referral code" }, 400);
  }

  // Find referrer by code
  const referrer = await c.env.DB.prepare(`
    SELECT auth_user_id FROM user_profiles WHERE referral_code = ?
  `).bind(code.toUpperCase()).first() as { auth_user_id: string } | null;

  if (!referrer) {
    return c.json({ error: "Invalid referral code" }, 404);
  }

  // Can't refer yourself
  if (referrer.auth_user_id === user!.id) {
    return c.json({ error: "You can't use your own referral code" }, 400);
  }

  // Create referral record
  await c.env.DB.prepare(`
    INSERT INTO referrals (referrer_user_id, referred_user_id, referral_code, status)
    VALUES (?, ?, ?, 'pending')
  `).bind(referrer.auth_user_id, user!.id, code.toUpperCase()).run();

  // Update user's referred_by_code AND extend trial to 4 days (move trial_started_at back 1 day)
  await c.env.DB.prepare(`
    UPDATE user_profiles 
    SET referred_by_code = ?, 
        trial_started_at = datetime(COALESCE(trial_started_at, CURRENT_TIMESTAMP), '-1 day'),
        updated_at = CURRENT_TIMESTAMP 
    WHERE auth_user_id = ?
  `).bind(code.toUpperCase(), user!.id).run();

  return c.json({ 
    success: true, 
    message: "Your friend gave you an extra day free! You have 4 days of unlimited access starting now.",
    extra_day: true
  });
});

// Convert referral (called when referred user subscribes)
async function convertReferral(referredUserId: string, db: D1Database) {
  const referral = await db.prepare(`
    SELECT id, referrer_user_id FROM referrals WHERE referred_user_id = ? AND status = 'pending'
  `).bind(referredUserId).first() as { id: number; referrer_user_id: string } | null;

  if (!referral) return;

  // Update referral status
  await db.prepare(`
    UPDATE referrals SET status = 'converted', converted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(referral.id).run();

  // Create reward for referrer (7 free days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Reward expires in 30 days
  await db.prepare(`
    INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_days, expires_at)
    VALUES (?, ?, 'referral_bonus', 7, ?)
  `).bind(referral.referrer_user_id, referral.id, expiresAt.toISOString()).run();
}

// Claim referral rewards (add free days to subscription)
app.post("/api/referrals/claim", authMiddleware, async (c) => {
  const user = c.get("user");

  // Get unclaimed rewards
  const rewards = await c.env.DB.prepare(`
    SELECT id, reward_days FROM referral_rewards 
    WHERE user_id = ? AND is_claimed = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
  `).bind(user!.id).all();

  if (!rewards.results.length) {
    return c.json({ error: "No rewards to claim" }, 400);
  }

  const totalDays = (rewards.results as Array<{ reward_days: number }>).reduce((sum, r) => sum + r.reward_days, 0);

  // Get current subscription expiry
  const profile = await c.env.DB.prepare(`
    SELECT subscription_tier, subscription_expires_at FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { subscription_tier: string; subscription_expires_at: string | null };

  // Calculate new expiry date
  let newExpiry: Date;
  if (profile.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date()) {
    newExpiry = new Date(profile.subscription_expires_at);
  } else {
    newExpiry = new Date();
  }
  newExpiry.setDate(newExpiry.getDate() + totalDays);

  // Update subscription
  await c.env.DB.prepare(`
    UPDATE user_profiles 
    SET subscription_tier = CASE WHEN subscription_tier = 'free' THEN 'monthly' ELSE subscription_tier END,
        subscription_expires_at = ?,
        updated_at = CURRENT_TIMESTAMP 
    WHERE auth_user_id = ?
  `).bind(newExpiry.toISOString(), user!.id).run();

  // Mark rewards as claimed
  for (const reward of rewards.results as { id: number }[]) {
    await c.env.DB.prepare(`
      UPDATE referral_rewards SET is_claimed = 1, claimed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(reward.id).run();
  }

  return c.json({ 
    success: true, 
    days_added: totalDays,
    new_expiry: newExpiry.toISOString(),
    message: `Added ${totalDays} free days to your subscription!`
  });
});

// ===================
// GIFT SUBSCRIPTIONS API
// ===================

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 4; i++) {
    if (i > 0) code += "-";
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return code;
}

// Initialize gift subscription purchase
app.post("/api/gifts/purchase", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const plan = body.plan || body.plan_type; // Support both field names
  const recipient_email = body.recipient_email;
  const message = body.message;

  const planPricing: Record<string, { amount: number; days: number }> = {
    weekly: { amount: 50000, days: 7 },
    monthly: { amount: 150000, days: 30 },
    "3-month": { amount: 400000, days: 90 },
    quarterly: { amount: 400000, days: 90 }, // alias
    "6-month": { amount: 700000, days: 180 },
    biannual: { amount: 700000, days: 180 }, // alias
    yearly: { amount: 1440000, days: 365 },
  };

  if (!planPricing[plan]) {
    return c.json({ error: "Invalid plan" }, 400);
  }

  if (!recipient_email || !recipient_email.includes("@")) {
    return c.json({ error: "Valid recipient email required" }, 400);
  }

  const giftCode = generateGiftCode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Gift expires in 1 year

  const reference = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Initialize payment with Flutterwave
  const flutterwaveRes = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: reference,
      amount: planPricing[plan].amount / 100, // Flutterwave uses actual amount
      currency: "NGN",
      redirect_url: `${c.req.url.split("/api")[0]}/settings?gift_verify=true`,
      customer: {
        email: user!.email,
      },
      meta: {
        type: "gift_subscription",
        purchaser_id: user!.id,
        gift_code: giftCode,
        recipient_email,
        plan,
        days: planPricing[plan].days,
        message: message || "",
      },
      customizations: {
        title: "Inkseries Gift Subscription",
        logo: "https://mochausercontent.com/68476787-c76e-4a74-af9a-22c5c3c44b1b/favicon.png",
      },
    }),
  });

  const flutterwaveData = await flutterwaveRes.json() as { status: string; data?: { link: string } };

  if (flutterwaveData.status !== "success" || !flutterwaveData.data) {
    return c.json({ error: "Failed to initialize payment" }, 500);
  }

  // Create pending gift record
  await c.env.DB.prepare(`
    INSERT INTO gift_subscriptions (purchaser_user_id, recipient_email, plan_type, amount, gift_code, gift_message, payment_reference, expires_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    user!.id,
    recipient_email,
    plan,
    planPricing[plan].amount / 100,
    giftCode,
    message || null,
    reference,
    expiresAt.toISOString()
  ).run();

  return c.json({ authorization_url: flutterwaveData.data.link });
});

// Get user's sent gifts
app.get("/api/gifts/sent", authMiddleware, async (c) => {
  const user = c.get("user");

  const gifts = await c.env.DB.prepare(`
    SELECT id, recipient_email, plan_type, amount, gift_code, gift_message, status, redeemed_at, created_at
    FROM gift_subscriptions WHERE purchaser_user_id = ?
    ORDER BY created_at DESC
  `).bind(user!.id).all();

  return c.json({ gifts: gifts.results });
});

// Get gifts user can redeem
app.get("/api/gifts/redeemable", authMiddleware, async (c) => {
  const user = c.get("user");

  const gifts = await c.env.DB.prepare(`
    SELECT id, plan_type, gift_message, created_at
    FROM gift_subscriptions 
    WHERE recipient_email = ? AND status = 'paid' AND (expires_at IS NULL OR expires_at > datetime('now'))
    ORDER BY created_at DESC
  `).bind(user!.email).all();

  return c.json({ gifts: gifts.results });
});

// Redeem a gift code
app.post("/api/gifts/redeem", authMiddleware, async (c) => {
  const user = c.get("user");
  const { code } = await c.req.json();

  if (!code) {
    return c.json({ error: "Gift code required" }, 400);
  }

  const gift = await c.env.DB.prepare(`
    SELECT * FROM gift_subscriptions 
    WHERE gift_code = ? AND status = 'paid' AND (expires_at IS NULL OR expires_at > datetime('now'))
  `).bind(code.toUpperCase()).first() as {
    id: number;
    plan_type: string;
    recipient_email: string;
  } | null;

  if (!gift) {
    return c.json({ error: "Invalid or expired gift code" }, 404);
  }

  // Update gift as redeemed
  await c.env.DB.prepare(`
    UPDATE gift_subscriptions 
    SET recipient_user_id = ?, status = 'redeemed', redeemed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(user!.id, gift.id).run();

  // Apply subscription to user
  const planDays: Record<string, number> = {
    weekly: 7, monthly: 30, quarterly: 90, biannual: 180, yearly: 365,
  };
  const days = planDays[gift.plan_type] || 30;

  // Get current subscription expiry
  const profile = await c.env.DB.prepare(`
    SELECT subscription_expires_at FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { subscription_expires_at: string | null };

  let newExpiry: Date;
  if (profile?.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date()) {
    newExpiry = new Date(profile.subscription_expires_at);
  } else {
    newExpiry = new Date();
  }
  newExpiry.setDate(newExpiry.getDate() + days);

  await c.env.DB.prepare(`
    UPDATE user_profiles 
    SET subscription_tier = ?, subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE auth_user_id = ?
  `).bind(gift.plan_type, newExpiry.toISOString(), user!.id).run();

  return c.json({ 
    success: true, 
    plan: gift.plan_type,
    expires_at: newExpiry.toISOString(),
    message: `Gift redeemed! Your ${gift.plan_type} subscription is now active.`
  });
});

// ===================
// FAMILY PLANS API
// ===================

// Create a family plan
app.post("/api/family/create", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json() as { plan_type?: string };
  const planType = body.plan_type || "family_annual";

  // Check if user already has a family plan
  const existing = await c.env.DB.prepare(`
    SELECT id FROM family_plans WHERE owner_user_id = ?
  `).bind(user!.id).first();

  if (existing) {
    return c.json({ error: "You already have a family plan" }, 400);
  }

  // Check if user is already in a family plan
  const member = await c.env.DB.prepare(`
    SELECT id FROM family_plan_members WHERE user_id = ?
  `).bind(user!.id).first();

  if (member) {
    return c.json({ error: "You're already part of a family plan" }, 400);
  }

  // Family plan pricing: ₦1,500/week, ₦4,500/month, ₦11,000/3mo, ₦20,000/6mo, ₦40,000/year for up to 4 members
  let amount: number;
  if (planType === "family_weekly") {
    amount = 1500; // ₦1,500
  } else if (planType === "family_monthly") {
    amount = 4500; // ₦4,500
  } else if (planType === "family_quarterly") {
    amount = 11000; // ₦11,000
  } else if (planType === "family_biannual") {
    amount = 20000; // ₦20,000
  } else {
    amount = 40000; // ₦40,000 annual
  }

  const reference = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check if this is a recurring plan (weekly/monthly for family)
  const isRecurringPlan = planType === "family_weekly" || planType === "family_monthly";
  const planId = FLUTTERWAVE_PLAN_IDS[planType];
  const paymentMethod = (body as { payment_method?: string }).payment_method;
  const useRecurringBilling = isRecurringPlan && (!paymentMethod || paymentMethod === "card") && planId;

  // Initialize payment with Flutterwave
  const flutterwaveRes = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.env.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: reference,
      amount,
      currency: "NGN",
      redirect_url: `${c.req.url.split("/api")[0]}/settings?family_verify=true`,
      ...(useRecurringBilling ? { payment_plan: planId } : {}),
      customer: {
        email: user!.email,
      },
      meta: {
        type: "family_plan",
        owner_id: user!.id,
        plan_type: planType,
        is_recurring: useRecurringBilling,
        duration_days: planType === "family_weekly" ? 7 : planType === "family_monthly" ? 30 : planType === "family_quarterly" ? 90 : planType === "family_biannual" ? 180 : 365,
      },
      customizations: {
        title: "Inkseries Family Plan",
        logo: "https://mochausercontent.com/68476787-c76e-4a74-af9a-22c5c3c44b1b/favicon.png",
      },
      ...(useRecurringBilling ? { payment_options: "card" } : {}),
    }),
  });

  const flutterwaveData = await flutterwaveRes.json() as { status: string; data?: { link: string } };

  if (flutterwaveData.status !== "success" || !flutterwaveData.data) {
    return c.json({ error: "Failed to initialize payment" }, 500);
  }

  return c.json({ authorization_url: flutterwaveData.data.link, reference });
});

// Get family plan status
app.get("/api/family", authMiddleware, async (c) => {
  const user = c.get("user");

  // Check if user owns a family plan
  const ownedPlan = await c.env.DB.prepare(`
    SELECT * FROM family_plans WHERE owner_user_id = ?
  `).bind(user!.id).first() as {
    id: number;
    max_members: number;
    starts_at: string;
    expires_at: string;
    is_active: number;
  } | null;

  if (ownedPlan) {
    // Get members
    const members = await c.env.DB.prepare(`
      SELECT fpm.*, up.display_name, up.email, up.avatar_url
      FROM family_plan_members fpm
      LEFT JOIN user_profiles up ON fpm.user_id = up.auth_user_id
      WHERE fpm.family_plan_id = ?
    `).bind(ownedPlan.id).all();

    return c.json({
      is_owner: true,
      is_member: false,
      plan: {
        id: ownedPlan.id,
        max_members: ownedPlan.max_members,
        current_members: members.results.length,
        starts_at: ownedPlan.starts_at,
        expires_at: ownedPlan.expires_at,
        is_active: ownedPlan.is_active === 1,
      },
      members: members.results.map((m: any) => ({
        ...m,
        avatar_url: convertAvatarUrl(m.avatar_url),
      })),
    });
  }

  // Check if user is a member of a family plan
  const membership = await c.env.DB.prepare(`
    SELECT fpm.*, fp.owner_user_id, fp.expires_at, fp.is_active,
           up.display_name as owner_name, up.email as owner_email
    FROM family_plan_members fpm
    JOIN family_plans fp ON fpm.family_plan_id = fp.id
    LEFT JOIN user_profiles up ON fp.owner_user_id = up.auth_user_id
    WHERE fpm.user_id = ?
  `).bind(user!.id).first() as {
    family_plan_id: number;
    status: string;
    joined_at: string;
    expires_at: string;
    is_active: number;
    owner_name: string;
    owner_email: string;
  } | null;

  if (membership) {
    return c.json({
      is_owner: false,
      is_member: true,
      plan: {
        id: membership.family_plan_id,
        owner_name: membership.owner_name,
        owner_email: membership.owner_email,
        status: membership.status,
        joined_at: membership.joined_at,
        expires_at: membership.expires_at,
        is_active: membership.is_active === 1,
      },
    });
  }

  return c.json({ is_owner: false, is_member: false, plan: null });
});

// Invite member to family plan
app.post("/api/family/invite", authMiddleware, async (c) => {
  const user = c.get("user");
  const { email } = await c.req.json();

  if (!email || !email.includes("@")) {
    return c.json({ error: "Valid email required" }, 400);
  }

  // Check user owns an active family plan
  const plan = await c.env.DB.prepare(`
    SELECT * FROM family_plans WHERE owner_user_id = ? AND is_active = 1 AND expires_at > datetime('now')
  `).bind(user!.id).first() as { id: number; max_members: number } | null;

  if (!plan) {
    return c.json({ error: "You don't have an active family plan" }, 400);
  }

  // Check member count
  const memberCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM family_plan_members WHERE family_plan_id = ?
  `).bind(plan.id).first() as { count: number };

  if (memberCount.count >= plan.max_members) {
    return c.json({ error: `Family plan is full (max ${plan.max_members} members)` }, 400);
  }

  // Check if email is already invited
  const existingInvite = await c.env.DB.prepare(`
    SELECT id FROM family_plan_members WHERE family_plan_id = ? AND email = ?
  `).bind(plan.id, email.toLowerCase()).first();

  if (existingInvite) {
    return c.json({ error: "This email has already been invited" }, 400);
  }

  // Create pending invitation
  await c.env.DB.prepare(`
    INSERT INTO family_plan_members (family_plan_id, user_id, email, status)
    VALUES (?, '', ?, 'pending')
  `).bind(plan.id, email.toLowerCase()).run();

  // Send invite email to family member
  const ownerProfile = await c.env.DB.prepare(`
    SELECT display_name FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first() as { display_name: string } | null;
  
  c.executionCtx.waitUntil(
    c.env.EMAILS.send({
      to: email.toLowerCase(),
      subject: "👨‍👩‍👧‍👦 You're invited to join an Inkseries Family Plan!",
      html_body: emailTemplate(`
        ${emailHeader("You've Been Invited!")}
        ${emailBody(`
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            <strong style="color: #d4af37;">${ownerProfile?.display_name || "Someone special"}</strong> has invited you to join their Inkseries Family Plan!
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            With a Family Plan membership, you get:
          </p>
          <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 16px; line-height: 26px; color: #d4d4d4;">
            <li style="margin-bottom: 8px;">Unlimited access to all premium episodes</li>
            <li style="margin-bottom: 8px;">Ad-free reading experience</li>
            <li style="margin-bottom: 8px;">Early access to new releases</li>
            <li style="margin-bottom: 8px;">All the benefits of premium — for free!</li>
          </ul>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            To accept the invitation, sign up or log in with this email address and go to your Settings page.
          </p>
          ${emailButton("Accept Invitation", "https://sitmr2etn6sue.mocha.app/settings")}
        `)}
        ${emailFooter("This invitation is waiting for you. Accept it anytime!")}
      `)
    })
  );

  return c.json({ success: true, message: `Invitation sent to ${email}` });
});

// Join family plan (accept invitation)
app.post("/api/family/join", authMiddleware, async (c) => {
  const user = c.get("user");

  // Check if user has a pending invitation
  const invitation = await c.env.DB.prepare(`
    SELECT fpm.*, fp.expires_at, fp.plan_type
    FROM family_plan_members fpm
    JOIN family_plans fp ON fpm.family_plan_id = fp.id
    WHERE fpm.email = ? AND fpm.status = 'pending' AND fp.is_active = 1 AND fp.expires_at > datetime('now')
  `).bind(user!.email?.toLowerCase()).first() as {
    id: number;
    family_plan_id: number;
    expires_at: string;
    plan_type: string;
  } | null;

  if (!invitation) {
    return c.json({ error: "No pending invitation found" }, 404);
  }

  // Check user isn't already in a family plan
  const existingMember = await c.env.DB.prepare(`
    SELECT id FROM family_plan_members WHERE user_id = ? AND status = 'active'
  `).bind(user!.id).first();

  if (existingMember) {
    return c.json({ error: "You're already part of a family plan" }, 400);
  }

  // Update invitation to active
  await c.env.DB.prepare(`
    UPDATE family_plan_members 
    SET user_id = ?, status = 'active', joined_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(user!.id, invitation.id).run();

  // Give user subscription access
  await c.env.DB.prepare(`
    UPDATE user_profiles 
    SET subscription_tier = 'yearly', subscription_expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE auth_user_id = ?
  `).bind(invitation.expires_at, user!.id).run();

  return c.json({ success: true, message: "You've joined the family plan!" });
});

// Leave family plan
app.post("/api/family/leave", authMiddleware, async (c) => {
  const user = c.get("user");

  const membership = await c.env.DB.prepare(`
    SELECT id FROM family_plan_members WHERE user_id = ? AND status = 'active'
  `).bind(user!.id).first() as { id: number } | null;

  if (!membership) {
    return c.json({ error: "You're not part of a family plan" }, 400);
  }

  await c.env.DB.prepare(`
    DELETE FROM family_plan_members WHERE id = ?
  `).bind(membership.id).run();

  // Remove subscription access
  await c.env.DB.prepare(`
    UPDATE user_profiles SET subscription_tier = 'free', subscription_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE auth_user_id = ?
  `).bind(user!.id).run();

  return c.json({ success: true, message: "You've left the family plan" });
});

// Remove member from family plan (owner only)
app.delete("/api/family/members/:email", authMiddleware, async (c) => {
  const user = c.get("user");
  const email = c.req.param("email");

  // Check user owns a family plan
  const plan = await c.env.DB.prepare(`
    SELECT id FROM family_plans WHERE owner_user_id = ?
  `).bind(user!.id).first() as { id: number } | null;

  if (!plan) {
    return c.json({ error: "You don't own a family plan" }, 400);
  }

  const member = await c.env.DB.prepare(`
    SELECT id, user_id FROM family_plan_members WHERE family_plan_id = ? AND email = ?
  `).bind(plan.id, email.toLowerCase()).first() as { id: number; user_id: string } | null;

  if (!member) {
    return c.json({ error: "Member not found" }, 404);
  }

  await c.env.DB.prepare(`DELETE FROM family_plan_members WHERE id = ?`).bind(member.id).run();

  // Remove their subscription if they had one
  if (member.user_id) {
    await c.env.DB.prepare(`
      UPDATE user_profiles SET subscription_tier = 'free', subscription_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE auth_user_id = ?
    `).bind(member.user_id).run();
  }

  return c.json({ success: true });
});

// Update user profile
app.patch("/api/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (body.display_name !== undefined) {
    updates.push("display_name = ?");
    params.push(body.display_name);
  }
  if (body.bio !== undefined) {
    updates.push("bio = ?");
    params.push(body.bio);
  }
  updates.push("updated_at = CURRENT_TIMESTAMP");

  await c.env.DB.prepare(`UPDATE user_profiles SET ${updates.join(", ")} WHERE auth_user_id = ?`)
    .bind(...params, user!.id).run();

  return c.json({ success: true });
});

// Upload profile avatar
app.post("/api/profile/avatar", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const formData = await c.req.formData();
  const file = formData.get("avatar") as File | null;
  
  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }
  
  // Validate file type - check MIME type and file extension
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
  const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
  const fileExt = (file.name.split(".").pop() || "").toLowerCase();
  
  // Accept if MIME type matches OR file extension matches (some mobile browsers don't set MIME correctly)
  const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExt) || file.type.startsWith("image/");
  if (!isValidType) {
    return c.json({ error: "Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or HEIC image." }, 400);
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: "File too large. Maximum size is 5MB." }, 400);
  }
  
  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const filename = `avatars/${user!.id}/${timestamp}.${ext}`;
  
  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.R2_BUCKET.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });
  
  // Update user profile with avatar URL (store the R2 key)
  await c.env.DB.prepare(`UPDATE user_profiles SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE auth_user_id = ?`)
    .bind(filename, user!.id).run();
  
  return c.json({ success: true, avatar_url: filename, key: filename });
});

// Get avatar image
app.get("/api/avatars/:userId/:filename", async (c) => {
  const userId = c.req.param("userId");
  const filename = c.req.param("filename");
  const key = `avatars/${userId}/${filename}`;
  
  const object = await c.env.R2_BUCKET.get(key);
  
  if (!object) {
    return c.json({ error: "Avatar not found" }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000");
  
  return c.body(object.body, { headers });
});

// Delete profile avatar
app.delete("/api/profile/avatar", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Get current avatar URL
  const profile = await c.env.DB.prepare(`SELECT avatar_url FROM user_profiles WHERE auth_user_id = ?`)
    .bind(user!.id).first();
  
  if (profile?.avatar_url) {
    // Delete from R2
    await c.env.R2_BUCKET.delete(profile.avatar_url as string);
  }
  
  // Clear avatar URL in database
  await c.env.DB.prepare(`UPDATE user_profiles SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE auth_user_id = ?`)
    .bind(user!.id).run();
  
  return c.json({ success: true });
});

// ===================
// NOTIFICATION PREFERENCES
// ===================

// Get notification preferences
app.get("/api/profile/notifications", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(`
    SELECT is_newsletter_subscribed, is_chapter_notifications_enabled 
    FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first();
  
  return c.json({
    newsletter: profile?.is_newsletter_subscribed === 1,
    chapterAlerts: profile?.is_chapter_notifications_enabled !== 0 // default to true
  });
});

// Update notification preferences
app.patch("/api/profile/notifications", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: (number)[] = [];
  
  if (body.newsletter !== undefined) {
    updates.push("is_newsletter_subscribed = ?");
    params.push(body.newsletter ? 1 : 0);
  }
  if (body.chapterAlerts !== undefined) {
    updates.push("is_chapter_notifications_enabled = ?");
    params.push(body.chapterAlerts ? 1 : 0);
  }
  
  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    await c.env.DB.prepare(`UPDATE user_profiles SET ${updates.join(", ")} WHERE auth_user_id = ?`)
      .bind(...params, user!.id).run();
  }
  
  return c.json({ success: true });
});

// ===================
// SITE CONFIG
// ===================

// Get public site config (contact email, etc.)
app.get("/api/config", async (c) => {
  return c.json({
    contactEmail: c.env.CONTACT_EMAIL || "hello@inkseries.com"
  });
});

// ===================
// EARLY ACCESS EMAILS
// ===================

// Submit early access email
app.post("/api/early-access", async (c) => {
  const body = await c.req.json<{ email: string; source?: string }>();
  
  if (!body.email) {
    return c.json({ error: "Email is required" }, 400);
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return c.json({ error: "Invalid email format" }, 400);
  }
  
  try {
    await c.env.DB.prepare(
      `INSERT INTO early_access_emails (email, source, created_at, updated_at) 
       VALUES (?, ?, datetime('now'), datetime('now'))`
    ).bind(body.email.toLowerCase(), body.source || "homepage").run();
    
    return c.json({ success: true, message: "Email registered successfully" });
  } catch (error: unknown) {
    // Check if it's a unique constraint violation
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return c.json({ success: true, message: "Email already registered" });
    }
    console.error("Early access email error:", error);
    return c.json({ error: "Failed to register email" }, 500);
  }
});

// Get all early access emails (admin only)
app.get("/api/admin/early-access", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check if user is admin
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first<{ is_admin: number }>();
  
  if (!profile?.is_admin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  const emails = await c.env.DB.prepare(
    `SELECT id, email, source, created_at FROM early_access_emails ORDER BY created_at DESC`
  ).all<{ id: number; email: string; source: string; created_at: string }>();
  
  return c.json({ emails: emails.results || [] });
});

// Delete early access email (admin only)
app.delete("/api/admin/early-access/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const emailId = c.req.param("id");
  
  // Check if user is admin
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first<{ is_admin: number }>();
  
  if (!profile?.is_admin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  await c.env.DB.prepare(
    `DELETE FROM early_access_emails WHERE id = ?`
  ).bind(emailId).run();
  
  return c.json({ success: true });
});

// ===================
// WRITER WAITLIST
// ===================

// Submit writer waitlist email
app.post("/api/writer-waitlist", async (c) => {
  const body = await c.req.json<{ email: string }>();
  
  if (!body.email) {
    return c.json({ error: "Email is required" }, 400);
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return c.json({ error: "Invalid email format" }, 400);
  }
  
  try {
    await c.env.DB.prepare(
      `INSERT INTO writer_waitlist (email, created_at, updated_at) 
       VALUES (?, datetime('now'), datetime('now'))`
    ).bind(body.email.toLowerCase()).run();
    
    return c.json({ success: true, message: "You're on the list. We'll reach out as soon as writer submissions open." });
  } catch (error: unknown) {
    // Check if it's a unique constraint violation
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return c.json({ success: true, message: "You're already on the list! We'll reach out when submissions open." });
    }
    console.error("Writer waitlist error:", error);
    return c.json({ error: "Failed to register email" }, 500);
  }
});

// Get all writer waitlist emails (admin only)
app.get("/api/admin/writer-waitlist", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check if user is admin
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first<{ is_admin: number }>();
  
  if (!profile?.is_admin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  const emails = await c.env.DB.prepare(
    `SELECT id, email, created_at FROM writer_waitlist ORDER BY created_at DESC`
  ).all<{ id: number; email: string; created_at: string }>();
  
  return c.json({ emails: emails.results || [] });
});

// Delete writer waitlist email (admin only)
app.delete("/api/admin/writer-waitlist/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const emailId = c.req.param("id");
  
  // Check if user is admin
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first<{ is_admin: number }>();
  
  if (!profile?.is_admin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  await c.env.DB.prepare(
    `DELETE FROM writer_waitlist WHERE id = ?`
  ).bind(emailId).run();
  
  return c.json({ success: true });
});

// ===================
// POLLS API
// ===================

// Get all polls (public)
app.get("/api/polls", async (c) => {
  // Check if user is logged in to get their votes
  let userId: string | null = null;
  const sessionToken = getCookie(c, "mocha_session");
  if (sessionToken) {
    try {
      const user = await getCurrentUser(sessionToken, { apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL, apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY });
      if (user) userId = user.id;
    } catch {}
  }
  
  const polls = await c.env.DB.prepare(`
    SELECT 
      p.id,
      p.novel_id,
      p.question,
      p.context,
      p.is_spoiler,
      p.is_active,
      p.ends_at,
      p.total_votes,
      p.created_at,
      n.title as novel_title,
      n.slug as novel_slug,
      n.cover_image_url as novel_cover
    FROM polls p
    LEFT JOIN novels n ON p.novel_id = n.id
    ORDER BY p.is_active DESC, p.created_at DESC
  `).all();
  
  // Get options for all polls
  
  const pollsWithOptions = await Promise.all(
    (polls.results || []).map(async (poll: any) => {
      const options = await c.env.DB.prepare(`
        SELECT id, option_text, votes FROM poll_options WHERE poll_id = ?
      `).bind(poll.id).all();
      
      // Check if user has voted on this poll
      let userVote = null;
      if (userId) {
        const vote = await c.env.DB.prepare(`
          SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?
        `).bind(poll.id, userId).first();
        if (vote) userVote = vote.option_id;
      }
      
      return {
        ...poll,
        options: options.results || [],
        userVote,
      };
    })
  );
  
  return c.json({ polls: pollsWithOptions });
});

// Vote on a poll
app.post("/api/polls/:pollId/vote", authMiddleware, async (c) => {
  const user = c.get("user");
  const pollId = parseInt(c.req.param("pollId"));
  const { optionId } = await c.req.json();
  
  // Check if poll exists and is active
  const poll = await c.env.DB.prepare(`
    SELECT id, is_active, ends_at FROM polls WHERE id = ?
  `).bind(pollId).first();
  
  if (!poll) {
    return c.json({ error: "Poll not found" }, 404);
  }
  
  if (!poll.is_active) {
    return c.json({ error: "Poll is no longer active" }, 400);
  }
  
  // Check if poll has ended
  if (poll.ends_at && new Date(poll.ends_at as string) < new Date()) {
    return c.json({ error: "Poll has ended" }, 400);
  }
  
  // Check if user has already voted
  const existingVote = await c.env.DB.prepare(`
    SELECT id FROM poll_votes WHERE poll_id = ? AND user_id = ?
  `).bind(pollId, user!.id).first();
  
  if (existingVote) {
    return c.json({ error: "You have already voted on this poll" }, 400);
  }
  
  // Record vote
  await c.env.DB.prepare(`
    INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)
  `).bind(pollId, optionId, user!.id).run();
  
  // Update vote counts
  await c.env.DB.prepare(`
    UPDATE poll_options SET votes = votes + 1 WHERE id = ?
  `).bind(optionId).run();
  
  await c.env.DB.prepare(`
    UPDATE polls SET total_votes = total_votes + 1 WHERE id = ?
  `).bind(pollId).run();
  
  return c.json({ success: true });
});

// Admin: Create poll
app.post("/api/admin/polls", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const body = await c.req.json();
  const novelId = body.novel_id || body.novelId;
  const question = body.question;
  const options = body.options;
  const expiresAt = body.expires_at || body.endsAt;
  const context = body.context;
  const isSpoiler = body.isSpoiler;
  
  if (!question || !options || options.length < 2) {
    return c.json({ error: "Question and at least 2 options required" }, 400);
  }
  
  // Create poll
  const result = await c.env.DB.prepare(`
    INSERT INTO polls (novel_id, question, context, is_spoiler, ends_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(novelId || null, question, context || null, isSpoiler ? 1 : 0, expiresAt || null).run();
  
  const pollId = result.meta.last_row_id;
  
  // Create options
  for (const optionText of options) {
    if (optionText.trim()) {
      await c.env.DB.prepare(`
        INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)
      `).bind(pollId, optionText.trim()).run();
    }
  }
  
  return c.json({ success: true, pollId });
});

// Admin: Get all polls
app.get("/api/admin/polls", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const polls = await c.env.DB.prepare(`
    SELECT 
      p.*,
      n.title as novel_title
    FROM polls p
    LEFT JOIN novels n ON p.novel_id = n.id
    ORDER BY p.created_at DESC
  `).all();
  
  const pollsWithOptions = await Promise.all(
    (polls.results || []).map(async (poll: any) => {
      const options = await c.env.DB.prepare(`
        SELECT * FROM poll_options WHERE poll_id = ?
      `).bind(poll.id).all();
      return { ...poll, options: options.results || [] };
    })
  );
  
  return c.json({ polls: pollsWithOptions });
});

// Admin: Update poll
app.put("/api/admin/polls/:pollId", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const pollId = parseInt(c.req.param("pollId"));
  const body = await c.req.json();
  const novelId = body.novel_id || body.novelId;
  const question = body.question;
  const options = body.options;
  const expiresAt = body.expires_at || body.endsAt;
  const isActive = body.isActive;
  
  // Update poll
  await c.env.DB.prepare(`
    UPDATE polls SET 
      novel_id = ?,
      question = COALESCE(?, question),
      ends_at = ?,
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(novelId || null, question, expiresAt || null, isActive !== undefined ? (isActive ? 1 : 0) : null, pollId).run();
  
  // Update options if provided
  if (options && options.length >= 2) {
    await c.env.DB.prepare(`DELETE FROM poll_options WHERE poll_id = ?`).bind(pollId).run();
    for (const optionText of options) {
      if (optionText.trim()) {
        await c.env.DB.prepare(`
          INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)
        `).bind(pollId, optionText.trim()).run();
      }
    }
  }
  
  return c.json({ success: true });
});

// Admin: Toggle poll active status
app.post("/api/admin/polls/:pollId/toggle", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const pollId = parseInt(c.req.param("pollId"));
  
  await c.env.DB.prepare(`
    UPDATE polls SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(pollId).run();
  
  return c.json({ success: true });
});

// Admin: Delete poll
app.delete("/api/admin/polls/:pollId", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const pollId = parseInt(c.req.param("pollId"));
  
  await c.env.DB.prepare(`DELETE FROM poll_votes WHERE poll_id = ?`).bind(pollId).run();
  await c.env.DB.prepare(`DELETE FROM poll_options WHERE poll_id = ?`).bind(pollId).run();
  await c.env.DB.prepare(`DELETE FROM polls WHERE id = ?`).bind(pollId).run();
  
  return c.json({ success: true });
});

// ===================
// EVENTS
// ===================

// Public: Get upcoming events
app.get("/api/events", async (c) => {
  const events = await c.env.DB.prepare(`
    SELECT e.*, n.title as novel_title, n.slug as novel_slug
    FROM events e
    LEFT JOIN novels n ON e.novel_id = n.id
    WHERE e.is_published = 1 AND e.starts_at > datetime('now', '-2 hours')
    ORDER BY e.starts_at ASC
    LIMIT 20
  `).all();
  
  return c.json({ events: events.results || [] });
});

// Get user's event reminders
app.get("/api/events/reminders", async (c) => {
  const sessionToken = getCookie(c, "session_token");
  if (!sessionToken) return c.json({ reminders: [] });
  
  const user = await getCurrentUser(sessionToken, { apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL, apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY });
  if (!user) return c.json({ reminders: [] });
  
  const reminders = await c.env.DB.prepare(`
    SELECT event_id FROM event_reminders WHERE user_id = ?
  `).bind(user.id).all();
  
  return c.json({ reminders: (reminders.results || []).map(r => r.event_id) });
});

// Set reminder for event
app.post("/api/events/:eventId/remind", async (c) => {
  const sessionToken = getCookie(c, "session_token");
  if (!sessionToken) return c.json({ error: "Login required" }, 401);
  
  const user = await getCurrentUser(sessionToken, { apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL, apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY });
  if (!user) return c.json({ error: "Login required" }, 401);
  
  const eventId = parseInt(c.req.param("eventId"));
  
  // Get event start time
  const event = await c.env.DB.prepare(`
    SELECT starts_at FROM events WHERE id = ? AND is_published = 1
  `).bind(eventId).first();
  
  if (!event) return c.json({ error: "Event not found" }, 404);
  
  // Set reminder for 1 hour before
  const startsAt = new Date(event.starts_at as string);
  const remindAt = new Date(startsAt.getTime() - 60 * 60 * 1000);
  
  // Check if reminder already exists
  const existing = await c.env.DB.prepare(`
    SELECT id FROM event_reminders WHERE event_id = ? AND user_id = ?
  `).bind(eventId, user.id).first();
  
  if (existing) {
    return c.json({ success: true, message: "Reminder already set" });
  }
  
  await c.env.DB.prepare(`
    INSERT INTO event_reminders (event_id, user_id, remind_at, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(eventId, user.id, remindAt.toISOString()).run();
  
  return c.json({ success: true });
});

// Cancel reminder for event
app.delete("/api/events/:eventId/remind", async (c) => {
  const sessionToken = getCookie(c, "session_token");
  if (!sessionToken) return c.json({ error: "Login required" }, 401);
  
  const user = await getCurrentUser(sessionToken, { apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL, apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY });
  if (!user) return c.json({ error: "Login required" }, 401);
  
  const eventId = parseInt(c.req.param("eventId"));
  
  await c.env.DB.prepare(`
    DELETE FROM event_reminders WHERE event_id = ? AND user_id = ?
  `).bind(eventId, user.id).run();
  
  return c.json({ success: true });
});

// Admin: Get all events
app.get("/api/admin/events", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const events = await c.env.DB.prepare(`
    SELECT e.*, n.title as novel_title,
      (SELECT COUNT(*) FROM event_reminders WHERE event_id = e.id) as reminder_count
    FROM events e
    LEFT JOIN novels n ON e.novel_id = n.id
    ORDER BY e.starts_at DESC
  `).all();
  
  return c.json({ events: events.results || [] });
});

// Admin: Create event
app.post("/api/admin/events", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const body = await c.req.json();
  const { title, description, event_type, cover_image_url, novel_id, starts_at, ends_at, external_link, is_published } = body;
  
  if (!title || !event_type || !starts_at) {
    return c.json({ error: "Title, event type, and start time are required" }, 400);
  }
  
  const result = await c.env.DB.prepare(`
    INSERT INTO events (title, description, event_type, cover_image_url, novel_id, starts_at, ends_at, external_link, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    title, description || null, event_type, cover_image_url || null, 
    novel_id || null, starts_at, ends_at || null, external_link || null,
    is_published !== false ? 1 : 0
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// Admin: Update event
app.put("/api/admin/events/:eventId", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const eventId = parseInt(c.req.param("eventId"));
  const body = await c.req.json();
  const { title, description, event_type, cover_image_url, novel_id, starts_at, ends_at, external_link, is_published, is_live } = body;
  
  await c.env.DB.prepare(`
    UPDATE events SET 
      title = ?, description = ?, event_type = ?, cover_image_url = ?, 
      novel_id = ?, starts_at = ?, ends_at = ?, external_link = ?,
      is_published = ?, is_live = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    title, description || null, event_type, cover_image_url || null,
    novel_id || null, starts_at, ends_at || null, external_link || null,
    is_published ? 1 : 0, is_live ? 1 : 0, eventId
  ).run();
  
  return c.json({ success: true });
});

// Admin: Delete event
app.delete("/api/admin/events/:eventId", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const eventId = parseInt(c.req.param("eventId"));
  
  await c.env.DB.prepare(`DELETE FROM event_reminders WHERE event_id = ?`).bind(eventId).run();
  await c.env.DB.prepare(`DELETE FROM events WHERE id = ?`).bind(eventId).run();
  
  return c.json({ success: true });
});

// ===================
// COVER IMAGE UPLOAD
// ===================

// Upload novel cover image
app.post("/api/admin/covers/upload", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const formData = await c.req.formData();
  const file = formData.get("cover") as File | null;
  
  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }
  
  // Get file extension - handle various filename formats
  const fileName = file.name || "";
  const fileExt = (fileName.split(".").pop() || "").toLowerCase();
  const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
  
  // Check MIME type - some Android phones send empty or generic types
  const mimeType = file.type || "";
  const isImageMime = mimeType.startsWith("image/") || mimeType === "" || mimeType === "application/octet-stream";
  const hasValidExtension = allowedExtensions.includes(fileExt);
  
  // Accept if either MIME type looks like an image OR extension is valid
  if (!isImageMime && !hasValidExtension) {
    return c.json({ error: "Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or HEIC image." }, 400);
  }
  
  // Validate file size (max 10MB for covers)
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: "File too large. Maximum size is 10MB." }, 400);
  }
  
  // Generate unique filename - use valid extension or default to jpg
  const ext = hasValidExtension ? fileExt : "jpg";
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const filename = `covers/${timestamp}-${randomId}.${ext}`;
  
  // Determine content type - prefer extension-based detection for reliability
  const extToMime: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg", 
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
  };
  const contentType = extToMime[ext] || mimeType || "image/jpeg";
  
  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.R2_BUCKET.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: contentType,
    },
  });
  
  return c.json({ 
    success: true, 
    key: filename,
    url: `/api/covers/${timestamp}-${randomId}.${ext}`,
  });
});

// Serve cover images
app.get("/api/covers/:filename", async (c) => {
  const filename = c.req.param("filename");
  const key = `covers/${filename}`;
  
  const object = await c.env.R2_BUCKET.get(key);
  
  if (!object) {
    return c.json({ error: "Cover not found" }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000");
  
  return c.body(object.body, { headers });
});

// ===================
// RATINGS API
// ===================

// Get average rating for a novel
app.get("/api/novels/:slug/rating", async (c) => {
  const slugOrId = c.req.param("slug");
  
  // Get novel ID from slug or numeric ID
  let novel = await c.env.DB.prepare("SELECT id FROM novels WHERE slug = ?")
    .bind(slugOrId)
    .first<{ id: number }>();
  
  if (!novel && /^\d+$/.test(slugOrId)) {
    novel = await c.env.DB.prepare("SELECT id FROM novels WHERE id = ?")
      .bind(parseInt(slugOrId))
      .first<{ id: number }>();
  }
  
  if (!novel) {
    return c.json({ average: 0, count: 0, userRating: null });
  }
  
  // Get average rating and count
  const stats = await c.env.DB.prepare(`
    SELECT AVG(rating) as average, COUNT(*) as count 
    FROM novel_ratings WHERE novel_id = ?
  `).bind(novel.id).first<{ average: number | null; count: number }>();
  
  // Check if current user has rated
  let userRating: number | null = null;
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (sessionToken) {
    try {
      const user = await getCurrentUser(sessionToken, {
        apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
        apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
      });
    if (user) {
      const profile = await c.env.DB.prepare(
        "SELECT id FROM user_profiles WHERE auth_user_id = ?"
      ).bind(user.id).first<{ id: number }>();
      
      if (profile) {
        const existingRating = await c.env.DB.prepare(
          "SELECT rating FROM novel_ratings WHERE novel_id = ? AND user_id = ?"
        ).bind(novel.id, profile.id.toString()).first<{ rating: number }>();
        
        userRating = existingRating?.rating || null;
      }
    }
  } catch {
    // Not logged in, that's fine
  }
  }
  
  return c.json({
    average: stats?.average ? Number(stats.average.toFixed(1)) : 0,
    count: stats?.count || 0,
    userRating,
  });
});

// Submit or update a rating
app.post("/api/novels/:slug/rating", authMiddleware, async (c) => {
  const user = c.get("user");
  const slugOrId = c.req.param("slug");
  const body = await c.req.json<{ rating: number }>();
  
  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return c.json({ error: "Rating must be between 1 and 5" }, 400);
  }
  
  // Get novel ID from slug or numeric ID
  let novel = await c.env.DB.prepare("SELECT id FROM novels WHERE slug = ?")
    .bind(slugOrId)
    .first<{ id: number }>();
  
  if (!novel && /^\d+$/.test(slugOrId)) {
    novel = await c.env.DB.prepare("SELECT id FROM novels WHERE id = ?")
      .bind(parseInt(slugOrId))
      .first<{ id: number }>();
  }
  
  if (!novel) {
    return c.json({ error: "Novel not found" }, 404);
  }
  
  // Get user profile
  const profile = await c.env.DB.prepare(
    "SELECT id FROM user_profiles WHERE auth_user_id = ?"
  ).bind(user!.id).first<{ id: number }>();
  
  if (!profile) {
    return c.json({ error: "User profile not found" }, 404);
  }
  
  // Upsert rating (SQLite uses INSERT OR REPLACE)
  await c.env.DB.prepare(`
    INSERT INTO novel_ratings (novel_id, user_id, rating, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(novel_id, user_id) DO UPDATE SET rating = ?, updated_at = datetime('now')
  `).bind(novel.id, profile.id.toString(), body.rating, body.rating).run();
  
  // Return updated stats
  const stats = await c.env.DB.prepare(`
    SELECT AVG(rating) as average, COUNT(*) as count 
    FROM novel_ratings WHERE novel_id = ?
  `).bind(novel.id).first<{ average: number | null; count: number }>();
  
  return c.json({
    success: true,
    average: stats?.average ? Number(stats.average.toFixed(1)) : body.rating,
    count: stats?.count || 1,
    userRating: body.rating,
  });
});

// ===================
// COMPETITION API
// ===================

// Submit competition entry
app.post("/api/competition/submit", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  // Check subscription status (must have 3-month or longer)
  const profile = await c.env.DB.prepare(`
    SELECT id, subscription_tier, subscription_expires_at FROM user_profiles WHERE auth_user_id = ?
  `).bind(user!.id).first();
  
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  
  const expiresAt = profile.subscription_expires_at as string | null;
  const tier = profile.subscription_tier as string | null;
  const isActive = expiresAt && new Date(expiresAt) > new Date();
  
  // Check if subscription is quarterly, biannual, or yearly
  const eligiblePlans = ["quarterly", "biannual", "yearly"];
  if (!isActive || !tier || !eligiblePlans.includes(tier)) {
    return c.json({ error: "A 3-month or longer subscription is required to submit" }, 403);
  }
  
  // Validate required fields
  if (!body.full_name || !body.email || !body.phone || !body.school_name || 
      !body.class_year || !body.age || !body.story_title || !body.genre || 
      !body.synopsis || !body.story_content || !body.is_original_work ||
      !body.story_2_title || !body.story_2_genre || !body.story_2_synopsis || !body.story_2_content ||
      !body.story_3_title || !body.story_3_genre || !body.story_3_synopsis || !body.story_3_content) {
    return c.json({ error: "All required fields must be filled" }, 400);
  }
  
  // Validate age (13-19)
  if (body.age < 13 || body.age > 19) {
    return c.json({ error: "Age must be between 13 and 19" }, 400);
  }
  
  // Check if user already submitted
  const existingSubmission = await c.env.DB.prepare(`
    SELECT id FROM competition_submissions WHERE user_id = ?
  `).bind(user!.id).first();
  
  if (existingSubmission) {
    return c.json({ error: "You have already submitted an entry. Only one submission per participant is allowed." }, 400);
  }
  
  // Calculate word counts for all stories
  const wordCount = countWords(body.story_content);
  const wordCount2 = countWords(body.story_2_content);
  const wordCount3 = countWords(body.story_3_content);
  
  await c.env.DB.prepare(`
    INSERT INTO competition_submissions (
      user_id, full_name, email, phone, school_name, class_year, age,
      story_title, genre, synopsis, story_content, word_count,
      story_2_title, story_2_synopsis, story_2_content, story_2_word_count,
      story_3_title, story_3_synopsis, story_3_content, story_3_word_count,
      novel_1_id, novel_1_summary, novel_2_id, novel_2_summary, novel_3_id, novel_3_summary,
      is_original_work, referral_source, has_written_before,
      follows_facebook, follows_instagram, follows_tiktok, follows_youtube, follows_whatsapp,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    user!.id,
    body.full_name,
    body.email,
    body.phone,
    body.school_name,
    body.class_year,
    body.age,
    body.story_title,
    body.genre,
    body.synopsis,
    body.story_content,
    wordCount,
    body.story_2_title,
    body.story_2_synopsis,
    body.story_2_content,
    wordCount2,
    body.story_3_title,
    body.story_3_synopsis,
    body.story_3_content,
    wordCount3,
    body.novel_1_id || null,
    body.novel_1_summary || null,
    body.novel_2_id || null,
    body.novel_2_summary || null,
    body.novel_3_id || null,
    body.novel_3_summary || null,
    body.is_original_work ? 1 : 0,
    body.referral_source || null,
    body.has_written_before ? 1 : 0,
    body.follows_facebook ? 1 : 0,
    body.follows_instagram ? 1 : 0,
    body.follows_tiktok ? 1 : 0,
    body.follows_youtube ? 1 : 0,
    body.follows_whatsapp ? 1 : 0
  ).run();
  
  // Send competition submission confirmation email
  c.executionCtx.waitUntil(
    c.env.EMAILS.send({
      to: body.email,
      subject: "🎉 Your Inkseries Competition Entry Has Been Received!",
      html_body: emailTemplate(`
        ${emailHeader("Entry Received!")}
        ${emailBody(`
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            Hi ${body.full_name},
          </p>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            We've received your submission for the <strong style="color: #d4af37;">Inkseries 2026 Writing Competition</strong>! 🎊
          </p>
          <div style="background: #262626; padding: 20px; border-radius: 8px; margin: 0 0 16px 0;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #888888;">Stories Submitted:</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #e5e5e5;">1. <strong style="color: #d4af37;">${body.story_title}</strong> (${wordCount.toLocaleString()} words)</p>
            <p style="margin: 0 0 8px 0; font-size: 16px; color: #e5e5e5;">2. <strong style="color: #d4af37;">${body.story_2_title}</strong> (${wordCount2.toLocaleString()} words)</p>
            <p style="margin: 0; font-size: 16px; color: #e5e5e5;">3. <strong style="color: #d4af37;">${body.story_3_title}</strong> (${wordCount3.toLocaleString()} words)</p>
          </div>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            <strong>What's next?</strong>
          </p>
          <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 16px; line-height: 26px; color: #d4d4d4;">
            <li style="margin-bottom: 8px;">Our judges will review all submissions</li>
            <li style="margin-bottom: 8px;">You'll be notified when judging is complete</li>
            <li style="margin-bottom: 8px;">Winners will be announced publicly</li>
          </ul>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
            Good luck! We're excited to read your stories. 📚
          </p>
          ${emailButton("View Competition Details", "https://sitmr2etn6sue.mocha.app/competition-flyer")}
        `)}
        ${emailFooter("Questions? Reply to this email or contact us through our website.")}
      `)
    })
  );
  
  return c.json({ success: true, message: "Your submission has been received!" });
});

// Check if user has already submitted
app.get("/api/competition/status", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const submission = await c.env.DB.prepare(`
    SELECT id, story_title, status, created_at FROM competition_submissions WHERE user_id = ?
  `).bind(user!.id).first();
  
  return c.json({ 
    hasSubmitted: !!submission,
    submission: submission || null
  });
});

// Admin: Get all submissions
app.get("/api/admin/competition/submissions", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const status = c.req.query("status");
  let query = `SELECT * FROM competition_submissions`;
  const params: string[] = [];
  
  if (status && status !== "all") {
    query += ` WHERE status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const submissions = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ submissions: submissions.results });
});

// Admin: Update submission status
app.patch("/api/admin/competition/submissions/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!(await isUserAdmin(user!.id, c.env.DB))) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const submissionId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  const updates: string[] = [];
  const params: (string | number)[] = [];
  
  if (body.status !== undefined) {
    updates.push("status = ?");
    params.push(body.status);
  }
  if (body.admin_notes !== undefined) {
    updates.push("admin_notes = ?");
    params.push(body.admin_notes);
  }
  updates.push("updated_at = CURRENT_TIMESTAMP");
  
  await c.env.DB.prepare(`UPDATE competition_submissions SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params, submissionId).run();
  
  return c.json({ success: true });
});

// Save/update submission score
app.post("/api/admin/competition/submissions/:id/score", authMiddleware, async (c) => {
  const user = c.get("user");
  const submissionId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  // Check if admin
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first() as { is_admin: number } | null;
  
  if (!profile?.is_admin) {
    return c.json({ error: "Not authorized" }, 403);
  }
  
  const {
    originality_score,
    plot_structure_score,
    character_development_score,
    writing_quality_score,
    voice_style_score,
    theme_impact_score,
    judge_notes
  } = body;
  
  // Calculate total score (each out of 10, total out of 60)
  const total_score = (originality_score || 0) + (plot_structure_score || 0) + 
    (character_development_score || 0) + (writing_quality_score || 0) + 
    (voice_style_score || 0) + (theme_impact_score || 0);
  
  // Check if score already exists for this judge
  const existing = await c.env.DB.prepare(
    `SELECT id FROM submission_scores WHERE submission_id = ? AND judge_user_id = ?`
  ).bind(submissionId, user!.id).first();
  
  if (existing) {
    // Update existing score
    await c.env.DB.prepare(`
      UPDATE submission_scores SET 
        originality_score = ?, plot_structure_score = ?, character_development_score = ?,
        writing_quality_score = ?, voice_style_score = ?, theme_impact_score = ?,
        total_score = ?, judge_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE submission_id = ? AND judge_user_id = ?
    `).bind(
      originality_score, plot_structure_score, character_development_score,
      writing_quality_score, voice_style_score, theme_impact_score,
      total_score, judge_notes, submissionId, user!.id
    ).run();
  } else {
    // Insert new score
    await c.env.DB.prepare(`
      INSERT INTO submission_scores (
        submission_id, judge_user_id, originality_score, plot_structure_score,
        character_development_score, writing_quality_score, voice_style_score,
        theme_impact_score, total_score, judge_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      submissionId, user!.id, originality_score, plot_structure_score,
      character_development_score, writing_quality_score, voice_style_score,
      theme_impact_score, total_score, judge_notes
    ).run();
  }
  
  return c.json({ success: true, total_score });
});

// Get scores for a submission
app.get("/api/admin/competition/submissions/:id/scores", authMiddleware, async (c) => {
  const user = c.get("user");
  const submissionId = parseInt(c.req.param("id"));
  
  // Check if admin
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first() as { is_admin: number } | null;
  
  if (!profile?.is_admin) {
    return c.json({ error: "Not authorized" }, 403);
  }
  
  // Get all scores for this submission
  const scores = await c.env.DB.prepare(`
    SELECT ss.*, up.display_name as judge_name
    FROM submission_scores ss
    LEFT JOIN user_profiles up ON ss.judge_user_id = up.auth_user_id
    WHERE ss.submission_id = ?
  `).bind(submissionId).all();
  
  // Get current judge's score
  const myScore = await c.env.DB.prepare(`
    SELECT * FROM submission_scores WHERE submission_id = ? AND judge_user_id = ?
  `).bind(submissionId, user!.id).first();
  
  // Calculate average scores
  const allScores = scores.results || [];
  const avgScore = allScores.length > 0 
    ? allScores.reduce((sum: number, s: any) => sum + (s.total_score || 0), 0) / allScores.length 
    : 0;
  
  return c.json({ 
    scores: allScores, 
    myScore: myScore || null,
    averageScore: Math.round(avgScore * 10) / 10,
    judgeCount: allScores.length
  });
});

// Get leaderboard of all submissions with scores
app.get("/api/admin/competition/leaderboard", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check if admin
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first() as { is_admin: number } | null;
  
  if (!profile?.is_admin) {
    return c.json({ error: "Not authorized" }, 403);
  }
  
  const leaderboard = await c.env.DB.prepare(`
    SELECT 
      cs.id, cs.full_name, cs.story_title, cs.genre, cs.school_name, cs.status,
      COUNT(ss.id) as judge_count,
      AVG(ss.total_score) as avg_score,
      MAX(ss.total_score) as max_score,
      MIN(ss.total_score) as min_score
    FROM competition_submissions cs
    LEFT JOIN submission_scores ss ON cs.id = ss.submission_id
    GROUP BY cs.id
    ORDER BY avg_score DESC NULLS LAST
  `).all();
  
  return c.json({ leaderboard: leaderboard.results || [] });
});

// Get Google OAuth redirect URL
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

// Exchange OAuth code for session token
app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

// Get current authenticated user
app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

// Logout and clear session
app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// ===================
// SUBSCRIPTION EXPIRY NOTIFICATIONS
// ===================

// Core function to check and send expiry notifications
async function checkExpiryNotifications(env: Env): Promise<{ sent: number; errors: string[] }> {
  const today = new Date();
  const notificationDays = [7, 3, 1];
  const results: { sent: number; errors: string[] } = { sent: 0, errors: [] };
  
  for (const days of notificationDays) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split("T")[0];
    
    // Find users with subscriptions expiring on target date
    const expiringUsers = await env.DB.prepare(`
      SELECT 
        up.auth_user_id,
        up.email,
        up.display_name,
        up.subscription_tier,
        up.subscription_expires_at
      FROM user_profiles up
      WHERE DATE(up.subscription_expires_at) = ?
        AND up.email IS NOT NULL
        AND up.subscription_tier != 'free'
        AND NOT EXISTS (
          SELECT 1 FROM subscription_notifications sn
          WHERE sn.user_id = up.auth_user_id
            AND sn.days_before_expiry = ?
            AND DATE(sn.subscription_expires_at) = DATE(up.subscription_expires_at)
        )
    `).bind(targetDateStr, days).all();
    
    // Also check family plan owners
    const expiringFamilyPlans = await env.DB.prepare(`
      SELECT 
        fp.owner_user_id,
        up.email,
        up.display_name,
        fp.expires_at,
        'family' as plan_type
      FROM family_plans fp
      JOIN user_profiles up ON fp.owner_user_id = up.auth_user_id
      WHERE DATE(fp.expires_at) = ?
        AND up.email IS NOT NULL
        AND fp.is_active = 1
        AND NOT EXISTS (
          SELECT 1 FROM subscription_notifications sn
          WHERE sn.user_id = fp.owner_user_id
            AND sn.days_before_expiry = ?
            AND sn.notification_type = 'family_expiry'
            AND DATE(sn.subscription_expires_at) = DATE(fp.expires_at)
        )
    `).bind(targetDateStr, days).all();
    
    // Send notifications to individual subscribers
    for (const user of expiringUsers.results || []) {
      try {
        const urgency = days === 1 ? "expires tomorrow" : days === 3 ? "expires in 3 days" : "expires in 7 days";
        const subject = days === 1 
          ? "⚠️ Your Inkseries subscription expires tomorrow!"
          : `Your Inkseries subscription ${urgency}`;
        
        await env.EMAILS.send({
          to: user.email as string,
          subject,
          html_body: emailTemplate(`
            ${emailHeader(days === 1 ? "Don't Lose Access!" : "Subscription Reminder")}
            ${emailBody(`
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                Hi ${user.display_name || "Reader"},
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                Your <strong style="color: #d4af37;">${user.subscription_tier}</strong> subscription ${urgency}.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                ${days === 1 
                  ? "Renew now to keep reading your favorite stories without interruption!"
                  : "Make sure to renew to continue enjoying unlimited access to all premium episodes."}
              </p>
              ${emailButton("Renew Subscription", "https://sitmr2etn6sue.mocha.app/settings")}
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #888888;">
                Your subscription expires on ${new Date(user.subscription_expires_at as string).toLocaleDateString("en-NG", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}.
              </p>
            `)}
            ${emailFooter("© 2025 Inkseries. The home of African novels.")}
          `),
          text_body: `Hi ${user.display_name || "Reader"}, your ${user.subscription_tier} subscription ${urgency}. Renew at https://sitmr2etn6sue.mocha.app/settings`,
        });
        
        // Record notification
        await env.DB.prepare(`
          INSERT INTO subscription_notifications (user_id, notification_type, days_before_expiry, subscription_expires_at)
          VALUES (?, 'subscription_expiry', ?, ?)
        `).bind(user.auth_user_id, days, user.subscription_expires_at).run();
        
        results.sent++;
      } catch (err) {
        results.errors.push(`Failed to notify ${user.email}: ${err}`);
      }
    }
    
    // Send notifications to family plan owners
    for (const fp of expiringFamilyPlans.results || []) {
      try {
        const urgency = days === 1 ? "expires tomorrow" : days === 3 ? "expires in 3 days" : "expires in 7 days";
        const subject = days === 1 
          ? "⚠️ Your Family Plan expires tomorrow!"
          : `Your Inkseries Family Plan ${urgency}`;
        
        await env.EMAILS.send({
          to: fp.email as string,
          subject,
          html_body: emailTemplate(`
            ${emailHeader(days === 1 ? "Family Plan Expiring!" : "Family Plan Reminder")}
            ${emailBody(`
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                Hi ${fp.display_name || "Reader"},
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                Your <strong style="color: #d4af37;">Family Plan</strong> ${urgency}.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
                ${days === 1 
                  ? "Renew now so you and your family members can keep reading!"
                  : "Don't forget to renew to keep premium access for your whole family."}
              </p>
              ${emailButton("Renew Family Plan", "https://sitmr2etn6sue.mocha.app/settings")}
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #888888;">
                Your plan expires on ${new Date(fp.expires_at as string).toLocaleDateString("en-NG", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}.
              </p>
            `)}
            ${emailFooter("© 2025 Inkseries. The home of African novels.")}
          `),
          text_body: `Hi ${fp.display_name || "Reader"}, your Family Plan ${urgency}. Renew at https://sitmr2etn6sue.mocha.app/settings`,
        });
        
        // Record notification
        await env.DB.prepare(`
          INSERT INTO subscription_notifications (user_id, notification_type, days_before_expiry, subscription_expires_at)
          VALUES (?, 'family_expiry', ?, ?)
        `).bind(fp.owner_user_id, days, fp.expires_at).run();
        
        results.sent++;
      } catch (err) {
        results.errors.push(`Failed to notify family plan ${fp.email}: ${err}`);
      }
    }
  }
  
  return results;
}

// Get user's notification history
app.get("/api/notifications", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const notifications = await c.env.DB.prepare(`
    SELECT * FROM subscription_notifications
    WHERE user_id = ?
    ORDER BY sent_at DESC
    LIMIT 50
  `).bind(user!.id).all();
  
  return c.json({ notifications: notifications.results || [] });
});

// Birthday notifications function
async function checkBirthdayNotifications(env: Env): Promise<{ sent: number; errors: string[] }> {
  const today = new Date();
  const currentYear = today.getFullYear();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');
  const birthdayPattern = `%-${todayMonth}-${todayDay}`;
  
  const results: { sent: number; errors: string[] } = { sent: 0, errors: [] };
  
  // Find users with birthdays today who haven't received an email this year
  const birthdayUsers = await env.DB.prepare(`
    SELECT 
      up.auth_user_id,
      up.email,
      up.display_name,
      up.birth_date
    FROM user_profiles up
    WHERE up.birth_date LIKE ?
      AND up.email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM birthday_notifications bn
        WHERE bn.user_id = up.auth_user_id
          AND bn.birth_year_sent = ?
      )
  `).bind(birthdayPattern, currentYear).all();
  
  for (const user of birthdayUsers.results || []) {
    try {
      const birthDate = new Date(user.birth_date as string);
      const age = currentYear - birthDate.getFullYear();
      
      await env.EMAILS.send({
        to: user.email as string,
        subject: "🎂 Happy Birthday from Inkseries!",
        html_body: emailTemplate(`
          ${emailHeader("Happy Birthday!")}
          ${emailBody(`
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
              Happy Birthday, ${user.display_name || "Reader"}! 🎉
            </p>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
              On this special day, we want to celebrate <strong style="color: #d4af37;">YOU</strong> — one of our amazing readers who makes the Inkseries community so vibrant.
            </p>
            <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e5e5e5;">
              May your ${age}${age === 1 ? 'st' : age === 2 ? 'nd' : age === 3 ? 'rd' : 'th'} year be filled with incredible stories, exciting adventures, and all the joy you deserve!
            </p>
            <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <p style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: bold;">
                🎁 Birthday Gift Inside! 🎁
              </p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #333;">
                Check your account for a special birthday surprise!
              </p>
            </div>
            ${emailButton("Celebrate With a Story", "https://sitmr2etn6sue.mocha.app/explore")}
            <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #888888; text-align: center;">
              🎈 Wishing you the happiest of birthdays! 🎈
            </p>
          `)}
          ${emailFooter("© 2025 Inkseries. The home of African novels.")}
        `),
        text_body: `Happy Birthday, ${user.display_name || "Reader"}! On this special day, we want to celebrate YOU — one of our amazing readers. May your year be filled with incredible stories! Visit https://sitmr2etn6sue.mocha.app/explore to celebrate with a story.`,
      });
      
      // Record notification
      await env.DB.prepare(`
        INSERT INTO birthday_notifications (user_id, birth_year_sent)
        VALUES (?, ?)
      `).bind(user.auth_user_id, currentYear).run();
      
      results.sent++;
    } catch (err) {
      results.errors.push(`Failed to send birthday email to ${user.email}: ${err}`);
    }
  }
  
  return results;
}

// Trigger expiry/renewal notifications check
app.post("/api/notifications/check-expiry", authMiddleware, async (c) => {
  const user = c.get("user");
  const isAdmin = await isUserAdmin(user!.id, c.env.DB);
  if (!isAdmin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  const result = await checkExpiryNotifications(c.env);
  return c.json({ 
    message: `Renewal reminders sent: ${result.sent}`,
    ...result 
  });
});

// Trigger birthday notifications check
app.post("/api/notifications/check-birthdays", authMiddleware, async (c) => {
  const user = c.get("user");
  const isAdmin = await isUserAdmin(user!.id, c.env.DB);
  if (!isAdmin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  const result = await checkBirthdayNotifications(c.env);
  return c.json({ 
    message: `Birthday notifications sent: ${result.sent}`,
    ...result 
  });
});

// Admin: View all recent notifications sent
app.get("/api/admin/notifications", authMiddleware, async (c) => {
  const user = c.get("user");
  const isAdmin = await isUserAdmin(user!.id, c.env.DB);
  if (!isAdmin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  const notifications = await c.env.DB.prepare(`
    SELECT sn.*, up.display_name, up.email
    FROM subscription_notifications sn
    LEFT JOIN user_profiles up ON sn.user_id = up.auth_user_id
    ORDER BY sn.sent_at DESC
    LIMIT 100
  `).all();
  
  return c.json({ notifications: notifications.results || [] });
});

// ===================
// COINS API (Pay-per-chapter)
// ===================

const COIN_PACKAGES = {
  starter: { coins: 100, amount: 50000, label: "100 Coins", bonus: 0 }, // ₦500
  popular: { coins: 300, amount: 120000, label: "300 Coins", bonus: 0 }, // ₦1,200
  value: { coins: 500, amount: 180000, label: "500 Coins", bonus: 0 }, // ₦1,800
  mega: { coins: 1000, amount: 300000, label: "1000 Coins", bonus: 0 }, // ₦3,000
};

const CHAPTER_UNLOCK_COST = 15; // coins per chapter

// Get user's coin balance
app.get("/api/coins/balance", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const balance = await c.env.DB.prepare(`
    SELECT balance FROM user_coins WHERE user_id = ?
  `).bind(user!.id).first<{ balance: number }>();
  
  return c.json({ 
    balance: balance?.balance || 0,
    chapterCost: CHAPTER_UNLOCK_COST
  });
});

// Get coin transaction history
app.get("/api/coins/transactions", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const transactions = await c.env.DB.prepare(`
    SELECT * FROM coin_transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `).bind(user!.id).all();
  
  return c.json({ transactions: transactions.results || [] });
});

// Get coin packages
app.get("/api/coins/packages", async (c) => {
  const packages = Object.entries(COIN_PACKAGES).map(([key, pkg]) => ({
    id: key,
    ...pkg,
    priceNaira: pkg.amount / 100,
  }));
  return c.json({ packages, chapterCost: CHAPTER_UNLOCK_COST });
});

// Initialize coin purchase
app.post("/api/coins/purchase", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const packageId = body.package as keyof typeof COIN_PACKAGES;
  
  if (!packageId || !COIN_PACKAGES[packageId]) {
    return c.json({ error: "Invalid coin package" }, 400);
  }
  
  const pkg = COIN_PACKAGES[packageId];
  const reference = `coins_${packageId}_${user!.id}_${Date.now()}`;
  
  const origin = c.req.header("origin") || "https://inkseries.mocha.app";
  const returnTo = body.return_to ? encodeURIComponent(body.return_to) : "";
  const callbackUrl = `${origin}/payment-callback?reference=${reference}${returnTo ? `&return_to=${returnTo}` : ""}`;
  
  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${c.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user!.email,
        amount: pkg.amount,
        reference,
        callback_url: callbackUrl,
        metadata: {
          user_id: user!.id,
          type: "coins",
          package_id: packageId,
          coins: pkg.coins,
          bonus: pkg.bonus,
        },
      }),
    });
    
    const data = await response.json() as { status: boolean; message?: string; data?: { authorization_url: string; reference: string } };
    
    if (!data.status) {
      return c.json({ error: data.message || "Payment initialization failed" }, 400);
    }
    
    return c.json({
      authorization_url: data.data?.authorization_url,
      reference: data.data?.reference,
    });
  } catch (error) {
    console.error("Coin purchase initialization error:", error);
    return c.json({ error: "Payment service unavailable" }, 500);
  }
});

// Verify coin purchase
app.get("/api/coins/verify/:reference", authMiddleware, async (c) => {
  const user = c.get("user");
  const reference = c.req.param("reference");
  
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${c.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    
    const data = await response.json() as {
      status: boolean;
      data?: {
        status: string;
        amount: number;
        metadata?: { user_id: string; type: string; package_id: string; coins: number; bonus: number };
      };
    };
    
    if (!data.status || data.data?.status !== "success") {
      return c.json({ error: "Payment not successful", verified: false }, 400);
    }
    
    const metadata = data.data.metadata;
    if (!metadata || metadata.user_id !== user!.id || metadata.type !== "coins") {
      return c.json({ error: "Payment verification mismatch", verified: false }, 400);
    }
    
    const totalCoins = metadata.coins + metadata.bonus;
    
    // Check if already processed
    const existingTx = await c.env.DB.prepare(`
      SELECT id FROM coin_transactions WHERE reference = ?
    `).bind(reference).first();
    
    if (existingTx) {
      const balance = await c.env.DB.prepare(`
        SELECT balance FROM user_coins WHERE user_id = ?
      `).bind(user!.id).first<{ balance: number }>();
      
      return c.json({
        verified: true,
        coins_added: totalCoins,
        new_balance: balance?.balance || 0,
        already_processed: true,
      });
    }
    
    // Add coins to balance
    const existingBalance = await c.env.DB.prepare(`
      SELECT id, balance FROM user_coins WHERE user_id = ?
    `).bind(user!.id).first<{ id: number; balance: number }>();
    
    let newBalance: number;
    if (existingBalance) {
      newBalance = existingBalance.balance + totalCoins;
      await c.env.DB.prepare(`
        UPDATE user_coins SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
      `).bind(newBalance, user!.id).run();
    } else {
      newBalance = totalCoins;
      await c.env.DB.prepare(`
        INSERT INTO user_coins (user_id, balance) VALUES (?, ?)
      `).bind(user!.id, totalCoins).run();
    }
    
    // Record transaction
    await c.env.DB.prepare(`
      INSERT INTO coin_transactions (user_id, amount, transaction_type, description, reference)
      VALUES (?, ?, 'purchase', ?, ?)
    `).bind(user!.id, totalCoins, `Purchased ${metadata.coins} coins + ${metadata.bonus} bonus`, reference).run();
    
    return c.json({
      verified: true,
      coins_added: totalCoins,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error("Coin verification error:", error);
    return c.json({ error: "Verification failed", verified: false }, 500);
  }
});

// Check if chapter is unlocked
app.get("/api/chapters/:chapterId/unlock-status", async (c) => {
  const chapterId = parseInt(c.req.param("chapterId"));
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  
  if (!sessionToken) {
    return c.json({ unlocked: false, requiresLogin: true });
  }
  
  const user = await getCurrentUser(sessionToken, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });
  if (!user) {
    return c.json({ unlocked: false, requiresLogin: true });
  }
  
  // Check if chapter is unlocked
  const unlock = await c.env.DB.prepare(`
    SELECT id FROM chapter_unlocks WHERE user_id = ? AND chapter_id = ?
  `).bind(user.id, chapterId).first();
  
  return c.json({ 
    unlocked: !!unlock,
    chapterCost: CHAPTER_UNLOCK_COST
  });
});

// Unlock chapter with coins
app.post("/api/chapters/:chapterId/unlock", authMiddleware, async (c) => {
  const user = c.get("user");
  const chapterId = parseInt(c.req.param("chapterId"));
  
  // Check if already unlocked
  const existingUnlock = await c.env.DB.prepare(`
    SELECT id FROM chapter_unlocks WHERE user_id = ? AND chapter_id = ?
  `).bind(user!.id, chapterId).first();
  
  if (existingUnlock) {
    return c.json({ success: true, already_unlocked: true });
  }
  
  // Get user's coin balance
  const coins = await c.env.DB.prepare(`
    SELECT balance FROM user_coins WHERE user_id = ?
  `).bind(user!.id).first<{ balance: number }>();
  
  const balance = coins?.balance || 0;
  
  if (balance < CHAPTER_UNLOCK_COST) {
    return c.json({ 
      error: "Insufficient coins", 
      balance, 
      required: CHAPTER_UNLOCK_COST 
    }, 400);
  }
  
  // Verify chapter exists
  const chapter = await c.env.DB.prepare(`
    SELECT c.id, c.title, n.title as novel_title 
    FROM chapters c 
    JOIN novels n ON c.novel_id = n.id 
    WHERE c.id = ?
  `).bind(chapterId).first<{ id: number; title: string; novel_title: string }>();
  
  if (!chapter) {
    return c.json({ error: "Chapter not found" }, 404);
  }
  
  // Deduct coins and create unlock record
  const newBalance = balance - CHAPTER_UNLOCK_COST;
  
  await c.env.DB.prepare(`
    UPDATE user_coins SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
  `).bind(newBalance, user!.id).run();
  
  await c.env.DB.prepare(`
    INSERT INTO chapter_unlocks (user_id, chapter_id, coins_spent) VALUES (?, ?, ?)
  `).bind(user!.id, chapterId, CHAPTER_UNLOCK_COST).run();
  
  // Record transaction
  await c.env.DB.prepare(`
    INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
    VALUES (?, ?, 'spend', ?)
  `).bind(user!.id, -CHAPTER_UNLOCK_COST, `Unlocked: ${chapter.novel_title} - ${chapter.title}`).run();
  
  return c.json({ 
    success: true, 
    new_balance: newBalance,
    chapter_unlocked: chapter.title
  });
});

// ==================== MAINTENANCE MODE ====================

// Public: Check maintenance status (no auth required)
app.get("/api/maintenance/status", async (c) => {
  const maintenanceMode = await c.env.DB.prepare(
    `SELECT setting_value FROM app_settings WHERE setting_key = 'maintenance_mode'`
  ).first<{ setting_value: string }>();
  
  const maintenanceMessage = await c.env.DB.prepare(
    `SELECT setting_value FROM app_settings WHERE setting_key = 'maintenance_message'`
  ).first<{ setting_value: string }>();
  
  return c.json({
    enabled: maintenanceMode?.setting_value === 'true',
    message: maintenanceMessage?.setting_value || 'We are updating Inkseries. Check back soon!'
  });
});

// Admin: Toggle maintenance mode
app.post("/api/admin/maintenance", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Check if user is admin
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first<{ is_admin: number }>();
  
  if (!profile || profile.is_admin !== 1) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const body = await c.req.json<{ enabled: boolean; message?: string }>();
  
  // Update maintenance mode
  await c.env.DB.prepare(
    `UPDATE app_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'maintenance_mode'`
  ).bind(body.enabled ? 'true' : 'false').run();
  
  // Update message if provided
  if (body.message) {
    await c.env.DB.prepare(
      `UPDATE app_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = 'maintenance_message'`
    ).bind(body.message).run();
  }
  
  return c.json({ success: true, enabled: body.enabled });
});

// ===== COMING SOON MODE =====

// Public: Check coming soon status
app.get("/api/coming-soon/status", async (c) => {
  const comingSoonMode = await c.env.DB.prepare(
    `SELECT setting_value FROM app_settings WHERE setting_key = 'coming_soon_mode'`
  ).first<{ setting_value: string }>();
  
  const launchDate = await c.env.DB.prepare(
    `SELECT setting_value FROM app_settings WHERE setting_key = 'launch_date'`
  ).first<{ setting_value: string }>();
  
  return c.json({
    enabled: comingSoonMode?.setting_value === 'true',
    launchDate: launchDate?.setting_value || null
  });
});

// Public: Join waitlist
app.post("/api/coming-soon/waitlist", async (c) => {
  const body = await c.req.json<{ email: string }>();
  
  if (!body.email || !body.email.includes('@')) {
    return c.json({ error: "Please enter a valid email address" }, 400);
  }
  
  try {
    await c.env.DB.prepare(
      `INSERT INTO launch_waitlist (email, created_at, updated_at) VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    ).bind(body.email.toLowerCase().trim()).run();
    
    return c.json({ success: true });
  } catch (e: unknown) {
    // Duplicate email
    if (e instanceof Error && e.message.includes('UNIQUE')) {
      return c.json({ error: "You're already on the waitlist!" }, 400);
    }
    return c.json({ error: "Something went wrong" }, 500);
  }
});

// Admin: Toggle coming soon mode
app.post("/api/admin/coming-soon", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first<{ is_admin: number }>();
  
  if (!profile || profile.is_admin !== 1) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const body = await c.req.json<{ enabled: boolean; launchDate?: string; sendEmails?: boolean }>();
  
  // Check if we're turning OFF coming soon mode to send launch emails
  const currentSetting = await c.env.DB.prepare(
    `SELECT setting_value FROM app_settings WHERE setting_key = 'coming_soon_mode'`
  ).first<{ setting_value: string }>();
  
  const wasEnabled = currentSetting?.setting_value === 'true';
  const isDisabling = wasEnabled && !body.enabled;
  
  // Update or insert coming_soon_mode
  await c.env.DB.prepare(
    `INSERT INTO app_settings (setting_key, setting_value, created_at, updated_at) 
     VALUES ('coming_soon_mode', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?, updated_at = CURRENT_TIMESTAMP`
  ).bind(body.enabled ? 'true' : 'false', body.enabled ? 'true' : 'false').run();
  
  // Update launch date if provided
  if (body.launchDate) {
    await c.env.DB.prepare(
      `INSERT INTO app_settings (setting_key, setting_value, created_at, updated_at) 
       VALUES ('launch_date', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?, updated_at = CURRENT_TIMESTAMP`
    ).bind(body.launchDate, body.launchDate).run();
  }
  
  // Send launch emails if turning off coming soon mode and sendEmails is true
  let emailsSent = 0;
  if (isDisabling && body.sendEmails) {
    const waitlist = await c.env.DB.prepare(
      `SELECT email FROM launch_waitlist`
    ).all<{ email: string }>();
    
    const emails = waitlist.results || [];
    
    for (const { email } of emails) {
      try {
        await c.env.EMAILS.send({
          to: email,
          subject: "🎉 Inkseries is LIVE! Your 7-Day Free Trial Awaits",
          html_body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #18181b 0%, #0a0a0a 100%); border-radius: 16px; border: 1px solid #27272a; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 40px; text-align: center;">
              <h1 style="margin: 0; color: #0a0a0a; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                🚀 WE'RE LIVE!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #fafafa; font-size: 18px; line-height: 1.6; margin: 0 0 24px 0;">
                The wait is over! <strong style="color: #f59e0b;">Inkseries</strong> is officially live, and your exclusive 7-day free trial is waiting for you.
              </p>
              
              <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Thank you for being one of the first to join our community. As a thank you for your patience, you'll get full access to everything—unlimited episodes, all our stories, and exclusive features.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="https://inkseries.com" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0a; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">
                      Start Reading Now →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits -->
              <div style="background-color: #1a1a1a; border-radius: 12px; padding: 24px; margin-top: 32px;">
                <h3 style="color: #f59e0b; margin: 0 0 16px 0; font-size: 16px;">Your 7-Day Trial Includes:</h3>
                <p style="color: #a1a1aa; font-size: 14px; line-height: 1.8; margin: 0;">
                  ✨ Unlimited access to all stories<br>
                  📚 New episodes every week<br>
                  💬 Join the reader community<br>
                  📱 Read anywhere, anytime
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #27272a; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">
                Where Stories Of African Teenagers Come Alive Weekly
              </p>
              <p style="color: #52525b; font-size: 11px; margin: 8px 0 0 0;">
                © ${new Date().getFullYear()} Inkseries. Owerri, Nigeria.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });
        emailsSent++;
      } catch (err) {
        console.error(`Failed to send launch email to ${email}:`, err);
      }
    }
  }
  
  return c.json({ success: true, enabled: body.enabled, emailsSent });
});

// Admin: Get launch waitlist
app.get("/api/admin/launch-waitlist", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first<{ is_admin: number }>();
  
  if (!profile || profile.is_admin !== 1) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const waitlist = await c.env.DB.prepare(
    `SELECT id, email, created_at FROM launch_waitlist ORDER BY created_at DESC`
  ).all();
  
  return c.json({ waitlist: waitlist.results || [] });
});

// Admin: Delete from launch waitlist
app.delete("/api/admin/launch-waitlist/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  
  const profile = await c.env.DB.prepare(
    `SELECT is_admin FROM user_profiles WHERE auth_user_id = ?`
  ).bind(user!.id).first<{ is_admin: number }>();
  
  if (!profile || profile.is_admin !== 1) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  await c.env.DB.prepare(`DELETE FROM launch_waitlist WHERE id = ?`).bind(id).run();
  
  return c.json({ success: true });
});

// Get all unlocked chapters for user
app.get("/api/chapters/unlocked", authMiddleware, async (c) => {
  const user = c.get("user");
  
  const unlocks = await c.env.DB.prepare(`
    SELECT cu.chapter_id, cu.created_at as unlocked_at, c.title, c.chapter_number, n.title as novel_title, COALESCE(n.slug, CAST(n.id AS TEXT)) as slug
    FROM chapter_unlocks cu
    JOIN chapters c ON cu.chapter_id = c.id
    JOIN novels n ON c.novel_id = n.id
    WHERE cu.user_id = ?
    ORDER BY cu.created_at DESC
  `).bind(user!.id).all();
  
  return c.json({ unlocked_chapters: unlocks.results || [] });
});

export default app;
