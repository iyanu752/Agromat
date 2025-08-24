/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Clock,
  Edit,
  LogOut,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  Trash,
  DollarSign,
  User,
  Calendar,
  Menu,
  X,
  Leaf,
} from "lucide-react";
import { socket } from "@/utils/socket";
import { AddEditItemModal } from "@/comp/add-edit-item-modal";
import { OrderDetailsModal } from "@/comp/order-details-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getOrdersByVendorId } from "@/service/orderService";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupermarket, updateStatus } from "@/service/supermarketService";
import { getProductsByVendor, deleteProduct } from "@/service/productService";
import { toast } from "sonner";
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
import { getVendorProfile } from "@/service/profileService";
import { SupermarketSettingsModal } from "@/comp/supermarket-settings-modal";
import { getVendorDashboard } from "@/service/dashboardService";
import { logoutUser } from "@/service/authService";

// Define the supermarket type
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

interface VendorOrder {
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
  assignedRider: string;
  createdAt: string;
}

interface VendorProfileType {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | number;
  address?: string;
  createdAt?: string;
  businessName?: string;
  businessPhoneNumber?: string;
  businessDescription?: string;
  estate?: string;
  supermarket?: string;
  userType?: string;
}
interface Product {
  _id?: string;
  id?: string;
  name: string;
  category?: string;
  price: number;
  unit?: string;
  stock: number;
  image?: string;
  description?: string;
  isAvailable?: boolean;
}

export default function VendorDashboard() {
  const [supermarket, setSupermarket] = useState<Supermarket>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState<VendorProfileType>({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [supermarketSettings, setSupermarketSettings] = useState(supermarket);
  const supermarketName =
    supermarket?.name || (isLoading ? "Loading..." : "No Name");
  const supermarketOpenTime = supermarket?.openTime || "9:00 AM";
  const supermarketCloseTime = supermarket?.closeTime || "9:00 PM";
  const supermarketDescription = supermarket?.description || "";
  const supermarketImage = supermarket?.image || "/placeholder.svg"
  const supermarketId = supermarket?._id;
  const vendorId = supermarket?.ownerId || "";
  const [isOpen, setIsOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [items, setItems] = useState<Product[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [dateFilter, setDateFilter] = useState("today");
  const navigate = useNavigate();
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    // confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    packed: "bg-orange-100 text-orange-800 border-orange-300",
    "out-for-delivery": "bg-purple-100 text-purple-800 border-purple-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    "payment-failed": "bg-red-50 text-red-700 border-red-200",
  };

useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('orderPlaced', (data: any) => {
      const orderid = data.product.orderId
      toast.success(`New Order ${orderid} Placed!`);
      setOrders((previousOrders) => [ data.product, ...previousOrders])
    });

       socket.on('orderStatusUpdate', (data: any) => {
      const orderStatus = data.orders.status
      let message = ''
        if (orderStatus === 'out-for-delivery'){
        message = 'Rider has picked up order, Out for delivery'
      }else if (orderStatus === 'delivered') {
        message = 'Order delivered, Your goods have been delivered'
      }
      toast.success(`${message}`);
      getVendorOrder()
    });

    return () => {
      socket.off('orderPlaced');
      socket.off('orderStatusUpdate')
    };
  }, []);


  const getVendorOrder = async () => {
    try {
      const response = await getOrdersByVendorId(vendorId);
      
      setOrders(response);
    } catch (error) {
      console.error("❌ Error fetching vendor orders:", error);
    }
  };

  useEffect(() => {
    getVendorOrder();
  }, []);

  useEffect(() => {
    getProfile();
  }, []);

  useEffect(() => {
    getSupermarketInfo();
  }, []);

  useEffect(() => {
    if (vendorId && !isLoading) {
      fetchVendorProducts();
    }
  }, [vendorId, isLoading]);





  const getSupermarketInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
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
      } else {
        setError("No supermarket data found");
      }
    } catch (error) {
      console.error("Error fetching supermarket:", error);
      setError("Failed to load supermarket data");
    } finally {
      setIsLoading(false);
    }
  };

   const logout = async () => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      toast.error('No user found to log out.');
      return;
    }

    try {
      await logoutUser(userId);

      // Clean up localStorage or cookies
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      toast.success('You have been logged out');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(typeof error === 'string' ? error : 'Logout failed');
    }
  };

  const handleSettingsUpdate = (updatedSettings: any) => {
    setSupermarketSettings(updatedSettings);
    setIsOpen(updatedSettings.isOpen);
    getSupermarketInfo();
  };

  const getProfile = async () => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        const vendorId = userData.id;
        const profile = await getVendorProfile(vendorId);
        setProfileData(profile.user);
        
        return profile;
      }
    } catch (error) {
      console.error("Could not fetch vendor profile", error);
    }
  };

  const fetchVendorProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const vendorProductsRes = await getProductsByVendor(vendorId);
      let productsArray = [];
      if (vendorProductsRes && vendorProductsRes.product) {
        productsArray = vendorProductsRes.product;
      } else if (vendorProductsRes && vendorProductsRes.products) {
        productsArray = vendorProductsRes.products;
      } else if (vendorProductsRes && Array.isArray(vendorProductsRes)) {
        productsArray = vendorProductsRes;
      } else if (
        vendorProductsRes &&
        vendorProductsRes.data &&
        Array.isArray(vendorProductsRes.data)
      ) {
        productsArray = vendorProductsRes.data;
      } else if (vendorProductsRes && typeof vendorProductsRes === "object") {
        const possibleArrays = [
          "product",
          "products",
          "data",
          "items",
          "results",
        ];
        for (const prop of possibleArrays) {
          if (
            vendorProductsRes[prop] &&
            Array.isArray(vendorProductsRes[prop])
          ) {
            productsArray = vendorProductsRes[prop];
            break;
          }
        }
      }

      if (productsArray && productsArray.length > 0) {
        const transformedProducts = productsArray.map(
          (product: Product, index: number) => ({
            id: product._id || product.id || index + 1,
            _id: product._id,
            name: product.name || "Unnamed Product",
            category: product.category || "Uncategorized",
            price:
              typeof product.price === "number"
                ? product.price
                : parseFloat(product.price) || 0,
            unit: product.unit || "each",
            isAvailable:
              product.isAvailable !== undefined
                ? product.isAvailable
                : product.stock !== undefined
                ? product.stock
                : (product.stock || product.stock) > 0,
            stock:
              product.stock !== undefined
                ? product.stock
                : typeof product.stock === "number"
                ? product.stock
                : product.stock || 0,
            image: product.image || "/placeholder.svg?height=100&width=100",
            description: product.description || "",
          })
        );
        setItems(transformedProducts);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching vendor products:", error);
      setItems([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case "today":
        return "Today's";
      case "week":
        return "This Week's";
      case "month":
        return "This Month's";
      case "year":
        return "This Year's";
      case "total":
        return "Total";
      default:
        return "This Month's";
    }
  };

  const handleAddItem = (newItem: any) => {
    const item = {
      ...newItem,
      id: Math.max(...items.map((i) => Number(i.id) || 0)) + 1,
    };
    setItems([...items, item]);
    // Optionally refresh the products list from the server
    fetchVendorProducts();
  };

  const handleEditItem = (updatedItem: any) => {
    setItems(
      items.map((item) =>
        item.id === updatedItem.id || item._id === updatedItem._id
          ? updatedItem
          : item
      )
    );
    setSelectedItem(null);
    fetchVendorProducts();
  };

  const handleDeleteItem = async (itemId: number | string) => {
    setItems(items.filter((item) => item.id !== itemId && item._id !== itemId));
    try {
      await deleteProduct(itemId as string);
      toast.success("Product deleted successfully");
      fetchVendorProducts();
    } catch (error) {
      console.error("Error deleting product: ", error);
    }
  };

  const handleEditClick = (item: Product) => {
    setSelectedItem(item);
    setIsEditItemModalOpen(true);
  };

  const handleOrderDetailsClick = (order: any) => {
    setSelectedOrder(order);
    setIsOrderDetailsModalOpen(true);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(
      orders.map((order) =>
        order.orderId === orderId
          ? { ...order, status: newStatus as any }
          : order
      )
    );
  };

  const handleStoreStatusChange = async (checked: boolean) => {
    setIsOpen(checked); // Optimistic UI update

    try {
      if (!supermarketId) {
        console.error("SupermarketId is not defined");
        return;
      }

      const updateStatusRes = await updateStatus(supermarketId, {
        isOpen: checked,
      });

      if (updateStatusRes) {
        setSupermarket((prev) => ({ ...prev, isOpen: checked }));
      } else {
        setIsOpen(!checked);
        console.error("Failed to update supermarket isOpen");
      }
    } catch (error) {
      setIsOpen(!checked);
      console.error("Error updating supermarket isOpen:", error);
    }
  };

  useEffect(() => {
    if (supermarketId) {
  
      fetchDashboardStats();
    }
  }, [supermarketId, dateFilter]);

  const fetchDashboardStats = async () => {
    try {
      const res = await getVendorDashboard(supermarketId!, dateFilter);
   
      setDashboardStats(res);
    } catch (err) {
      console.error("❌ Error fetching dashboard stats:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-base">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">
            Debug: Loading={isLoading.toString()}, HasData=
            {Object.keys(supermarket).length > 0}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-base">{error}</p>
          <Button onClick={getSupermarketInfo}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold text-green-800">AgroMat</span>
          </a>
        </div>
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-2 md:gap-4">
            <span className="text-xs sm:text-sm font-medium hidden md:block">
              {profileData.firstName && profileData.lastName
                ? `Welcome, ${profileData.firstName} ${profileData.lastName}`
                : "Welcome"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                getSupermarketInfo();
                if (vendorId) fetchVendorProducts();
              }}
              className="text-xs hidden lg:flex"
            >
              Refresh Data
            </Button>
            <a href="/profile/vendor">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <User className="h-4 w-4" />
                <span className="sr-only">Profile</span>
              </Button>
            </a>
            <a href="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" onClick={logout} />
                <span className="sr-only">Logout</span>
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-8 w-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-2">
              <div className="text-sm font-medium py-2">
                {profileData.firstName && profileData.lastName
                  ? `Welcome, ${profileData.firstName} ${profileData.lastName}`
                  : "Welcome"}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  getSupermarketInfo();
                  if (vendorId) fetchVendorProducts();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start text-xs"
              >
                Refresh Data
              </Button>
              <a href="/profile/vendor" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </a>
              <a href="/" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </a>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start">
          {/* Store Info Card */}
          <Card className="border-black/10 lg:w-1/3">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base sm:text-lg pr-2">
                  {supermarketName}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => setIsSettingsModalOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <img
                src={supermarketImage}
                alt={supermarketName}
                className="mb-3 h-[120px] sm:h-[150px] w-full rounded-md object-cover"
              />
              <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                {supermarketDescription || "No description available"}
              </p>
              {(supermarketOpenTime || supermarketCloseTime) && (
                <div className="mb-4 flex items-center text-xs text-gray-500">
                  <Clock className="mr-1 h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {supermarketOpenTime} - {supermarketCloseTime}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium text-sm sm:text-base">
                  Store Status
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      isOpen ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {isOpen ? "Open" : "Closed"}
                  </span>
                  <Switch
                    checked={isOpen}
                    onCheckedChange={handleStoreStatusChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1">
            {/* Date Filter */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Dashboard Overview
              </h2>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="total">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-4 sm:mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Revenue */}
              <Card className="border-black/10">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                    {getFilterLabel()} Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                    <span className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                      ₦{dashboardStats.Revenue?.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Total Orders */}
              <Card className="border-black/10">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                    {getFilterLabel()} Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="flex items-center">
                    <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-lg sm:text-2xl font-bold">
                      {dashboardStats.Orders}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Average Order Value */}
              <Card className="border-black/10">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                    Avg. Order Value
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
                    <span className="text-lg sm:text-2xl font-bold truncate">
                      ₦{dashboardStats.averageOrderValue?.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Orders */}
              <Card className="border-black/10">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                    Pending Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="flex items-center">
                    <Package className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 flex-shrink-0" />
                    <span className="text-lg sm:text-2xl font-bold">
                      {dashboardStats["Pending Orders"]}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-3 h-auto">
                <TabsTrigger
                  value="inventory"
                  className="text-xs sm:text-sm py-2"
                >
                  Inventory ({items.length})
                </TabsTrigger>
                <TabsTrigger value="orders" className="text-xs sm:text-sm py-2">
                  Orders({orders.length})
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="text-xs sm:text-sm py-2"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="border-none p-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-base sm:text-lg font-bold">
                    Inventory Management
                    {isLoadingProducts && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        (Loading products...)
                      </span>
                    )}
                  </h3>
                  <Button
                    size="sm"
                    className="w-fit"
                    onClick={() => setIsAddItemModalOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {/* Show loading state for products */}
                {isLoadingProducts && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading products...</p>
                  </div>
                )}

                {/* Show empty state */}
                {!isLoadingProducts && items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-base mb-2">No products found</p>
                    <p className="text-sm">
                      {vendorId
                        ? "Add your first product to get started"
                        : "Vendor ID not available"}
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setIsAddItemModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Product
                    </Button>
                  </div>
                )}

                {/* Mobile Card View */}
                {!isLoadingProducts && items.length > 0 && (
                  <div className="block sm:hidden space-y-4">
                    {items.map((item) => (
                      <Card
                        key={item._id || item.id}
                        className="border-gray-200"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="h-12 w-12 rounded object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-sm truncate">
                                    {item.name}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {item.category}
                                  </p>
                                </div>
                                <Badge
                                  variant={item.stock ? "default" : "outline"}
                                  className={`text-xs ${
                                    item.stock ? "bg-green-600" : "text-red-500"
                                  }`}
                                >
                                  {item.isAvailable
                                    ? "In Stock"
                                    : "Out of Stock"}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-sm">
                                  <span className="font-medium">
                                    ₦{item.price.toFixed(2)}
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    Qty: {item.stock}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditClick(item)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500"
                                      >
                                        <Trash className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Are you absolutely sure?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This
                                          will permanently delete the product
                                          and you will not be able to recover
                                          it.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                          onClick={() => {
                                            const id = item._id ?? item.id;
                                            if (id !== undefined)
                                              handleDeleteItem(id);
                                          }}
                                        >
                                          Yes, delete it
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Desktop Table View */}
                {!isLoadingProducts && items.length > 0 && (
                  <div className="hidden sm:block overflow-x-auto rounded-md border border-gray-200">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50 text-left">
                          <th className="px-4 py-3 font-medium text-sm">
                            Product
                          </th>
                          <th className="px-4 py-3 font-medium text-sm">
                            Category
                          </th>
                          <th className="px-4 py-3 font-medium text-sm">
                            Price
                          </th>
                          <th className="px-4 py-3 font-medium text-sm">
                            Quantity
                          </th>
                          <th className="px-4 py-3 font-medium text-sm">
                            Status
                          </th>
                          <th className="px-4 py-3 font-medium text-sm">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr
                            key={item._id || item.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name}
                                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                                />
                                <div>
                                  <div className="font-medium text-sm">
                                    {item.name}
                                  </div>
                                  {item.description && (
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {item.category || "Uncategorized"}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              ₦{item.price.toFixed(2)}
                              {item.unit && (
                                <span className="text-xs text-gray-500 ml-1">
                                  /{item.unit || ""}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {item.stock || 0}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  item.isAvailable ? "default" : "outline"
                                }
                                className={`text-xs ${
                                  item.isAvailable
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "text-red-500 border-red-200"
                                }`}
                              >
                                {item.isAvailable ? "In Stock" : "Out of Stock"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => handleEditClick(item)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500"
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Are you absolutely sure?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete the product and you
                                        will not be able to recover it.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => {
                                          const id = item._id ?? item.id;
                                          if (id !== undefined)
                                            handleDeleteItem(id);
                                        }}
                                      >
                                        Yes, delete it
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orders" className="border-none p-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-base sm:text-lg font-bold">
                    Order Management
                  </h3>
                </div>

                {/* Mobile Order Cards */}
                <div className="block sm:hidden space-y-4">
                  {orders.map((order) => (
                    <Card key={order.orderId} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-sm">
                              {order.orderId}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {order.userId?.firstName || "Customer"}
                            </p>
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

                        <div className="flex items-center justify-between text-sm mb-3">
                          <span className="text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className="font-medium">
                            ₦{order.totalAmount.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {order.items.length} item
                            {order.items.length > 1 ? "s" : ""}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleOrderDetailsClick(order)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Orders Table */}
                <div className="hidden sm:block overflow-x-auto rounded-md border border-gray-200">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left">
                        <th className="px-4 py-3 font-medium text-sm">
                          Order ID
                        </th>
                        <th className="px-4 py-3 font-medium text-sm">
                          Customer
                        </th>
                        <th className="px-4 py-3 font-medium text-sm">Date</th>
                        <th className="px-4 py-3 font-medium text-sm">Items</th>
                        <th className="px-4 py-3 font-medium text-sm">Total</th>
                        <th className="px-4 py-3 font-medium text-sm">
                          Status
                        </th>
                        <th className="px-4 py-3 font-medium text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.orderId}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm font-medium">
                            {order.orderId}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {order.userId?.firstName || "Customer"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {order.items.length}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            ₦{order.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                order.status === "pending"
                                  ? "outline"
                                  : "default"
                              }
                              className={`text-xs ${
                                statusColors[order.status] ??
                                "bg-gray-100 text-gray-800 border-gray-300"
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1).replace(/-/g, " ")}
                            </Badge>{" "}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleOrderDetailsClick(order)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty Orders State */}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-base mb-2">No orders yet</p>
                    <p className="text-sm">
                      Orders will appear here when customers place them
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      {supermarket?.ownerId && (
        <AddEditItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          onSave={handleAddItem}
          mode="add"
          ownerId={supermarket?.ownerId}
        />
      )}

      {supermarket?.ownerId && (
        <AddEditItemModal
          isOpen={isEditItemModalOpen}
          onClose={() => {
            setIsEditItemModalOpen(false);
            setSelectedItem(null);
          }}
          onSave={handleEditItem}
          item={
            selectedItem
              ? {
                  ...selectedItem,
                  category: selectedItem.category ?? "Uncategorized",
                  unit: selectedItem.unit ?? "unit",
                  stock: selectedItem.stock ?? 0,
                  isAvailable: selectedItem.isAvailable ?? false,
                }
              : null
          }
          mode="edit"
          ownerId={supermarket.ownerId}
        />
      )}

      <OrderDetailsModal
        isOpen={isOrderDetailsModalOpen}
        onClose={() => {
          setIsOrderDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onUpdateStatus={handleUpdateOrderStatus}
      />

      <SupermarketSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSettingsUpdate}
        settings={supermarketSettings}
      />

      <footer className="border-t border-gray-200 py-4 sm:py-6">
        <div className="container mx-auto px-4 text-center text-xs sm:text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Agromat. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
