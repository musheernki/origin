import { Link, useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { LayoutDashboard, Map, Users, CalendarDays, Plane } from "lucide-react";
import { glassStyles } from "@/lib/theme";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { isSignedIn } = useAuth();
  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: isSignedIn,
    }
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-serif mb-4">Unauthorized</h1>
        <p className="text-muted-foreground mb-8">You do not have access to this area.</p>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/destinations", label: "Destinations", icon: Map },
    { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
    { href: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      {/* Sidebar */}
      <aside className={`w-64 border-r border-border p-6 ${glassStyles.panel} flex flex-col hidden md:flex`}>
        <div className="mb-8 flex items-center gap-2 text-primary">
          <Plane className="h-5 w-5" />
          <span className="font-serif font-bold tracking-widest text-sm">ADMIN PANEL</span>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/admin' && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}>
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
