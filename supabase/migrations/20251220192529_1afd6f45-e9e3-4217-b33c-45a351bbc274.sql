-- Create trigger for reactions
CREATE TRIGGER on_post_reaction_created
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_reaction();

-- Create trigger for comments
CREATE TRIGGER on_post_comment_created
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();