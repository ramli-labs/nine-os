import { WEEKDAY_LABELS } from "@/lib/piket";
import type { Gender, PiketAssignment } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PiketRow = PiketAssignment & {
  profiles: {
    nickname: string;
    full_name: string;
    gender: Gender | null;
  } | null;
};

/** Mon–Fri schedule grid. `showGender` is for the teacher view. */
export function PiketGrid({
  rows,
  highlightStudentId,
  showGender = false,
}: {
  rows: PiketRow[];
  highlightStudentId?: string;
  showGender?: boolean;
}) {
  const byDay = new Map<number, PiketRow[]>();
  for (const row of rows) {
    const list = byDay.get(row.weekday) ?? [];
    list.push(row);
    byDay.set(row.weekday, list);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((day) => {
        const members = (byDay.get(day) ?? []).sort(
          (a, b) => a.display_order - b.display_order
        );
        const male = members.filter((m) => m.profiles?.gender === "L").length;
        const female = members.filter((m) => m.profiles?.gender === "P").length;

        return (
          <Card key={day}>
            <CardContent className="px-4 py-4">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold text-navy-950">
                  {WEEKDAY_LABELS[day]}
                </p>
                <span className="text-xs text-navy-400">
                  {members.length} siswa
                  {showGender ? ` · ${male}L/${female}P` : ""}
                </span>
              </div>
              {members.length === 0 ? (
                <p className="mt-3 text-sm text-navy-400">—</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {members.map((m) => {
                    const isMe = m.student_id === highlightStudentId;
                    return (
                      <li
                        key={m.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-1 text-sm",
                          isMe
                            ? "bg-accent-400/15 font-semibold text-navy-950"
                            : "text-navy-800"
                        )}
                      >
                        <span className="truncate">
                          {m.profiles?.nickname ||
                            m.profiles?.full_name ||
                            "Siswa"}
                        </span>
                        {showGender && m.profiles?.gender ? (
                          <Badge className="ml-auto shrink-0">
                            {m.profiles.gender}
                          </Badge>
                        ) : null}
                        {isMe ? (
                          <Badge tone="amber" className="ml-auto shrink-0">
                            kamu
                          </Badge>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
