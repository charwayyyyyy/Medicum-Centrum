# Medicum Centrum Patient Appointment and Management System

## Overview
This project is an integrated web-enabled system designed to address the challenges of manual appointment booking, patient queueing, loss of patient files, and paper-based medical history storage. The system provides secure and efficient solutions for patients, doctors, nurses, and administrative staff.

## Features
erDiagram
    PATIENT ||--o{ APPOINTMENT : books
    PATIENT ||--o{ EHR : has
    DOCTOR ||--o{ APPOINTMENT : assigned_to
    DOCTOR ||--o{ NURSE : supervises
    APPOINTMENT ||--o{ QUEUE : triggers
    ADMIN ||--o{ QUEUE : manages

### Patients
- Book and reschedule appointments
- View personal medical history (EHR)
- Receive appointment reminders (email/SMS)
- Update personal profile

### Doctors
- View personal schedules and patient appointments
- Access patient medical records (EHR)
- Write prescriptions and consultation notes
- Assign patients or tasks to nurses

### Nurses
- View list of assigned patients
- Record patient vitals and update treatment notes
- Support doctors in pre-consultation workflows

### Admin Staff
- Manage appointment bookings and patient queues
- Oversee doctor and nurse scheduling
- Register new patients and manage their files
- Generate operational reports and logs


## Getting Started
1. Clone the repository.
2. Set up the backend and frontend environments.
3. Configure the database and notification services.
4. Run the development servers.


