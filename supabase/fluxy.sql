-- Estadísticas de Fluxy: descargas (web), instalaciones y aperturas (apps). Sin IPs: solo la ubicación aproximada que da Cloudflare.
create table if not exists public.fluxy_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  app text not null check (app in ('flux', 'captly', 'micly', 'cutlify')),
  kind text not null check (kind in ('download', 'install', 'open', 'donate')),
  version text,
  country text,
  region text,
  city text,
  lat real,
  lon real,
  os text,
  referrer text,
  install_id text
);
create index if not exists fluxy_events_app_time on public.fluxy_events (app, created_at);
create index if not exists fluxy_events_kind_time on public.fluxy_events (kind, created_at);

-- La tabla no se lee ni se escribe directamente: solo con las dos funciones de abajo.
alter table public.fluxy_events enable row level security;
revoke all on public.fluxy_events from anon, authenticated;

create or replace function public.fluxy_track(
  p_app text, p_kind text, p_version text default null, p_country text default null, p_region text default null,
  p_city text default null, p_lat real default null, p_lon real default null, p_os text default null,
  p_referrer text default null, p_install_id text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_app not in ('flux', 'captly', 'micly', 'cutlify') or p_kind not in ('download', 'install', 'open', 'donate') then
    raise exception 'evento no válido';
  end if;
  insert into fluxy_events (app, kind, version, country, region, city, lat, lon, os, referrer, install_id)
  values (p_app, p_kind, left(p_version, 32), upper(left(p_country, 2)), left(p_region, 80), left(p_city, 80),
          case when p_lat between -90 and 90 then p_lat end, case when p_lon between -180 and 180 then p_lon end,
          left(p_os, 40), left(p_referrer, 200), left(p_install_id, 64));
end $$;

-- Resumen para el programa de estadísticas. p_app null = todos los programas.
create or replace function public.fluxy_stats(p_app text default null, p_days int default 30)
returns jsonb
language sql stable security definer set search_path = public as $$
  with e as (
    select * from fluxy_events where (p_app is null or app = p_app)
  ), p as (
    select * from e where created_at >= now() - make_interval(days => greatest(1, least(p_days, 3650)))
  )
  select jsonb_build_object(
    'generated_at', now(),
    'days', p_days,
    'totals', (select jsonb_build_object(
        'downloads', count(*) filter (where kind = 'download'),
        'installs', count(*) filter (where kind = 'install'),
        'opens', count(*) filter (where kind = 'open'),
        'donates', count(*) filter (where kind = 'donate'),
        'users', count(distinct install_id) filter (where kind in ('install', 'open')),
        'countries', count(distinct country)) from e),
    'period', (select jsonb_build_object(
        'downloads', count(*) filter (where kind = 'download'),
        'installs', count(*) filter (where kind = 'install'),
        'opens', count(*) filter (where kind = 'open'),
        'donates', count(*) filter (where kind = 'donate'),
        'users', count(distinct install_id) filter (where kind in ('install', 'open')),
        'active_7d', count(distinct install_id) filter (where kind = 'open' and created_at >= now() - interval '7 days'),
        'countries', count(distinct country)) from p),
    'by_country', coalesce((select jsonb_agg(x order by x.downloads + x.installs desc) from (
        select country,
               count(*) filter (where kind = 'download') as downloads,
               count(*) filter (where kind = 'install') as installs,
               count(*) filter (where kind = 'open') as opens,
               count(distinct install_id) filter (where kind in ('install', 'open')) as users
        from p where country is not null group by country) x), '[]'),
    'by_city', coalesce((select jsonb_agg(x order by x.total desc) from (
        select country, city, avg(lat) as lat, avg(lon) as lon, count(*) as total,
               count(*) filter (where kind = 'download') as downloads,
               count(*) filter (where kind = 'install') as installs
        from p where city is not null and lat is not null group by country, city order by count(*) desc limit 60) x), '[]'),
    'daily', coalesce((select jsonb_agg(x order by x.day) from (
        select date_trunc('day', created_at)::date as day,
               count(*) filter (where kind = 'download') as downloads,
               count(*) filter (where kind = 'install') as installs,
               count(*) filter (where kind = 'open') as opens
        from p group by 1) x), '[]'),
    'hours', coalesce((select jsonb_agg(x order by x.hour) from (
        select extract(hour from created_at)::int as hour, count(*) as total from p group by 1) x), '[]'),
    'versions', coalesce((select jsonb_agg(x order by x.total desc) from (
        select coalesce(version, '?') as version, count(*) as total from p where kind in ('install', 'open') group by 1 limit 12) x), '[]'),
    'os', coalesce((select jsonb_agg(x order by x.total desc) from (
        select coalesce(os, '?') as os, count(*) as total from p group by 1 limit 8) x), '[]'),
    'referrers', coalesce((select jsonb_agg(x order by x.total desc) from (
        select coalesce(nullif(referrer, ''), 'directo') as referrer, count(*) as total from p where kind = 'download' group by 1 limit 10) x), '[]'),
    'apps', coalesce((select jsonb_agg(x order by x.downloads desc) from (
        select app,
               count(*) filter (where kind = 'download') as downloads,
               count(*) filter (where kind = 'install') as installs,
               count(*) filter (where kind = 'open') as opens,
               count(distinct install_id) filter (where kind in ('install', 'open')) as users
        from fluxy_events where created_at >= now() - make_interval(days => greatest(1, least(p_days, 3650))) group by app) x), '[]')
  )
$$;

revoke all on function public.fluxy_track(text, text, text, text, text, text, real, real, text, text, text) from public;
revoke all on function public.fluxy_stats(text, int) from public;
grant execute on function public.fluxy_track(text, text, text, text, text, text, real, real, text, text, text) to anon;
grant execute on function public.fluxy_stats(text, int) to anon;
