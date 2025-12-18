"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { UserActions } from "./user-actions";
import PageHeader from "~/components/page-header";
import { trpc } from "~/trpc/client";
import { formatDate } from "date-fns";
import { Card } from "~/components/ui/card";
import AddUserModal from "~/components/modals/add-user-modal";

export default function UserList() {
  const [users] = trpc.users.getAll.useSuspenseQuery({});
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="User Management"
        subtitle="Manage application users"
        actions={<AddUserModal />}
      />
      
      {/* filters here... */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{formatDate(user.createdAt, "PP")}</TableCell>
                <TableCell>
                  <UserActions user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
