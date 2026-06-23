import { useGetWishlist } from "@workspace/api-client-react";
import { DestinationCard } from "@/components/destination-card";
import { glassStyles } from "@/lib/theme";

export default function Wishlist() {
  const { data: wishlist, isLoading } = useGetWishlist();

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Your Wishlist</h1>
        <p className="text-muted-foreground">Destinations you've saved for future adventures.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[400px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : wishlist?.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl ${glassStyles.panel} max-w-2xl mx-auto`}>
          <h3 className="text-xl font-serif mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground">Start exploring our destinations and save your favorites here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist?.map((item) => (
            <DestinationCard 
              key={item.id} 
              destination={item.destination} 
              isWishlisted={true} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
