"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getAbout() {
  const about = await prisma.about.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return about;
}

export async function updateAbout(title: string, paragraphs: string[]) {
  const session = await auth();
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const about = await prisma.about.create({
    data: {
      title,
      paragraphs,
    },
  });

  revalidatePath("/");
  return about;
}
