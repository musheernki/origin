import { useState } from "react";
import { useParams } from "wouter";
import { useGetBooking, useUpdateBooking, queryClient, getGetBookingQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { glassStyles } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2, Download, AlertCircle, CreditCard, Lock, CheckCircle2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: number;
  amount: number;
  destinationName: string;
  onSuccess: () => void;
  getToken: () => Promise<string | null>;
}

function PaymentModal({ open, onClose, bookingId, amount, destinationName, onSuccess, getToken }: PaymentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "processing" | "success">("form");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (cardNumber.replace(/\s/g, "").length < 16) e.cardNumber = "Enter a valid 16-digit card number";
    if (!cardName.trim()) e.cardName = "Cardholder name is required";
    const [mm] = expiry.split("/");
    if (expiry.length < 5 || Number(mm) > 12 || Number(mm) < 1) e.expiry = "Enter a valid expiry (MM/YY)";
    if (cvv.length < 3) e.cvv = "CVV must be 3 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;

    setStep("processing");

    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const intentRes = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers,
        body: JSON.stringify({ bookingId, amount }),
      });
      const { paymentIntentId } = await intentRes.json();

      await new Promise((r) => setTimeout(r, 1800));

      const confirmRes = await fetch("/api/payments/confirm", {
        method: "POST",
        headers,
        body: JSON.stringify({ bookingId, paymentIntentId }),
      });

      if (!confirmRes.ok) throw new Error("Payment confirmation failed");

      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
        setStep("form");
      }, 2500);
    } catch {
      setStep("form");
      toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleClose = () => {
    if (step === "processing") return;
    onClose();
    setStep("form");
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-md p-0 overflow-hidden border-border ${glassStyles.panel}`}>
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-20 px-8 gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <CreditCard className="absolute inset-0 m-auto h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-serif text-xl mb-1">Processing Payment</p>
              <p className="text-muted-foreground text-sm">Securely charging ${amount.toLocaleString()}…</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-20 px-8 gap-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-serif text-2xl mb-2">Payment Successful!</p>
              <p className="text-muted-foreground">Your booking is now confirmed.</p>
              <p className="text-sm text-muted-foreground mt-1">${amount.toLocaleString()} charged successfully.</p>
            </div>
          </div>
        )}

        {step === "form" && (
          <>
            <div className="bg-primary/5 border-b border-border px-6 py-5">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Complete Payment</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-1">{destinationName}</p>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-3xl font-serif font-bold">${amount.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">USD</span>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="cardNumber" className="text-sm font-medium">Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className={`pl-10 bg-white/5 border-white/10 font-mono tracking-wider ${errors.cardNumber ? "border-destructive" : ""}`}
                    maxLength={19}
                  />
                </div>
                {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cardName" className="text-sm font-medium">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="Name as on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className={`bg-white/5 border-white/10 ${errors.cardName ? "border-destructive" : ""}`}
                />
                {errors.cardName && <p className="text-xs text-destructive">{errors.cardName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expiry" className="text-sm font-medium">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className={`bg-white/5 border-white/10 font-mono ${errors.expiry ? "border-destructive" : ""}`}
                    maxLength={5}
                  />
                  {errors.expiry && <p className="text-xs text-destructive">{errors.expiry}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cvv" className="text-sm font-medium">CVV</Label>
                  <div className="relative">
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className={`bg-white/5 border-white/10 font-mono ${errors.cvv ? "border-destructive" : ""}`}
                      maxLength={4}
                    />
                  </div>
                  {errors.cvv && <p className="text-xs text-destructive">{errors.cvv}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                <Shield className="h-4 w-4 text-green-500 shrink-0" />
                <span>Your payment is encrypted and secured with 256-bit SSL</span>
              </div>

              <Button
                onClick={handlePay}
                className="w-full h-12 text-base font-serif tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Lock className="mr-2 h-4 w-4" />
                PAY ${amount.toLocaleString()}
              </Button>

              <div className="flex items-center justify-center gap-4 pt-1">
                {["VISA", "MC", "AMEX", "RuPay"].map((brand) => (
                  <span key={brand} className="text-[10px] font-bold tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function BookingDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data: booking, isLoading, refetch } = useGetBooking(id, {
    query: {
      enabled: !!id,
      queryKey: getGetBookingQueryKey(id),
    }
  });

  const updateBooking = useUpdateBooking({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        toast({ title: "Booking cancelled" });
      }
    }
  });

  const handleCancel = () => {
    updateBooking.mutate({ id, data: { status: "cancelled" } });
  };

  const handlePaymentSuccess = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
    toast({ title: "Payment confirmed!", description: "Your booking is now confirmed." });
  };

  if (isLoading || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-2">Booking #{booking.id}</p>
          <h1 className="text-3xl md:text-4xl font-serif">{booking.destination.name}</h1>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={`capitalize text-sm ${
            booking.paymentStatus === "paid"
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          }`}>
            {booking.paymentStatus === "paid" ? "✓ Paid" : "Unpaid"}
          </Badge>
          <Badge variant="outline" className={`capitalize text-sm ${
            booking.status === "confirmed" ? "bg-green-500/10 text-green-500 border-green-500/20" :
            booking.status === "cancelled" ? "bg-red-500/10 text-red-500 border-red-500/20" :
            "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          }`}>
            {booking.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className={`p-6 rounded-2xl ${glassStyles.panel}`}>
            <h3 className="font-serif text-xl mb-4">Journey Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Check-in</p>
                <p className="font-medium">{format(new Date(booking.checkIn), "PPP")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Check-out</p>
                <p className="font-medium">{format(new Date(booking.checkOut), "PPP")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Guests</p>
                <p className="font-medium">{booking.guests} People</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="font-medium">{booking.destination.city}, {booking.destination.country}</p>
              </div>
            </div>
            {booking.specialRequests && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Special Requests</p>
                <p className="font-medium">{booking.specialRequests}</p>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-2xl ${glassStyles.panel}`}>
            <h3 className="font-serif text-xl mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>{booking.destination.name} Package × {booking.guests} guests</span>
                <span>${booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-serif text-xl pt-4 border-t border-border text-foreground">
                <span>Total Amount</span>
                <span>${booking.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {booking.paymentStatus === "paid" ? (
              <div className="mt-6 flex items-center gap-3 bg-green-500/10 rounded-xl p-4 text-green-600">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Payment complete</p>
                  <p className="text-xs opacity-80">Your trip is fully confirmed and paid.</p>
                </div>
              </div>
            ) : booking.status !== "cancelled" ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                  <Lock className="h-4 w-4 text-primary shrink-0" />
                  <span>Complete your payment to confirm this booking. All transactions are secured.</span>
                </div>
                <Button
                  onClick={() => setPaymentOpen(true)}
                  className="w-full h-12 text-base font-serif tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  PAY ${booking.totalAmount.toLocaleString()}
                </Button>
              </div>
            ) : null}

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full bg-white/5"
                onClick={() => toast({ title: "Invoice download started" })}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Invoice
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl overflow-hidden aspect-[3/4]">
            <img
              src={booking.destination.images[0] || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"}
              className="w-full h-full object-cover"
              alt={booking.destination.name}
            />
          </div>

          {["pending", "confirmed"].includes(booking.status) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={`${glassStyles.panel} border-border`}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Refund policies apply according to our terms and conditions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent">Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, cancel booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        bookingId={booking.id}
        amount={booking.totalAmount}
        destinationName={booking.destination.name}
        onSuccess={handlePaymentSuccess}
        getToken={getToken}
      />
    </div>
  );
}
