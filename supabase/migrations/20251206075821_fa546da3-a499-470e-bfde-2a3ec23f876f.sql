-- Create trigger to automatically regenerate Web3 sitemap when Web3 articles are published
CREATE OR REPLACE TRIGGER trigger_web3_sitemap_on_article_publish
AFTER INSERT OR UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_web3_sitemap_regeneration();

-- Also create trigger for instant Web3 article indexing
CREATE OR REPLACE TRIGGER trigger_web3_instant_indexing
AFTER INSERT OR UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_instant_web3_indexing();