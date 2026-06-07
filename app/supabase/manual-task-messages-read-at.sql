-- Track read state for inbound message notifications in the bell badge and panel.
alter table public.messages add column if not exists read_at timestamptz;
