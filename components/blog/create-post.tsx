"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, X, Loader2 } from "lucide-react";
import { MicroPost } from "@/data/blog";
import { resolveGifUrlAction } from "@/app/actions/blog";

interface CreatePostProps {
  onPostCreated: (post: MicroPost) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [media, setMedia] = useState<{ type: "image" | "video" | "audio" | "pdf"; url: string; name?: string }[]>([]);
  const [showGifInput, setShowGifInput] = useState(false);
  const [gifUrl, setGifUrl] = useState("");
  const [isResolvingGif, setIsResolvingGif] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContentInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
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

  const handleRemoveMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!contentInput.trim() && media.length === 0) return;

    const newPost: MicroPost = {
      id: crypto.randomUUID(),
      authorName: nameInput.trim() || "Anonymous",
      content: contentInput.trim(),
      media: media.length > 0 ? media : undefined,
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
    setNameInput("");
    setMedia([]);
    setShowGifInput(false);
    setGifUrl("");
    setIsOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setContentInput("");
    setNameInput("");
    setMedia([]);
    setShowGifInput(false);
    setGifUrl("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="mb-12 w-full flex flex-col items-end">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-[#84b897]/10 hover:bg-[#84b897]/20 text-[#84b897] border border-[#84b897]/30 px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-lg"
        >
          <Plus size={18} />
          <span>Create Visitor Post</span>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full bg-white/[0.02] border border-[#84b897]/30 rounded-3xl p-6 shadow-xl relative"
        >
          <h3 className="text-xl font-semibold mb-6 text-white">Create a Post</h3>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 30))}
              placeholder="Name (Optional)"
              maxLength={30}
              className="w-full bg-transparent border-b border-white/10 pb-2 px-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#84b897]/50 transition-colors"
            />

            <textarea
              ref={textareaRef}
              value={contentInput}
              onChange={handleInputResize}
              placeholder="What's on your mind?"
              className="w-full bg-transparent resize-none text-white placeholder:text-white/30 focus:outline-none min-h-[100px] py-2 px-1 text-lg transition-all"
            />

            {/* Media previews */}
            {media.length > 0 && (
              <div className="flex flex-wrap gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-2xl">
                {media.map((item, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    <img
                      src={item.url}
                      alt="Attached GIF"
                      className="h-28 w-auto max-w-[200px] object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(i)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-red-500/80 text-white rounded-full transition-colors opacity-90 group-hover:opacity-100"
                      title="Remove GIF"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tenor / Giphy GIF URL input box */}
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
                    className="px-4 py-2.5 bg-[#84b897] hover:bg-[#95cca8] text-black text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
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
                    className="p-2 text-white/40 hover:text-white/80 transition-colors rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGifInput((prev) => !prev)}
                  className={`cursor-pointer transition-colors px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium border ${
                    showGifInput
                      ? "text-[#84b897] bg-[#84b897]/15 border-[#84b897]/40"
                      : "text-white/60 hover:text-white bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span className="font-bold tracking-wider">GIF</span>
                  <span>{showGifInput ? "Close GIF" : "Add GIF"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-white/40 hover:text-white/80 transition-colors text-sm font-medium px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={!contentInput.trim() && media.length === 0}
                  className="flex items-center gap-2 bg-[#84b897] hover:bg-[#95cca8] text-black px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Publish</span>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
