"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus } from "lucide-react";
import { MicroPost } from "@/data/blog";

interface CreatePostProps {
  onPostCreated: (post: MicroPost) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContentInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handlePost = () => {
    if (!contentInput.trim()) return;

    const newPost: MicroPost = {
      id: crypto.randomUUID(),
      authorName: nameInput.trim() || "Anonymous",
      content: contentInput.trim(),
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }),
    };

    onPostCreated(newPost);
    setContentInput("");
    setIsOpen(false);
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
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white/80 transition-colors text-sm font-medium px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={!contentInput.trim()}
                className="flex items-center gap-2 bg-[#84b897] hover:bg-[#95cca8] text-black px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Publish</span>
                <Send size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
