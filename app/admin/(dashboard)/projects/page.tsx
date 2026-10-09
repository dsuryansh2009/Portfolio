import { getProjects } from "@/app/actions/project"
import ProjectsClient from "./client"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Projects</h1>
        <p className="text-white/50">Manage your portfolio projects showcase.</p>
      </div>
      <ProjectsClient initialProjects={projects} />
    </div>
  )
}
