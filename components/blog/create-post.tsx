"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Plus, 
  X, 
  Loader2, 
  Paperclip, 
  Link as LinkIcon, 
  Music, 
  FileText, 
  Pen, 
  Sparkles,
  Video
} from "lucide-react";
import { MicroPost } from "@/data/blog";
import { resolveGifUrlAction, getCloudinarySignatureForBlogAction } from "@/app/actions/blog";

interface CreatePostProps {
  onPostCreated: (post: MicroPost) => void;
  isAdmin?: boolean;
  defaultAuthor?: string;
  tab?: "visitor" | "dsuryansh";
}

export function CreatePost({ 
  onPostCreated, 
  isAdmin = false, 
  defaultAuthor = "", 
  tab = "visitor" 
}: CreatePostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState(defaultAuthor);
  const [contentInput, setContentInput] = useState("");
  const [media, setMedia] = useState<{ type: "image" | "video" | "audio" | "pdf"; url: string; name?: string }[]>([]);
  
  // GIF state
  const [showGifInput, setShowGifInput] = useState(false);
  const [gifUrl, setGifUrl] = useState("");
  const [isResolvingGif, setIsResolvingGif] = useState(false);

  // Link state
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState("");
  const [linkTitleInput, setLinkTitleInput] = useState("");
  const [attachedLink, setAttachedLink] = useState<{ title: string; url: string } | null>(null);

  // File upload state (Admin)
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContentInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const { timestamp, signature, cloudName, apiKey } =
        await getCloudinarySignatureForBlogAction();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let type: "image" | "video" | "audio" | "pdf" = "pdf";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";
        else if (file.type.startsWith("audio/")) type = "audio";

        if (type === "image" || type === "video") {
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
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const url = ev.target?.result as string;
              setMedia(prev => [...prev, { type, url: nameInput || file.name }]);
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file. Please check Cloudinary configuration or try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddGif = async () => {
    if (!gifUrl.trim() || isResolvingGif) return;
    setIsResolvingGif(true);
    try {
      const resolved = await resolveGifUrlAction(gifUrl);
      if (!resolved) throw new Error("Could not resolve GIF");
      setMedia((prev) => [...prev, { type: "image", url: resolved, name: "GIF" }]);
      setGifUrl("");
      setShowGifInput(false);
    } catch (_) {
      alert("Could not resolve GIF link. Please check the URL or try pasting a direct .gif link.");
    } finally {
      setIsResolvingGif(false);
    }
  };

  const handleAddLink = () => {
    if (!linkUrlInput.trim()) return;
    let url = linkUrlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    setAttachedLink({
      url,
      title: linkTitleInput.trim() || url,
    });
    setLinkUrlInput("");
    setLinkTitleInput("");
    setShowLinkInput(false);
  };

  const handleRemoveMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!contentInput.trim() && media.length === 0 && !attachedLink) return;

    const author = tab === "dsuryansh"
      ? "dsuryansh"
      : (nameInput.trim() || (isAdmin ? "dsuryansh" : "Anonymous"));

    const newPost: MicroPost = {
      id: crypto.randomUUID(),
      authorName: author,
      content: contentInput.trim(),
      media: media.length > 0 ? media : undefined,
      link: attachedLink || undefined,
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    onPostCreated(newPost);
    setContentInput("");
    if (tab !== "dsuryansh") setNameInput("");
    setMedia([]);
    setAttachedLink(null);
    setShowGifInput(false);
    setGifUrl("");
    setShowLinkInput(false);
    setIsOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setContentInput("");
    if (tab !== "dsuryansh") setNameInput("");
    setMedia([]);
    setAttachedLink(null);
    setShowGifInput(false);
    setGifUrl("");
    setShowLinkInput(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="mb-12 w-full flex flex-col items-end">
      {!isOpen ? (
        tab === "dsuryansh" ? (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-[#84b897] hover:bg-[#95cca8] text-black px-6 py-3 rounded-full font-semibold transition-all duration-300 shadow-lg shadow-[#84b897]/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Pen size={17} />
            <span>Create dsuryansh Post</span>
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 cursor-pointer ${
              isAdmin 
                ? "bg-[#84b897]/15 hover:bg-[#84b897]/25 text-[#84b897] border border-[#84b897]/40" 
                : "bg-[#84b897]/10 hover:bg-[#84b897]/20 text-[#84b897] border border-[#84b897]/30"
            }`}
          >
            <Plus size={18} />
            <span>{isAdmin ? "Create Visitor Post (Admin)" : "Create Visitor Post"}</span>
          </button>
        )
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          className="w-full bg-white/[0.03] border border-[#84b897]/40 rounded-3xl p-6 shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-semibold text-white">
                {tab === "dsuryansh" ? "New dsuryansh Post" : "Create Post"}
              </h3>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#84b897]/20 text-[#84b897] border border-[#84b897]/30 flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Admin</span>
                </span>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="p-1.5 text-white/40 hover:text-white rounded-full transition-colors hover:bg-white/5 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {tab === "dsuryansh" ? (
              <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                <span className="text-[#84b897] font-semibold">Publishing as:</span>
                <span className="text-white font-medium">dsuryansh</span>
                <span className="text-white/35">· Appears directly on the dsuryansh tab</span>
              </div>
            ) : (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value.slice(0, 30))}
                placeholder={isAdmin ? "Name (Optional, defaults to dsuryansh)" : "Name (Optional)"}
                maxLength={30}
                className="w-full bg-transparent border-b border-white/10 pb-2 px-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#84b897]/50 transition-colors"
              />
            )}

            <textarea
              ref={textareaRef}
              value={contentInput}
              onChange={handleInputResize}
              placeholder={tab === "dsuryansh" ? "What's new, dsuryansh? Share updates, thoughts, links..." : "What's on your mind?"}
              className="w-full bg-transparent resize-none text-white placeholder:text-white/30 focus:outline-none min-h-[110px] py-2 px-1 text-lg transition-all"
            />

            {/* Attached media previews */}
            {media.length > 0 && (
              <div className="flex flex-wrap gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-2xl">
                {media.map((item, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    {item.type === "image" && (
                      <img
                        src={item.url}
                        alt="Attached media"
                        className="h-28 w-auto max-w-[200px] object-cover rounded-xl"
                      />
                    )}
                    {item.type === "video" && (
                      <div className="h-28 w-40 flex flex-col items-center justify-center bg-white/5 p-2 text-center">
                        <Video size={24} className="text-[#84b897] mb-1" />
                        <span className="text-xs text-white/70 truncate max-w-full px-2">{item.name || "Video"}</span>
                      </div>
                    )}
                    {item.type === "audio" && (
                      <div className="h-28 w-36 flex flex-col items-center justify-center bg-white/5 p-2 text-center">
                        <Music size={24} className="text-[#84b897] mb-1" />
                        <span className="text-xs text-white/70 truncate max-w-full px-2">{item.name || "Audio"}</span>
                      </div>
                    )}
                    {item.type === "pdf" && (
                      <div className="h-28 w-36 flex flex-col items-center justify-center bg-white/5 p-2 text-center">
                        <FileText size={24} className="text-[#84b897] mb-1" />
                        <span className="text-xs text-white/70 truncate max-w-full px-2">{item.name || "Document"}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(i)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-red-500/80 text-white rounded-full transition-colors opacity-90 group-hover:opacity-100 cursor-pointer"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Attached link preview chip */}
            {attachedLink && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <LinkIcon size={14} className="text-[#84b897] flex-shrink-0" />
                  <span className="text-white font-medium truncate">{attachedLink.title}</span>
                  <span className="text-white/40 truncate text-[11px]">({attachedLink.url})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedLink(null)}
                  className="p-1 text-white/40 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Link input form (Admin) */}
            <AnimatePresence>
              {showLinkInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col sm:flex-row items-center gap-2 pt-1 overflow-hidden"
                >
                  <input
                    type="url"
                    value={linkUrlInput}
                    onChange={(e) => setLinkUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#84b897]/60 transition-colors"
                  />
                  <input
                    type="text"
                    value={linkTitleInput}
                    onChange={(e) => setLinkTitleInput(e.target.value)}
                    placeholder="Link Title (Optional)"
                    className="w-full sm:w-48 bg-white/5 border border-white/15 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#84b897]/60 transition-colors"
                  />
                  <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleAddLink}
                      disabled={!linkUrlInput.trim()}
                      className="px-4 py-2 bg-[#84b897] hover:bg-[#95cca8] text-black text-sm font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Attach
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLinkInput(false);
                        setLinkUrlInput("");
                        setLinkTitleInput("");
                      }}
                      className="p-2 text-white/40 hover:text-white/80 transition-colors rounded-lg cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tenor / Giphy GIF input */}
            <AnimatePresence>
              {showGifInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 pt-1 overflow-hidden"
                >
                  <input
                    autoFocus
                    type="url"
                    value={gifUrl}
                    onChange={(e) => setGifUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddGif();
                      }
                      if (e.key === "Escape") {
                        setShowGifInput(false);
                      }
                    }}
                    placeholder="Paste Tenor / Giphy / direct GIF URL…"
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#84b897]/60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddGif}
                    disabled={!gifUrl.trim() || isResolvingGif}
                    className="px-4 py-2.5 bg-[#84b897] hover:bg-[#95cca8] text-black text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isResolvingGif ? <Loader2 size={14} className="animate-spin" /> : null}
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGifInput(false);
                      setGifUrl("");
                    }}
                    className="p-2 text-white/40 hover:text-white/80 transition-colors rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {/* File Upload (Admin only) */}
                {isAdmin && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,audio/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer transition-colors px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 disabled:opacity-50"
                      title="Attach images, videos, audio, or PDFs"
                    >
                      {isUploading ? <Loader2 size={13} className="animate-spin text-[#84b897]" /> : <Paperclip size={13} />}
                      <span>{isUploading ? "Uploading..." : "Attach File"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLinkInput((prev) => !prev)}
                      className={`cursor-pointer transition-colors px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium border ${
                        showLinkInput || attachedLink
                          ? "text-[#84b897] bg-[#84b897]/15 border-[#84b897]/40"
                          : "text-white/60 hover:text-white bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                      title="Attach Link"
                    >
                      <LinkIcon size={13} />
                      <span>Link</span>
                    </button>
                  </>
                )}

                {/* GIF Button */}
                <button
                  type="button"
                  onClick={() => setShowGifInput((prev) => !prev)}
                  className={`cursor-pointer transition-colors px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium border ${
                    showGifInput
                      ? "text-[#84b897] bg-[#84b897]/15 border-[#84b897]/40"
                      : "text-white/60 hover:text-white bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                  title="Attach GIF from Tenor or Giphy"
                >
                  <span className="font-bold tracking-wider text-[10px]">GIF</span>
                  <span>{showGifInput ? "Close GIF" : "Add GIF"}</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-white/40 hover:text-white/80 transition-colors text-sm font-medium px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={isUploading || isResolvingGif || (!contentInput.trim() && media.length === 0 && !attachedLink)}
                  className="flex items-center gap-2 bg-[#84b897] hover:bg-[#95cca8] text-black px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-[#84b897]/20"
                >
                  <span>Publish</span>
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
