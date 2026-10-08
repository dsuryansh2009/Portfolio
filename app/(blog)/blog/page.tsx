import { Metadata } from "next";
import BlogClient from "./blog-client";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Blog & Thoughts",
  description: "Read the latest thoughts, updates, and articles by Suryansh.",
  openGraph: {
    title: "Blog & Thoughts | Suryansh",
    description: "Read the latest thoughts, updates, and articles by Suryansh.",
    url: "/blog",
  },
  alternates: {
    canonical: "/blog",
  }
};

export default async function BlogPage() {
  // Fetch posts for JSON-LD schema
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Suryansh's Blog",
    "url": `${appUrl}/blog`,
    "description": "Read the latest thoughts, updates, and articles by Suryansh.",
    "publisher": {
      "@type": "Person",
      "name": "Suryansh Kumar"
    },
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.content.substring(0, 50) + "...",
      "articleBody": post.content,
      "datePublished": post.createdAt.toISOString(),
      "dateModified": post.createdAt.toISOString(),
      "author": {
        "@type": "Person",
        "name": post.authorName
      },
      "url": `${appUrl}/blog/post/${post.id}`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogClient />
    </>
  );
}
