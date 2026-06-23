import { useState } from "react";
import { useListDestinations, useGetDestinationCategories, useGetPopularCountries } from "@workspace/api-client-react";
import { DestinationCard } from "@/components/destination-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { glassStyles } from "@/lib/theme";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Destinations() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState<any>("popular");

  const { data: destinationsData, isLoading } = useListDestinations({
    search: search || undefined,
    category: category || undefined,
    country: country || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sortBy,
    limit: 50,
  });

  const { data: categories } = useGetDestinationCategories();
  const { data: popularCountries } = useGetPopularCountries();

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase mb-4">Category</h3>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full bg-white/5 border-white/10">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map(c => (
              <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase mb-4">Country</h3>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-full bg-white/5 border-white/10">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {popularCountries?.map(c => (
              <SelectItem key={c.country} value={c.country}>{c.country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Price Range</h3>
          <span className="text-sm font-serif">${priceRange[0]} - ${priceRange[1]}</span>
        </div>
        <Slider
          defaultValue={[0, 10000]}
          max={20000}
          step={100}
          value={priceRange}
          onValueChange={setPriceRange}
          className="my-6"
        />
      </div>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setCategory("");
          setCountry("");
          setPriceRange([0, 10000]);
        }}
      >
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Explore the Extraordinary</h1>
        <p className="text-muted-foreground">Discover our curated collection of luxury destinations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className={`sticky top-28 p-6 rounded-2xl ${glassStyles.panel}`}>
            <div className="flex items-center gap-2 mb-8">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-xl">Filters</h2>
            </div>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Top Bar */}
          <div className={`p-4 rounded-xl ${glassStyles.card} flex flex-col md:flex-row gap-4 justify-between items-center z-10 relative`}>
            <div className="relative w-full md:w-96 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 w-full"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden flex-1 border-white/10 bg-white/5">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent className={`${glassStyles.panel} border-l-border`}>
                  <SheetHeader>
                    <SheetTitle className="font-serif text-2xl mb-8 text-left">Filters</SheetTitle>
                  </SheetHeader>
                  <FilterContent />
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating_desc">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : destinationsData?.destinations.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl ${glassStyles.panel}`}>
              <h3 className="text-xl font-serif mb-2">No destinations found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {destinationsData?.destinations.map((dest) => (
                  <DestinationCard key={dest.id} destination={dest} isWishlisted={dest.isWishlisted} />
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-8">
                Showing {destinationsData?.destinations.length} of {destinationsData?.total} destinations
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
