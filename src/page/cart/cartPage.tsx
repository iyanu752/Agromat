/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { fetchCart, removeCartItem, updateCartItem } from "@/service/cartService";
import { getSupermarket } from "@/service/supermarketService";
import { toast } from "sonner";

export default function CartPage() {
  interface CartItem {
    id: string;
    quantity: number;
    productId: string;
    name: string;
    price: number;
    unit?: string;
    image?: string;
    supermarket?: string;
  }

  interface Supermarket {
  _id?: string;
  name?: string;
  address?: string;
  status?: string;
  openTime?: string;
  closeTime?: string;
  description?: string;
  ownerId?: string;
  image?: string;
  autoSchedule?: {
    enabled: boolean;
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  timezone?: string;
  holidayMode?: boolean;
  isOpen?: boolean;
}


  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [supermarket, setSupermarket] = useState<Supermarket>({});
  const supermarketId = supermarket?._id;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userId, setUserId] = useState<string | null>(null);

   const getSupermarketInfo = async () => {
    try {

      const supermarketRes = await getSupermarket();
      let supermarketData = supermarketRes;

      if (supermarketRes && supermarketRes.data) {
        supermarketData = supermarketRes.data;
      }
      if (Array.isArray(supermarketData) && supermarketData.length > 0) {
        supermarketData = supermarketData[0];
      }
      if (supermarketData && typeof supermarketData === "object") {
        setSupermarket(supermarketData);
      } 
    } catch (error) {
      console.error("Error fetching supermarket:", error);
    } 
  };

   useEffect(() => {
    getSupermarketInfo();
  }, []);
  
    

const fetchCartData = async (userId: string) => {
  try {
    const response = await fetchCart(userId);
    response.items.forEach((item: any, index: number) => {
      console.log(`Item ${index}:`, {
        _id: item._id,
        id: item.id,
        productId: item.productId?._id,
        quantity: item.quantity,
        fullItem: item
      });
    });

    const transformedItems = response.items
      .filter((item: any) => item.productId) 
      .map((item: any, index: number) => ({
        id: item._id || item.id || `cart-item-${item.productId._id}-${index}`,
        productId: item.productId._id, 
        quantity: item.quantity,
        name: item.productId.name,
        price: item.productId.price,
        unit: item.productId.unit,
        image: item.productId.image,
        supermarket: item.productId.category,
      }));

    setCartItems(transformedItems);
  } catch (error) {
    console.error("Error fetching cart data:", error);
  }
};

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (storedId) {
      setUserId(storedId);
      fetchCartData(storedId);
    }
  }, []);

const updateQuantity = async (id: string, newQuantity: number) => {
  
  if (!userId) return;

  if (newQuantity === 0) {
    removeItem(id);
    return;
  }

  const item = cartItems.find((i) => i.id === id);
  if (!item) {
    console.error("Item not found:", id);
    return;
  }


  try {
    await updateCartItem(userId, item.productId, newQuantity);
    
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((i) =>
        i.id === id ? { ...i, quantity: newQuantity } : i
      );
      return updatedItems;
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    toast.error("Failed to update quantity");
  }
};



const removeItem = async (cartItemId: string) => {
  if (!userId) {
    toast.error("Please log in");
    return;
  }

  const item = cartItems.find(i => i.id === cartItemId);
  if (!item?.productId) {
    console.error("Missing productId on item", item);
    toast.error("Invalid product ID. Cannot remove.");
    return;
  }
  try {
    await removeCartItem(userId, item.productId);
    setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
    toast.success("Item removed from cart");
     await fetchCartData(userId);
  } catch (error) {
    console.error("Error removing item from cart:", error);
    toast.error("Failed to remove item");
    await fetchCartData(userId);
  }
};


  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = 500;
  const tax = 500;
  const total = subtotal + deliveryFee + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="container mx-auto flex items-center gap-2 px-4 py-4">
            <a href={`/dashboard/user/supermarket/${supermarketId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </a>
            <h1 className="text-xl font-bold tracking-tight">
              Shopping Cart
            </h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Add some items to get started</p>
            <a href={`/dashboard/user/supermarket/${supermarketId}`}>
              <Button className="mt-4">Continue Shopping</Button>
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto flex items-center gap-2 px-4 py-4">
          <a href={`/dashboard/user/supermarket/${supermarketId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </a>
          <h1 className="text-xl font-bold tracking-tight">Shopping Cart</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="border-black/10">
              <CardHeader>
                <CardTitle>Cart Items ({cartItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {cartItems.map((item) => (
                    <div key={`${item.productId}-${item.supermarket}`} className="flex items-center gap-4 p-6">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="h-20 w-20 rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.supermarket}</p>
                        <p className="text-sm font-medium">
                          ₦{item.price.toFixed(2)} {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, parseInt(e.target.value) || 0)
                          }
                          className="w-16 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ₦{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="mt-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₦{total.toFixed(2)}</span>
                </div>
                <a href="/checkout" className="w-full">
                  <Button className="w-full">Proceed to Checkout</Button>
                </a>
                <a href={`/dashboard/user/supermarket/${supermarketId}`}>
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}