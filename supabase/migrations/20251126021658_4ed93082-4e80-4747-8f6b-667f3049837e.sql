-- Drop existing triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS on_article_published_update_learning_paths ON public.articles;
DROP TRIGGER IF EXISTS on_web3_article_published_regenerate_sitemap ON public.articles;
DROP TRIGGER IF EXISTS on_article_published_notify_search_engines ON public.articles;
DROP TRIGGER IF EXISTS on_article_published_send_onesignal ON public.articles;
DROP TRIGGER IF EXISTS on_article_published_send_newsletter ON public.articles;

-- Create trigger for learning path auto-updates on article publish
CREATE TRIGGER on_article_published_update_learning_paths
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_learning_path_update();

-- Create trigger for Web3 sitemap regeneration on Web3 article publish
CREATE TRIGGER on_web3_article_published_regenerate_sitemap
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_web3_sitemap_regeneration();

-- Create trigger for search engine notification on article publish
CREATE TRIGGER on_article_published_notify_search_engines
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_search_engine_notification();

-- Create trigger for OneSignal push notification on article publish
CREATE TRIGGER on_article_published_send_onesignal
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_onesignal_notification();

-- Create trigger for newsletter on article publish
CREATE TRIGGER on_article_published_send_newsletter
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_newsletter_on_publish();