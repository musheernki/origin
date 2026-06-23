import { useGetMe, useListBookings, useGetNotifications } from "@workspace/api-client-react";
import { glassStyles } from "@/lib/theme";
import { Link } from "wouter";
import { format } from "date-fns";
import { Calendar, Plane, Bell, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const { data: bookings, isLoading: bookingsLoading } = useListBookings({ limit: 5 });
  const { data: notifications, isLoading: notifLoading } = useGetNotifications();

  if (userLoading || bookingsLoading || notifLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeBookings = bookings?.filter(b => b.status === 'confirmed' || b.status === 'pending') || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-12">
        <h1 className="text-4xl font-serif mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Traveler'}</h1>
        <p className="text-muted-foreground">Your portal to extraordinary journeys.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Stats / Welcome */}
        <div className="md:col-span-2 space-y-8">
          <div className={`p-8 rounded-3xl ${glassStyles.panel} bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden`}>
            <div className="relative z-10">
              <h2 className="text-2xl font-serif mb-4">Ready for your next adventure?</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Explore our newly curated luxury escapes and off-the-beaten-path experiences.
              </p>
              <Link href="/destinations" className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold tracking-wider text-sm hover:bg-primary/90 transition-colors">
                <Plane className="mr-2 h-4 w-4" />
                EXPLORE DESTINATIONS
              </Link>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-serif">Recent Bookings</h3>
              <Link href="/bookings" className="text-primary hover:underline text-sm tracking-widest uppercase">View All</Link>
            </div>
            
            <div className="space-y-4">
              {bookings?.slice(0, 3).map((booking) => (
                <Link key={booking.id} href={`/bookings/${booking.id}`}>
                  <div className={`p-4 rounded-xl ${glassStyles.card} flex items-center gap-4 cursor-pointer group`}>
                    <img src={booking.destinationImage} alt={booking.destinationName} className="w-20 h-20 rounded-lg object-cover group-hover:scale-105 transition-transform" />
                    <div className="flex-1">
                      <h4 className="font-serif text-lg">{booking.destinationName}</h4>
                      <p className="text-sm text-muted-foreground">{format(new Date(booking.checkIn), "MMM d, yyyy")}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {booking.status}
                    </Badge>
                  </div>
                </Link>
              ))}
              {bookings?.length === 0 && (
                <p className="text-muted-foreground p-4 text-center rounded-xl bg-white/5 border border-white/10">No recent bookings.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className={`p-6 rounded-2xl ${glassStyles.panel}`}>
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-muted-foreground">Active Trips</span>
                <span className="font-serif text-2xl">{activeBookings.length}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <span className="text-muted-foreground">Total Journeys</span>
                <span className="font-serif text-2xl">{bookings?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${glassStyles.panel}`}>
            <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {notifications?.map((notif) => (
                <div key={notif.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                  <p className={`text-sm ${notif.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(notif.createdAt), "MMM d, h:mm a")}</p>
                </div>
              ))}
              {notifications?.length === 0 && (
                <p className="text-muted-foreground text-sm text-center">All caught up.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
