import { getAllScribblesAction } from "@/app/actions/scribble";
import ScribblesClient from "./client";

export default async function AdminScribblesPage() {
  const allScribbles = await getAllScribblesAction();
  return <ScribblesClient initialScribbles={allScribbles} />;
}
