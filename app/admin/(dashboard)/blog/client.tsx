"use client"

import { useState, useEffect } from "react"
import { createPostAction, deletePostAction, updatePostAction } from "@/app/actions/blog"
import { Trash2, Paperclip, X, Link as LinkIcon, Music, FileText, Edit } from "lucide-react"
import { useRouter } from "next/navigation"

export default function BlogClient({ initialPosts }: { initialPosts: any[] }) {
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>(initialPosts)
  
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const [content, setContent] = useState("")
  const [media, setMedia] = useState<{type: "image"|"video"|"audio"|"pdf", url: string, name?: string}[]>([])

  const [editingPost, setEditingPost] = useState<any | null>(null)
  const [editContent, setEditContent] = useState("")

  const onRefresh = () => {
    router.refresh()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        let type: "image" | "video" | "audio" | "pdf" = "pdf";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";
        else if (file.type.startsWith("audio/")) type = "audio";
        
        setMedia(prev => [...prev, { type, url, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreate = async () => {
    if (!content.trim() && media.length === 0) return;
    await createPostAction({
      content: content.trim(),
      authorName: "dsuryansh",
      media: media.length > 0 ? media : undefined
    })
    setContent("")
    setMedia([])
    onRefresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    await deletePostAction(id)
    onRefresh()
  }

  const handleUpdate = async () => {
    if (!editingPost) return;
    await updatePostAction(editingPost.id, {
      content: editContent
    })
    setEditingPost(null)
    setEditContent("")
    onRefresh()
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 relative">
      <h2 className="text-2xl font-bold mb-8">Manage Blog Posts</h2>

      {/* Create form */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-12">
        <h3 className="text-lg font-semibold mb-4">Create New Post</h3>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          placeholder="What's on your mind?"
          className="w-full bg-transparent resize-none text-white placeholder:text-white/30 focus:outline-none min-h-[100px] py-2 px-1 text-lg transition-all"
        />
        
        {media.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {media.map((m, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs">
                {m.type === "image" && <LinkIcon size={12} />}
                {m.type === "video" && <LinkIcon size={12} />}
                {m.type === "audio" && <Music size={12} />}
                {m.type === "pdf" && <FileText size={12} />}
                <span className="truncate max-w-[100px]">{m.name || m.type}</span>
                <button onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))} className="text-white/50 hover:text-red-400">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <label className="cursor-pointer text-white/50 hover:text-white transition-colors p-2 bg-white/5 rounded-full flex items-center gap-2 text-sm font-medium">
            <Paperclip size={16} />
            <span>Attach Files</span>
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*,audio/*,.pdf" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
          </label>
          <button
            onClick={handleCreate}
            disabled={!content.trim() && media.length === 0}
            className="bg-blue-500 hover:bg-blue-400 text-black px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
          >
            Publish Post
          </button>
        </div>
      </div>

      {/* Post List */}
      <h3 className="text-lg font-semibold mb-4">All Posts</h3>
      <div className="flex flex-col gap-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">{post.authorName}</span>
                <span className="text-xs text-white/40">{post.date}</span>
              </div>
              <p className="text-white/80 line-clamp-2">{post.content}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button 
                onClick={() => {
                  setEditingPost(post)
                  setEditContent(post.content)
                }}
                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
              >
                <Edit size={20} />
              </button>
              <button onClick={() => handleDelete(post.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <div className="text-white/50">No posts found.</div>}
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-2xl w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Edit Post</h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 transition resize-none min-h-[150px]"
            />
            <div className="flex justify-end gap-4 mt-6">
              <button 
                onClick={() => setEditingPost(null)}
                className="px-6 py-2.5 rounded-lg text-white/70 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                className="bg-blue-500 hover:bg-blue-400 text-black px-6 py-2.5 rounded-lg font-semibold transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
