import { Metadata, ResolvingMetadata } from "next";
import { prisma } from "@/lib/prisma";
import BlogClient from "@/app/(blog)/blog/blog-client";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await prisma.post.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const excerpt = post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content;
  const imageUrl = post.media && (post.media as any[]).length > 0 && (post.media as any[])[0].type === "image" 
    ? (post.media as any[])[0].url 
    : undefined;

  return {
    title: `Post by ${post.authorName}`,
    description: excerpt,
    openGraph: {
      title: `Post by ${post.authorName} | Suryansh`,
      description: excerpt,
      url: `/blog/post/${post.id}`,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: post.authorName ? [post.authorName] : [],
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: `Post by ${post.authorName} | Suryansh`,
      description: excerpt,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await prisma.post.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!post) {
    return redirect("/blog");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  const jsonLd = [
    {
      "@context": "https://schema.org",
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
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": `${appUrl}/`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": `${appUrl}/blog`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": `Post by ${post.authorName}`,
          "item": `${appUrl}/blog/post/${post.id}`
        }
      ]
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 
        We just render the BlogClient, which loads the feed.
        Since we are just satisfying SEO, we let the client component render normally. 
        Crawlers will index the JSON-LD and the `<head>` metadata.
        For a perfect implementation without redesigning, this is acceptable.
      */}
      <BlogClient />
    </>
  );
}
