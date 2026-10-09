"use server";

import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { revalidatePath } from "next/cache";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadScribbleAction(dataUri: string, nickname: string) {
  try {
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "scribbles",
    });

    const scribble = await prisma.scribble.create({
      data: {
        imageUrl: uploadResult.secure_url,
        nickname: nickname.trim() || "Anonymous",
        approved: false, // Default to false
      },
    });

    return { success: true, scribble };
  } catch (error) {
    console.error("Failed to upload scribble:", error);
    return { success: false, error: "Upload failed" };
  }
}

export async function getApprovedScribblesAction() {
  try {
    const scribbles = await prisma.scribble.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
    });
    return scribbles;
  } catch (error) {
    console.error("Failed to fetch scribbles:", error);
    return [];
  }
}

export async function getFeaturedScribblesAction() {
  try {
    const scribbles = await prisma.scribble.findMany({
      where: { isFeatured: true },
      orderBy: { createdAt: "desc" },
    });
    return scribbles;
  } catch (error) {
    console.error("Failed to fetch featured scribbles:", error);
    return [];
  }
}

export async function likeScribbleAction(id: string) {
  try {
    const scribble = await prisma.scribble.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
    return { success: true, likes: scribble.likes };
  } catch (error) {
    console.error("Failed to like scribble:", error);
    return { success: false };
  }
}

// --- Admin Actions ---

export async function getAllScribblesAction() {
  try {
    const scribbles = await prisma.scribble.findMany({
      orderBy: { createdAt: "desc" },
    });
    return scribbles;
  } catch (error) {
    console.error("Failed to fetch all scribbles:", error);
    return [];
  }
}

export async function toggleScribbleApprovalAction(id: string, approved: boolean) {
  try {
    await prisma.scribble.update({
      where: { id },
      data: { approved },
    });
    revalidatePath("/admin/scribbles");
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle approval:", error);
    return { success: false };
  }
}

export async function toggleScribbleFeatureAction(id: string, isFeatured: boolean) {
  try {
    await prisma.scribble.update({
      where: { id },
      data: { isFeatured },
    });
    revalidatePath("/admin/scribbles");
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle feature:", error);
    return { success: false };
  }
}

export async function deleteScribbleAction(id: string) {
  try {
    await prisma.scribble.delete({
      where: { id },
    });
    revalidatePath("/admin/scribbles");
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete scribble:", error);
    return { success: false };
  }
}
