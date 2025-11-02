export type SocialItem = { name: string; url: string; icon: React.ComponentType<any> };

export type SectionItem = { label: string; url: string };

export type EventRow = {
  id: string;
  game: string;
  date: string; // YYYY-MM-DD
  location: string;
  event: string;
  placement: string;
  published: boolean;
};

export type MediaItem = {
  id: string;
  type: "image" | "video";
  src: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  published: boolean;
  updatedAt: number;
  attachments?: MediaItem[];
};
