-- Thread grouping for MessageThread conversation inbox.
alter table public.messages add column if not exists thread_id text;
