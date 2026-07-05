-- Enable Supabase Realtime for helpdesk tickets (WhatsApp / n8n INSERT → live dashboard)

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'complaints_and_suggestions'
  ) then
    alter publication supabase_realtime add table complaints_and_suggestions;
  end if;
end $$;
