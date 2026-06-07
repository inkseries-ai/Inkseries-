
-- ==================== DROP ALL OVERLY-PERMISSIVE WRITE POLICIES ====================
-- We keep SELECT policies as-is and only replace the write policies.

-- novels (admin-managed content)
DROP POLICY IF EXISTS "insert_novels" ON novels;
DROP POLICY IF EXISTS "update_novels" ON novels;
DROP POLICY IF EXISTS "delete_novels" ON novels;
CREATE POLICY "insert_novels" ON novels FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_novels" ON novels FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_novels" ON novels FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- seasons (admin-managed content)
DROP POLICY IF EXISTS "insert_seasons" ON seasons;
DROP POLICY IF EXISTS "update_seasons" ON seasons;
DROP POLICY IF EXISTS "delete_seasons" ON seasons;
CREATE POLICY "insert_seasons" ON seasons FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_seasons" ON seasons FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_seasons" ON seasons FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- chapters (admin-managed content)
DROP POLICY IF EXISTS "insert_chapters" ON chapters;
DROP POLICY IF EXISTS "update_chapters" ON chapters;
DROP POLICY IF EXISTS "delete_chapters" ON chapters;
CREATE POLICY "insert_chapters" ON chapters FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_chapters" ON chapters FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_chapters" ON chapters FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- user_profiles (own row only)
DROP POLICY IF EXISTS "insert_user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "update_user_profiles" ON user_profiles;
CREATE POLICY "insert_user_profiles" ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid()::text);
CREATE POLICY "update_user_profiles" ON user_profiles FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid()::text)
  WITH CHECK (auth_user_id = auth.uid()::text);

-- user_libraries (user_id INTEGER → join user_profiles)
DROP POLICY IF EXISTS "insert_user_libraries" ON user_libraries;
DROP POLICY IF EXISTS "update_user_libraries" ON user_libraries;
DROP POLICY IF EXISTS "delete_user_libraries" ON user_libraries;
CREATE POLICY "insert_user_libraries" ON user_libraries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text));
CREATE POLICY "update_user_libraries" ON user_libraries FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text));
CREATE POLICY "delete_user_libraries" ON user_libraries FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text));

-- chapters_read (user_id TEXT)
DROP POLICY IF EXISTS "insert_chapters_read" ON chapters_read;
DROP POLICY IF EXISTS "update_chapters_read" ON chapters_read;
DROP POLICY IF EXISTS "delete_chapters_read" ON chapters_read;
CREATE POLICY "insert_chapters_read" ON chapters_read FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_chapters_read" ON chapters_read FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_chapters_read" ON chapters_read FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- reading_activity (user_id TEXT)
DROP POLICY IF EXISTS "insert_reading_activity" ON reading_activity;
DROP POLICY IF EXISTS "update_reading_activity" ON reading_activity;
DROP POLICY IF EXISTS "delete_reading_activity" ON reading_activity;
CREATE POLICY "insert_reading_activity" ON reading_activity FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_reading_activity" ON reading_activity FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_reading_activity" ON reading_activity FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- user_streaks (user_id TEXT)
DROP POLICY IF EXISTS "insert_user_streaks" ON user_streaks;
DROP POLICY IF EXISTS "update_user_streaks" ON user_streaks;
DROP POLICY IF EXISTS "delete_user_streaks" ON user_streaks;
CREATE POLICY "insert_user_streaks" ON user_streaks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_user_streaks" ON user_streaks FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_user_streaks" ON user_streaks FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- chapter_comments (user_id INTEGER → join user_profiles)
DROP POLICY IF EXISTS "insert_chapter_comments" ON chapter_comments;
DROP POLICY IF EXISTS "update_chapter_comments" ON chapter_comments;
DROP POLICY IF EXISTS "delete_chapter_comments" ON chapter_comments;
CREATE POLICY "insert_chapter_comments" ON chapter_comments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text));
CREATE POLICY "update_chapter_comments" ON chapter_comments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text));
CREATE POLICY "delete_chapter_comments" ON chapter_comments FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );

-- comment_likes (user_id TEXT)
DROP POLICY IF EXISTS "insert_comment_likes" ON comment_likes;
DROP POLICY IF EXISTS "update_comment_likes" ON comment_likes;
DROP POLICY IF EXISTS "delete_comment_likes" ON comment_likes;
CREATE POLICY "insert_comment_likes" ON comment_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_comment_likes" ON comment_likes FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_comment_likes" ON comment_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- chapter_reactions (user_id TEXT)
DROP POLICY IF EXISTS "insert_chapter_reactions" ON chapter_reactions;
DROP POLICY IF EXISTS "update_chapter_reactions" ON chapter_reactions;
DROP POLICY IF EXISTS "delete_chapter_reactions" ON chapter_reactions;
CREATE POLICY "insert_chapter_reactions" ON chapter_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_chapter_reactions" ON chapter_reactions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_chapter_reactions" ON chapter_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- chapter_unlocks (user_id TEXT)
DROP POLICY IF EXISTS "insert_chapter_unlocks" ON chapter_unlocks;
DROP POLICY IF EXISTS "update_chapter_unlocks" ON chapter_unlocks;
DROP POLICY IF EXISTS "delete_chapter_unlocks" ON chapter_unlocks;
CREATE POLICY "insert_chapter_unlocks" ON chapter_unlocks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_chapter_unlocks" ON chapter_unlocks FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_chapter_unlocks" ON chapter_unlocks FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- community_discussions (user_id INTEGER → join user_profiles)
DROP POLICY IF EXISTS "insert_community_discussions" ON community_discussions;
DROP POLICY IF EXISTS "update_community_discussions" ON community_discussions;
DROP POLICY IF EXISTS "delete_community_discussions" ON community_discussions;
CREATE POLICY "insert_community_discussions" ON community_discussions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text));
CREATE POLICY "update_community_discussions" ON community_discussions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text));
CREATE POLICY "delete_community_discussions" ON community_discussions FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );

-- discussion_likes (user_id TEXT)
DROP POLICY IF EXISTS "insert_discussion_likes" ON discussion_likes;
DROP POLICY IF EXISTS "update_discussion_likes" ON discussion_likes;
DROP POLICY IF EXISTS "delete_discussion_likes" ON discussion_likes;
CREATE POLICY "insert_discussion_likes" ON discussion_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_discussion_likes" ON discussion_likes FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_discussion_likes" ON discussion_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- discussion_replies (user_id INTEGER → join user_profiles)
DROP POLICY IF EXISTS "insert_discussion_replies" ON discussion_replies;
DROP POLICY IF EXISTS "update_discussion_replies" ON discussion_replies;
DROP POLICY IF EXISTS "delete_discussion_replies" ON discussion_replies;
CREATE POLICY "insert_discussion_replies" ON discussion_replies FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text));
CREATE POLICY "update_discussion_replies" ON discussion_replies FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text));
CREATE POLICY "delete_discussion_replies" ON discussion_replies FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );

-- novel_ratings (user_id TEXT)
DROP POLICY IF EXISTS "insert_novel_ratings" ON novel_ratings;
DROP POLICY IF EXISTS "update_novel_ratings" ON novel_ratings;
DROP POLICY IF EXISTS "delete_novel_ratings" ON novel_ratings;
CREATE POLICY "insert_novel_ratings" ON novel_ratings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_novel_ratings" ON novel_ratings FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_novel_ratings" ON novel_ratings FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- polls (admin-managed)
DROP POLICY IF EXISTS "insert_polls" ON polls;
DROP POLICY IF EXISTS "update_polls" ON polls;
DROP POLICY IF EXISTS "delete_polls" ON polls;
CREATE POLICY "insert_polls" ON polls FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_polls" ON polls FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_polls" ON polls FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- poll_options (admin-managed)
DROP POLICY IF EXISTS "insert_poll_options" ON poll_options;
DROP POLICY IF EXISTS "update_poll_options" ON poll_options;
DROP POLICY IF EXISTS "delete_poll_options" ON poll_options;
CREATE POLICY "insert_poll_options" ON poll_options FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_poll_options" ON poll_options FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_poll_options" ON poll_options FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- poll_votes (user_id TEXT)
DROP POLICY IF EXISTS "insert_poll_votes" ON poll_votes;
DROP POLICY IF EXISTS "update_poll_votes" ON poll_votes;
DROP POLICY IF EXISTS "delete_poll_votes" ON poll_votes;
CREATE POLICY "insert_poll_votes" ON poll_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_poll_votes" ON poll_votes FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_poll_votes" ON poll_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- subscriptions (user_id INTEGER → join user_profiles; also allow admin)
DROP POLICY IF EXISTS "insert_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "update_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "delete_subscriptions" ON subscriptions;
CREATE POLICY "insert_subscriptions" ON subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND auth_user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );
CREATE POLICY "update_subscriptions" ON subscriptions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_subscriptions" ON subscriptions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- subscription_cancellations (user_id TEXT)
DROP POLICY IF EXISTS "insert_subscription_cancellations" ON subscription_cancellations;
DROP POLICY IF EXISTS "update_subscription_cancellations" ON subscription_cancellations;
DROP POLICY IF EXISTS "delete_subscription_cancellations" ON subscription_cancellations;
CREATE POLICY "insert_subscription_cancellations" ON subscription_cancellations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_subscription_cancellations" ON subscription_cancellations FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  )
  WITH CHECK (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );
CREATE POLICY "delete_subscription_cancellations" ON subscription_cancellations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- subscription_notifications (user_id TEXT; admin-writes)
DROP POLICY IF EXISTS "insert_subscription_notifications" ON subscription_notifications;
DROP POLICY IF EXISTS "update_subscription_notifications" ON subscription_notifications;
DROP POLICY IF EXISTS "delete_subscription_notifications" ON subscription_notifications;
CREATE POLICY "insert_subscription_notifications" ON subscription_notifications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_subscription_notifications" ON subscription_notifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_subscription_notifications" ON subscription_notifications FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- scheduled_plan_changes (user_id TEXT)
DROP POLICY IF EXISTS "insert_scheduled_plan_changes" ON scheduled_plan_changes;
DROP POLICY IF EXISTS "update_scheduled_plan_changes" ON scheduled_plan_changes;
DROP POLICY IF EXISTS "delete_scheduled_plan_changes" ON scheduled_plan_changes;
CREATE POLICY "insert_scheduled_plan_changes" ON scheduled_plan_changes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );
CREATE POLICY "update_scheduled_plan_changes" ON scheduled_plan_changes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_scheduled_plan_changes" ON scheduled_plan_changes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- refunds (user_id INTEGER → join user_profiles; admin-managed)
DROP POLICY IF EXISTS "insert_refunds" ON refunds;
DROP POLICY IF EXISTS "update_refunds" ON refunds;
DROP POLICY IF EXISTS "delete_refunds" ON refunds;
CREATE POLICY "insert_refunds" ON refunds FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_refunds" ON refunds FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_refunds" ON refunds FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- payment_charges (admin-managed)
DROP POLICY IF EXISTS "insert_payment_charges" ON payment_charges;
DROP POLICY IF EXISTS "update_payment_charges" ON payment_charges;
DROP POLICY IF EXISTS "delete_payment_charges" ON payment_charges;
CREATE POLICY "insert_payment_charges" ON payment_charges FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_payment_charges" ON payment_charges FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_payment_charges" ON payment_charges FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- family_plans (owner_user_id TEXT)
DROP POLICY IF EXISTS "insert_family_plans" ON family_plans;
DROP POLICY IF EXISTS "update_family_plans" ON family_plans;
DROP POLICY IF EXISTS "delete_family_plans" ON family_plans;
CREATE POLICY "insert_family_plans" ON family_plans FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid()::text);
CREATE POLICY "update_family_plans" ON family_plans FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid()::text)
  WITH CHECK (owner_user_id = auth.uid()::text);
CREATE POLICY "delete_family_plans" ON family_plans FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid()::text);

-- family_plan_members (user_id TEXT; plan owner can also manage)
DROP POLICY IF EXISTS "insert_family_plan_members" ON family_plan_members;
DROP POLICY IF EXISTS "update_family_plan_members" ON family_plan_members;
DROP POLICY IF EXISTS "delete_family_plan_members" ON family_plan_members;
CREATE POLICY "insert_family_plan_members" ON family_plan_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM family_plans WHERE id = family_plan_id AND owner_user_id = auth.uid()::text)
  );
CREATE POLICY "update_family_plan_members" ON family_plan_members FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM family_plans WHERE id = family_plan_id AND owner_user_id = auth.uid()::text)
  )
  WITH CHECK (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM family_plans WHERE id = family_plan_id AND owner_user_id = auth.uid()::text)
  );
CREATE POLICY "delete_family_plan_members" ON family_plan_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM family_plans WHERE id = family_plan_id AND owner_user_id = auth.uid()::text)
  );

-- referrals (referrer_user_id or referred_user_id TEXT)
DROP POLICY IF EXISTS "insert_referrals" ON referrals;
DROP POLICY IF EXISTS "update_referrals" ON referrals;
DROP POLICY IF EXISTS "delete_referrals" ON referrals;
CREATE POLICY "insert_referrals" ON referrals FOR INSERT TO authenticated
  WITH CHECK (referrer_user_id = auth.uid()::text OR referred_user_id = auth.uid()::text);
CREATE POLICY "update_referrals" ON referrals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_referrals" ON referrals FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- referral_clicks (referrer_user_id TEXT; public insert stays open for anon)
DROP POLICY IF EXISTS "insert_referral_clicks" ON referral_clicks;
DROP POLICY IF EXISTS "update_referral_clicks" ON referral_clicks;
DROP POLICY IF EXISTS "delete_referral_clicks" ON referral_clicks;
CREATE POLICY "insert_referral_clicks" ON referral_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "update_referral_clicks" ON referral_clicks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_referral_clicks" ON referral_clicks FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- referral_rewards (user_id TEXT)
DROP POLICY IF EXISTS "insert_referral_rewards" ON referral_rewards;
DROP POLICY IF EXISTS "update_referral_rewards" ON referral_rewards;
DROP POLICY IF EXISTS "delete_referral_rewards" ON referral_rewards;
CREATE POLICY "insert_referral_rewards" ON referral_rewards FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_referral_rewards" ON referral_rewards FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  )
  WITH CHECK (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );
CREATE POLICY "delete_referral_rewards" ON referral_rewards FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- user_badges (user_id TEXT; admin awards badges)
DROP POLICY IF EXISTS "insert_user_badges" ON user_badges;
DROP POLICY IF EXISTS "update_user_badges" ON user_badges;
DROP POLICY IF EXISTS "delete_user_badges" ON user_badges;
CREATE POLICY "insert_user_badges" ON user_badges FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_user_badges" ON user_badges FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_user_badges" ON user_badges FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- user_coins (user_id TEXT)
DROP POLICY IF EXISTS "insert_user_coins" ON user_coins;
DROP POLICY IF EXISTS "update_user_coins" ON user_coins;
DROP POLICY IF EXISTS "delete_user_coins" ON user_coins;
CREATE POLICY "insert_user_coins" ON user_coins FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );
CREATE POLICY "update_user_coins" ON user_coins FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  )
  WITH CHECK (
    user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );
CREATE POLICY "delete_user_coins" ON user_coins FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- coin_transactions (user_id TEXT; admin-managed ledger)
DROP POLICY IF EXISTS "insert_coin_transactions" ON coin_transactions;
DROP POLICY IF EXISTS "update_coin_transactions" ON coin_transactions;
DROP POLICY IF EXISTS "delete_coin_transactions" ON coin_transactions;
CREATE POLICY "insert_coin_transactions" ON coin_transactions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_coin_transactions" ON coin_transactions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_coin_transactions" ON coin_transactions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- gift_subscriptions (purchaser_user_id TEXT)
DROP POLICY IF EXISTS "insert_gift_subscriptions" ON gift_subscriptions;
DROP POLICY IF EXISTS "update_gift_subscriptions" ON gift_subscriptions;
DROP POLICY IF EXISTS "delete_gift_subscriptions" ON gift_subscriptions;
CREATE POLICY "insert_gift_subscriptions" ON gift_subscriptions FOR INSERT TO authenticated
  WITH CHECK (purchaser_user_id = auth.uid()::text);
CREATE POLICY "update_gift_subscriptions" ON gift_subscriptions FOR UPDATE TO authenticated
  USING (
    purchaser_user_id = auth.uid()::text
    OR recipient_user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  )
  WITH CHECK (
    purchaser_user_id = auth.uid()::text
    OR recipient_user_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );
CREATE POLICY "delete_gift_subscriptions" ON gift_subscriptions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- events (admin-managed)
DROP POLICY IF EXISTS "insert_events" ON events;
DROP POLICY IF EXISTS "update_events" ON events;
DROP POLICY IF EXISTS "delete_events" ON events;
CREATE POLICY "insert_events" ON events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_events" ON events FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_events" ON events FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- event_reminders (user_id TEXT)
DROP POLICY IF EXISTS "insert_event_reminders" ON event_reminders;
DROP POLICY IF EXISTS "update_event_reminders" ON event_reminders;
DROP POLICY IF EXISTS "delete_event_reminders" ON event_reminders;
CREATE POLICY "insert_event_reminders" ON event_reminders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "update_event_reminders" ON event_reminders FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "delete_event_reminders" ON event_reminders FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- competition_submissions (user_id TEXT; anon INSERT stays open)
DROP POLICY IF EXISTS "insert_competition_submissions" ON competition_submissions;
DROP POLICY IF EXISTS "update_competition_submissions" ON competition_submissions;
DROP POLICY IF EXISTS "delete_competition_submissions" ON competition_submissions;
CREATE POLICY "insert_competition_submissions" ON competition_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "update_competition_submissions" ON competition_submissions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_competition_submissions" ON competition_submissions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- submission_scores (judge_user_id TEXT; admin/judge access)
DROP POLICY IF EXISTS "insert_submission_scores" ON submission_scores;
DROP POLICY IF EXISTS "update_submission_scores" ON submission_scores;
DROP POLICY IF EXISTS "delete_submission_scores" ON submission_scores;
CREATE POLICY "insert_submission_scores" ON submission_scores FOR INSERT TO authenticated
  WITH CHECK (
    judge_user_id = auth.uid()::text
    AND EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1)
  );
CREATE POLICY "update_submission_scores" ON submission_scores FOR UPDATE TO authenticated
  USING (judge_user_id = auth.uid()::text AND EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (judge_user_id = auth.uid()::text AND EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_submission_scores" ON submission_scores FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- early_access_emails (no user_id; anon INSERT; admin manages)
DROP POLICY IF EXISTS "insert_early_access_emails" ON early_access_emails;
DROP POLICY IF EXISTS "update_early_access_emails" ON early_access_emails;
DROP POLICY IF EXISTS "delete_early_access_emails" ON early_access_emails;
CREATE POLICY "insert_early_access_emails" ON early_access_emails FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "update_early_access_emails" ON early_access_emails FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_early_access_emails" ON early_access_emails FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- writer_waitlist (no user_id; anon INSERT; admin manages)
DROP POLICY IF EXISTS "insert_writer_waitlist" ON writer_waitlist;
DROP POLICY IF EXISTS "update_writer_waitlist" ON writer_waitlist;
DROP POLICY IF EXISTS "delete_writer_waitlist" ON writer_waitlist;
CREATE POLICY "insert_writer_waitlist" ON writer_waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "update_writer_waitlist" ON writer_waitlist FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_writer_waitlist" ON writer_waitlist FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- launch_waitlist (no user_id; anon INSERT; admin manages)
DROP POLICY IF EXISTS "insert_launch_waitlist" ON launch_waitlist;
DROP POLICY IF EXISTS "update_launch_waitlist" ON launch_waitlist;
DROP POLICY IF EXISTS "delete_launch_waitlist" ON launch_waitlist;
CREATE POLICY "insert_launch_waitlist" ON launch_waitlist FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "update_launch_waitlist" ON launch_waitlist FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_launch_waitlist" ON launch_waitlist FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- app_settings (admin-managed)
DROP POLICY IF EXISTS "insert_app_settings" ON app_settings;
DROP POLICY IF EXISTS "update_app_settings" ON app_settings;
DROP POLICY IF EXISTS "delete_app_settings" ON app_settings;
CREATE POLICY "insert_app_settings" ON app_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_app_settings" ON app_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_app_settings" ON app_settings FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));

-- birthday_notifications (user_id TEXT; admin-managed)
DROP POLICY IF EXISTS "insert_birthday_notifications" ON birthday_notifications;
DROP POLICY IF EXISTS "update_birthday_notifications" ON birthday_notifications;
DROP POLICY IF EXISTS "delete_birthday_notifications" ON birthday_notifications;
CREATE POLICY "insert_birthday_notifications" ON birthday_notifications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "update_birthday_notifications" ON birthday_notifications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
CREATE POLICY "delete_birthday_notifications" ON birthday_notifications FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid()::text AND is_admin = 1));
