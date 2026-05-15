"use client";

import { useEffect, useState } from "react";
import pb from "@/lib/pocketbase";
import StoryList from "./StoryList";

interface Story {
  id: string;
  title: string;
  original_author: string;
  created: string;
  expand?: {
    user_id?: {
      username?: string;
    };
  };
}

export default function StoryFeed() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStories() {
      try {
        const result = await pb.collection("stories").getList(1, 50, {
          expand: "user_id",
          sort: "-created",
        });
        if (!cancelled) {
          setStories(result.items as unknown as Story[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stories");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Wait a tick for AuthProvider to initialize auth
    const timer = setTimeout(fetchStories, 100);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return <StoryList stories={stories} />;
}
