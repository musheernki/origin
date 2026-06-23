import { useListBookings } from "@workspace/api-client-react";
import { glassStyles } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2 } from "lucide-react";

export default function Bookings() {
  const { data: bookingsData, isLoading } = useListBookings();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Your Journeys</h1>
        <p className="text-muted-foreground">Manage your upcoming and past bookings.</p>
      </div>

      {!bookingsData?.length ? (
        <div className={`p-12 text-center rounded-2xl ${glassStyles.panel}`}>
          <h3 className="text-xl font-serif mb-2">No bookings found</h3>
          <p className="text-muted-foreground mb-6">You haven't booked any journeys yet.</p>
          <Link href="/destinations" className="text-primary hover:underline uppercase tracking-widest text-sm font-medium">Explore Destinations</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookingsData.map((booking) => (
            <Link key={booking.id} href={`/bookings/${booking.id}`}>
              <div className={`flex flex-col md:flex-row gap-6 p-4 rounded-2xl ${glassStyles.card} cursor-pointer group`}>
                <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                  <img src={booking.destinationImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"} alt={booking.destinationName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div className="flex justify-between items-start mb-4 md:mb-0">
                    <div>
                      <h3 className="text-xl font-serif mb-2">{booking.destinationName}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(booking.checkIn), "MMM d")} - {format(new Date(booking.checkOut), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{booking.guests} Guests</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`capitalize ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-sm text-muted-foreground">Booked on {format(new Date(booking.createdAt), "MMM d, yyyy")}</p>
                    <p className="text-xl font-serif text-primary">${booking.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
