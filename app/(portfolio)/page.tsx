import PortfolioClient from "./portfolio-client";

export default function PortfolioPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "dsuryansh | AI Developer & Student Portfolio",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000",
    "description": "Personal portfolio of dsuryansh showcasing AI projects, blogs, creative work, photography, sketches, and experiments with technology.",
    "publisher": {
      "@type": "Person",
      "name": "dsuryansh Kumar",
      "url": process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000",
      "jobTitle": "Student & AI Developer",
      "sameAs": [
        "https://github.com/dsuryansh",
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PortfolioClient />
    </>
  );
}
