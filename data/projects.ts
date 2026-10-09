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
    id: "portfolio",
    title: "dsuryansh Portfolio",
    description: "My personal interactive portfolio built with Next.js, featuring a custom design system, an integrated blog, interactive scribbles, dynamic gallery viewing, and built-in music.",
    tags: ["Next.js", "Tailwind CSS", "Prisma", "Framer Motion", "Cloudinary"],
    imageUrl: "/images/projects/1791548991771541639.png",
    link: "https://dsuryansh.vercel.app/",
    github: "https://github.com/dsuryansh2009/Portfolio",
  },
];
