import type { Metadata } from "next";
import { CharterView } from "@/components/charter-view";

export const metadata: Metadata = { title: "Kesepakatan Kelas" };

export default function StudentCharterPage() {
  return <CharterView />;
}
