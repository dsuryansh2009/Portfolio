export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  link?: string;
  github?: string;
}

export const projectsData: Project[] = [
  {
    id: "nexus",
    title: "Nexus",
    description: "An AI-powered knowledge management tool that automatically organizes, tags, and connects your notes using large language models.",
    tags: ["Next.js", "OpenAI", "TailwindCSS", "PostgreSQL"],
    imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2874&auto=format&fit=crop",
    link: "https://example.com",
    github: "https://github.com",
  },

];
