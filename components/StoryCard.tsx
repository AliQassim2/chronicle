import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Story {
  id: string;
  title: string;
  original_author: string;
  created: string;
  expand?: {
    user_id?: {
      name?: string;
      username?: string;
    };
  };
}

export default function StoryCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/story/${story.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-5 transition hover:shadow-md hover:border-zinc-300"
    >
      <h2 className="text-lg font-semibold leading-snug text-zinc-900 line-clamp-2">
        {story.title}
      </h2>
      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
        <span>{story.expand?.user_id?.name ?? story.expand?.user_id?.username ?? "Unknown"}</span>
        <span className="text-zinc-300">·</span>
        <span>{story.original_author}</span>
      </div>
      <p className="mt-1 text-xs text-zinc-400">{formatDate(story.created)}</p>
    </Link>
  );
}
