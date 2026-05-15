"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";

export default function CreateStoryPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [originalAuthor, setOriginalAuthor] = useState("");
  const [content, setContent] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("original_author", originalAuthor);
      formData.append("content", content);
      formData.append("user_id", pb.authStore.model?.id ?? "");

      const validLinks = links.filter((l) => l.trim());
      if (validLinks.length > 0) {
        formData.append("links", JSON.stringify(validLinks));
      }

      for (const file of images) {
        formData.append("images", file);
      }

      for (const file of videos) {
        formData.append("videos", file);
      }

      const record = await pb.collection("stories").create(formData);
      router.push(`/story/${record.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create story");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-900">Create Story</h1>

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
          <textarea
            id="content"
            required
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Links</label>
          <div className="mt-1 space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updateLink(i, e.target.value)}
                  placeholder="https://..."
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
            + Add link
          </button>
        </div>

        <div>
          <label htmlFor="images" className="block text-sm font-medium text-zinc-700">
            Images
          </label>
          <input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            className="mt-1 block w-full text-sm text-zinc-500 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
          />
        </div>

        <div>
          <label htmlFor="videos" className="block text-sm font-medium text-zinc-700">
            Videos
          </label>
          <input
            id="videos"
            type="file"
            multiple
            accept="video/*"
            onChange={(e) => setVideos(Array.from(e.target.files ?? []))}
            className="mt-1 block w-full text-sm text-zinc-500 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? "Publishing..." : "Publish Story"}
        </button>
      </form>
    </div>
  );
}
