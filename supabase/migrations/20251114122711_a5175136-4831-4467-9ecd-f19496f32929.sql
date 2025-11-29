-- Create trigger to send OneSignal notifications when articles are published
CREATE TRIGGER trigger_send_onesignal_notification
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_onesignal_notification();