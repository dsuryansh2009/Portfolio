"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "asc" },
    });
    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function createProjectAction(data: {
  title: string;
  description: string;
  tags: string[];
  imageUrl: string;
  link?: string;
  github?: string;
}) {
  try {
    await prisma.project.create({
      data,
    });
    revalidatePath("/admin/projects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function updateProjectAction(
  id: string,
  data: {
    title: string;
    description: string;
    tags: string[];
    imageUrl: string;
    link?: string;
    github?: string;
  }
) {
  try {
    await prisma.project.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/projects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    await prisma.project.delete({
      where: { id },
    });
    revalidatePath("/admin/projects");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}
