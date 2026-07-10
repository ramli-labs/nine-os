import { requireStudent } from "@/lib/auth";
import { StudentShell } from "@/components/student-shell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStudent();
  return (
    <StudentShell nickname={profile.nickname || profile.full_name || "Kamu"}>
      {children}
    </StudentShell>
  );
}
