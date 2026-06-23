import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminStats } from "@workspace/api-client-react";
import { glassStyles } from "@/lib/theme";
import { Plane, Users, Calendar, DollarSign, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading || !stats) {
    return (
      <AdminLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const chartData = Object.entries(stats.bookingsByStatus).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif mb-2">Overview</h1>
        <p className="text-muted-foreground">Platform performance and statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign },
          { label: "Active Bookings", value: stats.activeBookings, icon: Calendar },
          { label: "Total Users", value: stats.totalUsers, icon: Users },
          { label: "Destinations", value: stats.totalDestinations, icon: Plane },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`p-6 rounded-2xl ${glassStyles.panel}`}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h3 className="text-3xl font-serif">{stat.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className={`p-6 rounded-2xl ${glassStyles.panel}`}>
          <h3 className="font-serif text-xl mb-6">Bookings by Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="status" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} className="capitalize" />
                <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`p-6 rounded-2xl ${glassStyles.panel} overflow-hidden`}>
          <h3 className="font-serif text-xl mb-6">Top Destinations</h3>
          <div className="space-y-4">
            {stats.topDestinations.slice(0, 5).map((dest) => (
              <div key={dest.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <h4 className="font-medium">{dest.name}</h4>
                  <p className="text-xs text-muted-foreground">{dest.country}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-primary">${dest.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{dest.bookingCount} bookings</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
