create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  academic_year text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.classroom_teachers (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  teacher_email text not null,
  role text not null default 'teacher' check (role in ('owner', 'teacher')),
  created_at timestamptz not null default now(),
  primary key (classroom_id, teacher_email)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  number integer not null,
  full_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (classroom_id, number)
);

create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  attendance_date date not null,
  completed boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (classroom_id, attendance_date)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null check (status in ('present', 'late', 'leave', 'absent')),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);

alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_teachers enable row level security;
alter table public.students enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

create or replace function public.is_classroom_teacher(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classroom_teachers ct
    where ct.classroom_id = p_classroom_id
      and (
        ct.teacher_id = auth.uid()
        or lower(ct.teacher_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
$$;

create or replace function public.can_access_teacher_row(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_classroom_teacher(p_classroom_id)
$$;

create or replace function public.current_teacher_classrooms()
returns table(classroom_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select ct.classroom_id
  from public.classroom_teachers ct
  where ct.teacher_id = auth.uid()
     or lower(ct.teacher_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "classrooms_select_assigned" on public.classrooms
  for select to authenticated using (public.is_classroom_teacher(id));

create policy "classrooms_insert_owner" on public.classrooms
  for insert to authenticated with check (owner_id = auth.uid());

create policy "classrooms_update_assigned" on public.classrooms
  for update to authenticated
  using (public.is_classroom_teacher(id))
  with check (public.is_classroom_teacher(id));

create policy "classrooms_delete_owner" on public.classrooms
  for delete to authenticated using (owner_id = auth.uid());

create policy "teachers_select_assigned" on public.classroom_teachers
  for select to authenticated using (public.can_access_teacher_row(classroom_id));

create policy "teachers_insert_owner" on public.classroom_teachers
  for insert to authenticated with check (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.owner_id = auth.uid()
    )
  );

create policy "teachers_delete_owner" on public.classroom_teachers
  for delete to authenticated using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.owner_id = auth.uid()
    )
  );

create policy "students_all_assigned" on public.students
  for all to authenticated
  using (public.is_classroom_teacher(classroom_id))
  with check (public.is_classroom_teacher(classroom_id));

create policy "sessions_all_assigned" on public.attendance_sessions
  for all to authenticated
  using (public.is_classroom_teacher(classroom_id))
  with check (public.is_classroom_teacher(classroom_id));

create policy "records_all_assigned" on public.attendance_records
  for all to authenticated
  using (
    exists (
      select 1
      from public.attendance_sessions s
      where s.id = session_id
        and public.is_classroom_teacher(s.classroom_id)
    )
  )
  with check (
    exists (
      select 1
      from public.attendance_sessions s
      where s.id = session_id
        and public.is_classroom_teacher(s.classroom_id)
    )
  );

create or replace function public.create_classroom_with_owner(
  p_name text,
  p_academic_year text
)
returns public.classrooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_full_name text;
  v_classroom public.classrooms;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if nullif(trim(p_name), '') is null or nullif(trim(p_academic_year), '') is null then
    raise exception 'Classroom name and academic year are required' using errcode = '22023';
  end if;

  select
    lower(coalesce(email, v_email)),
    coalesce(
      raw_user_meta_data ->> 'full_name',
      raw_user_meta_data ->> 'name',
      split_part(coalesce(email, v_email), '@', 1),
      'ครู'
    )
  into v_email, v_full_name
  from auth.users
  where id = v_user_id;

  insert into public.profiles (id, email, full_name)
  values (v_user_id, v_email, coalesce(v_full_name, split_part(v_email, '@', 1), 'ครู'))
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name;

  insert into public.classrooms (name, academic_year, owner_id)
  values (trim(p_name), trim(p_academic_year), v_user_id)
  returning * into v_classroom;

  insert into public.classroom_teachers (classroom_id, teacher_id, teacher_email, role)
  values (v_classroom.id, v_user_id, v_email, 'owner');

  return v_classroom;
end;
$$;

revoke execute on function public.is_classroom_teacher(uuid) from public;
revoke execute on function public.can_access_teacher_row(uuid) from public;
revoke execute on function public.current_teacher_classrooms() from public;
revoke execute on function public.create_classroom_with_owner(text, text) from public;
grant execute on function public.is_classroom_teacher(uuid) to authenticated;
grant execute on function public.can_access_teacher_row(uuid) to authenticated;
grant execute on function public.current_teacher_classrooms() to authenticated;
grant execute on function public.create_classroom_with_owner(text, text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name;

  update public.classroom_teachers
  set teacher_id = new.id
  where lower(teacher_email) = lower(coalesce(new.email, ''))
    and teacher_id is null;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();
