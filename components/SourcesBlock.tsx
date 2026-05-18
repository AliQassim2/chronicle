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
    <div className="space-y-6">
      {links && links.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Sources
          </h3>
          <ul className="space-y-1">
            {links.map((text, i) => (
              <li key={i}>
                {text.startsWith("http://") || text.startsWith("https://") ? (
                  <a
                    href={text}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                  >
                    {text}
                  </a>
                ) : (
                  <span className="text-sm text-zinc-700">{text}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {images && images.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Images
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((filename, i) => (
              <a
                key={i}
                href={getFileUrl("stories", storyId, filename)}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-zinc-200"
              >
                <img
                  src={getFileUrl("stories", storyId, filename)}
                  alt={`Story image ${i + 1}`}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {videos && videos.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Videos
          </h3>
          <div className="space-y-3">
            {videos.map((filename, i) => (
              <video
                key={i}
                controls
                className="w-full max-h-96 rounded-lg border border-zinc-200"
              >
                <source
                  src={getFileUrl("stories", storyId, filename)}
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
