# Setup a Fresh Supabase Project

This rebuild must use a new Supabase project.

Do not reuse older Name Checked / Name-Checked Supabase projects. Older projects may contain schema drift from previous app versions, such as:

- `classrooms.created_by` instead of `classrooms.owner_id`
- `students.student_no` / `students.status` instead of `students.number` / `students.active`
- older `classroom_teachers` structure
- conflicting RLS helper functions and policies

Treat old Supabase projects as archived legacy data until a separate data migration plan exists.

## 1. Create a New Project

Create a new Supabase project for this app rebuild.

Recommended settings:

- Project name: `Name Checked Rebuild`
- Region: `ap-southeast-1`
- Database password: store securely

Do not run compatibility migrations against old projects.

## 2. Configure Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_NEW_PROJECT_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Use the fresh project's API URL and enabled publishable/anon key only.

Never put the Supabase service role key in `.env.local` or any browser-exposed variable.

For LAN testing from an iPhone, use the computer's LAN address:

```env
NEXT_PUBLIC_SITE_URL=http://192.168.1.116:3000
```

Start the dev server so the phone can reach it:

```bash
npm run dev -- --hostname 0.0.0.0
```

The local LAN origin must also be listed in `allowedDevOrigins` in `next.config.ts`. This repo allows common LAN ranges and `192.168.*.*` for local device testing.

## 3. Run Migrations

For a fresh project, run all repo migrations in order:

1. `supabase/migrations/20260531000000_initial_schema.sql`
2. `supabase/migrations/20260531010000_fix_classroom_creation_rls.sql`

The second migration is safe to run after the initial schema and ensures the classroom creation RPC/RLS fix is present.

Do not run these migrations on the old drifted database.

## 4. Configure Google OAuth

In the fresh Supabase project dashboard:

1. Go to Authentication.
2. Enable Google provider.
3. Add your Google OAuth client ID and secret.
4. Set the app/site URL for local development. For desktop-only local testing:

```text
http://localhost:3000
```

For iPhone LAN testing, temporarily use:

```text
http://192.168.1.116:3000
```

5. Add redirect URLs:

```text
http://localhost:3000/auth/callback
http://192.168.1.116:3000/auth/callback
```

6. In Google Cloud Console, set the Google OAuth callback URL to:

```text
https://lcydhqylpusoxngxcowy.supabase.co/auth/v1/callback
```

For production, also add the production callback URL:

```text
https://YOUR_DOMAIN/auth/callback
```

After deploy, replace local/LAN development URLs with the production domain in Supabase Site URL, Supabase Redirect URLs, Google OAuth settings, and `NEXT_PUBLIC_SITE_URL`.

## 5. Verify From Scratch

After `.env.local`, migrations, and Google OAuth are configured:

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000/login`.
3. Login with Google.
4. Create the first classroom.
5. Confirm a row exists in `classrooms`.
6. Confirm the owner row exists in `classroom_teachers`.
7. Reload the dashboard.
8. Open classroom detail.
9. Logout and login again.
10. Confirm the classroom still loads.
11. Add students.
12. Take attendance.
13. Check reports.
14. Test Excel/PDF exports.

If any test fails, capture the exact Supabase/Postgres/Auth error before changing schema.
