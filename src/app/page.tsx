"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
};

export default function HomePage() {
  const router = useRouter();

  // store logged in user
  const [user, setUser] = useState<User | null>(null);

  // form inputs
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  // bookmarks list
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const loadBookmarksForUser = async (userId: string): Promise<Bookmark[]> => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return (data as Bookmark[]) || [];
  };

  // check session when page loads
  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  // once user available → load data + realtime
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const refreshBookmarks = () => {
      void loadBookmarksForUser(user.id).then((data) => {
        if (!isMounted) return;
        setBookmarks(data);
      });
    };

    refreshBookmarks();

    // listen for DB changes
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        () => {
          // refresh list if something changed
          refreshBookmarks();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const addBookmark = async () => {
    if (!user) return;

    if (!title.trim()) {
      alert("Title required");
      return;
    }

    if (!url.trim()) {
      alert("URL required");
      return;
    }

    // basic URL validation
    try {
      new URL(url);
    } catch {
      alert("Invalid URL");
      return;
    }

    // temporary object for instant UI
    const tempBookmark = {
      id: crypto.randomUUID(),
      title,
      url,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    // optimistic update → feels faster
    setBookmarks((prev) => [tempBookmark, ...prev]);

    setTitle("");
    setUrl("");

    // insert into DB
    await supabase.from("bookmarks").insert([
      {
        title: tempBookmark.title,
        url: tempBookmark.url,
        user_id: tempBookmark.user_id,
      },
    ]);
  };

  const deleteBookmark = async (id: string) => {
    // remove immediately from UI
    setBookmarks((prev) => prev.filter((bm) => bm.id !== id));

    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // loading state until user resolved
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* top section */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Smart Bookmarks
            </h1>
            <p className="text-zinc-400">
              Save and organize your favorite links
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
          >
            Logout
          </button>
        </header>

        {/* input container */}
        <div className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Bookmark title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <button
              onClick={addBookmark}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-500 active:scale-[0.99] cursor-pointer"
            >
              Save to Bookmark
            </button>
          </div>
        </div>

        {/* bookmarks */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Your Library
          </h2>

          <div className="grid gap-3">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-700"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-zinc-100">
                    {bm.title}
                  </h3>

                  {/* prevent layout break for long links */}
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-400 hover:underline break-all"
                  >
                    {bm.url}
                  </a>
                </div>

                <button
                  onClick={() => deleteBookmark(bm.id)}
                  className="ml-4 text-sm text-red-500 hover:text-red-400 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))}

            {bookmarks.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-zinc-500">
                No bookmarks saved yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
