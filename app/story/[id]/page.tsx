import { notFound, redirect } from "next/navigation";
import { createServerPB } from "@/lib/server-pb";
import { formatDate } from "@/lib/utils";
import SourcesBlock from "@/components/SourcesBlock";
import CommentSection from "@/components/CommentSection";
import DeleteButton from "@/components/DeleteButton";
import Link from "next/link";

interface StoryData {
  id: string;
  title: string;
  content: string;
  original_author: string;
  created: string;
  user_id: string;
  links?: string[] | null;
  images?: string[] | null;
  videos?: string[] | null;
  expand?: {
    user_id?: {
      name?: string;
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

  const isAuthor = pb.authStore.model?.id === story.user_id;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 px-8 py-12">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-4 translate-y-4 rounded-full bg-white/5 blur-xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-400">
              <span className="rounded-full bg-white/10 px-3 py-1">
                {story.expand?.user_id?.name ?? story.expand?.user_id?.username ?? "Unknown"}
              </span>
              <span className="text-zinc-600">·</span>
              <span>{formatDate(story.created)}</span>
              <span className="text-zinc-600">·</span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                {story.original_author}
              </span>
              {isAuthor && (
                <>
                  <Link
                    href={"/story/" + story.id + "/edit"}
                    className="ml-auto rounded-full bg-white/10 px-3 py-1 text-zinc-300 hover:bg-white/20 hover:text-white"
                  >
                    Edit
                  </Link>
                  <DeleteButton storyId={story.id} />
                </>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl">
              {story.title}
            </h1>
          </div>
        </div>

        <div className="px-8 py-10">
          <div className="prose prose-zinc prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: story.content }} />

          <div className="mt-12 border-t border-zinc-100 pt-10">
            <SourcesBlock
              storyId={story.id}
              links={story.links}
              images={story.images}
              videos={story.videos}
            />
          </div>

          <div className="mt-12 border-t border-zinc-100 pt-10">
            <CommentSection storyId={story.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
