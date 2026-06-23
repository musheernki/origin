import { AdminLayout } from "@/components/layout/admin-layout";
import { useListUsers, useUpdateUserRole, queryClient, getListUsersQueryKey } from "@workspace/api-client-react";
import { glassStyles } from "@/lib/theme";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();
  const { toast } = useToast();

  const updateRole = useUpdateUserRole({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "Role updated" });
      }
    }
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif mb-2">Users</h1>
          <p className="text-muted-foreground">Manage platform users and roles.</p>
        </div>
      </div>

      <div className={`rounded-2xl ${glassStyles.panel} overflow-hidden`}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id} className="border-border hover:bg-white/5">
                <TableCell className="font-medium flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  {user.name}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/10 text-secondary-foreground border-secondary/20'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Select 
                    defaultValue={user.role} 
                    onValueChange={(val: 'admin' | 'user') => updateRole.mutate({ id: user.id, data: { role: val } })}
                    disabled={updateRole.isPending}
                  >
                    <SelectTrigger className="w-[120px] ml-auto h-8 bg-transparent border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
