import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetDestination, useCreateBooking, useListReviews, useCreateReview, queryClient, getGetDestinationQueryKey, getListReviewsQueryKey } from "@workspace/api-client-react";
import { glassStyles } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Users, Calendar as CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@clerk/react";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters"),
});

export default function DestinationDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  const { toast } = useToast();

  const [date, setDate] = useState<{ from?: Date; to?: Date }>({});
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");

  const { data: destination, isLoading } = useGetDestination(id, {
    query: {
      enabled: !!id,
      queryKey: getGetDestinationQueryKey(id),
    }
  });

  const { data: reviews } = useListReviews({ destinationId: id }, {
    query: {
      enabled: !!id,
      queryKey: getListReviewsQueryKey({ destinationId: id }),
    }
  });

  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Booking successful", description: "Your journey awaits." });
        setLocation(`/bookings/${data.id}`);
      },
      onError: (err) => {
        toast({ title: "Booking failed", description: "Please try again later.", variant: "destructive" });
      }
    }
  });

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey({ destinationId: id }) });
        queryClient.invalidateQueries({ queryKey: getGetDestinationQueryKey(id) });
        toast({ title: "Review posted" });
        reviewForm.reset();
      }
    }
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const handleBooking = () => {
    if (!isSignedIn) {
      toast({ title: "Authentication required", description: "Please sign in to book.", variant: "destructive" });
      setLocation("/sign-in");
      return;
    }

    if (!date.from || !date.to) {
      toast({ title: "Dates required", description: "Please select your travel dates.", variant: "destructive" });
      return;
    }

    createBooking.mutate({
      data: {
        destinationId: id,
        checkIn: format(date.from, "yyyy-MM-dd"),
        checkOut: format(date.to, "yyyy-MM-dd"),
        guests,
        specialRequests: specialRequests || undefined,
      }
    });
  };

  const onReviewSubmit = (data: z.infer<typeof reviewSchema>) => {
    if (!isSignedIn) {
      toast({ title: "Authentication required", description: "Please sign in to review.", variant: "destructive" });
      return;
    }
    createReview.mutate({
      data: {
        destinationId: id,
        ...data,
      }
    });
  };

  if (isLoading || !destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const days = date.from && date.to ? differenceInDays(date.to, date.from) : 0;
  const totalPrice = days > 0 ? destination.pricePerPerson * guests : 0; // Assuming price is per person per trip, or per night. The API says pricePerPerson. Let's assume it's per person total for the 'duration' mentioned, but for dynamic dates, maybe it's just pricePerPerson * guests. Let's stick to pricePerPerson * guests.

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header & Gallery */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <MapPin className="h-4 w-4" />
              <span className="uppercase tracking-widest text-sm font-semibold">{destination.country}, {destination.city}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif">{destination.name}</h1>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span className="text-xl font-bold">{destination.rating.toFixed(1)}</span>
              <span className="text-muted-foreground ml-1">({destination.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[50vh] min-h-[400px]">
          <div className="col-span-1 md:col-span-3 h-full rounded-2xl overflow-hidden relative">
            <img src={destination.images[0] || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"} className="w-full h-full object-cover" alt={destination.name} />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-full">
            <div className="flex-1 rounded-2xl overflow-hidden relative">
              <img src={destination.images[1] || destination.images[0]} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden relative">
              <img src={destination.images[2] || destination.images[0]} className="w-full h-full object-cover" alt="" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-3xl font-serif mb-6">The Experience</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {destination.longDescription || destination.description}
            </p>
          </section>

          <Tabs defaultValue="highlights" className="w-full">
            <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 space-x-8">
              <TabsTrigger value="highlights" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-4 text-base font-serif">Highlights</TabsTrigger>
              <TabsTrigger value="inclusions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-4 text-base font-serif">Inclusions</TabsTrigger>
              <TabsTrigger value="exclusions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-4 text-base font-serif">Exclusions</TabsTrigger>
            </TabsList>
            <TabsContent value="highlights" className="pt-6">
              <ul className="space-y-4">
                {destination.highlights?.map((h, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="inclusions" className="pt-6">
              <ul className="space-y-4">
                {destination.inclusions?.map((inc, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="exclusions" className="pt-6">
              <ul className="space-y-4">
                {destination.exclusions?.map((exc, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <div className="h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center mt-0.5 shrink-0">
                      <div className="w-2 h-px bg-muted-foreground" />
                    </div>
                    <span>{exc}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>

          <section>
            <h2 className="text-3xl font-serif mb-6">Reviews</h2>
            <div className="space-y-6 mb-8">
              {reviews?.map((review) => (
                <div key={review.id} className={`p-6 rounded-2xl ${glassStyles.card}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {review.userAvatar ? (
                        <img src={review.userAvatar} alt={review.userName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-serif">
                          {review.userName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{review.userName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))}
              {reviews?.length === 0 && (
                <p className="text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
              )}
            </div>

            {isSignedIn && (
              <div className={`p-6 rounded-2xl ${glassStyles.panel}`}>
                <h3 className="font-serif text-xl mb-4">Leave a Review</h3>
                <Form {...reviewForm}>
                  <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                    <FormField
                      control={reviewForm.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating (1-5)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="5" {...field} className="bg-white/5 border-white/10 w-24" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={reviewForm.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Experience</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="bg-white/5 border-white/10" placeholder="Tell us about your journey..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createReview.isPending} className="bg-primary text-primary-foreground">
                      {createReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Review
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </section>
        </div>

        {/* Booking Widget */}
        <div className="lg:col-span-1">
          <div className={`sticky top-28 p-8 rounded-2xl ${glassStyles.widget}`}>
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">From</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-serif">${destination.pricePerPerson.toLocaleString()}</span>
                  <span className="text-muted-foreground">/ person</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Dates</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-white/5 border-white/10 h-12">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(date.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={{ from: date?.from, to: date?.to }}
                      onSelect={(range) => setDate({ from: range?.from, to: range?.to })}
                      numberOfMonths={1}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Guests</label>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-md p-2">
                  <Users className="h-4 w-4 text-muted-foreground ml-2" />
                  <Input 
                    type="number" 
                    min={1} 
                    max={destination.maxGuests}
                    value={guests} 
                    onChange={(e) => setGuests(Number(e.target.value))} 
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg h-8"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">Special Requests</label>
                <Textarea 
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="bg-white/5 border-white/10 resize-none" 
                  placeholder="Dietary requirements, celebrations..."
                />
              </div>

              {date.from && date.to && (
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                    <span>${destination.pricePerPerson} x {guests} guests</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-serif text-xl mt-4 text-foreground">
                    <span>Total</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full h-12 text-lg font-serif tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground mt-6"
                onClick={handleBooking}
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                RESERVE NOW
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
