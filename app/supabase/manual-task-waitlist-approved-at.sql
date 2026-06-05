-- Waitlist admin: track approved outreach and allow admin read/update from the app.
alter table public.waitlist add column if not exists approved_at timestamptz;

alter table public.waitlist enable row level security;

drop policy if exists "Admin can read waitlist" on public.waitlist;
create policy "Admin can read waitlist"
  on public.waitlist
  for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'sumithproductive@gmail.com');

drop policy if exists "Admin can update waitlist" on public.waitlist;
create policy "Admin can update waitlist"
  on public.waitlist
  for update
  to authenticated
  using (auth.jwt() ->> 'email' = 'sumithproductive@gmail.com')
  with check (auth.jwt() ->> 'email' = 'sumithproductive@gmail.com');
