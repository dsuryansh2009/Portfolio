import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, FileText, Image as ImageIcon, User, LogOut, ExternalLink } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session || session.user?.email !== process.env.ADMIN_EMAIL) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-black border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold text-lg">
              S
            </div>
            <h2 className="text-xl font-bold tracking-tight">Admin CMS</h2>
          </div>
          
          <nav className="flex flex-col gap-2">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white font-medium">
              <Home size={18} />
              Dashboard
            </Link>
            <Link href="/admin/blog" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white font-medium">
              <FileText size={18} />
              Blog
            </Link>
            <Link href="/admin/scribbles" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white font-medium">
              <FileText size={18} />
              Scribbles
            </Link>
            <Link href="/admin/gallery" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white font-medium">
              <ImageIcon size={18} />
              Gallery
            </Link>
            <Link href="/admin/about" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white font-medium">
              <User size={18} />
              About
            </Link>
          </nav>
        </div>

        <div className="mt-10 md:mt-0 flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/70 hover:text-white font-medium">
            <ExternalLink size={18} />
            Back to Website
          </Link>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button type="submit" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400/80 hover:text-red-400 font-medium w-full text-left">
              <LogOut size={18} />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
