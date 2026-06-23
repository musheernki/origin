import { Link, useLocation } from "wouter";
import { useAuth, useClerk, useUser } from "@clerk/react";
import { glassStyles } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Plane, Search, User as UserIcon, LogOut, LayoutDashboard, Heart, Calendar, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetMe, useGetNotifications } from "@workspace/api-client-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const [location] = useLocation();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: user } = useGetMe({
    query: {
      enabled: !!isSignedIn,
    }
  });
  const { data: notifications } = useGetNotifications({
    query: {
      enabled: !!isSignedIn,
    }
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleSignOut = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  return (
    <nav className={`fixed top-0 w-full z-50 ${glassStyles.nav}`}>
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Plane className="h-6 w-6 text-primary" />
          <span className="font-serif font-bold text-xl tracking-widest text-primary">MM NILEKANI</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-sans font-medium text-sm tracking-widest">
          <Link href="/destinations" className="text-foreground/80 hover:text-primary transition-colors">
            DESTINATIONS
          </Link>
          <Link href="/dashboard" className="text-foreground/80 hover:text-primary transition-colors">
            EXPERIENCES
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/destinations">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          <ThemeToggle />
          
          {isSignedIn ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 mt-2" align="end">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications?.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                    ) : (
                      notifications?.map((notif) => (
                        <div key={notif.id} className="p-3 border-b border-border last:border-0">
                          <p className={`text-sm ${!notif.isRead ? 'font-medium' : 'text-muted-foreground'}`}>{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full overflow-hidden">
                    {clerkUser?.imageUrl ? (
                      <img src={clerkUser.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || clerkUser?.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || clerkUser?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex w-full cursor-pointer items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookings" className="flex w-full cursor-pointer items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="flex w-full cursor-pointer items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex w-full cursor-pointer items-center text-primary focus:text-primary">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wider">
              <Link href="/sign-in">SIGN IN</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
