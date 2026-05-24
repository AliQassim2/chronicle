import { getFileUrl } from "@/lib/utils";

interface SourcesBlockProps {
  links?: string[] | null;
  images?: string[] | null;
  videos?: string[] | null;
  storyId: string;
}

export default function SourcesBlock({
  links,
  images,
  videos,
  storyId,
}: SourcesBlockProps) {
  const hasSources = links?.length || images?.length || videos?.length;

  if (!hasSources) return null;

  return (
    <div className="space-y-8">
      {links && links.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-zinc-900 uppercase tracking-wider">
            📎 Sources
          </h3>
          <div className="space-y-2">
            {links.map((text, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 transition hover:border-zinc-200 hover:bg-zinc-100"
              >
                {text.startsWith("http://") || text.startsWith("https://") ? (
                  <a
                    href={text}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline break-all"
                  >
                    {text}
                  </a>
                ) : (
                  <span className="text-sm text-zinc-700">{text}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {images && images.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-zinc-900 uppercase tracking-wider">
            🖼️ Images
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {images.map((filename, i) => (
              <a
                key={i}
                href={getFileUrl("stories", storyId, filename)}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-xl border border-zinc-200 transition hover:shadow-md"
              >
                <img
                  src={getFileUrl("stories", storyId, filename)}
                  alt={`Story image ${i + 1}`}
                  className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {videos && videos.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-zinc-900 uppercase tracking-wider">
            🎬 Videos
          </h3>
          <div className="space-y-4">
            {videos.map((filename, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-zinc-200"
              >
                <video
                  controls
                  className="w-full max-h-96"
                >
                  <source
                    src={getFileUrl("stories", storyId, filename)}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
