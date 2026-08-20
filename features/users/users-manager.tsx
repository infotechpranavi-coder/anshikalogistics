"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { createUser, deleteUser, updateUser } from "@/actions/users";
import { ModernPanel } from "@/components/shared/modern-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "MANAGER" | "OPERATOR" | "DRIVER";
  isActive: boolean;
}

export function UsersManager({ data }: { data: UserRow[] }) {
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    const payload = {
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      phone: String(formData.get("phone") || ""),
      role: String(formData.get("role")) as UserRow["role"],
      isActive: formData.get("isActive") === "on",
      password: String(formData.get("password") || "") || undefined,
    };
    const result = editing
      ? await updateUser(editing.id, payload)
      : await createUser(payload);
    if (result.success) location.reload();
    else setMessage(result.error ?? "Unable to save user.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <ModernPanel title="Team members" description="Manage access and roles" bodyClassName="p-0 sm:p-0">
        <div className="modern-table-shell rounded-none border-0 shadow-none">
          <table className="w-full text-sm">
            <thead className="modern-table-head">
              <tr>
                {["Name", "Email", "Role", "Status", ""].map((x) => (
                  <th className="px-4 py-3" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? "success" : "secondary"}>
                      {u.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </td>
                  <td className="flex justify-end gap-2 px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={async () => {
                        if (confirm(`Remove ${u.name}?`)) {
                          const r = await deleteUser(u.id);
                          if (r.success) location.reload();
                          else setMessage(r.error ?? "Unable to remove user.");
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModernPanel>

      <Card className="h-fit overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-teal-50/30">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-teal-700" />
            {editing ? "Edit user" : "Add user"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form key={editing?.id ?? "new"} action={submit} className="space-y-3">
            <Field label="Name">
              <Input name="name" defaultValue={editing?.name} required />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" defaultValue={editing?.email} required />
            </Field>
            <Field label="Phone">
              <Input name="phone" defaultValue={editing?.phone ?? ""} />
            </Field>
            <Field label={editing ? "New password (optional)" : "Password"}>
              <Input name="password" type="password" required={!editing} />
            </Field>
            <Field label="Role">
              <Select name="role" defaultValue={editing?.role ?? "OPERATOR"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["ADMIN", "MANAGER", "OPERATOR", "DRIVER"].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <label className="flex items-center gap-2">
              <Checkbox name="isActive" defaultChecked={editing?.isActive ?? true} />
              <span className="text-sm text-slate-700">Active</span>
            </label>
            {message ? <p className="text-sm text-red-700">{message}</p> : null}
            <div className="flex gap-2 pt-2">
              <Button className="shadow-sm">{editing ? "Update" : "Create"}</Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-700">{label}</Label>
      {children}
    </div>
  );
}
