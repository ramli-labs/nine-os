"use client";

import { useActionState, useEffect, useState } from "react";
import { saveAnnouncement, deleteAnnouncement } from "./actions";
import type { ActionResult, Announcement } from "@/lib/types";
import { formatDateTimeID } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
  EmptyState,
} from "@/components/ui/feedback";
import { DeleteButton, EditButton, EditToggle } from "@/components/crud/crud-bits";

export function AnnouncementManager({ items }: { items: Announcement[] }) {
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveAnnouncement,
    null
  );

  useEffect(() => {
    if (state?.ok) setEditing(null);
  }, [state]);

  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const current = editing === "new" ? null : editing;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-600">{items.length} pengumuman</p>
        <EditToggle
          editing={editing !== null}
          onToggle={() => setEditing(editing ? null : "new")}
          newLabel="Tulis pengumuman"
        />
      </div>

      {state?.ok && !editing ? <SuccessNote>{state.message}</SuccessNote> : null}

      {editing !== null ? (
        <Card>
          <CardContent>
            <form key={current?.id ?? "new"} action={action} className="space-y-4">
              {current ? (
                <input type="hidden" name="id" value={current.id} />
              ) : null}
              <div>
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  maxLength={200}
                  defaultValue={current?.title ?? ""}
                  className="mt-1.5"
                />
                <FieldError message={fe?.title?.[0]} />
              </div>
              <div>
                <Label htmlFor="content">Isi</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={5}
                  required
                  maxLength={10000}
                  defaultValue={current?.content ?? ""}
                  className="mt-1.5"
                />
                <FieldError message={fe?.content?.[0]} />
              </div>
              <label className="flex items-center gap-2.5 text-sm text-navy-800">
                <input
                  type="checkbox"
                  name="is_published"
                  value="true"
                  defaultChecked={current?.is_published ?? true}
                  className="h-4 w-4 rounded border-navy-300 accent-[#16263c]"
                />
                Publikasikan ke siswa
              </label>
              {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
              <SubmitButton pendingText="Menyimpan…">
                {current ? "Simpan perubahan" : "Terbitkan"}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada pengumuman"
          description="Tulis pengumuman pertama untuk kelas."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id}>
              <Card>
                <CardContent className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-navy-900">{a.title}</p>
                    <Badge tone={a.is_published ? "green" : "neutral"}>
                      {a.is_published ? "Terbit" : "Draft"}
                    </Badge>
                    <span className="ml-auto flex items-center gap-1">
                      <EditButton onClick={() => setEditing(a)} />
                      <DeleteButton action={deleteAnnouncement} id={a.id} />
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-navy-600">
                    {a.content}
                  </p>
                  <p className="mt-2 text-xs text-navy-400">
                    {a.published_at
                      ? `Dipublikasikan ${formatDateTimeID(a.published_at)}`
                      : `Dibuat ${formatDateTimeID(a.created_at)}`}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
