-- Drop all old/duplicate triggers
DROP TRIGGER IF EXISTS on_article_publish_notify_search_engines ON public.articles;
DROP TRIGGER IF EXISTS on_article_published_notify_search ON public.articles;
DROP TRIGGER IF EXISTS trigger_search_engine_notification_on_publish ON public.articles;
DROP TRIGGER IF EXISTS on_article_publish_onesignal ON public.articles;
DROP TRIGGER IF EXISTS trigger_send_onesignal_notification ON public.articles;
DROP TRIGGER IF EXISTS newsletter_digest_trigger ON public.articles;
DROP TRIGGER IF EXISTS trigger_newsletter_on_article_publish ON public.articles;
DROP TRIGGER IF EXISTS auto_update_learning_paths ON public.articles;
DROP TRIGGER IF EXISTS trigger_web3_sitemap_on_article_publish ON public.articles;

-- Keep only the standardized triggers we created:
-- - on_article_published_update_learning_paths
-- - on_web3_article_published_regenerate_sitemap
-- - on_article_published_notify_search_engines
-- - on_article_published_send_onesignal
-- - on_article_published_send_newsletter