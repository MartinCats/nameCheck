# Production Readiness Audit

Date: 2026-06-06

## Routes Reviewed

- `/`
- `/login`
- `/auth/callback`
- `/dashboard`
- `/classrooms`
- `/classrooms/[id]`
- `/attendance`
- `/attendance/[id]`
- `/reports`
- `/reports/[id]`
- `/settings`

## Routes Missing Explicit notFound Handling

- `src/app/classrooms/[id]/page.tsx`
- `src/app/attendance/[id]/page.tsx`
- `src/app/reports/[id]/page.tsx`

Status: Fixed.

These routes now call `notFound()` when a classroom cannot be loaded because it does not exist or the current teacher has no RLS access. The app-level not-found page shows a clear Thai message instead of a blank screen.

## Possible Crashes

- `loadClassroom`, `loadAttendance`, and `loadReports` use `.single()` for classroom lookup. The route now displays the Thai not-found/access-denied page when the classroom data is unavailable.
- Roster restore expects the first sheet in `students.xlsx` and columns in the documented order. Invalid files now show friendly errors, but unusual Excel cell types may still need more testing.
- PDF export depends on `/fonts/NotoSansThai-Regular.ttf`; if the file is missing from production static assets, PDF export will show a friendly failure but no PDF.

## Security Concerns

- RLS is the main protection layer and should be verified after every migration on the fresh Supabase project.
- Classroom archive/restore is now owner-only in server actions and protected by a database trigger on `classrooms.archived_at`.
- Public client uses only `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which is expected. Do not add service role keys to browser-exposed variables.

## Data Loss Risks

- Hard delete still exists, but it is separated into a Danger Zone and requires typed confirmation `ลบถาวร` in both the UI and server action. It still cascades data by design, so archive remains the recommended action.
- Student deactivation preserves attendance history. Deleting students is not exposed in the UI, which is safer.
- Backup/restore merges by student number to preserve existing student IDs where possible. If a teacher changes a student's number before restore, that row may be inserted as a new student.

## Permissions Reviewed

- Classroom, student, attendance, and report data still flow through Supabase RLS.
- Archived classrooms remain readable through reports/history because they are not deleted.
- Default classroom/attendance/dashboard lists hide archived classrooms.

## Empty States Reviewed

- No classrooms
- No archived classrooms
- No students
- No attendance data
- No reports in selected range
- No attendance history
- No risk students

## Export Reviewed

- Report Excel export contains `Student Summary` and `Daily Summary`.
- Report PDF export focuses on student and daily summaries.
- Roster backup export creates `students.xlsx` with student number, student name, and active status.

## Mobile Layout Notes

- App shell reserves safe-area bottom padding for mobile navigation.
- Attendance save button uses a safe-area-aware sticky bottom position.
- Remaining manual checks needed on real iPhone Safari before deployment: date picker, Home Screen launch, and keyboard overlap on import forms.

## Remaining Risks

- Real iPhone Safari testing is still required before deployment.
- Hard delete remains available for owners and is irreversible after typed confirmation.
- Roster restore merges by student number; changing numbers before restore may create new student rows.
