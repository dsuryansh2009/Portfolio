import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dsuryansh",
    short_name: "dsuryansh",
    description: "Personal portfolio of dsuryansh showcasing AI projects, blogs, creative work, photography, sketches, and experiments with technology.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
