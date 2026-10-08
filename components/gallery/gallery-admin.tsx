"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit, Trash2, Upload, GripVertical, Image as ImageIcon } from "lucide-react";
import { Reorder } from "framer-motion";
import { 
  createFolderAction, 
  updateFolderAction, 
  deleteFolderAction, 
  uploadImageAction, 
  updateImageAction, 
  deleteImageAction,
  reorderFoldersAction,
  reorderImagesAction
} from "@/app/actions/gallery";
import { useRouter } from "next/navigation";

export default function GalleryAdmin({ folders: initialFolders }: { folders: any[] }) {
  const router = useRouter();
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [folders, setFolders] = useState(initialFolders);
  
  useEffect(() => {
    setFolders(initialFolders);
  }, [initialFolders]);

  const onRefresh = () => {
    router.refresh();
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);

  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name) return;
    await createFolderAction({ name });
    onRefresh();
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this folder and all its images?")) return;
    await deleteFolderAction(id);
    if (activeFolderId === id) setActiveFolderId(null);
    onRefresh();
  };

  const handleUpdateFolder = async (id: string, currentName: string) => {
    const name = prompt("Enter new folder name:", currentName);
    if (!name) return;
    await updateFolderAction(id, { name });
    onRefresh();
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeFolderId || !e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", activeFolderId);
      
      try {
        await uploadImageAction(formData);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    
    setIsUploading(false);
    onRefresh();
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    await deleteImageAction(id);
    onRefresh();
  };

  const handleReorderFolders = async (newOrder: any[]) => {
    setFolders(newOrder);
    await reorderFoldersAction(newOrder.map(f => f.id));
  };

  const handleReorderImages = async (newOrder: any[]) => {
    // Update local state immediately for snappy UI
    setFolders(prev => prev.map(f => f.id === activeFolderId ? { ...f, images: newOrder } : f));
    await reorderImagesAction(newOrder.map(img => img.id));
  };

  return (
    <div className="text-white pb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Manage Gallery</h2>
      </div>

      {!activeFolderId ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Folders</h3>
            <button onClick={handleCreateFolder} className="bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-white/90 transition-colors">
              <Plus size={16} /> New Folder
            </button>
          </div>
          
          <Reorder.Group axis="y" values={folders} onReorder={handleReorderFolders} className="flex flex-col gap-4">
            {folders.map((folder) => (
              <Reorder.Item key={folder.id} value={folder} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="cursor-grab active:cursor-grabbing p-2 text-white/30 hover:text-white transition-colors">
                    <GripVertical size={20} />
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto md:flex-1">
                    <input 
                      type="text"
                      defaultValue={folder.name}
                      placeholder="Folder Name"
                      className="bg-transparent font-bold text-lg border-b border-transparent focus:border-white/30 outline-none transition-colors px-1"
                      onBlur={async (e) => {
                        if (e.target.value !== folder.name && e.target.value.trim() !== "") {
                          await updateFolderAction(folder.id, { name: e.target.value.trim() });
                          onRefresh();
                        }
                      }}
                    />
                    <input 
                      type="text"
                      defaultValue={folder.coverImage || ""}
                      placeholder="Cover Image URL (Optional)"
                      className="bg-black/20 text-white/70 text-xs p-2 rounded-lg border border-white/10 focus:border-blue-500 outline-none w-full max-w-sm"
                      onBlur={async (e) => {
                        if (e.target.value !== (folder.coverImage || "")) {
                          await updateFolderAction(folder.id, { coverImage: e.target.value });
                          onRefresh();
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <button onClick={() => setActiveFolderId(folder.id)} className="bg-blue-500 hover:bg-blue-400 text-black px-4 py-2 rounded-lg font-medium text-sm transition-colors mr-2">
                    Manage Images
                  </button>
                  <button onClick={() => handleDeleteFolder(folder.id)} className="bg-red-500/10 text-red-400 p-2.5 rounded-lg hover:bg-red-500/20 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          {folders.length === 0 && (
            <div className="py-12 text-center text-white/40 border border-dashed border-white/10 rounded-xl">
              No folders found. Create one to start.
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveFolderId(null)} className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className="text-white/50 text-xs uppercase tracking-wider font-medium">Folder</span>
                <h3 className="text-xl font-bold">{activeFolder?.name}</h3>
              </div>
            </div>
            
            <label className="bg-blue-500 text-black px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold cursor-pointer hover:bg-blue-400 transition-colors">
              {isUploading ? "Uploading..." : <><Upload size={18} /> Upload Media</>}
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleUploadImage} disabled={isUploading} />
            </label>
          </div>

          <Reorder.Group axis="y" values={activeFolder?.images || []} onReorder={handleReorderImages} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeFolder?.images?.map((img: any) => (
              <Reorder.Item key={img.id} value={img} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col relative">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <div className="cursor-grab active:cursor-grabbing p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-black/80 transition-colors">
                    <GripVertical size={16} />
                  </div>
                  <button onClick={() => handleDeleteImage(img.id)} className="p-2 bg-red-500/80 backdrop-blur-md text-white rounded-lg hover:bg-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="aspect-[4/3] bg-black/50 w-full overflow-hidden">
                  <img src={img.imageUrl} alt={img.title || "Image"} className="w-full h-full object-contain" />
                </div>
                
                <div className="p-4 flex flex-col gap-2">
                  <div>
                    <label className="text-xs text-white/50 font-medium">Title</label>
                    <input 
                      type="text" 
                      defaultValue={img.title || ""}
                      placeholder="Add a title..."
                      className="w-full bg-black/20 text-white text-sm p-2.5 rounded-lg mt-1 border border-white/10 focus:border-blue-500 outline-none transition-colors"
                      onBlur={async (e) => {
                        if (e.target.value !== img.title) {
                          await updateImageAction(img.id, { title: e.target.value });
                          onRefresh();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-medium">Description</label>
                    <textarea 
                      defaultValue={img.description || ""}
                      placeholder="Add a description..."
                      rows={2}
                      className="w-full bg-black/20 text-white text-sm p-2.5 rounded-lg mt-1 border border-white/10 focus:border-blue-500 outline-none transition-colors resize-none"
                      onBlur={async (e) => {
                        if (e.target.value !== img.description) {
                          await updateImageAction(img.id, { description: e.target.value });
                          onRefresh();
                        }
                      }}
                    />
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          {(!activeFolder?.images || activeFolder.images.length === 0) && (
            <div className="py-20 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
              No media in this folder yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
