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
    content: "Just shipped a massive update to the blog! We now have a brand new visitor and commenting system built in. You can drop a comment anonymously, leave your name, and even like or dislike posts. Give it a try below! 🚀",
    date: "Oct 7, 2026, 3:30 PM",
  }
];
