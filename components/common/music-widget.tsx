"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

type TrackData = {
  name: string;
  artist: string;
  album: string;
  image: string;
  nowPlaying: boolean;
  timestamp?: string;
  username: string;
};

function getTimeAgo(uts?: string) {
  if (!uts) return "";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - parseInt(uts, 10);
  
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MusicWidget() {
  const [track, setTrack] = useState<TrackData | null>(null);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const res = await fetch(`/api/lastfm?t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        const recent = data?.recenttracks?.track?.[0];
        
        if (recent) {
          setTrack({
            name: recent.name,
            artist: recent.artist["#text"],
            album: recent.album?.["#text"] || "",
            image: recent.image[3]?.["#text"] || recent.image[2]?.["#text"] || "", 
            nowPlaying: recent["@attr"]?.nowplaying === "true",
            timestamp: recent.date?.uts,
            username: data.username || "lastfm"
          });
        }
      } catch (e) {
        console.error("Failed to fetch Last.fm data", e);
      }
    };

    fetchMusic();
    const interval = setInterval(fetchMusic, 30000); 
    return () => clearInterval(interval);
  }, []);

  if (!track) return null;

  return (
    <motion.a 
      href={`https://last.fm/user/${track.username}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20, scale: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="relative flex flex-col origin-bottom cursor-pointer group/widget"
    >
      {/* Hover Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover/widget:opacity-100 group-hover/widget:-translate-y-1 transition-all duration-300 ease-out whitespace-nowrap z-50">
        <div className="bg-[#121614]/95 text-[#a3b3ac] border border-[#26332a] text-xs px-3 py-1.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-1.5">
          <span>( dsuryansh music activity, also follow me on spotify 🥺 )</span>
        </div>
      </div>

      {/* Main Widget Card */}
      <div 
        title="( dsuryansh music activity, also follow me on spotify 🥺 )"
        className="w-[320px] flex items-center gap-4 bg-[#151a17] border border-[#26332a] p-3 pr-8 rounded-2xl shadow-2xl transition-all duration-300 group-hover/widget:border-[#84b897]/40 group-hover/widget:shadow-[0_0_30px_rgba(132,184,151,0.15)] group-hover/widget:-translate-y-1"
      >
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5">
          {track.image ? (
            <img 
              src={track.image} 
              alt={track.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 bg-neutral-800">
               <span className="text-xs">No Art</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col justify-center flex-1 min-w-0 overflow-hidden">
          <div className="text-[11px] font-bold tracking-widest text-[#a3b3ac] uppercase mb-1 truncate">
            {track.nowPlaying ? "Now Playing" : `Last Played • ${getTimeAgo(track.timestamp)}`}
          </div>
          <div className="text-[17px] font-bold text-[#f2f5f4] leading-tight truncate">
            {track.name}
          </div>
          <div className="text-[13px] font-medium text-[#84968e] truncate mt-0.5">
            {track.artist} {track.album ? `• ${track.album}` : ""}
          </div>
        </div>
      </div>
    </motion.a>
  );
}
