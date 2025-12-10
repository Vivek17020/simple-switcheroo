-- Attach trigger for article search engine notification (Google Index Now)
CREATE TRIGGER trigger_article_search_engine_notification
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_search_engine_notification();

-- Attach trigger for web story instant indexing
CREATE TRIGGER trigger_webstory_indexing
  AFTER INSERT OR UPDATE ON public.web_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_webstory_instant_indexing();

-- Attach trigger for video instant indexing
CREATE TRIGGER trigger_video_indexing
  AFTER INSERT OR UPDATE ON public.homepage_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_instant_video_indexing();

-- Attach trigger for web3 article instant indexing
CREATE TRIGGER trigger_web3_article_indexing
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_instant_web3_indexing();

-- Attach trigger for web3 sitemap regeneration
CREATE TRIGGER trigger_web3_sitemap_regen
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_web3_sitemap_regeneration();