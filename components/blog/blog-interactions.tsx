"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageCircle, Send, Trash2 } from "lucide-react";
import { getPostInteractions, createCommentAction, deleteCommentAction, reactToPostAction, reactToCommentAction } from "@/app/actions/blog";

type Comment = {
  id: string;
  authorName: string;
  text: string;
  timestamp: string;
  likes: number;
  dislikes: number;
};

type GlobalData = {
  postLikes: number;
  postDislikes: number;
  comments: Comment[];
};

type UserData = {
  postReaction: "like" | "dislike" | null;
  commentReactions: Record<string, "like" | "dislike">;
  ownedComments: string[];
};

interface BlogInteractionsProps {
  postId: string;
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function BlogInteractions({ postId }: BlogInteractionsProps) {
  const [globalData, setGlobalData] = useState<GlobalData>({
    postLikes: 0,
    postDislikes: 0,
    comments: [],
  });
  const [userData, setUserData] = useState<UserData>({
    postReaction: null,
    commentReactions: {},
    ownedComments: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchInteractions = async () => {
    try {
      const data = await getPostInteractions(postId);
      setGlobalData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, [postId]);

  const handlePostReaction = async (type: "like" | "dislike") => {
    const currentReaction = userData.postReaction;
    let newReaction: "like" | "dislike" | null = type;

    setGlobalData((prevGlobal) => {
      let newLikes = prevGlobal.postLikes;
      let newDislikes = prevGlobal.postDislikes;

      if (currentReaction === type) {
        newReaction = null;
        if (type === "like") newLikes = Math.max(0, newLikes - 1);
        if (type === "dislike") newDislikes = Math.max(0, newDislikes - 1);
      } else {
        if (currentReaction === "like") newLikes = Math.max(0, newLikes - 1);
        if (currentReaction === "dislike") newDislikes = Math.max(0, newDislikes - 1);

        if (type === "like") newLikes++;
        if (type === "dislike") newDislikes++;
      }

      return { ...prevGlobal, postLikes: newLikes, postDislikes: newDislikes };
    });

    setUserData((prev) => ({ ...prev, postReaction: newReaction }));

    if (currentReaction === type) {
      await reactToPostAction(postId, type, -1);
    } else {
      if (currentReaction) {
        await reactToPostAction(postId, currentReaction, -1);
      }
      await reactToPostAction(postId, type, 1);
    }
  };

  const handleCommentReaction = async (commentId: string, type: "like" | "dislike") => {
    const currentReaction = userData.commentReactions[commentId];
    let newReaction: "like" | "dislike" | null = type;

    setGlobalData((prevGlobal) => {
      const newComments = prevGlobal.comments.map((comment) => {
        if (comment.id !== commentId) return comment;
        let newLikes = comment.likes;
        let newDislikes = comment.dislikes;

        if (currentReaction === type) {
          newReaction = null;
          if (type === "like") newLikes = Math.max(0, newLikes - 1);
          if (type === "dislike") newDislikes = Math.max(0, newDislikes - 1);
        } else {
          if (currentReaction === "like") newLikes = Math.max(0, newLikes - 1);
          if (currentReaction === "dislike") newDislikes = Math.max(0, newDislikes - 1);

          if (type === "like") newLikes++;
          if (type === "dislike") newDislikes++;
        }
        return { ...comment, likes: newLikes, dislikes: newDislikes };
      });
      return { ...prevGlobal, comments: newComments };
    });

    const newCommentReactions = { ...userData.commentReactions };
    if (newReaction === null) {
      delete newCommentReactions[commentId];
    } else {
      newCommentReactions[commentId] = newReaction;
    }
    setUserData((prev) => ({ ...prev, commentReactions: newCommentReactions }));

    if (currentReaction === type) {
      await reactToCommentAction(commentId, type, -1);
    } else {
      if (currentReaction) {
        await reactToCommentAction(commentId, currentReaction, -1);
      }
      await reactToCommentAction(commentId, type, 1);
    }
  };

  const handlePostComment = async () => {
    if (!commentInput.trim()) return;

    const newCommentId = await createCommentAction(postId, {
      authorName: nameInput.trim() || "Anonymous",
      text: commentInput.trim(),
    });

    setUserData((prev) => ({
      ...prev,
      ownedComments: [...(prev.ownedComments || []), newCommentId],
    }));

    setCommentInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await fetchInteractions();
  };

  const handleDeleteComment = async (commentId: string) => {
    setGlobalData((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c.id !== commentId),
    }));
    await deleteCommentAction(commentId);
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const charCount = commentInput.length;
  const charLimit = 1000;

  return (
    <div className="mt-8 pt-6 border-t border-white/10 w-full flex flex-col gap-6">
      {/* Blog Engagement Bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
        <button
          onClick={() => handlePostReaction("like")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
            userData.postReaction === "like"
              ? "bg-[#84b897]/20 text-[#84b897] border border-[#84b897]/30"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
          }`}
        >
          <ThumbsUp size={16} className={userData.postReaction === "like" ? "fill-[#84b897]" : ""} />
          <span>{globalData.postLikes}</span>
        </button>
        <button
          onClick={() => handlePostReaction("dislike")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
            userData.postReaction === "dislike"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
          }`}
        >
          <ThumbsDown size={16} className={userData.postReaction === "dislike" ? "fill-red-400" : ""} />
          <span>{globalData.postDislikes}</span>
        </button>
        <button
          onClick={() => setIsCommentsOpen(!isCommentsOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
            isCommentsOpen
              ? "bg-white/10 text-white border border-white/20"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5"
          }`}
        >
          <MessageCircle size={16} className={isCommentsOpen ? "fill-white/20" : ""} />
          <span>{globalData.comments.length} Comments</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-8 pt-4 pb-2">
              {/* Comment Form */}
              <div className="flex flex-col gap-3 p-5 rounded-3xl bg-white/[0.02] border border-white/10 shadow-lg">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value.slice(0, 30))}
                  placeholder="Name (Optional)"
                  className="w-full bg-transparent border-b border-white/10 pb-2 px-1 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#84b897]/50 transition-colors"
                  maxLength={30}
                />
                <textarea
                  ref={textareaRef}
                  value={commentInput}
                  onChange={handleInputResize}
                  placeholder="Write a comment..."
                  maxLength={charLimit}
                  className="w-full bg-transparent resize-none text-white placeholder:text-white/30 focus:outline-none min-h-[60px] py-2 px-1 text-base transition-all"
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className={`text-xs ${charCount > charLimit * 0.9 ? 'text-red-400' : 'text-white/30'}`}>
                    {charCount}/{charLimit}
                  </span>
                  <button
                    onClick={handlePostComment}
                    disabled={!commentInput.trim()}
                    className="flex items-center gap-2 bg-[#84b897] hover:bg-[#95cca8] text-black px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Post</span>
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {globalData.comments.map((comment) => {
                    const reaction = userData.commentReactions[comment.id];
                    const isOwner = (userData.ownedComments || []).includes(comment.id);
                    // Use DiceBear API for avatars based on authorName and timestamp to make it somewhat unique per comment
                    const avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(comment.authorName + comment.id)}`;
                    
                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full bg-white/10" />
                            <span className="font-medium text-white/90 text-sm">{comment.authorName}</span>
                          </div>
                          <span className="text-white/30 text-xs">{formatDate(comment.timestamp)}</span>
                        </div>
                        <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed mb-4 ml-11">
                          {comment.text}
                        </p>
                        <div className="flex items-center justify-between ml-11">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleCommentReaction(comment.id, "like")}
                              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                reaction === "like" ? "text-[#84b897]" : "text-white/40 hover:text-white/80"
                              }`}
                            >
                              <ThumbsUp size={14} className={reaction === "like" ? "fill-[#84b897]" : ""} />
                              <span>{comment.likes}</span>
                            </button>
                            <button
                              onClick={() => handleCommentReaction(comment.id, "dislike")}
                              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                reaction === "dislike" ? "text-red-400" : "text-white/40 hover:text-white/80"
                              }`}
                            >
                              <ThumbsDown size={14} className={reaction === "dislike" ? "fill-red-400" : ""} />
                              <span>{comment.dislikes}</span>
                            </button>
                          </div>
                          {isOwner && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {globalData.comments.length === 0 && (
                  <p className="text-center text-white/30 text-sm py-8">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
