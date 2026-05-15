import StoryFeed from "@/components/StoryFeed";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Stories</h1>
      <StoryFeed />
    </div>
  );
}
