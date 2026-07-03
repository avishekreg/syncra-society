-- Society onboarding & legacy migration columns

alter table if exists societies
  add column if not exists total_flats integer,
  add column if not exists opening_bank_balance numeric(14,2) default 0;

alter table if exists user_and_flats
  add column if not exists opening_outstanding_balance numeric(14,2) default 0,
  add column if not exists role text default 'resident';

create index if not exists idx_user_and_flats_user_id on user_and_flats(user_id);
create index if not exists idx_complaints_user on complaints_and_suggestions(raised_by_user_id);
