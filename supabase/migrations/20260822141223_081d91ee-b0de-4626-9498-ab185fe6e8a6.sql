REVOKE ALL ON FUNCTION public.find_circle_duplicates(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.merge_friends(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_circle_duplicates(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_friends(uuid, uuid) TO authenticated;