import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function AdminDashboard() {
  const [totalPosts, totalImages, totalFolders, recentPosts, recentImages] = await Promise.all([
    prisma.post.count(),
    prisma.galleryImage.count(),
    prisma.galleryFolder.count(),
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, content: true, createdAt: true, authorName: true }
    }),
    prisma.galleryImage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { folder: { select: { name: true } } }
    })
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-bold">Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-white/50 text-sm font-medium uppercase tracking-wider">Total Blog Posts</span>
          <span className="text-4xl font-light mt-2">{totalPosts}</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-white/50 text-sm font-medium uppercase tracking-wider">Gallery Folders</span>
          <span className="text-4xl font-light mt-2">{totalFolders}</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-white/50 text-sm font-medium uppercase tracking-wider">Gallery Images</span>
          <span className="text-4xl font-light mt-2">{totalImages}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Blog Posts */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Posts</h2>
            <Link href="/admin/blog" className="text-sm text-blue-400 hover:text-blue-300 transition">View All</Link>
          </div>
          <div className="divide-y divide-white/10 flex-1">
            {recentPosts.length === 0 && <div className="p-6 text-white/40 text-sm">No posts found.</div>}
            {recentPosts.map(post => (
              <div key={post.id} className="p-4 px-6 hover:bg-white/[0.02] transition">
                <p className="text-white/80 line-clamp-1 mb-1">{post.content}</p>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>{post.authorName}</span>
                  <span>&bull;</span>
                  <span>{post.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Gallery Uploads */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest Uploads</h2>
            <Link href="/admin/gallery" className="text-sm text-blue-400 hover:text-blue-300 transition">View All</Link>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {recentImages.length === 0 && <div className="col-span-full text-white/40 text-sm">No images found.</div>}
            {recentImages.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-black/50 border border-white/10">
                <img src={img.imageUrl} alt={img.title || "Gallery image"} className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <span className="text-xs text-white font-medium truncate">{img.folder.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
