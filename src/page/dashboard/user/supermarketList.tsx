/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { Clock,
    //  LogOut,
      Search,
       ShoppingCart,
        // User,
        //  Package,
        //   Leaf
         } from "lucide-react"
// import { socket } from "@/utils/socket";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getSupermarket } from "@/service/supermarketService"
// import { getOrderByUserId  } from "@/service/orderService"
// import { toast } from "sonner"
// import { logoutUser } from "@/service/authService"
// import { useNavigate } from "react-router-dom";
import Navbar from "@/comp/navbar";
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
  isOpen?: boolean
}



export default function SupermarketList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [supermarket, setSupermarket] = useState<Supermarket[]>([]);
  const supermarketName = supermarket[0]?.name || "";
  const supermarketImage = supermarket[0]?.image;
  const supermarketStatus = supermarket[0]?.isOpen;
//    const navigate = useNavigate();
  const supermarketOpenTime = supermarket[0]?.openTime || "9:00 AM";
  const supermarketCloseTime = supermarket[0]?.closeTime || "9:00 PM";
  const supermarketDescription = supermarket[0]?.description || "";
  const supermarketId = supermarket[0]?._id;
    // const [orders, setOrders] = useState<UserOrder[]>([]);
// const filteredSupermarkets = supermarket.filter((market) =>
//   market.name.toLowerCase().includes(searchQuery.toLowerCase())
// );

// interface UserOrder {
//   _id: string;
//   userId: {
//     email: string;
//     firstName: string;
//     supermarket: string;
//   };
//   items: {
//     product: any;
//     quantity: number;
//   }[];
//   totalAmount: number;
//   deliveryAddress: string;
//   deliveryInstructions: string;
//   status: string;
//   orderId: string;
//   assignedRider: string;
//   createdAt: string;
//   verificationCode: string;
// }



//   const statusColors: Record<string, string> = {
//     pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
//     // confirmed: "bg-blue-100 text-blue-800 border-blue-300",
//     packed: "bg-orange-100 text-orange-800 border-orange-300",
//     "out-for-delivery": "bg-purple-100 text-purple-800 border-purple-300",
//     delivered: "bg-green-100 text-green-800 border-green-300",
//     cancelled: "bg-red-100 text-red-800 border-red-300",
//     "payment-failed": "bg-red-50 text-red-700 border-red-200",
//   };



//   const getUserOrder = async () => {
//     try {
//       const userId = localStorage.getItem("userId")
//       console.log('userId', userId)
//       if (!userId){
//          return;
//         }
//       const response = await getOrderByUserId(userId);
//       console.log("new orders", response);
//       setOrders(response);
//     } catch (error) {
//       console.error("❌ Error fetching vendor orders:", error);
//     }
//   };

//   useEffect(() => {
//     getUserOrder();
//   }, []);

//   useEffect(() => {
//     socket.on('connect', () => {
//       console.log('Connected to WebSocket');
//     });

//     socket.on('riderAcceptNotification', (data: any) => {
//       const orderid = data.product.orderId
//       toast.success(`${orderid} has been assigned to a rider`);
//       // setOrders((previousOrders) => [ data.product, ...previousOrders])
//     });

//         socket.on('orderStatusUpdate', (data: any) => {
//       console.log('data', data)
//       const orderStatus = data.orders.status
//       let message = ''
//       if(orderStatus === 'pending') {
//         message = 'Your order has been updated to pending'
//       }else if (orderStatus === 'packed'){
//         message = 'Your order has been packed'
//       }else if (orderStatus === 'out-for-delivery'){
//         message = 'Rider has picked up your order, Out for delivery'
//       }else if (orderStatus === 'delivered') {
//         message = 'Order delivered, Please rate the dispatch service'
//       }
//       toast.success(`${message}`);
//       getUserOrder()
//       // setOrders((previousOrders) => [ data.product, ...previousOrders])
//     });


//     return () => {
//       socket.off('riderAcceptNotification');
//       socket.off('orderStatusUpdate')
//     };
//   }, []);
  

//     const logout = async () => {
//     const userId = localStorage.getItem('userId');

//     if (!userId) {
//       toast.error('No user found to log out.');
//       return;
//     }

//     try {
//       await logoutUser(userId);

//       // Clean up localStorage or cookies
//       localStorage.removeItem('userId');
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');

//       toast.success('You have been logged out');
//       navigate('/');
//     } catch (error) {
//       console.error('Logout error:', error);
//       toast.error(typeof error === 'string' ? error : 'Logout failed');
//     }
//   };


  const getSupermarkets = async() => {
  try{
  const supermarkets = await getSupermarket()
   setSupermarket(supermarkets)
  }catch(error){
    console.error("Error fetching supermarkets: ", error)
  }
}
  useEffect(() => {
 getSupermarkets()
}, [])

  return (
    <div className="min-h-screen bg-white">
     {/* <header className="border-b border-gray-200">
  <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between px-4 py-4 gap-4 sm:gap-0">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold text-green-800">AgroMat</span>
          </a>
        </div>
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium hidden sm:inline">Welcome, Resident</span>

      <a href="/dashboard/user/orders/:id">
        <Button variant="ghost" size="icon">
          <Package className="h-5 w-5" />
          <span className="sr-only">My Orders</span>
        </Button>
      </a>

      <a href="/profile/user">
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">Profile</span>
        </Button>
      </a>

      
        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
    </div>
  </div>
</header> */}

        <nav>
            <Navbar/>
        </nav>


      <main className="container mx-auto px-4 py-8">
        {/* {orders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <a href="/dashboard/user/orders/:id">
                <Button variant="outline" size="sm">
                  View All Orders
                </Button>
              </a>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {orders.map((order) => (
                <Card key={order._id} className="border-black/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">#{order.orderId}</h3>
                        <p className="text-sm text-gray-600">
                          {order.userId.supermarket} •{" "}
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
                        <p className="text-xs sm:text-sm text-gray-800"> Verification code • <span className="font-bold">{order.verificationCode}</span></p>
                      </div>
                          <Badge
                            variant={
                              order.status === "pending" ? "outline" : "default"
                            }
                            className={`text-xs ${
                              statusColors[order.status] ??
                              "bg-gray-100 text-gray-800 border-gray-300"
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1).replace(/-/g, " ")}
                          </Badge>{" "}
                        
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {order.items.length} items • ₦{order.totalAmount.toFixed(2)}
                      </div>
                      <a href={`/orders/${order._id}`}>
                        <Button variant="outline" size="sm">
                          Track Order
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )} */}

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Available Supermarkets</h2>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search supermarkets..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* {filteredSupermarkets.map((market) => ( */}
              <Card key={supermarketId} className="border-black/10 transition-all hover:shadow-md">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{supermarketName}</CardTitle>
                    <Badge
                      variant={supermarketStatus ? "default" : "outline"}
                      className={supermarketStatus ? "bg-green-600" : "text-gray-500"}
                    >
                      {supermarketStatus ? "Open" : "Closed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <img
                    src={supermarketImage || "/placeholder.svg"}
                    alt={supermarketName}
                    className="mb-3 h-[100px] w-full rounded-md object-cover"
                  />
                  <p className="mb-2 text-sm text-gray-600">{supermarketDescription}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="mr-1 h-3 w-3" />
                    {supermarketOpenTime} - {supermarketCloseTime}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <a href={`/dashboard/user/supermarket/${supermarketId}`} className="w-full">
                    <Button variant="outline" className="w-full" disabled={!supermarketId}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {supermarketStatus ? "Shop Now" : "Currently Closed"}
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            {/* ))} */}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Agromat. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
