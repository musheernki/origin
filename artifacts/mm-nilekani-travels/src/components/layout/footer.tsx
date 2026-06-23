import { Link } from "wouter";
import { Plane } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Plane className="h-6 w-6 text-primary" />
              <span className="font-serif font-bold text-xl tracking-widest text-primary">MM NILEKANI</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              Curating once-in-a-lifetime experiences for the sophisticated traveler. 
              Elevate your journey with our premium booking platform and exclusive access.
            </p>
          </div>
          
          <div>
            <h4 className="font-serif font-semibold mb-4 tracking-wider">EXPLORE</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/destinations" className="hover:text-primary transition-colors">All Destinations</Link></li>
              <li><Link href="/destinations?category=Luxury" className="hover:text-primary transition-colors">Luxury Escapes</Link></li>
              <li><Link href="/destinations?category=Adventure" className="hover:text-primary transition-colors">Curated Adventures</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-semibold mb-4 tracking-wider">LEGAL</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Booking Conditions</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MM Nilekani Travels. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
