"use client";

import { useMemo, useState } from "react";
import StoryCard from "./StoryCard";
import FilterBar from "./FilterBar";
import EmptyState from "./EmptyState";
import Link from "next/link";

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

export default function StoryList({ stories }: { stories: Story[] }) {
  const [selectedPublisher, setSelectedPublisher] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const publishers = useMemo(() => {
    const set = new Set<string>();
    for (const s of stories) {
      const name = s.expand?.user_id?.username;
      if (name) set.add(name);
    }
    return Array.from(set).sort();
  }, [stories]);

  const filtered = useMemo(() => {
    let result = [...stories];

    if (selectedPublisher) {
      result = result.filter(
        (s) => s.expand?.user_id?.username === selectedPublisher
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.original_author.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const diff = new Date(a.created).getTime() - new Date(b.created).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

    return result;
  }, [stories, selectedPublisher, searchQuery, sortOrder]);

  if (stories.length === 0) {
    return (
      <EmptyState
        title="No stories yet"
        description="Be the first to share a story."
        action={
          <Link
            href="/create"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Create Story
          </Link>
        }
      />
    );
  }

  return (
    <>
      <FilterBar
        publishers={publishers}
        selectedPublisher={selectedPublisher}
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        onPublisherChange={setSelectedPublisher}
        onSearchChange={setSearchQuery}
        onSortChange={setSortOrder}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No stories match your filters"
          description="Try changing your search or filter criteria."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </>
  );
}
