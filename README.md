# Traffic Violation Reporting System

A modern, responsive web application for reporting and managing traffic violations. Built with React (Vite), TypeScript, Tailwind CSS, Supabase (PostgreSQL), and React Router.

## Features

### Authentication
- User registration and login with secure JWT-based authentication
- Three user roles: **Admin**, **Traffic Officer**, and **Citizen**
- Password hashing and session management handled by Supabase Auth

### Role-Based Dashboards
- **Citizen**: View personal report statistics, submit new violations, track report status
- **Traffic Officer**: Review all reports, approve or reject violations with notes
- **Admin**: Full system access — manage users, change roles, view all reports, delete any report

### Violation Reports (Full CRUD)
- **Create**: Report violations with vehicle number, vehicle type, violation type, description, date, time, location, GPS coordinates, image upload, and remarks
- **Read**: View detailed report pages with all fields, evidence images, and review history
- **Update**: Edit pending reports (citizens can edit their own; officers/admins can review and change status)
- **Delete**: Remove reports (admin or report owner)

### Dashboard Statistics
- Total, Pending, Approved, and Rejected report counts
- Admin sees additional user statistics (total users, officers, citizens)
- Recent reports summary

### Search, Filter, Sort & Pagination
- Full-text search by vehicle number, location, or description
- Filter by status, violation type, and vehicle type
- Sort by date created, violation date, vehicle number, status, or violation type
- Paginated results with configurable page sizes

### Image Upload
- Upload evidence photos with drag-and-drop interface
- Image preview before submission
- Files stored securely in Supabase Storage with public read access

### Responsive Design
- Professional government-style UI with blue, white, and orange color theme
- Fully responsive — works on mobile, tablet, and desktop
- Sidebar navigation with mobile drawer
- Responsive tables (desktop) and cards (mobile)
- Modern animations and micro-interactions

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Security | Row-Level Security (RLS), JWT Auth |

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

The following variables are pre-configured in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `.env.example` for reference.

### Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx       # Main layout with sidebar
│   ├── Sidebar.tsx      # Role-based navigation sidebar
│   ├── ProtectedRoute.tsx  # Auth & role guard
│   ├── PageHeader.tsx   # Page title + action bar
│   ├── StatCard.tsx     # Statistics cards
│   ├── StatusBadge.tsx  # Status indicators
│   ├── Pagination.tsx   # Page navigation
│   └── ImagePreview.tsx # Image display
├── context/
│   └── AuthContext.tsx  # Auth state & methods
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── types.ts         # TypeScript types
│   ├── constants.ts     # Dropdown options, labels, colors
│   └── violationService.ts  # CRUD API functions
├── pages/
│   ├── Login.tsx        # Sign in page
│   ├── Register.tsx     # Sign up page
│   ├── Dashboard.tsx    # Role-based dashboard
│   ├── ViolationList.tsx    # Searchable/filterable report list
│   ├── ViolationDetail.tsx  # Single report view + review
│   ├── ViolationForm.tsx    # Create/edit report form
│   └── ManageUsers.tsx  # Admin user management
├── App.tsx              # Routes
├── main.tsx             # Entry point
└── index.css            # Tailwind imports
```

## Database Schema

### Tables

**profiles** — extends `auth.users` with app-specific fields
- `id` (UUID, FK to auth.users)
- `full_name` (text)
- `phone` (text, nullable)
- `role` (text: 'admin' | 'officer' | 'citizen')
- `created_at` (timestamp)

**violations** — traffic violation reports
- `id` (UUID, PK)
- `reporter_id` (UUID, FK to profiles)
- `vehicle_number`, `vehicle_type`, `violation_type` (text)
- `description`, `location`, `remarks` (text)
- `violation_date` (date), `violation_time` (text)
- `latitude`, `longitude` (numeric, nullable)
- `image_url` (text, nullable)
- `status` (text: 'pending' | 'approved' | 'rejected')
- `reviewed_by` (UUID, FK to profiles, nullable)
- `review_notes` (text, nullable)
- `reviewed_at` (timestamp, nullable)
- `created_at`, `updated_at` (timestamps)

### Security
- Row-Level Security (RLS) enabled on all tables
- Citizens can only access their own reports
- Officers and admins can read and review all reports
- Only admins can delete any report
- Storage bucket with authenticated upload and public read

## Usage Guide

### For Citizens
1. Register with the "Citizen" role
2. Click "Report Violation" to submit a new report
3. Track your reports under "My Reports"
4. Edit pending reports or delete your own reports

### For Traffic Officers
1. Register with the "Traffic Officer" role
2. View all reports under "All Reports"
3. Click any report to view details
4. Add review notes and approve or reject reports

### For Administrators
1. Register with the "Administrator" role
2. Access "Manage Users" to view all users and change roles
3. View, review, and delete any report
4. Monitor system statistics on the dashboard

## License

This project is for educational purposes as a final-year college project.
