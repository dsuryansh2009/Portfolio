import { Metadata, ResolvingMetadata } from "next";
import PortfolioClient from "@/app/(portfolio)/portfolio-client";
import { getFolderBySlug } from "@/app/actions/gallery";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const folder = await getFolderBySlug(resolvedParams.slug);

  if (!folder) {
    return {
      title: "Gallery Not Found",
    };
  }

  return {
    title: `${folder.name} | Gallery`,
    description: folder.description || `View the ${folder.name} gallery by Suryansh.`,
    openGraph: {
      title: `${folder.name} | Gallery | Suryansh`,
      description: folder.description || `View the ${folder.name} gallery by Suryansh.`,
      url: `/gallery/${resolvedParams.slug}`,
      images: folder.images && folder.images.length > 0 ? [{ url: folder.images[0].imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${folder.name} | Gallery | Suryansh`,
      description: folder.description || `View the ${folder.name} gallery by Suryansh.`,
      images: folder.images && folder.images.length > 0 ? [folder.images[0].imageUrl] : [],
    },
  };
}

export default async function GalleryPage({ params }: Props) {
  const resolvedParams = await params;
  const folder = await getFolderBySlug(resolvedParams.slug);

  if (!folder) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <h1>Gallery Not Found</h1>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": folder.name,
    "description": folder.description || `Gallery for ${folder.name}`,
    "url": `${process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"}/gallery/${resolvedParams.slug}`,
    "image": folder.images?.map(img => img.imageUrl) || []
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PortfolioClient initialActiveFolder={resolvedParams.slug} />
    </>
  );
}
