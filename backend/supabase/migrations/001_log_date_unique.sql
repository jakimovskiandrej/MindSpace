alter table daily_logs drop constraint if exists daily_logs_user_id_created_at_key;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'daily_logs' and column_name = 'log_date'
  ) then
    alter table daily_logs
      add column log_date date
      generated always as ( (created_at at time zone 'utc')::date ) stored;
  end if;
end;
$$;

delete from daily_logs
where id in (
  select id from (
    select id,
           row_number() over (partition by user_id, (created_at at time zone 'utc')::date
                              order by created_at desc) as rn
    from daily_logs
  ) ranked
  where rn > 1
);

alter table daily_logs drop constraint if exists daily_logs_user_id_log_date_key;
alter table daily_logs add constraint daily_logs_user_id_log_date_key unique (user_id, log_date);
