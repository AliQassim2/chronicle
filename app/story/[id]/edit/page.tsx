"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import RichEditor from "@/components/RichEditor";

interface StoryData {
  id: string;
  title: string;
  content: string;
  original_author: string;
  links?: string[] | null;
  images?: string[] | null;
  videos?: string[] | null;
  user_id: string;
}

export default function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [originalAuthor, setOriginalAuthor] = useState("");
  const [content, setContent] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function load() {
      if (!pb.authStore.isValid || !pb.authStore.model?.id) {
        router.replace("/login?redirect=/story/" + id);
        return;
      }

      try {
        const story = (await pb.collection("stories").getOne(id!)) as unknown as StoryData;

        if (story.user_id !== pb.authStore.model.id) {
          router.replace("/story/" + id);
          return;
        }

        setTitle(story.title);
        setOriginalAuthor(story.original_author);
        setContent(story.content);
        setLinks(
          story.links && story.links.length > 0
            ? [...story.links, ""]
            : [""]
        );
      } catch {
        router.replace("/story/" + id);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

  function addLink() {
    setLinks((prev) => [...prev, ""]);
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLink(index: number, value: string) {
    setLinks((prev) => prev.map((l, i) => (i === index ? value : l)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("original_author", originalAuthor);
      formData.append("content", content);

      const validLinks = links.filter((l) => l.trim());
      formData.append("links", JSON.stringify(validLinks));

      await pb.collection("stories").update(id, formData);
      router.push("/story/" + id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update story");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900">Edit Story</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-zinc-700">
            Original Author
          </label>
          <input
            id="author"
            type="text"
            required
            value={originalAuthor}
            onChange={(e) => setOriginalAuthor(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-zinc-700">
            Content
          </label>
          <div className="mt-1">
            <RichEditor value={content} onChange={setContent} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Sources</label>
          <div className="mt-1 space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={link}
                  onChange={(e) => updateLink(i, e.target.value)}
                  placeholder="Source text or URL..."
                  className="block flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="rounded-md border border-zinc-300 px-2 text-sm text-zinc-500 hover:bg-zinc-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addLink}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            + Add source
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/story/" + id)}
            className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
