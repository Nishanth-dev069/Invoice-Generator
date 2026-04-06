"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Plus, Edit, Key, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { AddUserModal } from "@/components/users/AddUserModal";
import { EditUserModal } from "@/components/users/EditUserModal";
import { ResetPasswordModal } from "@/components/users/ResetPasswordModal";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

export default function UsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
    },
    onSuccess: () => {
      toast.success("User deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete user.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system access and roles.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-brand-forest text-white px-4 py-2 text-sm font-medium hover:bg-brand-forest/90 focus:outline-none focus:ring-2 focus:ring-brand-sage focus:ring-offset-2 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Created At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(Array.isArray(users) ? users : (users?.data || [])).map((user: any) => (
                <tr key={user.id} className="bg-card hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        user.role === "ADMIN"
                          ? "bg-orange-100 text-brand-forest/90"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditModalOpen(true);
                      }}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-2 rounded-md transition-colors hover:bg-muted"
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsResetModalOpen(true);
                      }}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-2 rounded-md transition-colors hover:bg-muted"
                      title="Reset Password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    {user.id !== session?.user?.id && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive inline-flex items-center justify-center p-2 rounded-md transition-colors hover:bg-muted"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddUserModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      {selectedUser && (
        <>
          <EditUserModal
            user={selectedUser}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
          />
          <ResetPasswordModal
            user={selectedUser}
            open={isResetModalOpen}
            onOpenChange={setIsResetModalOpen}
          />
        </>
      )}
    </div>
  );
}
