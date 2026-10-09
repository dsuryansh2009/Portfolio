"use client"

import { useState } from "react"
import { createProjectAction, updateProjectAction, deleteProjectAction } from "@/app/actions/project"
import { Plus, Trash2, Edit2, X, ExternalLink, Image as ImageIcon } from "lucide-react"

export default function ProjectsClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProject, setCurrentProject] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    imageUrl: "",
    link: "",
    github: ""
  })
  const [loading, setLoading] = useState(false)

  const openNew = () => {
    setFormData({ title: "", description: "", tags: "", imageUrl: "", link: "", github: "" })
    setCurrentProject(null)
    setIsEditing(true)
  }

  const openEdit = (project: any) => {
    setFormData({
      title: project.title,
      description: project.description,
      tags: project.tags.join(", "),
      imageUrl: project.imageUrl,
      link: project.link || "",
      github: project.github || ""
    })
    setCurrentProject(project)
    setIsEditing(true)
  }

  const closeForm = () => {
    setIsEditing(false)
    setCurrentProject(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      title: formData.title,
      description: formData.description,
      tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
      imageUrl: formData.imageUrl,
      link: formData.link || undefined,
      github: formData.github || undefined,
    }

    try {
      if (currentProject) {
        await updateProjectAction(currentProject.id, payload)
        setProjects(projects.map(p => p.id === currentProject.id ? { ...p, ...payload } : p))
      } else {
        await createProjectAction(payload)
        // Temporary optimistic update, will refresh on next load
        setProjects([...projects, { ...payload, id: Math.random().toString() }])
      }
      closeForm()
    } catch (error) {
      alert("Failed to save project")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return
    try {
      await deleteProjectAction(id)
      setProjects(projects.filter(p => p.id !== id))
    } catch (e) {
      alert("Failed to delete project")
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold">{currentProject ? "Edit Project" : "New Project"}</h2>
          <button onClick={closeForm} className="p-2 bg-white/5 text-white/50 hover:text-white rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Title</label>
            <input
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#84b897] transition-colors"
              placeholder="Project Title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#84b897] transition-colors resize-none"
              placeholder="Short description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Tags (comma separated)</label>
            <input
              required
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#84b897] transition-colors"
              placeholder="Next.js, Tailwind, Prisma..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Image URL</label>
            <input
              required
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#84b897] transition-colors"
              placeholder="/images/projects/portfolio.png"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">Live URL (Optional)</label>
              <input
                value={formData.link}
                onChange={e => setFormData({ ...formData, link: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#84b897] transition-colors"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white/70">GitHub URL (Optional)</label>
              <input
                value={formData.github}
                onChange={e => setFormData({ ...formData, github: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#84b897] transition-colors"
                placeholder="https://github.com/..."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button
              type="button"
              onClick={closeForm}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-black rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={openNew}
          className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group">
            <div className="aspect-[4/3] bg-black/50 relative">
              {project.imageUrl ? (
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <ImageIcon size={48} />
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="font-bold text-xl mb-2">{project.title}</h3>
              <p className="text-white/50 text-sm line-clamp-2 mb-4">{project.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((tag: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-1 bg-white/10 rounded-md text-white/70">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(project)}
                    className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex gap-2 text-white/30">
                  {project.link && <ExternalLink size={16} />}
                </div>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/40 mb-4">No projects added yet.</p>
            <button
              onClick={openNew}
              className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus size={18} /> Add Your First Project
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
