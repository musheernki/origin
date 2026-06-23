import { Link } from "wouter";
import { Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { glassStyles } from "@/lib/theme";
import { Destination } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useAddToWishlist, useRemoveFromWishlist, queryClient, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface DestinationCardProps {
  destination: Destination;
  isWishlisted?: boolean;
}

export function DestinationCard({ destination, isWishlisted = false }: DestinationCardProps) {
  const { isSignedIn } = useAuth();
  const { toast } = useToast();
  
  const addToWishlist = useAddToWishlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
        toast({ title: "Added to wishlist" });
      }
    }
  });
  
  const removeFromWishlist = useRemoveFromWishlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
        toast({ title: "Removed from wishlist" });
      }
    }
  });

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast({ title: "Sign in required", description: "Please sign in to save destinations.", variant: "destructive" });
      return;
    }
    
    if (isWishlisted) {
      removeFromWishlist.mutate({ destinationId: destination.id });
    } else {
      addToWishlist.mutate({ data: { destinationId: destination.id } });
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={`group relative overflow-hidden rounded-2xl ${glassStyles.card} border-border`}
    >
      <Link href={`/destinations/${destination.id}`}>
        <div className="aspect-[4/3] overflow-hidden relative">
          <img 
            src={destination.images[0] || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"} 
            alt={destination.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-4 right-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleWishlist}
              className={`h-10 w-10 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 transition-all ${isWishlisted ? 'text-primary' : 'text-white'}`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </Button>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-medium tracking-widest text-primary mb-1 uppercase">{destination.country}</p>
                <h3 className="font-serif text-xl font-medium leading-tight">{destination.name}</h3>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center text-primary mb-1">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs ml-1 font-medium">{destination.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">{destination.duration}</div>
            <div className="font-serif text-lg font-semibold">${destination.pricePerPerson.toLocaleString()}</div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {destination.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
