# Smart Bookmark App

This project was built as part of a screening assignment.

The app allows users to sign in with Google, add bookmarks, delete them, and see updates in real time.

---

## Features

- Google login using Supabase Auth
- Add bookmark (title + URL)
- Delete bookmark
- Realtime updates across tabs
- Each user sees only their own bookmarks

---

## Tech Stack

- Next.js (App Router)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS

---

## How It Works

After login, users can save bookmarks with a title and URL.

Bookmarks are stored in Supabase Postgres database and linked to the logged-in user.

When bookmarks are added or removed, changes appear automatically across browser tabs.

---

## Data Privacy (RLS)

Row Level Security is enabled on the bookmarks table.

Policy used:

user_id = auth.uid()

This makes sure users can only access their own data.

---

## Problems I Faced

**1. Realtime updates were not working**

Initially bookmarks were not syncing across tabs.

Reason was realtime not enabled on the table.

**Fix:**  
Enabled realtime from Supabase dashboard.

---

**2. RLS policy confusion**

While creating policies I accidentally set incorrect rules which blocked queries.

**Fix:**  
Updated policies to use:

user_id = auth.uid()

---

**3. UI felt slightly delayed**

After insert/delete, UI updates were not instant.

**Fix:**  
Used optimistic UI updates to improve responsiveness.

---

## Improvements Possible

If extended further:

- Edit bookmark
- Search / filter bookmarks
- Better error handling UI

---

## Running Locally

npm install  
npm run dev

---

## Deployment

Deployed using Vercel.
