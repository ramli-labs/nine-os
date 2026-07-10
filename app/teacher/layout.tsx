import { requireTeacher } from "@/lib/auth";
import { TeacherShell } from "@/components/teacher-shell";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireTeacher();
  return (
    <TeacherShell nickname={profile.nickname || profile.full_name}>
      {children}
    </TeacherShell>
  );
}
