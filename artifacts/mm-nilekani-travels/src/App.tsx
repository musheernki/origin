import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient, setAuthTokenGetter } from "@workspace/api-client-react";

import { Navbar } from "./components/layout/navbar";
import { Footer } from "./components/layout/footer";
import Home from "./pages/home";
import NotFound from "./pages/not-found";

import Destinations from "./pages/destinations";
import DestinationDetail from "./pages/destination-detail";
import Bookings from "./pages/bookings";
import BookingDetail from "./pages/booking-detail";
import Wishlist from "./pages/wishlist";
import Dashboard from "./pages/dashboard";
import AdminDashboard from "./pages/admin/dashboard";
import AdminDestinations from "./pages/admin/destinations";
import AdminUsers from "./pages/admin/users";
import AdminBookings from "./pages/admin/bookings";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(43 74% 49%)",
    colorForeground: "hsl(222 47% 11%)",
    colorMutedForeground: "hsl(215 16% 47%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "transparent",
    colorInputForeground: "hsl(222 47% 11%)",
    colorNeutral: "hsl(214 32% 91%)",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white dark:bg-slate-950 rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-2xl font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium text-sm",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground text-xs uppercase tracking-wider",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-600",
    alertText: "text-destructive",
    logoBox: "flex justify-center mb-4",
    logoImage: "h-8",
    socialButtonsBlockButton: "border border-border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wider",
    formFieldInput: "border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-md px-3 py-2",
    footerAction: "justify-center mt-6",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20 text-destructive",
    otpCodeFieldInput: "border border-border focus:border-primary",
    formFieldRow: "mb-4",
    main: "p-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 bg-[url('https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 bg-[url('https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkAuthSetup() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkAuthSetup />
        <ClerkQueryClientCacheInvalidator />
        <Navbar />
        <main className="min-h-screen pt-20">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/destinations" component={Destinations} />
            <Route path="/destinations/:id" component={DestinationDetail} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard">
              <Show when="signed-in"><Dashboard /></Show>
              <Show when="signed-out"><Redirect to="/sign-in" /></Show>
            </Route>
            <Route path="/bookings">
              <Show when="signed-in"><Bookings /></Show>
              <Show when="signed-out"><Redirect to="/sign-in" /></Show>
            </Route>
            <Route path="/bookings/:id">
              <Show when="signed-in"><BookingDetail /></Show>
              <Show when="signed-out"><Redirect to="/sign-in" /></Show>
            </Route>
            <Route path="/wishlist">
              <Show when="signed-in"><Wishlist /></Show>
              <Show when="signed-out"><Redirect to="/sign-in" /></Show>
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin">
              <Show when="signed-in"><AdminDashboard /></Show>
              <Show when="signed-out"><Redirect to="/sign-in" /></Show>
            </Route>
            <Route path="/admin/destinations">
              <Show when="signed-in"><AdminDestinations /></Show>
              <Show when="signed-out"><Redirect to="/sign-in" /></Show>
            </Route>
            <Route path="/admin/users">
              <Show when="signed-in"><AdminUsers /></Show>
              <Show when="signed-out"><Redirect to="/sign-in" /></Show>
            </Route>
            <Route path="/admin/bookings">
              <Show when="signed-in"><AdminBookings /></Show>
              <Show when="signed-out"><Redirect to="/sign-in" /></Show>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
