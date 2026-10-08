"use client";

import { useState, useRef } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { uploadScribbleAction } from "@/app/actions/scribble";
import { Pen, Eraser, Undo2, Redo2, Trash2, X, Send, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LeaveScribble() {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraserMode, setEraserMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setSuccess(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state
    setEraserMode(false);
    setStrokeColor("#ffffff");
    setStrokeWidth(4);
    setNickname("");
  };

  const toggleEraser = () => {
    canvasRef.current?.eraseMode(!eraserMode);
    setEraserMode(!eraserMode);
  };

  const undo = () => canvasRef.current?.undo();
  const redo = () => canvasRef.current?.redo();
  const clear = () => canvasRef.current?.clearCanvas();

  const handleSubmit = async () => {
    if (!canvasRef.current) return;
    try {
      setIsSubmitting(true);
      const dataUri = await canvasRef.current.exportImage("png");
      const result = await uploadScribbleAction(dataUri, nickname);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => handleClose(), 2000);
      } else {
        alert("Failed to submit scribble. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating image.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = ["#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

  return (
    <>
      <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-12">
        <h3 className="text-xl font-bold text-white mb-2">Leave a Scribble</h3>
        <p className="text-white/60 text-sm mb-6 max-w-md">
          Draw something cool, leave a note, or just doodle. Your creation will be reviewed and featured in our community gallery!
        </p>
        <button
          onClick={handleOpen}
          className="bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:bg-white/90 transition-colors flex items-center gap-2 text-sm"
        >
          <Pen size={16} /> Open Canvas
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/50">
                <h3 className="text-lg font-bold text-white">Create Scribble</h3>
                <button onClick={handleClose} className="p-2 text-white/50 hover:text-white rounded-full transition-colors hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-4 p-4 border-b border-white/5 bg-zinc-900/30">
                <div className="flex gap-2">
                  <button onClick={() => { setEraserMode(false); canvasRef.current?.eraseMode(false); }} className={`p-2 rounded-lg transition-colors ${!eraserMode ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`} title="Pen">
                    <Pen size={18} />
                  </button>
                  <button onClick={toggleEraser} className={`p-2 rounded-lg transition-colors ${eraserMode ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`} title="Eraser">
                    <Eraser size={18} />
                  </button>
                </div>
                
                <div className="w-px h-6 bg-white/10" />

                <div className="flex gap-2">
                  <button onClick={undo} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Undo">
                    <Undo2 size={18} />
                  </button>
                  <button onClick={redo} className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Redo">
                    <Redo2 size={18} />
                  </button>
                  <button onClick={clear} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Clear">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="w-px h-6 bg-white/10" />

                {/* Colors */}
                <div className="flex items-center gap-2">
                  <Palette size={16} className="text-white/50" />
                  <div className="flex gap-1.5 flex-wrap">
                    {colors.map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          setStrokeColor(c);
                          if (eraserMode) toggleEraser();
                        }}
                        className={`w-6 h-6 rounded-full transition-transform ${strokeColor === c && !eraserMode ? 'scale-110 ring-2 ring-white/50' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="w-px h-6 bg-white/10" />
                
                {/* Size */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50">Size</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-24 accent-white"
                  />
                </div>
              </div>

              {/* Canvas Area */}
              <div className="bg-black/50 p-4">
                <div className="bg-zinc-900 rounded-xl overflow-hidden border border-white/5 shadow-inner" style={{ height: "400px" }}>
                  <ReactSketchCanvas
                    ref={canvasRef}
                    strokeWidth={strokeWidth}
                    strokeColor={strokeColor}
                    eraserWidth={strokeWidth * 2}
                    canvasColor="transparent"
                    className="w-full h-full cursor-crosshair"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-zinc-900/50 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <input
                  type="text"
                  placeholder="Nickname (Optional)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 w-full sm:w-64"
                />
                
                {success ? (
                  <div className="text-green-400 text-sm font-medium flex items-center gap-2">
                    Submitted for review! 🎉
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Uploading...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Scribble
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
