import { AdminLayout } from "@/components/layout/admin-layout";
import { useListDestinations, useDeleteDestination, queryClient, getListDestinationsQueryKey } from "@workspace/api-client-react";
import { glassStyles } from "@/lib/theme";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function AdminDestinations() {
  const { data: destinationsData, isLoading } = useListDestinations({ limit: 100 });
  const { toast } = useToast();

  const deleteDest = useDeleteDestination({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDestinationsQueryKey() });
        toast({ title: "Destination deleted" });
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
          <h1 className="text-3xl font-serif mb-2">Destinations</h1>
          <p className="text-muted-foreground">Manage the portfolio of luxury journeys.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wider">
          <Plus className="mr-2 h-4 w-4" />
          ADD DESTINATION
        </Button>
      </div>

      <div className={`rounded-2xl ${glassStyles.panel} overflow-hidden`}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Destination</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price (pp)</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinationsData?.destinations.map((dest) => (
              <TableRow key={dest.id} className="border-border hover:bg-white/5">
                <TableCell className="font-medium flex items-center gap-3">
                  <img src={dest.images[0]} className="w-10 h-10 rounded-lg object-cover" alt="" />
                  <div>
                    <Link href={`/destinations/${dest.id}`} className="hover:text-primary transition-colors block">
                      {dest.name}
                    </Link>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{dest.country}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{dest.category}</TableCell>
                <TableCell className="font-serif">${dest.pricePerPerson.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{dest.rating.toFixed(1)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${dest.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {dest.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this destination?')) {
                          deleteDest.mutate({ id: dest.id });
                        }
                      }}
                      disabled={deleteDest.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
