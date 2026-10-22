"use server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

import { prisma } from "@/lib/prisma";
import { blogPosts } from "@/data/blog";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to seed initial posts if they don't exist
async function ensureSeedPosts() {
  const count = await prisma.post.count({ where: { id: "post-1" } });
  if (count === 0) {
    for (const post of blogPosts) {
      await prisma.post.create({
        data: {
          id: post.id,
          content: post.content,
          authorName: post.authorName || "dsuryansh", // Seed posts are typically by admin
          createdAt: new Date(post.date),
          media: post.media ? (post.media as any) : undefined,
          link: post.link ? (post.link as any) : undefined,
        }
      });
    }
  }
}

export async function getPosts(type: "visitor" | "dsuryansh") {
  await ensureSeedPosts();

  const posts = await prisma.post.findMany({
    where: {
      authorName: type === "dsuryansh" ? "dsuryansh" : { not: "dsuryansh" }
    },
    orderBy: { createdAt: "desc" },
  });

  return posts.map(p => ({
    id: p.id,
    content: p.content,
    authorName: p.authorName,
    date: p.createdAt.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }),
    media: p.media ? (p.media as any) : undefined,
    link: p.link ? (p.link as any) : undefined,
    likes: p.likes,
    dislikes: p.dislikes
  }));
}


export async function checkIsAdminAction(): Promise<boolean> {
  const session = await auth();
  return !!(session && session.user?.email && session.user.email === process.env.ADMIN_EMAIL);
}

export async function createPostAction(data: { content: string, authorName: string, media?: any[], link?: any }) {
  const session = await auth();
  const isAdmin = session && session.user?.email === process.env.ADMIN_EMAIL;

  let authorName = data.authorName?.trim() || "Anonymous";
  if (!isAdmin) {
    if (authorName.toLowerCase() === "dsuryansh" || authorName.toLowerCase() === "suryansh") {
      authorName = "Visitor (Anonymous)";
    }
  }

  const newPost = await prisma.post.create({
    data: {
      content: data.content,
      authorName: authorName,
      media: data.media ? (data.media as any) : undefined,
      link: data.link ? (data.link as any) : undefined,
    }
  });
  return newPost.id;
}

export async function updatePostAction(id: string, data: { content?: string, media?: any[], link?: any }) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  await prisma.post.update({
    where: { id },
    data: {
      content: data.content,
      media: data.media ? (data.media as any) : undefined,
      link: data.link ? (data.link as any) : undefined,
    }
  });
}

export async function deletePostAction(id: string) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  await prisma.post.delete({ where: { id } });
}

export async function getPostInteractions(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      likes: true,
      dislikes: true,
      comments: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!post) return { postLikes: 0, postDislikes: 0, comments: [] };

  return {
    postLikes: post.likes,
    postDislikes: post.dislikes,
    comments: post.comments.map(c => ({
      id: c.id,
      authorName: c.authorName,
      text: c.text,
      timestamp: c.createdAt.toISOString(),
      likes: c.likes,
      dislikes: c.dislikes
    }))
  };
}

export async function reactToPostAction(postId: string, type: "like" | "dislike", amount: number) {
  await prisma.post.update({
    where: { id: postId },
    data: {
      [type === "like" ? "likes" : "dislikes"]: { increment: amount }
    }
  });
}

export async function createCommentAction(postId: string, data: { authorName: string, text: string }) {
  const newComment = await prisma.comment.create({
    data: {
      authorName: data.authorName?.trim() || "Anonymous",
      text: data.text,
      postId
    }
  });
  return newComment.id;
}

export async function deleteCommentAction(id: string) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  await prisma.comment.delete({ where: { id } });
}

export async function reactToCommentAction(commentId: string, type: "like" | "dislike", amount: number) {
  await prisma.comment.update({
    where: { id: commentId },
    data: {
      [type === "like" ? "likes" : "dislikes"]: { increment: amount }
    }
  });
}

export async function getCloudinarySignatureForBlogAction() {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: "portfolio_blog" },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}

export async function resolveGifUrlAction(raw: string): Promise<string> {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // 1. Direct image/gif URL
  if (/\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i.test(trimmed)) {
    return trimmed;
  }

  // 2. Tenor share link (e.g. https://tenor.com/view/...)
  if (trimmed.includes("tenor.com/view/")) {
    try {
      const res = await fetch(`https://tenor.com/oembed?url=${encodeURIComponent(trimmed)}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.thumbnail_url) {
          // Replace thumbnail preview (AAAAN) with animated GIF (AAAAC)
          return data.thumbnail_url.replace(/AAAA[A-Za-z0-9]/, "AAAAC").replace(/\.png$/, ".gif");
        }
      }
    } catch (e) {
      console.error("Failed to resolve Tenor URL via oEmbed", e);
    }
  }

  // 3. Tenor media link
  if (trimmed.includes("media.tenor.com") || trimmed.includes("c.tenor.com")) {
    return trimmed;
  }

  // 4. Giphy share link
  if (trimmed.includes("giphy.com")) {
    const idMatch = trimmed.match(/giphy\.com\/gifs\/(?:[^/]+-)?([a-zA-Z0-9]+)$/);
    if (idMatch && idMatch[1]) {
      return `https://media.giphy.com/media/${idMatch[1]}/giphy.gif`;
    }
  }

  return trimmed;
}
