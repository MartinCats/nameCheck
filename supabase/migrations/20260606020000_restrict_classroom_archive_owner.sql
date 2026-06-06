create or replace function public.ensure_classroom_archive_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.archived_at is distinct from old.archived_at and old.owner_id <> auth.uid() then
    raise exception 'Only the classroom owner can archive or restore this classroom' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_classroom_archive_owner_trigger on public.classrooms;

create trigger ensure_classroom_archive_owner_trigger
  before update of archived_at on public.classrooms
  for each row
  execute function public.ensure_classroom_archive_owner();

revoke execute on function public.ensure_classroom_archive_owner() from public;
