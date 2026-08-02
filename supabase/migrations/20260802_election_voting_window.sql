-- Voting window + scheduled result reveal configuration
-- Decoupled naming views: votes_log (who voted) vs ballot_data (anonymous choices)

alter table public.society_elections
  add column if not exists voting_duration_hours numeric,
  add column if not exists result_reveal_delay_hours numeric not null default 0,
  add column if not exists results_reveal_at timestamptz;

comment on column public.society_elections.voting_duration_hours is
  'Configured voting window length in hours (e.g. 12, 24, 48). Used with opened_at to derive closes_at.';
comment on column public.society_elections.result_reveal_delay_hours is
  'Hours after voting close before results may be revealed. 0 = immediately on close.';
comment on column public.society_elections.results_reveal_at is
  'Scheduled timestamp when results become visible (RESULT_PUBLISHED / auto-publish).';

-- Public-facing aliases matching product vocabulary (no flat→candidate join possible).
create or replace view public.votes_log as
  select
    id,
    election_id,
    society_id,
    position_id,
    flat_id,
    seal_hash,
    cast_at
  from public.election_participation_seals;

create or replace view public.ballot_data as
  select
    id,
    election_id,
    society_id,
    position_id,
    encrypted_choice,
    cast_at
  from public.election_anonymous_ballots;

grant select on public.votes_log to anon, authenticated, service_role;
grant select on public.ballot_data to anon, authenticated, service_role;
