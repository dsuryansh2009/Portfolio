import PortfolioClient from "./portfolio-client";

import { getFolders } from "@/app/actions/gallery";
import { getAbout } from "@/app/actions/about";
import { getFeaturedScribblesAction } from "@/app/actions/scribble";
import { getProjects } from "@/app/actions/project";

export const dynamic = "force-dynamic"

export default async function PortfolioPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "dsuryansh | AI Developer & Student Portfolio",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000",
    "description": "Personal portfolio of dsuryansh showcasing AI projects, blogs, creative work, photography, sketches, and experiments with technology.",
    "publisher": {
      "@type": "Person",
      "name": "dsuryansh Kumar",
      "url": process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000",
      "jobTitle": "Student & AI Developer",
      "sameAs": [
        "https://github.com/dsuryansh",
      ]
    }
  };

  const [folders, about, scribbles, projects] = await Promise.all([
    getFolders(),
    getAbout(),
    getFeaturedScribblesAction(),
    getProjects()
  ]);

  const defaultAbout = `Hi, I'm dsuryansh a student from India with a deep curiosity for AI, technology, and building things that leave an impression.\n\nI come from a small town, but I've never believed that ambition is defined by where you start. While preparing for competitive exams in high school, I spend every spare moment exploring artificial intelligence, experimenting with new ideas, and turning them into projects and experiences.\n\nThis website is a collection of that journey—my work, my thoughts, and the things I'm learning along the way. It's not a showcase of perfection; it's a record of progress.\n\nThanks for stopping by. I hope you find something here that inspires you as much as creating it inspires me.`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PortfolioClient 
        initialFolders={folders}
        initialAboutContent={about ? about.paragraphs.join("\n\n") : defaultAbout}
        initialScribbles={scribbles}
        initialProjects={projects}
      />
    </>
  );
}
