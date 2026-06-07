# Deploy Name Checked to Vercel

This guide prepares the Name Checked PWA for production deployment on Vercel.

Do not reuse an old Supabase project with an older schema. Use the fresh Supabase project created for this rebuild, then run the repository migrations in order before production use.

## 1. Import the Project to Vercel

1. Push the latest code to GitHub.
2. Open Vercel and choose **Add New > Project**.
3. Import the GitHub repository.
4. Keep the framework preset as **Next.js**.
5. Use the default commands:
   - Install command: `npm install` or Vercel default
   - Build command: `npm run build`
   - Output directory: Next.js default
6. Add the required environment variables before the first production deploy.
7. Deploy only after Supabase and Google OAuth production settings are ready.

## 2. Required Environment Variables

Set these in Vercel Project Settings > Environment Variables for **Production**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_PRODUCTION_DOMAIN
```

For the current fresh rebuild project, the Supabase URL is:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lcydhqylpusoxngxcowy.supabase.co
```

Do not add the Supabase service role key to Vercel for this app. The browser and server code use the public anon key with Supabase RLS.

## 3. Supabase Production Settings

In Supabase Dashboard for the production project:

1. Confirm all repository migrations have been applied in order:
   - `supabase/migrations/20260531000000_initial_schema.sql`
   - `supabase/migrations/20260531010000_fix_classroom_creation_rls.sql`
   - `supabase/migrations/20260606010000_add_classroom_archive.sql`
   - `supabase/migrations/20260606020000_restrict_classroom_archive_owner.sql`
2. Go to **Authentication > URL Configuration**.
3. Set **Site URL** to the production app origin:

```text
https://YOUR_PRODUCTION_DOMAIN
```

4. Add Redirect URLs:

```text
https://YOUR_PRODUCTION_DOMAIN/auth/callback
https://YOUR_VERCEL_PROJECT.vercel.app/auth/callback
```

Keep local development redirect URLs only if local testing is still needed:

```text
http://localhost:3000/auth/callback
http://192.168.1.116:3000/auth/callback
```

## 4. Google OAuth Production Settings

In Google Cloud Console for the OAuth client used by Supabase:

1. Keep the Supabase callback URL as an authorized redirect URI:

```text
https://lcydhqylpusoxngxcowy.supabase.co/auth/v1/callback
```

2. If Google requires authorized JavaScript origins for the client, add:

```text
https://YOUR_PRODUCTION_DOMAIN
https://YOUR_VERCEL_PROJECT.vercel.app
```

3. In Supabase **Authentication > Providers > Google**, confirm the Google client ID and client secret are configured.
4. Do not store the Google client secret in the Next.js app or in `NEXT_PUBLIC_` variables.

## 5. Custom Domain Setup

1. In Vercel Project Settings > Domains, add the production domain.
2. Follow Vercel DNS instructions for the domain provider.
3. Wait until Vercel shows the domain as valid and HTTPS is active.
4. Update Vercel environment variable:

```env
NEXT_PUBLIC_SITE_URL=https://YOUR_PRODUCTION_DOMAIN
```

5. Update Supabase Site URL and Redirect URLs to include the custom domain.
6. Keep the `vercel.app` callback URL during rollout if you will test both domains.

## 6. OAuth Callback Assumptions

The app starts Google OAuth from the current request origin when possible and sends Supabase:

```text
https://YOUR_PRODUCTION_DOMAIN/auth/callback
```

The callback route exchanges the code for a Supabase session, then redirects to:

```text
https://YOUR_PRODUCTION_DOMAIN/dashboard
```

This means the production domain must be present in both:

- Supabase Redirect URLs
- `NEXT_PUBLIC_SITE_URL` in Vercel

## 7. Post-Deploy Verification Checklist

After deployment:

1. Open `https://YOUR_PRODUCTION_DOMAIN/login`.
2. Sign in with Google.
3. Confirm the final URL is `https://YOUR_PRODUCTION_DOMAIN/dashboard`.
4. Create a classroom.
5. Confirm the owner teacher row is created in Supabase.
6. Add students.
7. Save attendance.
8. Refresh and reopen the saved attendance date.
9. Open reports.
10. Export Excel.
11. Export PDF and confirm Thai text renders correctly.
12. Install the PWA on iPhone or iPad.
13. Open the installed app and confirm it loads.
14. Confirm archived classrooms hide from the default list and can be restored by the owner.
15. Confirm hard delete still requires typing `ลบถาวร`.

## 8. Production Safety Checklist

- `.env.local` must stay uncommitted.
- Supabase service role keys must not be added to client or public environment variables.
- Google OAuth client secret must stay only in Supabase/Google provider settings.
- Production Supabase RLS policies must be enabled.
- Production domain must use HTTPS.
- Vercel Production environment variables must match the deployed domain.
- After changing environment variables, redeploy the Vercel project.
