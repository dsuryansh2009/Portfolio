export interface MicroPost {
  id: string;
  content: string;
  date: string;
  authorName?: string;
  media?: {
    type: "image" | "video" | "audio" | "pdf";
    url: string;
    name?: string;
  }[];
  link?: {
    title: string;
    url: string;
  };
}

// Add your manual blog posts here
export const blogPosts: MicroPost[] = [
  {
    id: "post-1",
    content: "Welcome to my blog! Here I share thoughts, progress on AI projects, tech experiments, and updates. Feel free to explore! 🚀",
    date: "Oct 7, 2026, 3:30 PM",
  }
];
