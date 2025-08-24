/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CheckCircle,
  Clock,
  LogOut,
  MapPin,
  Package,
  Star,
  Truck,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllOrders } from "@/service/orderService";
import { useEffect, useState } from "react";
import { socket } from "@/utils/socket";
import {
  getOrderHistory,
  assignToRider,
  updateOrderStatus,
} from "@/service/orderService";
import { OrderDetailsModal } from "@/comp/order-details-modal";
// import { RevenueFilter } from "@/components/revenue-filter"
import { verifyOrderCode } from "@/service/orderService";
import { toast } from "sonner";
import { getRiderDashboard } from "@/service/dashboardService";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/service/authService";

// Mock data for orders
interface Orders {
  _id: string;
  userId: {
    email: string;
    firstName: string;
    lastName: string;
    supermarket: string;
    address: string;
    phone: string;
  };
  supermarketId?: string;
  items: {
    product: any;
    quantity: number;
    supermarket: {
      _id: string;
      name: string;
      dropshippingMode?: boolean; // Add this field
    } | string; // Can also be just a string ID
  }[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryInstructions?: string;
  status?: string;
  paymentReference?: string;
  paymentStatus?: string;
  assignedRider?: string;
  orderId?: string;
  verificationCode: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RiderStats {
  totalDeliveries: number;
  todayDeliveries: number;
  pendingDeliveries: number;
  rating: number;
}

// Verification Modal Component
const VerificationModal = ({
  isOpen,
  onClose,
  onVerify,
  orderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (orderId: string, code: string) => void;
  orderId: string;
}) => {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!token.trim()) {
      setError("Please enter the verification token");
      return;
    }
    onVerify(orderId, token);
    setToken("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Delivery Verification</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Please enter the verification token provided by the customer for order
          #{orderId}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Verification Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter 6-digit token"
              maxLength={6}
            />
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              Verify & Complete
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RiderDashboard() {
  const [orders, setOrders] = useState<Orders[]>([]);
  const [orderHistory, setOrderHistory] = useState<Orders[]>([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [riderStats, setRiderStats] = useState<RiderStats>({
    totalDeliveries: 0,
    todayDeliveries: 0,
    pendingDeliveries: 0,
    rating: 0.0,
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    // confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    packed: "bg-orange-100 text-orange-800 border-orange-300",
    "out-for-delivery": "bg-purple-100 text-purple-800 border-purple-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    "payment-failed": "bg-red-50 text-red-700 border-red-200",
  };

  const isDropshippingOrder = (order: Orders): boolean => {
    return order.items.some((item) => {
      if (typeof item.supermarket === 'object' && item.supermarket !== null) {
        return item.supermarket.dropshippingMode === true;
      }
      return false;
    });
  };

  // Filter out dropshipping orders
  const filterNonDropshippingOrders = (orders: Orders[]): Orders[] => {
    return orders.filter((order) => !isDropshippingOrder(order));
  };

const getOrders = async () => {
  try {
    const allOrders = await getAllOrders();
    // Filter out delivered and dropshipping
    const pendingOrders = filterNonDropshippingOrders(
      allOrders.filter((order: Orders) => order.status !== "delivered")
    );
    setOrders(pendingOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    toast.error("Failed to fetch orders");
  }
};


  useEffect(() => {
    getOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

socket.on("orderPlaced", (data: any) => {
  const newOrder = data.product;

  if (filterNonDropshippingOrders([newOrder]).length === 0) return;

  toast.success(`New Order ${newOrder.orderId} Placed!`);
  setOrders((previousOrders) => [newOrder, ...previousOrders]);
});


    socket.on("orderStatusUpdate", (data: any) => {

      const orderStatus = data.orders.status;
      let message = "";
      if (orderStatus === "packed") {
        message = `Order ${data.orders.orderId} has been packed, proceed to pickup`;
      } else if (orderStatus === "delivered") {
        message = "Order delivered, Good Job";
      }
      if (message) {
        toast.success(message);
      }
      getOrders();
    });

    return () => {
      socket.off("orderPlaced");
      socket.off("orderStatusUpdate");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      toast.error("No user found to log out.");
      return;
    }

    try {
      await logoutUser(userId);

      // Clean up localStorage or cookies
      localStorage.removeItem("userId");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      toast.success("You have been logged out");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(typeof error === "string" ? error : "Logout failed");
    }
  };

  const fetchDashboard = async () => {
    const riderId = localStorage.getItem("userId");
    if (!riderId) {
      return;
    }
    try {
      const response = await getRiderDashboard(riderId);
      if (response) {
   
        setRiderStats({
          totalDeliveries: response.totalDeliveries || 0,
          todayDeliveries: response.todayDeliveries || 0,
          pendingDeliveries: response.pendingDeliveries || 0,
          rating: response.rating || 0.0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch rider dashboard:", error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

const getOrdersHistory = async () => {
  try {
    const riderId = localStorage.getItem("userId");
    if (!riderId) return;

    const orders = await getOrderHistory(riderId);
    const deliveredNonDropshippingOrders = filterNonDropshippingOrders(
      orders.filter((order: Orders) => order.status === "delivered")
    );
    setOrderHistory(deliveredNonDropshippingOrders);

  } catch (error) {
    console.error("Failed to fetch rider order history", error);
  }
};


  useEffect(() => {
    getOrdersHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyDelivery = async (orderId: string, code: string) => {
    try {
      const orderVerify = await verifyOrderCode(orderId, code);
      if (orderVerify.success) {
        toast.success("Delivery verified successfully");
        await updateOrderStatus(orderId, "delivered");
        setShowVerificationModal(false);
        setSelectedOrderId("");
        // Refresh both lists to move delivered item from pending to history
        getOrders();
        getOrdersHistory();
      } else {
        toast.error("Failed to verify the delivery");
      }
    } catch (error) {
      console.error("Error verifying delivery:", error);
      toast.error("Failed to verify the delivery");
    }
  };

  const handleOrderDetailsClick = (order: any) => {
    setSelectedOrder(order);
    setIsOrderDetailsModalOpen(true);
  };

  const acceptDelivery = (orderId: string) => {
    assignRiderOrder(orderId);
  
  };

  const assignRiderOrder = async (orderId: string) => {
    try {
      const riderId = localStorage.getItem("userId");
      if (!riderId) {
        toast.error("User ID not found");
        return;
      }
      await assignToRider(orderId, riderId);
      
      // Find and update the order status locally
      const orderToUpdate = orders.find(order => order.orderId === orderId);
      if (orderToUpdate) {
        updateStatus(orderId, "out-for-delivery");
      }
    } catch (error) {
      console.error("Failed to assign order to rider", error);
      
      // Check if the error is related to dropshipping
      if (error instanceof Error && error.message.includes('dropshipping')) {
        toast.error("This order is handled by dropshipping and doesn't require a rider");
      } else {
        toast.error("Failed to assign order");
      }
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      // Refresh orders to get updated data
      getOrders();
    } catch (error) {
      console.error("Failed to update order status", error);
      toast.error("Failed to update order status");
    }
  };

  const completeDelivery = (deliveryId: string) => {
    console.log("Completing delivery:", deliveryId);
  };

  const markAsOutForDelivery = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowVerificationModal(true);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            Agromat
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm font-medium hidden sm:block">
              Welcome, Rider
            </span>
            <a href="/profile/rider">
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </a>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">
          Rider Dashboard
        </h2>

        <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-black/10">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                Total Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center">
                <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <span className="text-lg sm:text-2xl font-bold">
                  {orderHistory.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                Today's Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                <span className="text-lg sm:text-2xl font-bold">
                  {riderStats.todayDeliveries}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <span className="text-lg sm:text-2xl font-bold">
                  {orders.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center">
                <Star className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <span className="text-lg sm:text-2xl font-bold">
                  {riderStats.rating.toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              History ({orderHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="border-none p-0">
            <h3 className="mb-4 text-base sm:text-lg font-bold">
              Available Deliveries
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p>No pending deliveries available</p>
                <p className="text-sm text-gray-400 mt-1">
                  New orders will appear here when they're ready for delivery
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.orderId} className="border-black/10">
                    <CardHeader className="p-3 sm:p-4 pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm sm:text-lg">
                            {`${order.userId.firstName} ${order.userId.lastName}`}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-gray-500">
                            #{order.orderId}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-800">
                            Verification code •{" "}
                            <span className="font-bold">
                              {order.verificationCode
                                ? "*****" + order.verificationCode.slice(-1)
                                : "******"}
                            </span>
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${
                            statusColors[order.status ?? "pending"] ||
                            "bg-gray-100 text-gray-800 border-gray-300"
                          } text-xs self-start sm:self-center`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className="grid gap-2">
                        <div className="flex items-start text-xs sm:text-sm">
                          <MapPin className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="break-words">
                            {order.deliveryAddress}
                          </span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm">
                          <Package className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          {order.items.length} items • ₦{order.totalAmount}
                        </div>
                        <div className="flex items-center text-xs sm:text-sm">
                          <Truck className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          Delivery fee: ₦500
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        {order.status === "packed" ||
                        order.status === "pending" ? (
                          <Button
                            onClick={() =>
                              order.orderId && acceptDelivery(order.orderId)
                            }
                            size="sm"
                            disabled={!order.orderId}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Accept Delivery
                          </Button>
                        ) : order.status === "out-for-delivery" ? (
                          <Button
                            onClick={() =>
                              order.orderId && markAsOutForDelivery(order.orderId)
                            }
                            size="sm"
                            disabled={!order.orderId}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Mark as Delivered
                          </Button>
                        ) : (
                          <Button
                            onClick={() =>
                              order.orderId && completeDelivery(order.orderId)
                            }
                            size="sm"
                            disabled={!order.orderId}
                            hidden={order.status === "delivered"}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Mark as Out-For-Delivery
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-xs sm:text-sm"
                          onClick={() => handleOrderDetailsClick(order)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="border-none p-0">
            <h3 className="mb-4 text-base sm:text-lg font-bold">
              Delivered Orders
            </h3>

            {/* Mobile-friendly card layout for small screens */}
            <div className="block sm:hidden space-y-3">
              {orderHistory.map((history) => (
                <Card key={history.orderId} className="border-black/10">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            {`${history.userId.firstName} ${history.userId.lastName}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            #{history.orderId}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 border-green-300 text-xs"
                        >
                          delivered
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-600">
                        <p className="truncate">{history.deliveryAddress}</p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs">
                          <p className="font-medium">₦{history.totalAmount}</p>
                          <p className="text-green-600">Delivery Fee: ₦500</p>
                        </div>
                        <div className="text-right text-xs">
                          <p>{formatDate(history.updatedAt)}</p>
                          <div className="flex items-center">
                            <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>5.0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop table layout */}
            <div className="hidden sm:block overflow-x-auto rounded-md border border-gray-200">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-sm">Order</th>
                    <th className="px-4 py-3 font-medium text-sm">Customer</th>
                    <th className="px-4 py-3 font-medium text-sm">Address</th>
                    <th className="px-4 py-3 font-medium text-sm">Amount</th>
                    <th className="px-4 py-3 font-medium text-sm">
                      Delivery Fee
                    </th>
                    <th className="px-4 py-3 font-medium text-sm">Completed</th>
                    <th className="px-4 py-3 font-medium text-sm">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((history) => (
                    <tr
                      key={history.orderId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{history.orderId}</p>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-300 text-xs mt-1"
                          >
                            delivered
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {`${history.userId.firstName} ${history.userId.lastName}`}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div
                          className="max-w-[200px] truncate"
                          title={history.deliveryAddress}
                        >
                          {history.deliveryAddress}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        ₦{history.totalAmount}
                      </td>
                      <td className="px-4 py-3 font-medium text-green-600 text-sm">
                        ₦500
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(history.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                          5.0
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orderHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                <p>No delivered orders yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Completed deliveries will appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <OrderDetailsModal
        isOpen={isOrderDetailsModalOpen}
        onClose={() => {
          setIsOrderDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdateStatus={() => {}}
      />

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerify={verifyDelivery}
        orderId={selectedOrderId}
      />

      <footer className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-xs sm:text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Agromat. All rights reserved.
        </div>
      </footer>
    </div>
  );
}