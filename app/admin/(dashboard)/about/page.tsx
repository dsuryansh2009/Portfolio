import { getAbout } from "@/app/actions/about"
import AboutClient from "./client"

export default async function AdminAboutPage() {
  const data = await getAbout()
  return <AboutClient initialData={data} />
}
