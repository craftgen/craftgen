--> statement-breakpoint
-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger as $$
declare 
  new_username text;
  counter int := 0;
  new_project_id uuid;
begin
  new_username := split_part(new.email, '@', 1);
  new_username := lower(regexp_replace(new_username, '[^a-zA-Z0-9]+', '-', 'g'));
  new_username := regexp_replace(new_username, '-{2,}', '-', 'g');
  new_username := regexp_replace(new_username, '(^-|-$)', '', 'g');
  
  while exists(select 1 from public.user where username = new_username) loop
    counter := counter + 1;
    new_username := split_part(new.email, '@', 1) || '_' || counter;
  end loop;

  insert into public.user (id, email, username, full_name, avatar_url)
  values (new.id, new.email, new_username, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  new_project_id := gen_random_uuid();

  insert into public.project (id, name, slug, personal)
  values (new_project_id, new_username, new_username, true);

  insert into public.project_members (id, project_id, user_id, member_role)
  values (gen_random_uuid(), new_project_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

