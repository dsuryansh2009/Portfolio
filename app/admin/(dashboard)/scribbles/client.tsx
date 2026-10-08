"use client";

import { useState } from "react";
import { toggleScribbleApprovalAction, toggleScribbleFeatureAction, deleteScribbleAction } from "@/app/actions/scribble";
import Image from "next/image";
import { Check, X, Trash2, Star } from "lucide-react";

export default function ScribblesClient({ initialScribbles }: { initialScribbles: any[] }) {
  const [scribbles, setScribbles] = useState(initialScribbles);

  const handleToggleApproval = async (id: string, approved: boolean) => {
    setScribbles(s => s.map(x => x.id === id ? { ...x, approved } : x));
    await toggleScribbleApprovalAction(id, approved);
  };

  const handleToggleFeature = async (id: string, isFeatured: boolean) => {
    setScribbles(s => s.map(x => x.id === id ? { ...x, isFeatured } : x));
    await toggleScribbleFeatureAction(id, isFeatured);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scribble?")) return;
    setScribbles(s => s.filter(x => x.id !== id));
    await deleteScribbleAction(id);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Manage Scribbles</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {scribbles.map(scribble => (
          <div key={scribble.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="relative aspect-square bg-black">
              <Image src={scribble.imageUrl} alt="Scribble" fill className="object-contain p-2" unoptimized />
            </div>
            <div className="p-4 flex-1 flex flex-col gap-4">
              <div>
                <p className="font-medium text-white">{scribble.nickname}</p>
                <p className="text-xs text-white/50">{new Date(scribble.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/10">
                <button
                  onClick={() => handleToggleApproval(scribble.id, !scribble.approved)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                    scribble.approved 
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {scribble.approved ? <Check size={14} /> : <X size={14} />}
                  {scribble.approved ? 'Approved' : 'Unapproved'}
                </button>
                
                <button
                  onClick={() => handleToggleFeature(scribble.id, !scribble.isFeatured)}
                  className={`p-2 rounded-lg transition-colors ${
                    scribble.isFeatured
                      ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                  title={scribble.isFeatured ? "Unfeature" : "Feature"}
                >
                  <Star size={16} className={scribble.isFeatured ? "fill-yellow-400" : ""} />
                </button>
                
                <button
                  onClick={() => handleDelete(scribble.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {scribbles.length === 0 && (
          <p className="text-white/50">No scribbles found.</p>
        )}
      </div>
    </div>
  );
}
