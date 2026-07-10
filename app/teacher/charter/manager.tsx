"use client";

import { useActionState, useEffect, useState } from "react";
import { saveCharterItem, deleteCharterItem } from "./actions";
import type { ActionResult, CharterItem } from "@/lib/types";
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

export function CharterManager({ items }: { items: CharterItem[] }) {
  const [editing, setEditing] = useState<CharterItem | "new" | null>(null);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveCharterItem,
    null
  );

  useEffect(() => {
    if (state?.ok) setEditing(null);
  }, [state]);

  const fe = state && !state.ok ? state.fieldErrors : undefined;
  const current = editing === "new" ? null : editing;
  const nextOrder =
    items.length > 0 ? Math.max(...items.map((i) => i.display_order)) + 1 : 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy-600">{items.length} butir kesepakatan</p>
        <EditToggle
          editing={editing !== null}
          onToggle={() => setEditing(editing ? null : "new")}
          newLabel="Tambah butir"
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
                <Label htmlFor="title">Kesepakatan</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  maxLength={200}
                  placeholder="Contoh: Kita hadir tepat waktu"
                  defaultValue={current?.title ?? ""}
                  className="mt-1.5"
                />
                <FieldError message={fe?.title?.[0]} />
              </div>
              <div>
                <Label htmlFor="description">Penjelasan (opsional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={2}
                  maxLength={1000}
                  defaultValue={current?.description ?? ""}
                  className="mt-1.5"
                />
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div className="w-28">
                  <Label htmlFor="display_order">Urutan</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    min={0}
                    max={999}
                    defaultValue={current?.display_order ?? nextOrder}
                    className="mt-1.5"
                  />
                </div>
                <label className="flex items-center gap-2.5 pb-3 text-sm text-navy-800">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="true"
                    defaultChecked={current?.is_active ?? true}
                    className="h-4 w-4 rounded border-navy-300 accent-[#16263c]"
                  />
                  Aktif (tampil untuk kelas)
                </label>
              </div>
              {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
              <SubmitButton pendingText="Menyimpan…">
                {current ? "Simpan perubahan" : "Tambahkan"}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada kesepakatan"
          description="Rumuskan bersama kelas, lalu catat butir-butirnya di sini."
        />
      ) : (
        <ol className="space-y-3">
          {items.map((c) => (
            <li key={c.id}>
              <Card className={!c.is_active ? "opacity-60" : undefined}>
                <CardContent className="flex items-start gap-4 px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
                    {c.display_order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-navy-900">{c.title}</p>
                      {!c.is_active ? <Badge>Nonaktif</Badge> : null}
                    </div>
                    {c.description ? (
                      <p className="mt-1 text-sm text-navy-600">
                        {c.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="flex shrink-0 items-center gap-1">
                    <EditButton onClick={() => setEditing(c)} />
                    <DeleteButton action={deleteCharterItem} id={c.id} />
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
