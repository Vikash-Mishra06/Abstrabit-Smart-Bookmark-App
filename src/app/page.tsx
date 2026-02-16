"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  // initial auth check on page load
  useEffect(() => {
    checkUser();
  }, []);

  // setup realtime subscription once user is available
  useEffect(() => {
    if (!user) return;

    fetchBookmarks(user.id);

    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        () => {
          // refresh bookmarks when DB changes
          fetchBookmarks(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
    } else {
      setUser(data.user);
    }
  };

  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  const addBookmark = async () => {
    if (!title.trim()) {
      alert("Title required");
      return;
    }

    if (!url.trim()) {
      alert("URL required");
      return;
    }

    try {
      new URL(url); // basic URL validation
    } catch {
      alert("Invalid URL");
      return;
    }

    const tempBookmark = {
      id: crypto.randomUUID(), // temporary client-side ID
      title,
      url,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    // optimistic update for faster UI response
    setBookmarks((prev) => [tempBookmark, ...prev]);

    setTitle("");
    setUrl("");

    await supabase.from("bookmarks").insert([
      {
        title: tempBookmark.title,
        url: tempBookmark.url,
        user_id: tempBookmark.user_id,
      },
    ]);
  };

  const deleteBookmark = async (id: string) => {
    // remove immediately for better UX
    setBookmarks((prev) => prev.filter((bm) => bm.id !== id));

    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!user) return <div className="p-10">Loading...</div>;

  return (
    <div className="mx-auto max-w-xl p-10">
      <button onClick={logout} className="mb-4 text-sm text-gray-500 underline">
        Logout
      </button>

      <h1 className="mb-6 text-2xl font-bold">Smart Bookmarks</h1>

      <div className="mb-4 flex flex-col gap-2">
        <input
          className="rounded border p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="rounded border p-2"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={addBookmark}
          className="rounded bg-black py-2 text-white"
        >
          Add Bookmark
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {bookmarks.map((bm) => (
          <div
            key={bm.id}
            className="flex items-center justify-between rounded border p-3"
          >
            <div>
              <div className="font-semibold">{bm.title}</div>
              <a
                href={bm.url}
                target="_blank"
                className="text-sm text-blue-600"
              >
                {bm.url}
              </a>
            </div>

            <button
              onClick={() => deleteBookmark(bm.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </div>
        ))}

        {bookmarks.length === 0 && (
          <div className="text-sm text-gray-500">No bookmarks yet</div>
        )}
      </div>
    </div>
  );
}
