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

drop policy if exists "classrooms_select_assigned" on public.classrooms;
drop policy if exists "classrooms_update_assigned" on public.classrooms;
drop policy if exists "teachers_select_assigned" on public.classroom_teachers;
drop policy if exists "students_all_assigned" on public.students;
drop policy if exists "sessions_all_assigned" on public.attendance_sessions;
drop policy if exists "records_all_assigned" on public.attendance_records;

create policy "classrooms_select_assigned" on public.classrooms
  for select to authenticated using (public.is_classroom_teacher(id));

create policy "classrooms_update_assigned" on public.classrooms
  for update to authenticated
  using (public.is_classroom_teacher(id))
  with check (public.is_classroom_teacher(id));

create policy "teachers_select_assigned" on public.classroom_teachers
  for select to authenticated using (public.can_access_teacher_row(classroom_id));

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
