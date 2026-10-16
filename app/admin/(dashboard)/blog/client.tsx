"use client"

import { useState, useEffect, useRef } from "react"
import { createPostAction, deletePostAction, updatePostAction, getCloudinarySignatureForBlogAction, resolveGifUrlAction } from "@/app/actions/blog"
import { Trash2, Paperclip, X, Link as LinkIcon, Music, FileText, Edit, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function BlogClient({ initialPosts }: { initialPosts: any[] }) {
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>(initialPosts)
  
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const [content, setContent] = useState("")
  const [media, setMedia] = useState<{type: "image"|"video"|"audio"|"pdf", url: string, name?: string}[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [gifUrl, setGifUrl] = useState("")
  const [showGifInput, setShowGifInput] = useState(false)
  const [isResolvingGif, setIsResolvingGif] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editingPost, setEditingPost] = useState<any | null>(null)
  const [editContent, setEditContent] = useState("")

  const onRefresh = () => {
    router.refresh()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      // Get Cloudinary signature once for all files
      const { timestamp, signature, cloudName, apiKey } =
        await getCloudinarySignatureForBlogAction();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let type: "image" | "video" | "audio" | "pdf" = "pdf";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";
        else if (file.type.startsWith("audio/")) type = "audio";

        if (type === "image" || type === "video") {
          // Upload to Cloudinary
          const formData = new FormData();
          formData.append("file", file);
          formData.append("api_key", apiKey!);
          formData.append("timestamp", timestamp.toString());
          formData.append("signature", signature);
          formData.append("folder", "portfolio_blog");

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
            { method: "POST", body: formData }
          );
          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json();
          setMedia(prev => [...prev, { type, url: data.secure_url, name: file.name }]);
        } else {
          // Audio/PDF — read as base64 (small files)
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const url = ev.target?.result as string;
              setMedia(prev => [...prev, { type, url, name: file.name }]);
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddGif = async () => {
    if (!gifUrl.trim()) return;
    setIsResolvingGif(true);
    try {
      const resolved = await resolveGifUrlAction(gifUrl);
      if (!resolved) throw new Error("Could not resolve GIF");
      setMedia(prev => [...prev, { type: "image", url: resolved, name: "GIF" }]);
      setGifUrl("");
      setShowGifInput(false);
    } catch (_) {
      alert("Could not resolve GIF URL. Try pasting a direct .gif link.");
    } finally {
      setIsResolvingGif(false);
    }
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
        
        {/* GIF URL inline input */}
        {showGifInput && (
          <div className="flex items-center gap-2 mt-3 mb-1">
            <input
              autoFocus
              type="url"
              value={gifUrl}
              onChange={e => setGifUrl(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddGif(); if (e.key === "Escape") setShowGifInput(false); }}
              placeholder="Paste Tenor / Giphy / direct GIF URL…"
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/60 transition-colors"
            />
            <button
              onClick={handleAddGif}
              disabled={!gifUrl.trim() || isResolvingGif}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-400 text-black text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isResolvingGif ? <Loader2 size={14} className="animate-spin" /> : null}
              Add
            </button>
            <button onClick={() => { setShowGifInput(false); setGifUrl(""); }} className="text-white/40 hover:text-white/80 transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <label className={`cursor-pointer transition-colors p-2 bg-white/5 rounded-full flex items-center gap-2 text-sm font-medium ${isUploading ? "opacity-50 pointer-events-none" : "text-white/50 hover:text-white"}`}>
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
              <span>{isUploading ? "Uploading..." : "Attach Files"}</span>
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept="image/*,image/gif,video/*,audio/*,.pdf" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
            <button
              onClick={() => setShowGifInput(v => !v)}
              className={`cursor-pointer transition-colors p-2 bg-white/5 rounded-full flex items-center gap-2 text-sm font-medium ${
                showGifInput ? "text-pink-400 bg-pink-500/10" : "text-white/50 hover:text-white"
              }`}
            >
              <span className="text-xs font-bold tracking-widest">GIF</span>
              <span>Add GIF</span>
            </button>
          </div>

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
