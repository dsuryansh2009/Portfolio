"use client";

import { useState } from "react";
import { likeScribbleAction } from "@/app/actions/scribble";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface Scribble {
  id: string;
  imageUrl: string;
  nickname: string;
  likes: number;
  createdAt: Date;
}

export function CommunityScribbles({ initialScribbles }: { initialScribbles: Scribble[] }) {
  const [scribbles, setScribbles] = useState<Scribble[]>(initialScribbles);

  if (scribbles.length === 0) return null;

  const handleLike = async (id: string) => {
    // Optimistic UI
    setScribbles(current =>
      current.map(s => s.id === id ? { ...s, likes: s.likes + 1 } : s)
    );
    
    const result = await likeScribbleAction(id);
    if (!result.success) {
      // Revert if failed
      setScribbles(current =>
        current.map(s => s.id === id ? { ...s, likes: s.likes - 1 } : s)
      );
    }
  };

  return (
    <div className="my-16">
      <h2 className="text-2xl font-bold text-white mb-8 px-4 border-l-4 border-blue-500">
        Community Scribbles
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
        {scribbles.map((scribble) => (
          <motion.div
            key={scribble.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="group relative bg-zinc-900/50 rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all shadow-lg"
          >
            <div className="aspect-square relative p-2 bg-black/50">
              <Image
                src={scribble.imageUrl}
                alt={`Scribble by ${scribble.nickname}`}
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>
            
            <div className="p-4 flex items-center justify-between bg-zinc-900">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white truncate max-w-[100px]">
                  {scribble.nickname}
                </span>
                <span className="text-xs text-white/40">
                  {new Date(scribble.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => handleLike(scribble.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-red-400 transition-colors"
              >
                <Heart size={14} className="group-hover:fill-red-400/20" />
                <span className="text-xs font-semibold">{scribble.likes}</span>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
