"use client"

import { useState } from "react"
import { updateAbout } from "@/app/actions/about"
import { Plus, Trash2, GripVertical, Save, CheckCircle2 } from "lucide-react"
import { Reorder } from "framer-motion"

export default function AboutClient({ initialData }: { initialData: any }) {
  const [title, setTitle] = useState(initialData?.title || "About Me")
  const [paragraphs, setParagraphs] = useState<string[]>(initialData?.paragraphs || ["Hi, I'm dsuryansh..."])
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setShowSuccess(false)
    try {
      await updateAbout(title, paragraphs)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (e) {
      console.error(e)
      alert("Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">About Section</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-400 text-black px-6 py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? "Saving..." : showSuccess ? <><CheckCircle2 size={18} /> Saved</> : <><Save size={18} /> Save Changes</>}
        </button>
      </div>
      
      <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-2xl mb-8">
        <div>
          <label className="block text-sm font-medium mb-3 text-white/70">Content Paragraphs</label>
          <Reorder.Group axis="y" values={paragraphs} onReorder={setParagraphs} className="flex flex-col gap-4">
            {paragraphs.map((p, i) => (
              <Reorder.Item key={i} value={p} className="flex gap-4 group bg-black/20 border border-white/10 rounded-xl p-2 relative">
                <div className="flex items-center justify-center px-2 cursor-grab active:cursor-grabbing text-white/30 hover:text-white transition-colors">
                  <GripVertical size={20} />
                </div>
                <textarea
                  value={p}
                  onChange={(e) => {
                    const newP = [...paragraphs]
                    newP[i] = e.target.value
                    setParagraphs(newP)
                  }}
                  rows={4}
                  className="flex-1 bg-transparent text-white focus:outline-none resize-none py-2"
                  placeholder="Write a paragraph here..."
                />
                <div className="pr-2 pt-2">
                  <button 
                    onClick={() => setParagraphs(paragraphs.filter((_, idx) => idx !== i))}
                    className="p-2.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <button 
            onClick={() => setParagraphs([...paragraphs, ""])}
            className="mt-6 flex items-center justify-center gap-2 w-full py-4 border border-dashed border-white/20 rounded-xl text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 transition-colors font-medium"
          >
            <Plus size={18} /> Add Paragraph
          </button>
        </div>
      </div>
    </div>
  )
}
