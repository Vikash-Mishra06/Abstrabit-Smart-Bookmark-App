# Smart Bookmark App

This project is a simple full-stack bookmark manager built as part of a screening assignment.

The application allows users to sign in with Google, save personal bookmarks, delete them, and see updates in real time across multiple browser tabs.

---

## Assignment Requirements Implemented

The following requirements from the assignment are implemented:

✔ Google Authentication using Supabase Auth  
✔ Bookmark creation (title + URL)  
✔ Bookmark deletion  
✔ Per-user data privacy  
✔ Real-time updates across tabs (Supabase Realtime)  
✔ Next.js App Router architecture  
✔ Tailwind CSS basic styling  

---

## Tech Stack Used

- Next.js (App Router)
- Supabase (Authentication, Database, Realtime)
- Postgres (via Supabase)
- Tailwind CSS

---

## Application Behavior

1. Users sign in using Google OAuth (no passwords).
2. Authenticated users can add bookmarks with a title and URL.
3. Users can delete their bookmarks.
4. Each user only sees their own bookmarks.
5. Changes sync instantly across browser tabs.

---

## Data Privacy

User data isolation is enforced using Supabase Row Level Security (RLS).

Bookmarks are associated with a user via:

user_id = auth.uid()

This ensures users cannot access or modify other users’ data.

---

## Realtime Updates

Supabase realtime subscriptions are used to listen for database changes.

When bookmarks are added or deleted, all open tabs update automatically without manual refresh.

---

## Input Validation

Basic client-side validation is implemented:

- Empty title prevention
- Empty URL prevention
- URL format validation

---

## UX Decisions

Optimistic UI updates are used so that:

- Bookmarks appear immediately after adding
- Bookmarks disappear immediately after deletion

Database operations run in the background.

---

## Possible Improvements

If extended further, the application could support:

- Bookmark editing
- Better error handling UI
- Bookmark search / filtering
- Metadata extraction (favicon/title)

---

## Running Locally

npm install  
npm run dev

---

## Deployment

Designed to be deployed using Vercel.
