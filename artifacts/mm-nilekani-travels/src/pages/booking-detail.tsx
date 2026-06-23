import { useParams } from "wouter";
import { useGetBooking, useUpdateBooking, queryClient, getGetBookingQueryKey } from "@workspace/api-client-react";
import { glassStyles } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BookingDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();

  const { data: booking, isLoading } = useGetBooking(id, {
    query: {
      enabled: !!id,
      queryKey: getGetBookingQueryKey(id),
    }
  });

  const updateBooking = useUpdateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        toast({ title: "Booking cancelled" });
      }
    }
  });

  const handleCancel = () => {
    updateBooking.mutate({
      id,
      data: { status: 'cancelled' }
    });
  };

  if (isLoading || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-2">Booking #{booking.id}</p>
          <h1 className="text-3xl md:text-4xl font-serif">{booking.destination.name}</h1>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="capitalize text-sm bg-white/5">
            Payment: {booking.paymentStatus}
          </Badge>
          <Badge variant="outline" className={`capitalize text-sm ${
            booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
            booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
          }`}>
            {booking.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className={`p-6 rounded-2xl ${glassStyles.panel}`}>
            <h3 className="font-serif text-xl mb-4">Journey Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Check-in</p>
                <p className="font-medium">{format(new Date(booking.checkIn), "PPP")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Check-out</p>
                <p className="font-medium">{format(new Date(booking.checkOut), "PPP")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Guests</p>
                <p className="font-medium">{booking.guests} People</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="font-medium">{booking.destination.city}, {booking.destination.country}</p>
              </div>
            </div>
            {booking.specialRequests && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Special Requests</p>
                <p className="font-medium">{booking.specialRequests}</p>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl ${glassStyles.panel}`}>
            <h3 className="font-serif text-xl mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>{booking.destination.name} Package x {booking.guests}</span>
                <span>${booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-serif text-xl pt-4 border-t border-border text-foreground">
                <span>Total Amount</span>
                <span>${booking.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-8 flex gap-4">
              <Button variant="outline" className="w-full bg-white/5" onClick={() => toast({ title: "Invoice download started" })}>
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>
              {booking.paymentStatus === 'unpaid' && booking.status !== 'cancelled' && (
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl overflow-hidden aspect-[3/4]">
            <img src={booking.destination.images[0] || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"} className="w-full h-full object-cover" alt="" />
          </div>

          {['pending', 'confirmed'].includes(booking.status) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={`${glassStyles.panel} border-border`}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Refund policies apply according to our terms and conditions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent">Keep Booking</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, cancel booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
