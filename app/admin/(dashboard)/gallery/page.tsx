import { getFolders } from "@/app/actions/gallery"
import GalleryAdmin from "@/components/gallery/gallery-admin"

export default async function AdminGalleryPage() {
  const folders = await getFolders()

  return (
    <div className="relative h-full min-h-[600px]">
      <GalleryAdmin folders={folders} />
    </div>
  )
}
