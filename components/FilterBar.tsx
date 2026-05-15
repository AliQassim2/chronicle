"use client";

interface FilterBarProps {
  publishers: string[];
  selectedPublisher: string;
  searchQuery: string;
  sortOrder: "newest" | "oldest";
  onPublisherChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: "newest" | "oldest") => void;
}

export default function FilterBar({
  publishers,
  selectedPublisher,
  searchQuery,
  sortOrder,
  onPublisherChange,
  onSearchChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3">
      <select
        value={selectedPublisher}
        onChange={(e) => onPublisherChange(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
      >
        <option value="">All publishers</option>
        {publishers.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Search by author..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="min-w-[180px] rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
      />

      <button
        onClick={() => onSortChange(sortOrder === "newest" ? "oldest" : "newest")}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {sortOrder === "newest" ? "Newest first" : "Oldest first"}
      </button>
    </div>
  );
}
