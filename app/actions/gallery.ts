"use server";

import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function ensureSeedFolders() {
  const count = await prisma.galleryFolder.count();
  if (count === 0) {
    const defaultFolders = [
      { name: "U WANT ME ?", images: [{ title: "snapchat", url: "/images/u-want-me/1.jpg" }] },
      { name: "PHOTOGRAPHY", images: [{ title: "Beautiful landscape.", url: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/08f4d1ae-43ca-4879-80f4-c1e7969eef00/w=800" }] },
      { name: "SCREENSHOTS", images: [{ title: "Captured moment.", url: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/75367195-8fa6-4ff1-d0ce-68df4694a700/w=800" }] },
      { name: "MISCELLANEOUS", images: [{ title: "", url: "/images/miscellaneous/1791308248200.jpg" }] },
      { name: "MY SKETCHES", images: [
        { title: "Sketch of Asa Mitaka from Chainsaw Man I made it when I was in 9th grade, I was so addicted to her back then >.<.", url: "/images/my-sketches/asa.jpg" },
        { title: "Thought to paint this one but got too lazy lol", url: "/images/my-sketches/Luffy.jpg" },
        { title: "This was my Profile Picture everywhere at that time (8th 9th grade) this was my identity back then. Well guess who is she?                     shes Jinx from Arcane :>  ", url: "/images/my-sketches/jinx.jpg" },
        { title: "Well I drew many sketches on a sticky note but many got lost or sticjed somewhere else .. sad.", url: "/images/my-sketches/L.jpg" }
      ] },
    ];

    for (let i = 0; i < defaultFolders.length; i++) {
      const f = defaultFolders[i];
      const folder = await prisma.galleryFolder.create({
        data: {
          name: f.name,
          slug: f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          displayOrder: i,
        }
      });
      for (let j = 0; j < f.images.length; j++) {
        const img = f.images[j];
        await prisma.galleryImage.create({
          data: {
            folderId: folder.id,
            title: img.title,
            imageUrl: img.url,
            cloudinaryPublicId: "seeded", // placeholder
            displayOrder: j,
          }
        });
      }
    }
  }
}

export async function getFolders() {
  await ensureSeedFolders();
  return prisma.galleryFolder.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      images: {
        orderBy: { displayOrder: "asc" }
      },
      _count: {
        select: { images: true }
      }
    }
  });
}

export async function getFolderBySlug(slug: string) {
  return prisma.galleryFolder.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { displayOrder: "asc" }
      }
    }
  });
}

export async function createFolderAction(data: { name: string, description?: string }) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");
  
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  // check if slug exists
  const existing = await prisma.galleryFolder.findUnique({ where: { slug } });
  if (existing) {
    throw new Error("Folder with this name already exists");
  }

  return prisma.galleryFolder.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
    }
  });
}

export async function updateFolderAction(id: string, data: { name?: string, description?: string, coverImage?: string }) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  let slug;
  if (data.name) {
    slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }
  
  return prisma.galleryFolder.update({
    where: { id },
    data: {
      ...data,
      slug: slug || undefined,
    }
  });
}

export async function deleteFolderAction(id: string) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  // Cloudinary image deletion should ideally happen here, but for now we'll just delete from DB.
  // We can fetch all images first to delete from Cloudinary.
  const images = await prisma.galleryImage.findMany({ where: { folderId: id } });
  for (const img of images) {
    try {
      await cloudinary.uploader.destroy(img.cloudinaryPublicId);
    } catch (e) {
      console.error("Failed to delete from cloudinary", e);
    }
  }
  
  return prisma.galleryFolder.delete({ where: { id } });
}

export async function uploadImageAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  const folderId = formData.get("folderId") as string;
  const title = (formData.get("title") as string) || undefined;
  const description = (formData.get("description") as string) || undefined;

  if (!file || !folderId) {
    throw new Error("Missing file or folderId");
  }

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString('base64');
  const fileUri = `data:${file.type};base64,${base64Data}`;

  // Upload to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(fileUri, {
    folder: "portfolio_gallery",
  });

  // Save to Database
  return prisma.galleryImage.create({
    data: {
      folderId,
      title,
      description,
      cloudinaryPublicId: uploadResult.public_id,
      imageUrl: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
    }
  });
}

export async function updateImageAction(id: string, data: { title?: string, description?: string }) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  return prisma.galleryImage.update({
    where: { id },
    data
  });
}

export async function deleteImageAction(id: string) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  const image = await prisma.galleryImage.findUnique({ where: { id } });
  if (!image) throw new Error("Image not found");

  try {
    await cloudinary.uploader.destroy(image.cloudinaryPublicId);
  } catch (e) {
    console.error("Failed to delete from cloudinary", e);
  }

  return prisma.galleryImage.delete({ where: { id } });
}

export async function reorderFoldersAction(folderIds: string[]) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  // Update displayOrder based on array index
  for (let i = 0; i < folderIds.length; i++) {
    await prisma.galleryFolder.update({
      where: { id: folderIds[i] },
      data: { displayOrder: i }
    });
  }
}

export async function reorderImagesAction(imageIds: string[]) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) throw new Error("Unauthorized");

  for (let i = 0; i < imageIds.length; i++) {
    await prisma.galleryImage.update({
      where: { id: imageIds[i] },
      data: { displayOrder: i }
    });
  }
}
