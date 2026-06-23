import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar as CalendarIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { glassStyles } from "@/lib/theme";
import { DestinationCard } from "@/components/destination-card";
import { useGetFeaturedDestinations, useGetDestinationCategories } from "@workspace/api-client-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: featuredDestinations } = useGetFeaturedDestinations();
  const { data: categories } = useGetDestinationCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation('/destinations');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=2020&auto=format&fit=crop" 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/40" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-medium text-foreground leading-tight">
              Curate Your <span className="text-primary italic">Beyond</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light tracking-wide">
              Private aviation aesthetics meets untouched wilderness. 
              Book once-in-a-lifetime journeys crafted for the sophisticated traveler.
            </p>

            <form onSubmit={handleSearch} className={`mt-12 p-2 md:p-4 rounded-full mx-auto max-w-3xl flex flex-col md:flex-row gap-2 ${glassStyles.widget}`}>
              <div className="flex-1 relative flex items-center">
                <MapPin className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Where to?" 
                  className="pl-12 border-0 bg-transparent shadow-none focus-visible:ring-0 text-foreground text-lg h-12"
                />
              </div>
              <div className="w-px h-8 bg-border hidden md:block self-center" />
              <div className="flex-1 relative flex items-center">
                <CalendarIcon className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="When?" 
                  className="pl-12 border-0 bg-transparent shadow-none focus-visible:ring-0 text-foreground text-lg h-12"
                />
              </div>
              <div className="w-px h-8 bg-border hidden md:block self-center" />
              <div className="flex-1 relative flex items-center">
                <Users className="absolute left-4 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Guests" 
                  className="pl-12 border-0 bg-transparent shadow-none focus-visible:ring-0 text-foreground text-lg h-12"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-full h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wider">
                <Search className="mr-2 h-4 w-4" />
                EXPLORE
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-primary tracking-widest text-sm font-semibold mb-2 uppercase">Curated Collection</p>
              <h2 className="text-4xl font-serif">Featured Journeys</h2>
            </div>
            <Button variant="outline" asChild className="hidden md:flex tracking-widest text-xs border-primary/20 hover:bg-primary/10 hover:text-primary">
              <Link href="/destinations">VIEW ALL</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDestinations?.map((dest) => (
              <DestinationCard key={dest.id} destination={dest} isWishlisted={dest.isWishlisted} />
            ))}
            {!featuredDestinations && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[400px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif mb-4">Travel Styles</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Find an experience perfectly tailored to your desires.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories?.map((cat) => (
              <Link key={cat.category} href={`/destinations?category=${cat.category}`}>
                <div className={`p-6 text-center cursor-pointer rounded-xl ${glassStyles.card} hover:border-primary/50 transition-colors`}>
                  <h3 className="font-serif text-lg mb-1">{cat.category}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{cat.count} destinations</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
