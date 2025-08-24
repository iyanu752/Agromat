/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { fetchCart , clearCart} from "@/service/cartService";
import { createOrder } from "@/service/orderService";
import { toast } from "sonner";
import { getSupermarket } from "@/service/supermarketService";
export default function CheckoutPage() {
  interface CartItem {
    id: string;
    quantity: number;
    productId: string;
    name: string;
    price: number;
    unit?: string;
    image?: string;
    supermarket?: string;
    supermarketId?: string;
  }

  interface Supermarket {
    _id?: string;
    // name?: string;
    // address?: string;
    // status?: string;
    // openTime?: string;
    // closeTime?: string;
    // description?: string;
    // ownerId?: string;
    // image?: string;
    // autoSchedule?: {
    // enabled: boolean;
    // monday: { open: string; close: string; closed: boolean };
    // tuesday: { open: string; close: string; closed: boolean };
    // wednesday: { open: string; close: string; closed: boolean };
    // thursday: { open: string; close: string; closed: boolean };
    // friday: { open: string; close: string; closed: boolean };
    // saturday: { open: string; close: string; closed: boolean };
    // sunday: { open: string; close: string; closed: boolean };
    // };
    // timezone?: string;
    // holidayMode?: boolean;
    // isOpen?: boolean
  }

  const [deliveryAddress, setDeliveryAddress] = useState({
    address: "",
    instructions: "",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [ispacked, setIspacked] = useState(false);
   
  const [, setSupermarket] = useState<Supermarket[]>([]);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 500;
  const tax = 500;
  const total = subtotal + deliveryFee + tax;

  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // FIXED: Added form validation
  const validateForm = () => {
    if (!user.firstName.trim()) {
      toast.error("Please enter your first name");
      return false;
    }
    if (!user.lastName.trim()) {
      toast.error("Please enter your last name");
      return false;
    }
    if (!user.email.trim()) {
      toast.error("Please enter your email address");
      return false;
    }
    if (!user.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!deliveryAddress.address.trim()) {
      toast.error("Please enter your delivery address");
      return false;
    }
    if (cartItems.length === 0) {
      toast.warning("Your cart is empty");
      return false;
    }
    return true;
  };

  const getSupermarkets = async () => {
    try {
      const supermarkets = await getSupermarket();
      setSupermarket(supermarkets);
    } catch (error) {
      console.error("Error fetching supermarkets: ", error);
    }
  };
  useEffect(() => {
    getSupermarkets();
  }, []);

  const handlePlaceOrder = () => {
    if (!validateForm()) return;

    const ref = `ORD-${Date.now()}`;

    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: total * 100, // Paystack expects amount in kobo
      currency: "NGN",
      ref,
      callback: function (response: any) {
        (async () => {
          try {
            setIspacked(true);

            const orderPayload = {
              userId: userId!,
              items: cartItems.map((item) => ({
                product: item.productId,
                quantity: item.quantity,
                supermarket: item.supermarketId || item.supermarket,
              })),
              deliveryAddress: deliveryAddress.address,
              deliveryInstructions: deliveryAddress.instructions,
              totalAmount: total,
              paymentReference: response.reference,
              paymentStatus: "success",
              status: "pending",
              orderId: response.reference,
              supermarketId: cartItems[0].supermarket || cartItems[0].supermarketId
            };

            const orderResponse = await createOrder(orderPayload);

            if (orderResponse?.success) {
              await clearCart(userId!);
              window.location.href = `/orders/${response.reference}`;
              
            } else {
              console.error(
                "❌ Failed to create order:",
                orderResponse?.message
              );
              toast.error("Failed to create order. Please contact support.");
            }
          } catch (error) {
            console.error("❌ Order creation failed:", error);
            toast.error("An error occurred. Please try again.");
          } finally {
            setIspacked(false);
          }
        })();
      },
      onClose: () => {
  
        setIspacked(false);
      },
    });

    handler.openIframe();
  };

const fetchCartData = async (userId: string) => {
    try {
      const response = await fetchCart(userId);
      const transformedItems = response.items
        .filter((item: any) => item.productId)
        .map((item: any) => {
          // FIXED: Extract supermarket ID properly
          // let supermarketId = null;
          
          // if (item.Supermarket) {
          //   // If supermarket is an object with _id
          //   if (typeof item.Supermarket === 'object' && item.productId.supermarket._id) {
          //     supermarketId = item.productId.supermarket._id;
          //   } 
          //   // If supermarket is just a string ID
          //   else if (typeof item.productId.supermarket === 'string') {
          //     supermarketId = item.productId.supermarket;
          //   }
          // }

          return {
            productId: item.productId._id,
            quantity: item.quantity,
            name: item.productId.name,
            price: item.productId.price,
            unit: item.productId.unit,
            image: item.productId.image,
            category: item.productId.category,
            supermarketId: item.Supermarket,
          };
        });
      setCartItems(transformedItems);
    } catch (error) {
      console.error("Error fetching cart data:", error);
    }
  };


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedId = localStorage.getItem("userId");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          firstName: parsedUser.firstName || "",
          lastName: parsedUser.lastName || "",
          phone: parsedUser.phone || "",
          email: parsedUser.email || "",
        });
      } catch (err) {
        console.error("Failed to parse user:", err);
      }
    }
    if (storedId) {
      setUserId(storedId);
      fetchCartData(storedId);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto flex items-center gap-2 px-4 py-4">
          <a href={`/cart/${userId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          </a>
          <h1 className="text-xl font-bold tracking-tight">Checkout</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card className="border-black/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={user.firstName}
                      onChange={(e) =>
                        setUser((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={user.lastName}
                      onChange={(e) =>
                        setUser((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      onChange={(e) =>
                        setUser((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={user.phone}
                      onChange={(e) =>
                        setUser((prev) => ({
                          ...prev,
                          phone: e.target.value, // FIXED: Keep as string
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={deliveryAddress.address}
                    onChange={(e) =>
                      setDeliveryAddress((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions">
                    Delivery Instructions (Optional)
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="e.g., Leave at door, Ring doorbell, etc."
                    value={deliveryAddress.instructions}
                    onChange={(e) =>
                      setDeliveryAddress((prev) => ({
                        ...prev,
                        instructions: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="border-black/10">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span>₦{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₦{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>₦{tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₦{total.toFixed(2)}</span>
                </div>

                <div className="space-y-2 pt-4">
                  <Button
                    onClick={handlePlaceOrder}
                    className="w-full"
                    disabled={ispacked || cartItems.length === 0}
                  >
                    {ispacked ? "packed..." : "Place Order"}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    By placing this order, you agree to our Terms of Service
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
