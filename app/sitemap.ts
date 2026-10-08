import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getFolders } from "@/app/actions/gallery";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${appUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${appUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
  ];

  // Dynamic gallery folders
  try {
    const folders = await getFolders();
    const folderRoutes = folders.map((folder) => ({
      url: `${appUrl}/gallery/${folder.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    routes.push(...folderRoutes);
  } catch (e) {
    console.error("Failed to load folders for sitemap", e);
  }

  // Dynamic blog posts
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
    });
    const postRoutes = posts.map((post) => ({
      url: `${appUrl}/blog/post/${post.id}`,
      lastModified: post.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
    routes.push(...postRoutes);
  } catch (e) {
    console.error("Failed to load posts for sitemap", e);
  }

  return routes;
}
