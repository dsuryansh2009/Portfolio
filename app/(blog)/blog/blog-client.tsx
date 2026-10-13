"use client";

import { motion } from "framer-motion";
import { Link as LinkIcon, ExternalLink, Calendar, Paperclip, FileText, Music, X, ArrowLeft, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { BlogInteractions } from "@/components/blog/blog-interactions";
import { CreatePost } from "@/components/blog/create-post";
import { getPosts, createPostAction, deletePostAction } from "@/app/actions/blog";
import { MicroPost } from "@/data/blog";
import { LeaveScribble } from "@/components/blog/leave-scribble";
import { CommunityScribbles } from "@/components/blog/community-scribbles";
import { getApprovedScribblesAction } from "@/app/actions/scribble";

export default function BlogClient() {
  const [displayedPosts, setDisplayedPosts] = useState<MicroPost[]>([]);
  const [activeTab, setActiveTab] = useState<"visitor" | "dsuryansh">("dsuryansh");
  const [isLoading, setIsLoading] = useState(true);
  
  // Easter egg admin state
  const [dsuryanshClicks, setdsuryanshClicks] = useState(0);

  const [scribbles, setScribbles] = useState<any[]>([]);

  const fetchPosts = async (tab: "visitor" | "dsuryansh") => {
    setIsLoading(true);
    try {
      const posts = await getPosts(tab);
      setDisplayedPosts(posts as MicroPost[]);
      
      if (tab === "visitor") {
        const approvedScribbles = await getApprovedScribblesAction();
        setScribbles(approvedScribbles);
      }
    } catch (e) {
      console.error("Failed to fetch posts", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab]);

  const handlePostCreated = async (newPost: MicroPost) => {
    await createPostAction({
      content: newPost.content,
      authorName: newPost.authorName || "Anonymous"
    });
    await fetchPosts(activeTab);
  };

  const handledsuryanshClick = () => {
    setActiveTab("dsuryansh");
    setdsuryanshClicks((prev) => prev + 1);
    if (dsuryanshClicks >= 4) {
      window.location.href = "/admin";
    }
  };



  return (
    <main className="min-h-screen w-full bg-[#050505] text-white selection:bg-[#84b897] selection:text-black pb-32">
      <h1 className="sr-only">dsuryansh&apos;s Blog & Thoughts</h1>
      <Navbar />
      
      {/* Back Button */}
      <Link 
        href="/"
        className="fixed top-8 left-8 md:top-12 md:left-12 z-[100] p-3 md:p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all group flex items-center justify-center text-white/50 hover:text-white shadow-xl shadow-black/50"
      >
        <ArrowLeft size={20} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
      </Link>

      <div className="max-w-2xl mx-auto px-6 pt-32">
        {/* Toggle Slider */}
        <div className="flex bg-white/5 p-1 rounded-full relative w-64 mx-auto mb-12">
          <motion.div 
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#84b897] rounded-full z-0"
            animate={{ left: activeTab === "dsuryansh" ? "4px" : "calc(50%)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
          <button 
            onClick={handledsuryanshClick}
            className={`w-1/2 py-2 text-sm font-medium z-10 transition-colors ${activeTab === "dsuryansh" ? "text-black" : "text-white/50 hover:text-white"}`}
          >
            dsuryansh
          </button>
          <button 
            onClick={() => setActiveTab("visitor")}
            className={`w-1/2 py-2 text-sm font-medium z-10 transition-colors ${activeTab === "visitor" ? "text-black" : "text-white/50 hover:text-white"}`}
          >
            Visitor
          </button>
        </div>

        {/* Create Post Section */}
        {activeTab === "visitor" && (
          <>
            <CreatePost onPostCreated={handlePostCreated} />
            <LeaveScribble />
            <CommunityScribbles initialScribbles={scribbles} />
          </>
        )}


        {/* Feed */}
        <div className="flex flex-col space-y-12">
          {isLoading ? (
            <div className="w-full text-center py-20 text-white/50">Loading posts...</div>
          ) : displayedPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-start group"
            >
              <div className="w-full flex flex-col items-start bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 shadow-xl shadow-black/20">
                <h2 className="sr-only">Post by {post.authorName || "Anonymous"} on {post.date}</h2>
                {/* Meta */}
                <header className="flex items-start justify-between w-full mb-4">
                  <div className="flex flex-col gap-1">
                    {post.authorName && (
                      <div className="flex items-center gap-2 mb-1">
                        <img 
                          src={`https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(post.authorName + post.id)}`} 
                          alt={`${post.authorName}'s avatar`}
                          className="w-6 h-6 rounded-full bg-white/10" 
                        />
                        <span className="text-white/90 text-sm font-medium">{post.authorName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/40 text-xs font-medium tracking-wide">
                      <Calendar size={14} className="text-white/30" />
                      <time dateTime={new Date(post.date).toISOString()}>{post.date}</time>
                    </div>
                  </div>
                </header>

                {/* Content */}
                <p className="text-white/80 text-lg leading-relaxed mb-6">
                  {post.content}
                </p>

                {/* Media Attachment */}
                {post.media && post.media.length > 0 && (
                  <div className={`w-full grid gap-2 mb-4 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {post.media.map((item, i) => (
                      <figure key={i} className="relative m-0 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-2">
                        {item.type === "image" && (
                          <img
                            src={item.url}
                            alt={`Attached image ${i+1}`}
                            className="w-full h-auto max-h-[400px] object-cover hover:scale-105 transition-transform duration-700 rounded-xl"
                            loading="lazy"
                          />
                        )}
                        {item.type === "video" && (
                          <video
                            src={item.url}
                            controls
                            className="w-full h-auto max-h-[400px] object-cover rounded-xl"
                          />
                        )}
                        {item.type === "audio" && (
                          <div className="w-full p-4 flex flex-col gap-2">
                            <figcaption className="flex items-center gap-2 text-sm font-medium mb-1">
                              <Music size={16} className="text-[#84b897]" />
                              <span>{item.name || "Audio File"}</span>
                            </figcaption>
                            <audio src={item.url} controls className="w-full h-10" />
                          </div>
                        )}
                        {item.type === "pdf" && (
                          <a 
                            href={item.url} 
                            download={item.name}
                            className="w-full p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-colors rounded-xl group/pdf text-center"
                          >
                            <FileText size={32} className="text-white/40 group-hover/pdf:text-[#84b897] transition-colors" />
                            <span className="text-sm font-medium max-w-[80%] truncate">{item.name || "Document.pdf"}</span>
                            <span className="text-xs text-white/40">Click to download</span>
                          </a>
                        )}
                      </figure>
                    ))}
                  </div>
                )}

                {/* Link Attachment */}
                {post.link && (
                  <a
                    href={post.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group/link mt-2"
                  >
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover/link:bg-[#84b897]/20 group-hover/link:text-[#84b897] transition-colors">
                      <LinkIcon size={18} />
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <h4 className="text-white text-sm font-medium truncate mb-1">
                        {post.link.title}
                      </h4>
                      <p className="text-white/40 text-xs truncate">
                        {post.link.url}
                      </p>
                    </div>
                    <ExternalLink size={16} className="text-white/30 group-hover/link:text-white/70 flex-shrink-0" />
                  </a>
                )}

                <BlogInteractions postId={post.id} />
              </div>
            </motion.article>
          ))}
          {!isLoading && displayedPosts.length === 0 && (
            <div className="w-full text-center py-20 text-white/30 text-sm font-medium">
              No posts found.
            </div>
          )}
        </div>
      </div>


    </main>
  );
}
