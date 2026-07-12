import type { Metadata } from "next";
import { ResourcesView } from "@/components/resources-view";

export const metadata: Metadata = { title: "Materi" };

export default function StudentResourcesPage() {
  return <ResourcesView />;
}
