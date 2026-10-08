import { getPosts } from "@/app/actions/blog"
import BlogClient from "./client"

export default async function AdminBlogPage() {
  const adminPosts = await getPosts("dsuryansh")
  const visitorPosts = await getPosts("visitor")
  const allPosts = [...adminPosts, ...visitorPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return <BlogClient initialPosts={allPosts} />
}
