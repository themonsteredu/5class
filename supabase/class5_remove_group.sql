-- 3차시: 같은 모둠이 올린 문장은 그 모둠 어느 태블릿에서든 지울 수 있게 합니다.
create or replace function public.class5_remove_group(p_code text, p_id uuid, p_group integer, p_author text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_code text := lower(trim(coalesce(p_code, '')));
begin
  if coalesce(p_author, '') !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('error', '다시 입장해 주세요.');
  end if;
  delete from class5.sentences s using class5.rooms r
    where s.id = p_id and s.room_id = r.id and r.code = v_code
      and (s.author_hash = encode(sha256(convert_to(p_author, 'UTF8')), 'hex')
           or (p_group between 1 and 6 and s.group_no = p_group));
  if not found then
    return jsonb_build_object('error', '우리 모둠이 올린 문장만 지울 수 있어요.');
  end if;
  return jsonb_build_object('removed', true);
end $$;
revoke all on function public.class5_remove_group(text, uuid, integer, text) from public;
grant execute on function public.class5_remove_group(text, uuid, integer, text) to anon, authenticated;
notify pgrst, 'reload schema';
