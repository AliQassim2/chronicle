"use client";

import { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";
import { formatDate, getFileUrl } from "@/lib/utils";
import EmptyState from "./EmptyState";

interface Comment {
  id: string;
  content: string;
  stance: "for" | "against" | "neutral";
  created: string;
  images?: string[] | null;
  expand?: {
    user_id?: {
      id: string;
      username?: string;
      avatar?: string;
    };
  };
}

interface CommentSectionProps {
  storyId: string;
}

const stanceConfig = {
  for: { label: "For", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  against: { label: "Against", color: "bg-red-100 text-red-800 border-red-300" },
  neutral: { label: "Neutral", color: "bg-zinc-100 text-zinc-700 border-zinc-300" },
} as const;

export default function CommentSection({
  storyId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stance, setStance] = useState<"for" | "against" | "neutral">("neutral");
  const [content, setContent] = useState("");
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchComments() {
      try {
        const result = await pb.collection("comments").getList(1, 100, {
          filter: `story_id="${storyId}"`,
          expand: "user_id",
          sort: "+created",
        });
        if (!cancelled) {
          setComments(result.items as unknown as Comment[]);
        }
      } catch {
        // comments might not exist
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timer = setTimeout(fetchComments, 100);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [storyId]);

  const grouped = {
    for: comments.filter((c) => c.stance === "for"),
    against: comments.filter((c) => c.stance === "against"),
    neutral: comments.filter((c) => c.stance === "neutral"),
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("story_id", storyId);
      formData.append("user_id", pb.authStore.model?.id ?? "");
      formData.append("stance", stance);
      formData.append("content", content.trim());

      for (const file of commentImages) {
        formData.append("images", file);
      }

      const record = await pb.collection("comments").create(formData);

      const newComment: Comment = {
        id: record.id,
        content: record.content,
        stance: record.stance,
        created: record.created,
        images: record.images,
        expand: {
          user_id: {
            id: pb.authStore.model?.id ?? "",
            username: (pb.authStore.model as Record<string, unknown>)?.username as string | undefined,
          },
        },
      };

      setComments((prev) => [newComment, ...prev]);
      setContent("");
      setCommentImages([]);
      setStance("neutral");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">
        Comments ({comments.length})
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex gap-2">
          {(Object.entries(stanceConfig) as [string, typeof stanceConfig[keyof typeof stanceConfig]][]).map(
            ([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStance(key as "for" | "against" | "neutral")}
                className={`rounded-md border px-3 py-1 text-sm font-medium transition ${
                  stance === key
                    ? config.color
                    : "border-zinc-300 text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                {config.label}
              </button>
            )
          )}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your comment..."
          rows={5}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-y"
        />

        <div>
          <input
            id="comment-images"
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setCommentImages(Array.from(e.target.files ?? []))}
            className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
          />
          {commentImages.length > 0 && (
            <p className="mt-1 text-xs text-zinc-400">{commentImages.length} image(s) selected</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState title="No comments yet" description="Be the first to share your stance." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(Object.entries(grouped) as [string, Comment[]][]).map(([key, group]) => {
            const config = stanceConfig[key as keyof typeof stanceConfig];
            return (
              <div key={key} className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <span
                    className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${config.color}`}
                  >
                    {config.label}
                  </span>
                  <span className="text-zinc-400">({group.length})</span>
                </h3>
                {group.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No comments</p>
                ) : (
                  <div className="space-y-3">
                    {group.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg border border-zinc-100 bg-white p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {comment.expand?.user_id?.avatar ? (
                            <img
                              src={getFileUrl(
                                "users",
                                comment.expand.user_id.id,
                                comment.expand.user_id.avatar
                              )}
                              alt=""
                              className="h-5 w-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-zinc-200" />
                          )}
                          <span className="text-xs font-medium text-zinc-600">
                            {comment.expand?.user_id?.username ?? "Unknown"}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {formatDate(comment.created)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-700 whitespace-pre-wrap">{comment.content}</p>
                        {comment.images && comment.images.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {comment.images.map((filename, i) => (
                              <a
                                key={i}
                                href={getFileUrl("comments", comment.id, filename)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={getFileUrl("comments", comment.id, filename)}
                                  alt={`Comment image ${i + 1}`}
                                  className="h-20 w-20 rounded-md object-cover border border-zinc-200 hover:opacity-80"
                                  loading="lazy"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
