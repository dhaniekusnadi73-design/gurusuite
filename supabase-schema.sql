create table if not exists gurusuite_orders (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists gurusuite_orders_created_at_idx
  on gurusuite_orders (created_at desc);
