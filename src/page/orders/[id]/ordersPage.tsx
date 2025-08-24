/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { ArrowLeft, Download,
  //  Phone 
  } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { OrderTracking } from "@/comp/order-tracking"
import { getOrderByUserId } from "@/service/orderService"
import { useEffect, useState } from "react"
import { socket } from "@/utils/socket";
import { toast } from "sonner"
interface UserOrder {
  _id: string;
  userId: {
    email: string;
    firstName: string;
    supermarket: string;
  };
  items: {
    product: any;
    quantity: number;
  }[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryInstructions: string;
  status: string;
  orderId: string;
  assignedRider: any;
  createdAt: string;
}

export default function OrderPage() {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = localStorage.getItem("userId");
      
      
      if (!userId) {
        setError("User ID not found. Please log in again.");
        return;
      }
      
      const response = await getOrderByUserId(userId);
   
      setOrders(response);
    } catch (error) {
      console.error("❌ Error fetching vendor orders:", error);
      setError("Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

      useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('orderStatusUpdate', (data: any) => {
     
      const orderStatus = data.orders.status
      let message = ''
      if(orderStatus === 'pending') {
        message = 'Your order has been updated to pending'
      }else if (orderStatus === 'packed'){
        message = 'Your order has been packed'
      }else if (orderStatus === 'out-for-delivery'){
        message = 'Rider has picked up your order, Out for delivery'
      }else if (orderStatus === 'delivered') {
        message = 'Order delivered, Please rate the dispatch service'
      }
      toast.success(`${message}`);
      getUserOrder()
      // setOrders((previousOrders) => [ data.product, ...previousOrders])
    });

    return () => {
      socket.off('orderStatusUpdate');
    };
  }, []);

  useEffect(() => {
    getUserOrder();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={getUserOrder}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <a href="/dashboard/user">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            </a>
            <h1 className="text-xl font-bold tracking-tight">Order Details</h1>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400 mt-2">Your orders will appear here once you make a purchase.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order._id} className="grid gap-8 lg:grid-cols-3">
                {/* Order Tracking */}
                <div className="lg:col-span-2">
                  <OrderTracking
                    orderId={order.orderId || order._id}
                    status={order.status}
                    estimatedDelivery={undefined} // Add this if you have estimated delivery data
                  />
                </div>

                {/* Order Summary */}
                <div className="space-y-6">
                  {/* Order Info */}
                  <Card className="border-black/10">
                    <CardHeader>
                      <CardTitle>Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="font-medium">{order.orderId || order._id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Placed on</p>
                        <p className="font-medium">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })},{" "}
                          {new Date(order.createdAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-medium">N/A</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Address */}
                  <Card className="border-black/10">
                    <CardHeader>
                      <CardTitle>Delivery Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="font-medium">{order.userId.firstName}</p>
                      <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                      <p className="text-sm text-gray-600">{order.userId.email}</p>
                      {order.deliveryInstructions && (
                        <p className="text-sm text-gray-500">Instructions: {order.deliveryInstructions}</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Order Items */}
                  <Card className="border-black/10">
                    <CardHeader>
                      <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.product?.name ?? "Product"} x{item.quantity}</span>
                            <span>₦{item.product?.price ? (item.product.price * item.quantity).toFixed(2) : "N/A"}</span>
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total</span>
                          <span>₦{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Support */}
                  <Card className="border-black/10">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 mb-3">Need help with your order?</p>
                      {/* <Button variant="outline" className="w-full">
                        <Phone className="mr-2 h-4 w-4" />
                        Contact Support
                      </Button> */}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}