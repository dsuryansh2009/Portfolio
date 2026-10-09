"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import CreaseFlyer from "./crease-flyer";

const ProjectCard = ({ project, index }: { project: any; index: number }) => {
  return (
    <motion.div
      className="group relative flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full max-w-6xl mx-auto py-16 border-b border-white/5 last:border-0"
    >
      {/* Image Section */}
      <div className="w-full md:w-1/2 overflow-hidden rounded-2xl relative aspect-[4/3] isolate">
        <CreaseFlyer
          images={[{ image: project.imageUrl }]}
          playback={{ play: "click", hold: 2.5, speed: 5, spin: 5 }}
          posterWidth={1024}
          posterHeight={768}
        />
      </div>

      {/* Content Section */}
      <div className="w-full md:w-1/2 flex flex-col items-start text-left space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl md:text-5xl font-medium tracking-tight text-white group-hover:text-[#84b897] transition-colors duration-500">
            {project.title}
          </h3>
        </div>

        <p className="text-white/50 text-lg leading-relaxed max-w-xl">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {project.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-medium backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 pt-4">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-[#84b897] transition-colors duration-300"
            >
              <span>Live Site</span>
              <ExternalLink size={16} />
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-colors duration-300 backdrop-blur-sm"
            >
              <FaGithub size={18} />
              <span>Source</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function ProjectsShowcase({ projects = [] }: { projects?: any[] }) {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center py-24 px-8 relative z-20">
      <div className="w-full max-w-7xl mx-auto relative flex flex-col justify-center">
        {/* Projects List */}
        <div className="flex flex-col w-full relative z-20">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
