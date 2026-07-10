"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Trash2, Loader2, PenLine, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Delete button with a lightweight two-tap confirmation. */
export function DeleteButton({
  action,
  id,
  label = "Hapus",
}: {
  action: (formData: FormData) => Promise<void> | void;
  id: string;
  label?: string;
}) {
  const [confirming, setConfirming] = React.useState(false);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-red-700 hover:bg-red-50"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {label}
      </Button>
    );
  }

  return (
    <form action={action} className="inline-flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <DeleteConfirm />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(false)}
      >
        Batal
      </Button>
    </form>
  );
}

function DeleteConfirm() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Trash2 className="h-4 w-4" aria-hidden />
      )}
      Yakin hapus?
    </Button>
  );
}

export function EditToggle({
  editing,
  onToggle,
  newLabel = "Tambah baru",
}: {
  editing: boolean;
  onToggle: () => void;
  newLabel?: string;
}) {
  return (
    <Button
      type="button"
      variant={editing ? "ghost" : "primary"}
      size="sm"
      onClick={onToggle}
    >
      {editing ? (
        <>
          <X className="h-4 w-4" aria-hidden /> Tutup
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" aria-hidden /> {newLabel}
        </>
      )}
    </Button>
  );
}

export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick}>
      <PenLine className="h-4 w-4" aria-hidden />
      Ubah
    </Button>
  );
}
