export function getFileUrl(
  collection: string,
  recordId: string,
  filename: string
): string {
  const base = process.env.NEXT_PUBLIC_POCKETBASE_URL;
  return `${base}/api/files/${collection}/${recordId}/${filename}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
