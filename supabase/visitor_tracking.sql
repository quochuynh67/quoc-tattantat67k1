-- Run this in Supabase SQL editor to enable visitor counting

-- Initialize visitor count entry
insert into public.site_settings (row_key, value)
values ('visitor_count', '0'::jsonb)
on conflict (row_key) do nothing;

-- Atomically increment visitor count.
-- security definer = runs as owner, bypassing public RLS on site_settings.
create or replace function public.increment_visitor_count()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  update public.site_settings
  set value = (coalesce(value::text, '0')::bigint + 1)::text::jsonb,
      updated_at = now()
  where row_key = 'visitor_count'
  returning value::text::bigint into new_count;

  if new_count is null then
    insert into public.site_settings (row_key, value)
    values ('visitor_count', '1')
    on conflict (row_key) do update
      set value = (coalesce(public.site_settings.value::text, '0')::bigint + 1)::text::jsonb,
          updated_at = now()
    returning value::text::bigint into new_count;
  end if;

  return coalesce(new_count, 0);
end;
$$;

grant execute on function public.increment_visitor_count() to anon;
grant execute on function public.increment_visitor_count() to authenticated;
