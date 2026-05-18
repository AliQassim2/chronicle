import { notFound, redirect } from "next/navigation";
import { createServerPB } from "@/lib/server-pb";
import { formatDate } from "@/lib/utils";
import SourcesBlock from "@/components/SourcesBlock";
import CommentSection from "@/components/CommentSection";

interface StoryData {
  id: string;
  title: string;
  content: string;
  original_author: string;
  created: string;
  links?: string[] | null;
  images?: string[] | null;
  videos?: string[] | null;
  expand?: {
    user_id?: {
      username?: string;
    };
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pb = await createServerPB();

  let story: StoryData;

  try {
    story = (await pb.collection("stories").getOne(id, {
      expand: "user_id",
    })) as unknown as StoryData;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && err.status === 404) {
      notFound();
    }
    redirect("/login?redirect=/story/" + id);
  }

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-zinc-900 leading-tight">
          {story.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <span>
            Published by{" "}
            <strong className="text-zinc-700">
              {story.expand?.user_id?.username ?? "Unknown"}
            </strong>
          </span>
          <span className="text-zinc-300">·</span>
          <span>
            Original author:{" "}
            <strong className="text-zinc-700">{story.original_author}</strong>
          </span>
          <span className="text-zinc-300">·</span>
          <time>{formatDate(story.created)}</time>
        </div>
      </header>

      <div className="prose prose-zinc max-w-none text-zinc-700 whitespace-pre-wrap">
        {story.content}
      </div>

      <SourcesBlock
        storyId={story.id}
        links={story.links}
        images={story.images}
        videos={story.videos}
      />

      <hr className="border-zinc-200" />

      <CommentSection storyId={story.id} />
    </article>
  );
}
