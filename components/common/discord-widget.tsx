"use client";

import { motion } from "framer-motion";
import { useLanyard } from "use-lanyard";
import { useEffect, useState } from "react";

// Replace this with your actual Discord ID
// You can get it by enabling Developer Mode in Discord settings, 
// right-clicking your profile, and selecting "Copy User ID"
// Note: You MUST join the Lanyard Discord server for this to work: https://discord.gg/lanyard
const DISCORD_ID = "973202333381038080"; 

export default function DiscordWidget() {
  const lanyard = useLanyard(DISCORD_ID);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !lanyard) return null;

  // Filter out Spotify if they are using the Music Widget for that, 
  // or we can show whatever activity is active.
  // Activities[0] is usually the primary one (like VS Code, a game, etc.)
  const activity = lanyard.activities.find(a => a.type !== 2) || lanyard.activities[0];
  const isOnline = lanyard.discord_status !== "offline";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-[#23a559]";
      case "idle": return "bg-[#f0b132]";
      case "dnd": return "bg-[#f23f42]";
      default: return "bg-[#80848e]";
    }
  };

  return (
    <motion.a 
      href={`https://discord.com/users/${DISCORD_ID}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20, scale: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }} // Slight delay after music widget
      className="relative flex flex-col origin-bottom cursor-pointer group/discord"
    >
      {/* Hover Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover/discord:opacity-100 group-hover/discord:-translate-y-1 transition-all duration-300 ease-out whitespace-nowrap z-50">
        <div className="bg-[#121614]/95 text-[#a3b3ac] border border-[#26332a] text-xs px-3 py-1.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-1.5">
          <span>( my discord status )</span>
        </div>
      </div>

      {/* Main Widget Card */}
      <div 
        title="( my discord status )"
        className="w-[320px] flex items-center gap-4 bg-[#151a17] border border-[#26332a] p-3 pr-8 rounded-2xl shadow-2xl transition-all duration-300 group-hover/discord:border-[#5865F2]/40 group-hover/discord:shadow-[0_0_30px_rgba(88,101,242,0.15)] group-hover/discord:-translate-y-1"
      >
        <div className="relative w-16 h-16 flex-shrink-0">
          <div className="w-full h-full rounded-xl overflow-hidden bg-[#2b2d31] border border-white/5 flex items-center justify-center">
            {activity?.assets?.large_image ? (
              <img 
                src={
                  activity.assets.large_image.startsWith("spotify:")
                  ? `https://i.scdn.co/image/${activity.assets.large_image.split("spotify:")[1]}`
                  : activity.assets.large_image.startsWith("mp:external") 
                  ? `https://media.discordapp.net/external/${activity.assets.large_image.split("mp:external/")[1]}`
                  : `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`
                } 
                alt={activity.name} 
                className="w-full h-full object-cover" 
              />
            ) : lanyard.discord_user.avatar ? (
              <img 
                src={`https://cdn.discordapp.com/avatars/${lanyard.discord_user.id}/${lanyard.discord_user.avatar}.png?size=128`}
                alt={lanyard.discord_user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 bg-neutral-800">
                 <span className="text-xs">No Img</span>
              </div>
            )}
          </div>
          
          {/* Status Indicator */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#151a17] rounded-full flex items-center justify-center z-10">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(lanyard.discord_status)}`} />
          </div>
        </div>
        
        <div className="flex flex-col justify-center flex-1 min-w-0 overflow-hidden">
          <div className="text-[11px] font-bold tracking-widest text-[#a3b3ac] uppercase mb-1 flex items-center gap-1.5 truncate">
            {activity ? "Doing things" : (
              lanyard.discord_status === "online" ? "Online" :
              lanyard.discord_status === "idle" ? "Idle" :
              lanyard.discord_status === "dnd" ? "Do Not Disturb" : "Offline"
            )}
          </div>
          <div className="text-[17px] font-bold text-[#f2f5f4] leading-tight truncate">
            {activity ? activity.name : lanyard.discord_user.username}
          </div>
          <div className="text-[13px] font-medium text-[#84968e] truncate mt-0.5">
            {activity 
              ? (activity.details || activity.state || "Active") 
              : (lanyard.discord_status === "offline" ? "Currently away" : "Chilling on Discord")}
          </div>
        </div>
      </div>
    </motion.a>
  );
}
