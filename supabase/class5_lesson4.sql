-- 4차시: 모둠별 분류와 우리 반 역사 로봇의 지식 카드
create table if not exists class5.sorts(
  room_id uuid not null references class5.rooms(id) on delete cascade,
  group_no integer not null check (group_no between 1 and 6),
  criterion text not null default '' check (char_length(criterion) <= 100),
  bins jsonb not null default '[]'::jsonb check (jsonb_typeof(bins) = 'array' and octet_length(bins::text) <= 6000),
  updated_at timestamptz not null default now(),
  primary key (room_id, group_no)
);
create table if not exists class5.cards(
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references class5.rooms(id) on delete cascade,
  group_no integer not null check (group_no between 0 and 6),
  artifact text not null default '' check (artifact = '' or artifact ~ '^[a-z-]{2,20}$'),
  nation text not null check (nation in ('고구려','백제','신라','가야')),
  material text not null default '' check (char_length(material) <= 20),
  use_text text not null default '' check (char_length(use_text) <= 80),
  feature text not null default '' check (char_length(feature) <= 200),
  author_hash text not null check (author_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now()
);
create index if not exists cards_room_idx on class5.cards(room_id, created_at);
alter table class5.sorts enable row level security;
alter table class5.cards enable row level security;
revoke all on all tables in schema class5 from public, anon, authenticated;

create or replace function public.class5_room(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_code text := lower(trim(coalesce(p_code, ''))); v_room uuid;
begin
  if v_code !~ '^[a-z0-9]{4,12}$' then return null; end if;
  insert into class5.rooms(code) values (v_code) on conflict (code) do nothing;
  select id into v_room from class5.rooms where code = v_code;
  return v_room;
end $$;
revoke all on function public.class5_room(text) from public, anon, authenticated;

create or replace function public.class5_sort_save(p_code text, p_group integer, p_criterion text, p_bins jsonb, p_author text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room uuid; v_bin jsonb; v_item jsonb;
begin
  if p_group is null or p_group not between 1 and 6 then return jsonb_build_object('error', '1~6모둠 중 우리 모둠으로 입장해 주세요.'); end if;
  if coalesce(p_author, '') !~ '^[a-f0-9]{64}$' then return jsonb_build_object('error', '다시 입장해 주세요.'); end if;
  if char_length(trim(coalesce(p_criterion, ''))) not between 1 and 100 then return jsonb_build_object('error', '우리 기준을 100자 안으로 적어 주세요.'); end if;
  if jsonb_typeof(p_bins) is distinct from 'array' or jsonb_array_length(p_bins) not between 1 and 8 then return jsonb_build_object('error', '묶음을 1~8개 만들어 주세요.'); end if;
  for v_bin in select value from jsonb_array_elements(p_bins) loop
    if jsonb_typeof(v_bin->'name') is distinct from 'string' or char_length(trim(v_bin->>'name')) not between 1 and 20
       or jsonb_typeof(v_bin->'items') is distinct from 'array' or jsonb_array_length(v_bin->'items') > 20 then
      return jsonb_build_object('error', '묶음 이름은 20자 안으로 적어 주세요.');
    end if;
    for v_item in select value from jsonb_array_elements(v_bin->'items') loop
      if jsonb_typeof(v_item) is distinct from 'string' or v_item #>> '{}' !~ '^[a-z-]{2,20}$' then return jsonb_build_object('error', '유물 카드를 다시 골라 주세요.'); end if;
    end loop;
  end loop;
  v_room := public.class5_room(p_code);
  if v_room is null then return jsonb_build_object('error', '수업코드는 숫자 4~12자리로 입력해 주세요.'); end if;
  insert into class5.sorts(room_id, group_no, criterion, bins) values (v_room, p_group, trim(p_criterion), p_bins)
    on conflict (room_id, group_no) do update set criterion = excluded.criterion, bins = excluded.bins, updated_at = now();
  return jsonb_build_object('saved', true);
end $$;

create or replace function public.class5_sort_list(p_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_code text := lower(trim(coalesce(p_code, '')));
begin
  if v_code !~ '^[a-z0-9]{4,12}$' then return jsonb_build_object('error', '수업코드는 숫자 4~12자리로 입력해 주세요.'); end if;
  return jsonb_build_object('sorts', coalesce((select jsonb_agg(jsonb_build_object('group', s.group_no, 'criterion', s.criterion, 'bins', s.bins) order by s.group_no)
    from class5.sorts s join class5.rooms r on r.id = s.room_id where r.code = v_code), '[]'::jsonb));
end $$;

create or replace function public.class5_card_add(p_code text, p_group integer, p_artifact text, p_nation text,
  p_material text, p_use text, p_feature text, p_author text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_room uuid; v_id uuid;
  v_artifact text := trim(coalesce(p_artifact, '')); v_material text := trim(coalesce(p_material, ''));
  v_use text := trim(coalesce(p_use, '')); v_feature text := trim(coalesce(p_feature, ''));
begin
  if p_group is null or p_group not between 0 and 6 then return jsonb_build_object('error', '다시 입장해 주세요.'); end if;
  if coalesce(p_author, '') !~ '^[a-f0-9]{64}$' then return jsonb_build_object('error', '다시 입장해 주세요.'); end if;
  if v_artifact <> '' and v_artifact !~ '^[a-z-]{2,20}$' then return jsonb_build_object('error', '유물을 다시 골라 주세요.'); end if;
  if coalesce(p_nation, '') not in ('고구려','백제','신라','가야') then return jsonb_build_object('error', '나라를 골라 주세요.'); end if;
  if v_material = '' and v_use = '' and v_feature = '' then return jsonb_build_object('error', '재료·쓰임·특징 중 하나는 가르쳐 주세요.'); end if;
  if char_length(v_material) > 20 or char_length(v_use) > 80 or char_length(v_feature) > 200 then return jsonb_build_object('error', '쓰임은 80자, 특징은 200자 안으로 적어 주세요.'); end if;
  v_room := public.class5_room(p_code);
  if v_room is null then return jsonb_build_object('error', '수업코드는 숫자 4~12자리로 입력해 주세요.'); end if;
  perform 1 from class5.rooms where id = v_room for update;
  if (select count(*) from class5.cards where room_id = v_room) >= 300 then return jsonb_build_object('error', '로봇 카드가 가득 찼어요. 선생님께 알려 주세요.'); end if;
  if (select count(*) from class5.cards where room_id = v_room and group_no = p_group) >= 50 then return jsonb_build_object('error', '한 모둠은 카드 50장까지 가르칠 수 있어요.'); end if;
  insert into class5.cards(room_id, group_no, artifact, nation, material, use_text, feature, author_hash)
    values (v_room, p_group, v_artifact, p_nation, v_material, v_use, v_feature, encode(sha256(convert_to(p_author, 'UTF8')), 'hex'))
    returning id into v_id;
  return jsonb_build_object('saved', true, 'id', v_id);
end $$;

create or replace function public.class5_card_list(p_code text, p_author text default '')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_code text := lower(trim(coalesce(p_code, ''))); v_hash text := '';
begin
  if v_code !~ '^[a-z0-9]{4,12}$' then return jsonb_build_object('error', '수업코드는 숫자 4~12자리로 입력해 주세요.'); end if;
  if coalesce(p_author, '') ~ '^[a-f0-9]{64}$' then v_hash := encode(sha256(convert_to(p_author, 'UTF8')), 'hex'); end if;
  return jsonb_build_object('cards', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'group', c.group_no, 'artifact', c.artifact,
      'nation', c.nation, 'material', c.material, 'use', c.use_text, 'feature', c.feature, 'mine', c.author_hash = v_hash) order by c.created_at)
    from class5.cards c join class5.rooms r on r.id = c.room_id where r.code = v_code), '[]'::jsonb));
end $$;

create or replace function public.class5_card_remove(p_code text, p_id uuid, p_author text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_code text := lower(trim(coalesce(p_code, '')));
begin
  if coalesce(p_author, '') !~ '^[a-f0-9]{64}$' then return jsonb_build_object('error', '내가 가르친 카드만 지울 수 있어요.'); end if;
  delete from class5.cards c using class5.rooms r
    where c.id = p_id and c.room_id = r.id and r.code = v_code and c.author_hash = encode(sha256(convert_to(p_author, 'UTF8')), 'hex');
  if not found then return jsonb_build_object('error', '내가 가르친 카드만 지울 수 있어요.'); end if;
  return jsonb_build_object('removed', true);
end $$;

revoke all on function public.class5_sort_save(text, integer, text, jsonb, text) from public;
revoke all on function public.class5_sort_list(text) from public;
revoke all on function public.class5_card_add(text, integer, text, text, text, text, text, text) from public;
revoke all on function public.class5_card_list(text, text) from public;
revoke all on function public.class5_card_remove(text, uuid, text) from public;
grant execute on function public.class5_sort_save(text, integer, text, jsonb, text) to anon, authenticated;
grant execute on function public.class5_sort_list(text) to anon, authenticated;
grant execute on function public.class5_card_add(text, integer, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.class5_card_list(text, text) to anon, authenticated;
grant execute on function public.class5_card_remove(text, uuid, text) to anon, authenticated;
notify pgrst, 'reload schema';
