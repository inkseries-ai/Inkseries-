
-- ==================== NOVELS & CHAPTERS ====================

CREATE TABLE novels (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  author_id INTEGER,
  author_name TEXT,
  cover_image_url TEXT,
  synopsis TEXT,
  genre TEXT,
  tags TEXT,
  status TEXT DEFAULT 'ongoing',
  is_featured INTEGER DEFAULT 0,
  chapter_format TEXT DEFAULT 'chapter',
  total_reads INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  rating DECIMAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_novels" ON novels FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_novels" ON novels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_novels" ON novels FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_novels" ON novels FOR DELETE TO authenticated USING (true);

CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  novel_id INTEGER REFERENCES novels(id),
  season_number INTEGER,
  title TEXT NOT NULL,
  synopsis TEXT,
  cover_image_url TEXT,
  release_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_seasons" ON seasons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_seasons" ON seasons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_seasons" ON seasons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_seasons" ON seasons FOR DELETE TO authenticated USING (true);

CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  novel_id INTEGER REFERENCES novels(id),
  season_id INTEGER REFERENCES seasons(id),
  chapter_number INTEGER,
  part_number INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  is_premium INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 0,
  audio_url TEXT,
  published_at TIMESTAMP,
  scheduled_release_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_chapters" ON chapters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_chapters" ON chapters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_chapters" ON chapters FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_chapters" ON chapters FOR DELETE TO authenticated USING (true);

-- ==================== USER PROFILES ====================

CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  auth_user_id TEXT UNIQUE,
  display_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  birth_date DATE,
  favorite_genres TEXT,
  referral_code TEXT UNIQUE,
  referred_by_code TEXT,
  is_admin INTEGER DEFAULT 0,
  is_newsletter_subscribed INTEGER DEFAULT 0,
  is_chapter_notifications_enabled INTEGER DEFAULT 1,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  trial_started_at TIMESTAMP,
  referral_bonus_days INTEGER DEFAULT 0,
  total_referral_days_earned INTEGER DEFAULT 0,
  successful_referrals_count INTEGER DEFAULT 0,
  has_early_access INTEGER DEFAULT 0,
  has_completed_onboarding INTEGER DEFAULT 0,
  fraud_flagged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_user_profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_user_profiles" ON user_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_user_profiles" ON user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_profiles" ON user_profiles FOR DELETE TO authenticated USING (auth.uid()::text = auth_user_id);

-- ==================== READING & LIBRARY ====================

CREATE TABLE user_libraries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES user_profiles(id),
  novel_id INTEGER REFERENCES novels(id),
  is_bookmarked INTEGER DEFAULT 0,
  last_read_chapter INTEGER DEFAULT 0,
  scroll_position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, novel_id)
);
ALTER TABLE user_libraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_user_libraries" ON user_libraries FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_user_libraries" ON user_libraries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_user_libraries" ON user_libraries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_libraries" ON user_libraries FOR DELETE TO authenticated USING (true);

CREATE TABLE chapters_read (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  chapter_id INTEGER REFERENCES chapters(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, chapter_id)
);
ALTER TABLE chapters_read ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_chapters_read" ON chapters_read FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_chapters_read" ON chapters_read FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_chapters_read" ON chapters_read FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_chapters_read" ON chapters_read FOR DELETE TO authenticated USING (true);

CREATE TABLE reading_activity (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  read_date DATE,
  chapters_read INTEGER DEFAULT 0,
  minutes_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, read_date)
);
ALTER TABLE reading_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_reading_activity" ON reading_activity FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_reading_activity" ON reading_activity FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_reading_activity" ON reading_activity FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_reading_activity" ON reading_activity FOR DELETE TO authenticated USING (true);

CREATE TABLE user_streaks (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_days_read INTEGER DEFAULT 0,
  total_chapters_read INTEGER DEFAULT 0,
  reading_level TEXT DEFAULT 'new_reader',
  last_read_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_user_streaks" ON user_streaks FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_user_streaks" ON user_streaks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_user_streaks" ON user_streaks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_streaks" ON user_streaks FOR DELETE TO authenticated USING (true);

-- ==================== COMMENTS & REACTIONS ====================

CREATE TABLE chapter_comments (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id),
  user_id INTEGER REFERENCES user_profiles(id),
  parent_id INTEGER,
  content TEXT NOT NULL,
  is_spoiler INTEGER DEFAULT 0,
  is_hidden INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  reply_to_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE chapter_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_chapter_comments" ON chapter_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_chapter_comments" ON chapter_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_chapter_comments" ON chapter_comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_chapter_comments" ON chapter_comments FOR DELETE TO authenticated USING (true);

CREATE TABLE comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER REFERENCES chapter_comments(id),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_comment_likes" ON comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_comment_likes" ON comment_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_comment_likes" ON comment_likes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_comment_likes" ON comment_likes FOR DELETE TO authenticated USING (true);

CREATE TABLE chapter_reactions (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id),
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, user_id)
);
ALTER TABLE chapter_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_chapter_reactions" ON chapter_reactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_chapter_reactions" ON chapter_reactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_chapter_reactions" ON chapter_reactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_chapter_reactions" ON chapter_reactions FOR DELETE TO authenticated USING (true);

CREATE TABLE chapter_unlocks (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  chapter_id INTEGER REFERENCES chapters(id),
  coins_spent INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, chapter_id)
);
ALTER TABLE chapter_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_chapter_unlocks" ON chapter_unlocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_chapter_unlocks" ON chapter_unlocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_chapter_unlocks" ON chapter_unlocks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_chapter_unlocks" ON chapter_unlocks FOR DELETE TO authenticated USING (true);

-- ==================== COMMUNITY & DISCUSSIONS ====================

CREATE TABLE community_discussions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES user_profiles(id),
  novel_id INTEGER REFERENCES novels(id),
  chapter_number INTEGER,
  content TEXT NOT NULL,
  is_spoiler INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE community_discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_community_discussions" ON community_discussions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_community_discussions" ON community_discussions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_community_discussions" ON community_discussions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_community_discussions" ON community_discussions FOR DELETE TO authenticated USING (true);

CREATE TABLE discussion_likes (
  id SERIAL PRIMARY KEY,
  discussion_id INTEGER REFERENCES community_discussions(id),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(discussion_id, user_id)
);
ALTER TABLE discussion_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_discussion_likes" ON discussion_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_discussion_likes" ON discussion_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_discussion_likes" ON discussion_likes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_discussion_likes" ON discussion_likes FOR DELETE TO authenticated USING (true);

CREATE TABLE discussion_replies (
  id SERIAL PRIMARY KEY,
  discussion_id INTEGER REFERENCES community_discussions(id),
  user_id INTEGER REFERENCES user_profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_discussion_replies" ON discussion_replies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_discussion_replies" ON discussion_replies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_discussion_replies" ON discussion_replies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_discussion_replies" ON discussion_replies FOR DELETE TO authenticated USING (true);

-- ==================== RATINGS & POLLS ====================

CREATE TABLE novel_ratings (
  id SERIAL PRIMARY KEY,
  novel_id INTEGER REFERENCES novels(id),
  user_id TEXT NOT NULL,
  rating INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(novel_id, user_id)
);
ALTER TABLE novel_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_novel_ratings" ON novel_ratings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_novel_ratings" ON novel_ratings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_novel_ratings" ON novel_ratings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_novel_ratings" ON novel_ratings FOR DELETE TO authenticated USING (true);

CREATE TABLE polls (
  id SERIAL PRIMARY KEY,
  novel_id INTEGER REFERENCES novels(id),
  question TEXT NOT NULL,
  context TEXT,
  is_spoiler INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  ends_at TIMESTAMP,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_polls" ON polls FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_polls" ON polls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_polls" ON polls FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_polls" ON polls FOR DELETE TO authenticated USING (true);

CREATE TABLE poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id),
  option_text TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_poll_options" ON poll_options FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_poll_options" ON poll_options FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_poll_options" ON poll_options FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_poll_options" ON poll_options FOR DELETE TO authenticated USING (true);

CREATE TABLE poll_votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id),
  option_id INTEGER REFERENCES poll_options(id),
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(poll_id, user_id)
);
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_poll_votes" ON poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_poll_votes" ON poll_votes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_poll_votes" ON poll_votes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_poll_votes" ON poll_votes FOR DELETE TO authenticated USING (true);

-- ==================== SUBSCRIPTIONS & PAYMENTS ====================

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES user_profiles(id),
  plan_type TEXT NOT NULL,
  amount INTEGER,
  payment_provider TEXT,
  payment_reference TEXT UNIQUE,
  starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active INTEGER DEFAULT 1,
  is_cancelled INTEGER DEFAULT 0,
  is_recurring INTEGER DEFAULT 0,
  cancelled_at TIMESTAMP,
  first_charge_at TIMESTAMP,
  episodes_read_at_first_charge INTEGER DEFAULT 0,
  flutterwave_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_subscriptions" ON subscriptions FOR DELETE TO authenticated USING (true);

CREATE TABLE subscription_cancellations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount INTEGER,
  cancellation_reason TEXT,
  access_expires_at TIMESTAMP,
  flutterwave_subscription_id TEXT,
  save_offer_shown INTEGER DEFAULT 0,
  save_offer_accepted INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE subscription_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_subscription_cancellations" ON subscription_cancellations FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_subscription_cancellations" ON subscription_cancellations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_subscription_cancellations" ON subscription_cancellations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_subscription_cancellations" ON subscription_cancellations FOR DELETE TO authenticated USING (true);

CREATE TABLE subscription_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  notification_type TEXT,
  days_before_expiry INTEGER,
  subscription_expires_at TIMESTAMP,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE subscription_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_subscription_notifications" ON subscription_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_subscription_notifications" ON subscription_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_subscription_notifications" ON subscription_notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_subscription_notifications" ON subscription_notifications FOR DELETE TO authenticated USING (true);

CREATE TABLE scheduled_plan_changes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  current_plan_type TEXT,
  new_plan_type TEXT NOT NULL,
  change_type TEXT,
  effective_at TIMESTAMP,
  is_processed INTEGER DEFAULT 0,
  processed_at TIMESTAMP,
  proration_credit INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE scheduled_plan_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_scheduled_plan_changes" ON scheduled_plan_changes FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_scheduled_plan_changes" ON scheduled_plan_changes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_scheduled_plan_changes" ON scheduled_plan_changes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_scheduled_plan_changes" ON scheduled_plan_changes FOR DELETE TO authenticated USING (true);

CREATE TABLE refunds (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES user_profiles(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  amount INTEGER,
  refund_type TEXT,
  status TEXT DEFAULT 'pending',
  refund_reason TEXT,
  flutterwave_refund_id TEXT,
  payment_reference TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_refunds" ON refunds FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_refunds" ON refunds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_refunds" ON refunds FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_refunds" ON refunds FOR DELETE TO authenticated USING (true);

CREATE TABLE payment_charges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES user_profiles(id),
  subscription_id INTEGER REFERENCES subscriptions(id),
  transaction_id TEXT,
  payment_reference TEXT,
  amount INTEGER,
  plan_type TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE payment_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_payment_charges" ON payment_charges FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_payment_charges" ON payment_charges FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_payment_charges" ON payment_charges FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_payment_charges" ON payment_charges FOR DELETE TO authenticated USING (true);

-- ==================== FAMILY PLANS ====================

CREATE TABLE family_plans (
  id SERIAL PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  plan_type TEXT,
  max_members INTEGER DEFAULT 4,
  amount INTEGER,
  payment_reference TEXT,
  starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE family_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_family_plans" ON family_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_family_plans" ON family_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_family_plans" ON family_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_family_plans" ON family_plans FOR DELETE TO authenticated USING (true);

CREATE TABLE family_plan_members (
  id SERIAL PRIMARY KEY,
  family_plan_id INTEGER REFERENCES family_plans(id),
  user_id TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending',
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE family_plan_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_family_plan_members" ON family_plan_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_family_plan_members" ON family_plan_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_family_plan_members" ON family_plan_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_family_plan_members" ON family_plan_members FOR DELETE TO authenticated USING (true);

-- ==================== REFERRALS & REWARDS ====================

CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  referral_code TEXT,
  status TEXT DEFAULT 'pending',
  is_trial_activated INTEGER DEFAULT 0,
  reward_days_given INTEGER DEFAULT 0,
  reward_revoked INTEGER DEFAULT 0,
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(referrer_user_id, referred_user_id)
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_referrals" ON referrals FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_referrals" ON referrals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_referrals" ON referrals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_referrals" ON referrals FOR DELETE TO authenticated USING (true);

CREATE TABLE referral_clicks (
  id SERIAL PRIMARY KEY,
  referral_code TEXT,
  referrer_user_id TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_referral_clicks" ON referral_clicks FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_referral_clicks" ON referral_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_referral_clicks" ON referral_clicks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_referral_clicks" ON referral_clicks FOR DELETE TO authenticated USING (true);

CREATE TABLE referral_rewards (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  referral_id INTEGER REFERENCES referrals(id),
  reward_type TEXT,
  reward_days INTEGER,
  is_claimed INTEGER DEFAULT 0,
  claimed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_referral_rewards" ON referral_rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_referral_rewards" ON referral_rewards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_referral_rewards" ON referral_rewards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_referral_rewards" ON referral_rewards FOR DELETE TO authenticated USING (true);

-- ==================== BADGES ====================

CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_user_badges" ON user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_user_badges" ON user_badges FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_user_badges" ON user_badges FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_badges" ON user_badges FOR DELETE TO authenticated USING (true);

-- ==================== COINS & PURCHASES ====================

CREATE TABLE user_coins (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  balance INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_user_coins" ON user_coins FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_user_coins" ON user_coins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_user_coins" ON user_coins FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_user_coins" ON user_coins FOR DELETE TO authenticated USING (true);

CREATE TABLE coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER,
  transaction_type TEXT,
  description TEXT,
  reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_coin_transactions" ON coin_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_coin_transactions" ON coin_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_coin_transactions" ON coin_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_coin_transactions" ON coin_transactions FOR DELETE TO authenticated USING (true);

-- ==================== GIFT SUBSCRIPTIONS ====================

CREATE TABLE gift_subscriptions (
  id SERIAL PRIMARY KEY,
  purchaser_user_id TEXT,
  recipient_user_id TEXT,
  recipient_email TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount INTEGER,
  gift_code TEXT UNIQUE NOT NULL,
  gift_message TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP,
  redeemed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE gift_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_gift_subscriptions" ON gift_subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_gift_subscriptions" ON gift_subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_gift_subscriptions" ON gift_subscriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_gift_subscriptions" ON gift_subscriptions FOR DELETE TO authenticated USING (true);

-- ==================== EVENTS ====================

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  cover_image_url TEXT,
  novel_id INTEGER REFERENCES novels(id),
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP,
  external_link TEXT,
  is_published INTEGER DEFAULT 0,
  is_live INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_events" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_events" ON events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_events" ON events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_events" ON events FOR DELETE TO authenticated USING (true);

CREATE TABLE event_reminders (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  user_id TEXT NOT NULL,
  remind_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_event_reminders" ON event_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_event_reminders" ON event_reminders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_event_reminders" ON event_reminders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_event_reminders" ON event_reminders FOR DELETE TO authenticated USING (true);

-- ==================== COMPETITION ====================

CREATE TABLE competition_submissions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  school_name TEXT NOT NULL,
  class_year TEXT,
  age INTEGER,
  story_title TEXT NOT NULL,
  genre TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  story_content TEXT NOT NULL,
  word_count INTEGER,
  story_2_title TEXT,
  story_2_genre TEXT,
  story_2_synopsis TEXT,
  story_2_content TEXT,
  story_2_word_count INTEGER,
  story_3_title TEXT,
  story_3_genre TEXT,
  story_3_synopsis TEXT,
  story_3_content TEXT,
  story_3_word_count INTEGER,
  novel_1_id INTEGER,
  novel_1_summary TEXT,
  novel_2_id INTEGER,
  novel_2_summary TEXT,
  novel_3_id INTEGER,
  novel_3_summary TEXT,
  is_original_work INTEGER DEFAULT 0,
  referral_source TEXT,
  has_written_before INTEGER DEFAULT 0,
  follows_facebook INTEGER DEFAULT 0,
  follows_instagram INTEGER DEFAULT 0,
  follows_tiktok INTEGER DEFAULT 0,
  follows_youtube INTEGER DEFAULT 0,
  follows_whatsapp INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE competition_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_competition_submissions" ON competition_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_competition_submissions" ON competition_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_competition_submissions" ON competition_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_competition_submissions" ON competition_submissions FOR DELETE TO authenticated USING (true);

CREATE TABLE submission_scores (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES competition_submissions(id),
  judge_user_id TEXT NOT NULL,
  originality_score INTEGER,
  plot_structure_score INTEGER,
  character_development_score INTEGER,
  writing_quality_score INTEGER,
  voice_style_score INTEGER,
  theme_impact_score INTEGER,
  total_score INTEGER,
  judge_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE submission_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_submission_scores" ON submission_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_submission_scores" ON submission_scores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_submission_scores" ON submission_scores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_submission_scores" ON submission_scores FOR DELETE TO authenticated USING (true);

-- ==================== WAITLISTS & SETTINGS ====================

CREATE TABLE early_access_emails (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE early_access_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_early_access_emails" ON early_access_emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_early_access_emails" ON early_access_emails FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_early_access_emails" ON early_access_emails FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_early_access_emails" ON early_access_emails FOR DELETE TO authenticated USING (true);

CREATE TABLE writer_waitlist (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE writer_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_writer_waitlist" ON writer_waitlist FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_writer_waitlist" ON writer_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_writer_waitlist" ON writer_waitlist FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_writer_waitlist" ON writer_waitlist FOR DELETE TO authenticated USING (true);

CREATE TABLE launch_waitlist (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE launch_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_launch_waitlist" ON launch_waitlist FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_launch_waitlist" ON launch_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_launch_waitlist" ON launch_waitlist FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_launch_waitlist" ON launch_waitlist FOR DELETE TO authenticated USING (true);

CREATE TABLE app_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_app_settings" ON app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_app_settings" ON app_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_app_settings" ON app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_app_settings" ON app_settings FOR DELETE TO authenticated USING (true);

-- ==================== NOTIFICATIONS ====================

CREATE TABLE birthday_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  birth_year_sent INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, birth_year_sent)
);
ALTER TABLE birthday_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_birthday_notifications" ON birthday_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_birthday_notifications" ON birthday_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_birthday_notifications" ON birthday_notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_birthday_notifications" ON birthday_notifications FOR DELETE TO authenticated USING (true);

-- ==================== SEED DEFAULT SETTINGS ====================

INSERT INTO app_settings (setting_key, setting_value) VALUES
  ('maintenance_mode', 'false'),
  ('coming_soon_mode', 'false')
ON CONFLICT (setting_key) DO NOTHING;
