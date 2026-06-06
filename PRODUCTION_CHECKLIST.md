# Production Checklist

Use this before deploying Name Checked for real classroom use.

## Supabase Setup

- Use a fresh Supabase project for this rebuild.
- Do not reuse legacy projects with older schema drift.
- Run migrations in order:
  1. `supabase/migrations/20260531000000_initial_schema.sql`
  2. `supabase/migrations/20260531010000_fix_classroom_creation_rls.sql`
  3. `supabase/migrations/20260606010000_add_classroom_archive.sql`
  4. `supabase/migrations/20260606020000_restrict_classroom_archive_owner.sql`
- Confirm RLS is enabled on all public tables.
- Confirm a teacher can only see classrooms where they are assigned.
- Confirm archived classrooms keep students and attendance history.
- Confirm only the classroom owner can archive and restore classrooms.

## Google OAuth Setup

- Supabase Google provider must be enabled.
- Google OAuth callback URL:

```text
https://lcydhqylpusoxngxcowy.supabase.co/auth/v1/callback
```

- Supabase redirect URLs for local testing:

```text
http://localhost:3000/auth/callback
http://192.168.1.116:3000/auth/callback
```

- After deploy, add the production callback URL:

```text
https://YOUR_DOMAIN/auth/callback
```

## Environment Variables

Local:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lcydhqylpusoxngxcowy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

iPhone LAN testing:

```env
NEXT_PUBLIC_SITE_URL=http://192.168.1.116:3000
```

Production:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lcydhqylpusoxngxcowy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
```

Never expose the service role key in a `NEXT_PUBLIC_` variable.

## Vercel Deployment

- Add the production environment variables in Vercel.
- Build command: `npm run build`.
- Confirm the deployment uses the same fresh Supabase project.
- After deployment, update Supabase Site URL to the production domain.
- Add the production redirect URL in Supabase Auth.
- Add the production domain in Google OAuth authorized JavaScript origins if required by the Google project.

## Custom Domain Setup

- Add the custom domain in Vercel.
- Configure DNS as instructed by Vercel.
- Wait for HTTPS certificate provisioning.
- Set `NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN`.
- Add `https://YOUR_DOMAIN/auth/callback` to Supabase Redirect URLs.
- Retest Google login from the production domain.

## PWA Verification

- Open the production site on iPhone Safari.
- Login with Google.
- Add to Home Screen.
- Open from Home Screen.
- Confirm dashboard loads.
- Turn off network and confirm the offline shell opens.
- Turn network back on and confirm attendance save works.

## Backup Procedure

- Open a classroom.
- Use `สำรองรายชื่อนักเรียน`.
- Click `ส่งออก`.
- Store `students.xlsx` somewhere safe.
- Repeat for each classroom.
- Export summary reports periodically from the Reports screen.

## Archive and Delete Verification

- Owner can archive a classroom.
- Archived classroom disappears from dashboard, attendance, and default classroom list.
- Archived classroom remains visible in reports and archived classroom list.
- Owner can restore an archived classroom.
- Non-owner assigned teacher cannot archive or restore the classroom.
- Hard delete appears only in the Danger Zone.
- Hard delete button stays disabled until the teacher types `ลบถาวร`.
- Hard delete shows the warning: `การลบถาวรจะลบข้อมูลนักเรียนและประวัติการเช็คชื่อทั้งหมด ไม่สามารถกู้คืนได้`.

## Recovery Procedure

- Create or open the target classroom.
- Open `สำรองรายชื่อนักเรียน`.
- Choose `students.xlsx`.
- Confirm the preview message shows the expected row count.
- Click `กู้คืนรายชื่อ`.
- Verify student number, name, and active status.
- Take a test attendance entry before real use.

## Final Smoke Test

- Google login and logout.
- Create classroom.
- Archive and restore classroom.
- Add, edit, deactivate, backup, and restore students.
- Save attendance.
- Edit attendance.
- Open reports.
- Export Excel and PDF.
- Test on iPhone width and real iPhone Safari.
