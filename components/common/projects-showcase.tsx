"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { projectsData, Project } from "@/data/projects";

const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: "-100px" }}
      className="group relative flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full max-w-6xl mx-auto py-16 border-b border-white/5 last:border-0"
    >
      {/* Image Section */}
      <div className="w-full md:w-1/2 overflow-hidden rounded-2xl relative aspect-[4/3] bg-white/5 isolate">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-full object-cover"
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
          {project.tags.map((tag) => (
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

export default function ProjectsShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-center py-32 px-8 relative z-20">
      <div className="w-full max-w-7xl mx-auto relative">
        {/* Sticky Header Section */}
        <div className="sticky top-32 w-full flex flex-col md:flex-row justify-between items-start md:items-end mb-32 z-10 hidden md:flex mix-blend-difference pointer-events-none">
          <motion.h2 
            style={{ y: titleY, opacity: titleOpacity }}
            className="text-6xl md:text-8xl font-semibold tracking-tighter text-white"
          >
            Selected <br /> <span className="text-[#84b897]">Works.</span>
          </motion.h2>
          <motion.div style={{ opacity: titleOpacity }} className="text-white/40 max-w-xs text-right">
            A showcase of recent engineering and design experiments.
          </motion.div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden mb-16 space-y-4">
          <h2 className="text-5xl font-semibold tracking-tighter text-white">
            Selected <br /> <span className="text-[#84b897]">Works.</span>
          </h2>
          <p className="text-white/40 text-lg">
            A showcase of recent engineering and design experiments.
          </p>
        </div>

        {/* Projects List */}
        <div className="flex flex-col w-full relative z-20 mt-0 md:-mt-64 pt-0 md:pt-64 bg-transparent">
          {projectsData.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
