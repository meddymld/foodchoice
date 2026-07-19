create extension if not exists postgis;
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  location geography(Point, 4326),
  price_level integer,
  rating numeric,
  cuisine_type text,
  ambiance_tags text[],
  opening_hours jsonb,
  google_place_id text,
  thefork_id text,
  reservation_available boolean default false,
  source text,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists restaurants_location_idx
  on restaurants using gist(location);

create index if not exists restaurants_cuisine_idx
  on restaurants(cuisine_type);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, restaurant_id)
);

create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  max_budget integer,
  favorite_cuisines text[],
  dietary_preferences text[],
  ambiance_preferences text[],
  default_radius_km integer default 5,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

create table if not exists search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  query text,
  filters jsonb,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone default now()
);

create index if not exists favorites_user_id_idx on favorites(user_id);
create index if not exists user_preferences_user_id_idx on user_preferences(user_id);
create index if not exists search_history_user_id_idx on search_history(user_id);

create or replace function set_restaurant_location()
returns trigger as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location = ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326)::geography;
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists restaurants_set_location on restaurants;
create trigger restaurants_set_location
before insert or update of latitude, longitude on restaurants
for each row execute function set_restaurant_location();

alter table profiles enable row level security;
alter table favorites enable row level security;
alter table user_preferences enable row level security;
alter table search_history enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own"
on profiles for select
using (id = auth.uid());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
on profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "favorites_select_own" on favorites;
create policy "favorites_select_own"
on favorites for select
using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on favorites;
create policy "favorites_insert_own"
on favorites for insert
with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on favorites;
create policy "favorites_delete_own"
on favorites for delete
using (user_id = auth.uid());

drop policy if exists "preferences_select_own" on user_preferences;
create policy "preferences_select_own"
on user_preferences for select
using (user_id = auth.uid());

drop policy if exists "preferences_insert_own" on user_preferences;
create policy "preferences_insert_own"
on user_preferences for insert
with check (user_id = auth.uid());

drop policy if exists "preferences_update_own" on user_preferences;
create policy "preferences_update_own"
on user_preferences for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "search_history_select_own" on search_history;
create policy "search_history_select_own"
on search_history for select
using (user_id = auth.uid());

drop policy if exists "search_history_insert_own" on search_history;
create policy "search_history_insert_own"
on search_history for insert
with check (user_id = auth.uid());

drop policy if exists "search_history_delete_own" on search_history;
create policy "search_history_delete_own"
on search_history for delete
using (user_id = auth.uid());

alter table restaurants enable row level security;

drop policy if exists "restaurants_public_read" on restaurants;
create policy "restaurants_public_read"
on restaurants for select
using (true);
