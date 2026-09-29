-- Private storage bucket for the nightly backup export (see
-- src/app/api/cron/backup/route.ts). Not public: only the service role
-- (which bypasses RLS/storage policies entirely) ever touches it, so no
-- policies are needed here. Run this only in the Production project —
-- the nightly backup targets Production's data, not Test's.
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;
