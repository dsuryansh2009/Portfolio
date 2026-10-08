import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
    async session({ session, user }) {
      // Pass the user id or role if needed
      return session
    }
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/error",
  }
})
