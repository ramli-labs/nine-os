"use client";

import { useActionState, useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { saveResource, deleteResource } from "./actions";
import type { ActionResult, Resource } from "@/lib/types";
import { RESOURCE_CATEGORY_LABELS } from "@/lib/labels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Input,
  Label,
  Select,
  Textarea,
  FieldError,
} from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
  EmptyState,
} from "@/components/ui/feedback";
import { DeleteButton, EditButton, EditToggle } from "@/components/crud/crud-bits";

export function ResourceManager({ items }: { items: Resource[] }) {
  const [editing, setEditing] = useState<Resource | "new" | null>(null);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveResource,
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
        <p className="text-sm text-navy-600">{items.length} materi</p>
        <EditToggle
          editing={editing !== null}
          onToggle={() => setEditing(editing ? null : "new")}
          newLabel="Tambah materi"
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
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    id="category"
                    name="category"
                    defaultValue={current?.category ?? "study"}
                    className="mt-1.5"
                  >
                    {Object.entries(RESOURCE_CATEGORY_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Deskripsi singkat (opsional)</Label>
                <Input
                  id="description"
                  name="description"
                  maxLength={500}
                  defaultValue={current?.description ?? ""}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="content">Isi materi (opsional)</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={5}
                  maxLength={10000}
                  defaultValue={current?.content ?? ""}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="url">Tautan (opsional)</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://…"
                  defaultValue={current?.url ?? ""}
                  className="mt-1.5"
                />
                <FieldError message={fe?.url?.[0]} />
              </div>
              <label className="flex items-center gap-2.5 text-sm text-navy-800">
                <input
                  type="checkbox"
                  name="is_published"
                  value="true"
                  defaultChecked={current?.is_published ?? true}
                  className="h-4 w-4 rounded border-navy-300 accent-[#16263c]"
                />
                Publikasikan (tampil juga di halaman publik)
              </label>
              {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
              <SubmitButton pendingText="Menyimpan…">
                {current ? "Simpan perubahan" : "Tambahkan materi"}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada materi"
          description="Materi belajar, panduan SMA, etika AI — semuanya dikelola di sini."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-navy-900">{r.title}</p>
                    <Badge>{RESOURCE_CATEGORY_LABELS[r.category]}</Badge>
                    <Badge tone={r.is_published ? "green" : "neutral"}>
                      {r.is_published ? "Terbit" : "Draft"}
                    </Badge>
                    <span className="ml-auto flex items-center gap-1">
                      <EditButton onClick={() => setEditing(r)} />
                      <DeleteButton action={deleteResource} id={r.id} />
                    </span>
                  </div>
                  {r.description ? (
                    <p className="mt-1.5 text-sm text-navy-600">{r.description}</p>
                  ) : null}
                  {r.url ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-navy-500">
                      <Link2 className="h-3.5 w-3.5" aria-hidden />
                      {r.url}
                    </p>
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
