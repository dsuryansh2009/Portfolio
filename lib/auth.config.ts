import GitHub from "next-auth/providers/github"
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      console.log("GitHub User Email:", user.email);
      console.log("Expected Admin Email:", process.env.ADMIN_EMAIL);
      if (user.email === process.env.ADMIN_EMAIL) {
        return true
      }
      console.log("Unauthorized: Emails do not match.");
      return false // Unauthorized
    },
    async session({ session }) {
      return session
    }
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/error",
  }
} satisfies NextAuthConfig
