import { signIn } from "@/lib/auth"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
      <div className="p-8 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">Admin Access</h1>
        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/admin" })
          }}
        >
          <button type="submit" className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition">
            Sign in with GitHub
          </button>
        </form>
      </div>
    </div>
  )
}
