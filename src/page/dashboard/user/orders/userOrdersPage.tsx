/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Clock,
  Download,
  Eye,
  Filter,
  LogOut,
  MapPin,
  Package,
  Phone,
  Search,
  Star,
  User,
  Menu,
  ChevronDown,
  // X,
} from "lucide-react"
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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import OrderPage from "@/page/orders/[id]/ordersPage"
import { getOrderByUserId , updateOrderStatus} from "@/service/orderService" 

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  // confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  packed: "bg-orange-100 text-orange-800 border-orange-300",
  "out-for-delivery": "bg-purple-100 text-purple-800 border-purple-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  "payment-failed": "bg-red-50 text-red-700 border-red-200",
};

export default function UserOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  // const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

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
      supermarket: any
    }[];
    totalAmount: number;
    deliveryAddress: string;
    deliveryInstructions: string;
    status: string;
    orderId: string;
    assignedRider: any;
    createdAt: string;
    deliveredAt: string;
    cancelledAt: string;
    paymentReference: string;
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userId.supermarket.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    const matchesDate =
      dateFilter === "all" ||
      (() => {
        const orderDate = new Date(order.createdAt)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - orderDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        switch (dateFilter) {
          case "today":
            return diffDays <= 1
          case "week":
            return diffDays <= 7
          case "month":
            return diffDays <= 30
          default:
            return true
        }
      })()

    return matchesSearch && matchesStatus && matchesDate
  })

  const activeOrders = filteredOrders.filter((order) => !["delivered", "cancelled"].includes(order.status))
  const orderHistory = filteredOrders.filter((order) => ["delivered", "cancelled"].includes(order.status))

  const handleViewDetails = (orderId: string) => {
    window.location.href = `/orders/${orderId}`
  }

  const handleDownloadReceipt = (orderId: string) => {
    alert(`Downloading receipt for order ${orderId}`)
  }

  const handleReorder = (order: any) => {
    alert(`Reordering items from ${order.supermarket}`)
  }

  const updateStatus = async (orderId: string, newStatus: string) =>{
    try{
      await updateOrderStatus(orderId, newStatus)
      orders.map((order) => {
        if(order.orderId === orderId) {
          order.status = newStatus
        }
      })
      getUserOrder() 
    }catch (error) {
      console.error('Failed to update order status', error)
    }
  }


  const handleCancelOrder = (orderId: string) => {
    updateStatus(orderId, 'cancelled')
  }

  const getUserOrder = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        return;
      }
      const response = await getOrderByUserId(userId);
      console.log("new orders", response);
      setOrders(response);
    } catch (error) {
      console.error("❌ Error fetching vendor orders:", error);
    }
  };

  useEffect(() => {
    getUserOrder();
  }, []);

  // const handleContactSupport = (orderId: string) => {
  //   alert(`Opening support for order ${orderId}`)
  // }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <a href="/dashboard/user">
              <Button variant="ghost" size="icon" className="md:flex">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            </a>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">My Orders</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm font-medium">Welcome, Resident</span>
            <a href="/profile/user">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </a>
            <a href="/">
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </a>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold">Order Tracking & History</h2>
              <Button 
                variant="outline" 
                size="sm" 
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            
            {/* Desktop Filters */}
            <div className="hidden md:flex gap-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search orders..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  {/* <SelectItem value="confirmed">Confirmed</SelectItem> */}
                  <SelectItem value="packed">Packed</SelectItem>
                  {/* <SelectItem value="picked_up">Picked Up</SelectItem> */}
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="md:hidden space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search orders..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      {/* <SelectItem value="confirmed">Confirmed</SelectItem> */}
                      <SelectItem value="packed">Packed</SelectItem>
                      {/* <SelectItem value="picked_up">Picked Up</SelectItem> */}
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="active" className="w-full">
          {/* Responsive Tabs */}
          <TabsList className="mb-6 w-full md:w-auto">
            <TabsTrigger value="active" className="flex-1 md:flex-none flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Active Orders</span>
              <span className="sm:hidden">Active</span>
              <span className="text-xs">({activeOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 md:flex-none flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Order History</span>
              <span className="sm:hidden">History</span>
              <span className="text-xs">({orderHistory.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Active Orders Tab */}
          <TabsContent value="active" className="space-y-4 md:space-y-6">
            {activeOrders.length === 0 ? (
              <Card className="border-black/10">
                <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
                  <Package className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg md:text-xl font-semibold mb-2">No Active Orders</h3>
                  <p className="text-gray-600 mb-4 text-center px-4">You don't have any active orders at the moment</p>
                  <a href="/dashboard/user">
                    <Button>Start Shopping</Button>
                  </a>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <Card key={order.orderId} className="border-black/10">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-sm md:text-base">#{order.orderId}</span>
                          <Badge
                            variant={order.status === "pending" ? "outline" : "default"}
                            className={`text-xs w-fit ${
                              statusColors[order.status] ??
                              "bg-gray-100 text-gray-800 border-gray-300"
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1).replace(/-/g, " ")}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.userId.supermarket} • {" "}
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
                      <div className="flex md:flex-col md:items-end md:text-right justify-between md:justify-start">
                        <p className="font-semibold text-lg md:text-base">₦{order.totalAmount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{order.items.length} items</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span className="flex-1">
                                {item.product.name} x{item.quantity}
                              </span>
                              <span className="font-medium">₦{(item.product.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="break-words">{order.deliveryAddress}</span>
                      </div>

                      {order.assignedRider && (order.status === "picked_up" || order.status === "out_for_delivery") && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="font-medium text-blue-800">Your Delivery Rider</p>
                              <p className="text-sm text-blue-600">{order.assignedRider}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="text-xs">
                                <Phone className="h-3 w-3 mr-1" />
                                Call
                              </Button>
                              <div className="flex items-center text-xs">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                <span>{order.assignedRider}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(order._id)} className="flex-1 sm:flex-none">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        
                        {(order.status === "pending" || order.status === "packed") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 flex-1 sm:flex-none">
                                Cancel Order
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[90vw] max-w-sm sm:max-w-md px-4 py-6">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this order? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto">No, keep order</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                  onClick={() => handleCancelOrder(order.orderId)}
                                >
                                  Yes, cancel order
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* <Button variant="outline" size="sm" onClick={() => handleContactSupport(order._id)} className="flex-1 sm:flex-none">
                          <Phone className="h-4 w-4 mr-2" />
                          Support
                        </Button> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="history" className="space-y-4">
            {orderHistory.length === 0 ? (
              <Card className="border-black/10">
                <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
                  <Clock className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg md:text-xl font-semibold mb-2">No Order History</h3>
                  <p className="text-gray-600 mb-4 text-center px-4">You haven't completed any orders yet</p>
                  <a href="/dashboard/user">
                    <Button>Start Shopping</Button>
                  </a>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orderHistory.map((order) => (
                  <Card key={order._id} className="border-black/10">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                            <h3 className="font-semibold text-sm md:text-base">Order #{order.orderId}</h3>
                            <Badge
                              variant={order.status === "pending" ? "outline" : "default"}
                              className={`text-xs w-fit ${
                                statusColors[order.status] ??
                                "bg-gray-100 text-gray-800 border-gray-300"
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1).replace(/-/g, " ")}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600 mb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                              <span className="font-medium">{order.userId.supermarket}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              {order.deliveredAt && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="text-green-600">Delivered</span>
                                </>
                              )}
                              {order.cancelledAt && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="text-red-600">Cancelled</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span className="break-words">{order.deliveryAddress}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                            <span className="font-medium">{order.items.length} items</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="font-semibold text-lg sm:text-base">₦{order.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(order._id)} className="flex-1 sm:flex-none">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {order.status === "delivered" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(order._id)} className="flex-1 sm:flex-none">
                                <Download className="h-4 w-4 mr-2" />
                                Receipt
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleReorder(order)} className="flex-1 sm:flex-none">
                                Reorder
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Agromat. All rights reserved.
        </div>
      </footer>
    </div>
  )
}