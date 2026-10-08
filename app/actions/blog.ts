"use server";
import { auth } from "@/lib/auth";

import { prisma } from "@/lib/prisma";
import { blogPosts } from "@/data/blog";

// Helper to seed initial posts if they don't exist
async function ensureSeedPosts() {
  const count = await prisma.post.count({ where: { id: "post-1" } });
  if (count === 0) {
    for (const post of blogPosts) {
      await prisma.post.create({
        data: {
          id: post.id,
          content: post.content,
          authorName: post.authorName || "Suryansh", // Seed posts are typically by admin
          createdAt: new Date(post.date),
          media: post.media ? (post.media as any) : undefined,
          link: post.link ? (post.link as any) : undefined,
        }
      });
    }
  }
}

export async function getPosts(type: "visitor" | "suryansh") {
  await ensureSeedPosts();

  const posts = await prisma.post.findMany({
    where: {
      authorName: type === "suryansh" ? "Suryansh" : { not: "Suryansh" }
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


export async function createPostAction(data: { content: string, authorName: string, media?: any[], link?: any }) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  const newPost = await prisma.post.create({
    data: {
      content: data.content,
      authorName: data.authorName,
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
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  const newComment = await prisma.comment.create({
    data: {
      ...data,
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
