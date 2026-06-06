# Database Schema

profiles
- id
- email
- full_name

classrooms
- id
- name
- academic_year

classroom_teachers
- classroom_id
- teacher_id

students
- id
- classroom_id
- number
- full_name
- active

attendance_sessions
- id
- classroom_id
- attendance_date
- completed

attendance_records
- id
- session_id
- student_id
- status

Status:
- present
- late
- leave
- absent
