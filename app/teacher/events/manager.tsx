"use client";

import { useActionState, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { saveEvent, deleteEvent } from "./actions";
import type { ActionResult, ClassEvent } from "@/lib/types";
import { formatDateTimeID, toJakartaInputValue } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea, FieldError, Hint } from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
  EmptyState,
} from "@/components/ui/feedback";
import { DeleteButton, EditButton, EditToggle } from "@/components/crud/crud-bits";

export function EventManager({ items }: { items: ClassEvent[] }) {
  const [editing, setEditing] = useState<ClassEvent | "new" | null>(null);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveEvent,
    null
  );

  useEffect(() => {
    if (state?.ok) setEditing(null);
  }, [state]);

  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const current = editing === "new" ? null : editing;
  const now = new Date().toISOString();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-600">{items.length} agenda</p>
        <EditToggle
          editing={editing !== null}
          onToggle={() => setEditing(editing ? null : "new")}
          newLabel="Tambah agenda"
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="start_at">Mulai</Label>
                  <Input
                    id="start_at"
                    name="start_at"
                    type="datetime-local"
                    required
                    defaultValue={
                      current ? toJakartaInputValue(current.start_at) : ""
                    }
                    className="mt-1.5"
                  />
                  <FieldError message={fe?.start_at?.[0]} />
                </div>
                <div>
                  <Label htmlFor="end_at">Selesai (opsional)</Label>
                  <Input
                    id="end_at"
                    name="end_at"
                    type="datetime-local"
                    defaultValue={
                      current?.end_at ? toJakartaInputValue(current.end_at) : ""
                    }
                    className="mt-1.5"
                  />
                  <FieldError message={fe?.end_at?.[0]} />
                </div>
              </div>
              <Hint>Waktu ditulis dalam zona Asia/Jakarta (WIB).</Hint>
              <div>
                <Label htmlFor="location">Lokasi (opsional)</Label>
                <Input
                  id="location"
                  name="location"
                  maxLength={200}
                  defaultValue={current?.location ?? ""}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi (opsional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={2}
                  maxLength={2000}
                  defaultValue={current?.description ?? ""}
                  className="mt-1.5"
                />
              </div>
              {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
              <SubmitButton pendingText="Menyimpan…">
                {current ? "Simpan perubahan" : "Tambahkan agenda"}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada agenda"
          description="Agenda kelas yang kamu buat akan tampil di beranda siswa."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((ev) => (
            <li key={ev.id}>
              <Card className={ev.start_at < now ? "opacity-60" : undefined}>
                <CardContent className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-navy-900">{ev.title}</p>
                    <span className="ml-auto flex items-center gap-1">
                      <EditButton onClick={() => setEditing(ev)} />
                      <DeleteButton action={deleteEvent} id={ev.id} />
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-navy-600">
                    {formatDateTimeID(ev.start_at)}
                    {ev.end_at ? ` — ${formatDateTimeID(ev.end_at)}` : ""}
                  </p>
                  {ev.location ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-navy-500">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {ev.location}
                    </p>
                  ) : null}
                  {ev.description ? (
                    <p className="mt-2 text-sm text-navy-600">{ev.description}</p>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
