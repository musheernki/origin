import { AdminLayout } from "@/components/layout/admin-layout";
import { useListAllBookings, useUpdateBooking, queryClient, getListAllBookingsQueryKey } from "@workspace/api-client-react";
import { glassStyles } from "@/lib/theme";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function AdminBookings() {
  const { data: bookings, isLoading } = useListAllBookings();
  const { toast } = useToast();

  const updateBooking = useUpdateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAllBookingsQueryKey() });
        toast({ title: "Booking updated" });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'cancelled': return 'text-red-500';
      case 'completed': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif mb-2">All Bookings</h1>
        <p className="text-muted-foreground">Manage and track all platform reservations.</p>
      </div>

      <div className={`rounded-2xl ${glassStyles.panel} overflow-hidden`}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Booking ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((booking) => (
              <TableRow key={booking.id} className="border-border hover:bg-white/5">
                <TableCell className="font-medium">
                  <Link href={`/bookings/${booking.id}`} className="hover:text-primary transition-colors">
                    #{booking.id}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{booking.userName}</span>
                    <span className="text-xs text-muted-foreground">{booking.userEmail}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{booking.destinationName}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(booking.checkIn), "MMM d")} - {format(new Date(booking.checkOut), "MMM d, yy")}
                </TableCell>
                <TableCell className="font-serif">${booking.totalAmount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs bg-white/5">
                    {booking.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Select 
                    defaultValue={booking.status} 
                    onValueChange={(val: any) => updateBooking.mutate({ id: booking.id, data: { status: val } })}
                    disabled={updateBooking.isPending}
                  >
                    <SelectTrigger className={`w-[130px] ml-auto h-8 bg-transparent border-white/10 ${getStatusColor(booking.status)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="text-yellow-500">Pending</SelectItem>
                      <SelectItem value="confirmed" className="text-green-500">Confirmed</SelectItem>
                      <SelectItem value="completed" className="text-blue-500">Completed</SelectItem>
                      <SelectItem value="cancelled" className="text-red-500">Cancelled</SelectItem>
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
