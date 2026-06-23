import { Link } from "wouter";
import { Plane } from "lucide-react";
import { glassStyles } from "@/lib/theme";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 dark:opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
      
      <div className={`relative z-10 max-w-md w-full p-8 md:p-12 text-center rounded-3xl ${glassStyles.widget}`}>
        <Plane className="h-12 w-12 text-primary mx-auto mb-6 opacity-80" />
        <h1 className="text-6xl font-serif font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          This destination appears to be off the map.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wider text-sm transition-all"
        >
          RETURN TO CIVILIZATION
        </Link>
      </div>
    </div>
  );
}
