"use client";

import { useActionState, useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteStudent } from "../actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { ErrorNote } from "@/components/ui/feedback";

/**
 * Permanent deletion with a typed confirmation — the teacher must
 * type the student's username so a stray tap can never wipe data.
 */
export function DeleteStudentForm({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    deleteStudent,
    null
  );
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const match = typed.trim().toLowerCase() === username.toLowerCase();

  return (
    <Card className="border-red-200">
      <CardContent className="px-5 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-medium text-navy-900">
                Hapus akun siswa
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-navy-500">
                Permanen: profil, denyut, pesan, target, kapsul waktu, dan slot
                piket ikut terhapus. Hanya untuk akun dummy/uji coba — untuk
                siswa sungguhan, gunakan <strong>Nonaktifkan akun</strong> agar
                datanya tetap tersimpan.
              </p>
            </div>

            {!open ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => setOpen(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Hapus akun ini…
              </Button>
            ) : (
              <form action={action} className="space-y-3">
                <input type="hidden" name="user_id" value={userId} />
                <div>
                  <Label htmlFor="confirm-username" className="text-xs">
                    Ketik <span className="font-mono">{username}</span> untuk
                    mengonfirmasi:
                  </Label>
                  <Input
                    id="confirm-username"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className="mt-1.5 h-9 max-w-60 font-mono text-sm"
                  />
                </div>
                {state && !state.ok ? (
                  <ErrorNote>{state.error}</ErrorNote>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    disabled={!match || pending}
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden />
                    )}
                    Hapus permanen
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      setTyped("");
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
