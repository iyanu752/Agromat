/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { LogOut, Search, ShoppingCart, Trash, User, Users, Star, Truck, Edit, Menu, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllUsers, getAdminDashboard, getAllRiders, getAllVendors } from "@/service/dashboardService"
import { AssignRiderModal } from "@/comp/assign-rider-modal"
import { EditRiderModal } from "@/comp/edit-rider-modal"
import { getAllOrders } from "@/service/orderService"
import { EditUserModal } from "@/comp/edit-user-modal"
import { EditVendorModal } from "@/comp/edit-vendor-modal"
import { logoutUser } from "@/service/authService"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom";
// import { Navigate } from "react-router-dom"
interface User {
  id?: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  address?: string
  string?: string
  estate?: string
  userType?: "user" | "vendor" | "rider" | "admin"
  createdAt?: string
}

interface Vendor {
  id?: string
  firstName?: string
  lastName?: string
  owner?: string
  email?: string
  phone?: string
  superMarketName?: string
  businessAddress?: string
  businessPhone?: string
  businessDescription?: string
  businessLicense?: string
  items?: number
  createdAt?: string
  avatar?: string
  operatingHours?: {
    openTime: string
    closeTime: string
    isOpen: boolean
  }
  deliverySettings?: {
    deliveryFee: number
    minimumOrder: number
    deliveryRadius: number
    estimatedDeliveryTime: string
  }
  bankDetails?: {
    accountName: string
    accountNumber: string
    bankName: string
    routingNumber: string
  }
}

interface Rider {
  id?: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  status?: string
  rating?: number
  totalDeliveries?: number
  assignedOrders?: number
  createdAt?: string
  avatar?: string
  vehicleInfo?: {
    type: string
    number: string
    color: string
    model: string
  }
  licenseInfo?: {
    number: string
    expiryDate: string
    verified: boolean
  }
  bankDetails?: {
    accountName: string
    accountNumber: string
    bankName: string
    routingNumber: string
  }
  workingHours?: {
    startTime: string
    endTime: string
    availableDays: string[]
  }
  deliveryZones?: string[]
  earnings?: {
    totalEarnings: number
    thisMonth: number
    averagePerDelivery: number
  }
}

interface PendingOrder {
  _id: string;
  userId: {
    email: string;
    firstName: string;
    lastName?: string;
    supermarket?: string;
  };
  items: {
    product: {
      _id: string;
      name: string;
      price: number;
      category?: string;
    };
    quantity: number;
  }[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryInstructions?: string;
  status: string;
  orderId: string;
  assignedRider?: string;
  createdAt: string;
  updatedAt?: string;
  paymentMethod?: string;
  deliveryFee?: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  // confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  packed: "bg-orange-100 text-orange-800 border-orange-300",
  "out-for-delivery": "bg-purple-100 text-purple-800 border-purple-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  "payment-failed": "bg-red-50 text-red-700 border-red-200",
};

const UserCard = ({ user, onEdit, onDelete }: any) => (
  <Card className="border-black/10">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-lg">
            {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
          </h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">Phone:</span> {user.phone || "N/A"}</p>
        <p><span className="font-medium">Joined:</span> {user.createdAt?.split('T')[0] || "N/A"}</p>
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(user)} className="flex-1">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(user.id)}>
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
)

const VendorCard = ({ vendor, onEdit, onDelete }: any) => {
  return (
    <Card className="border-black/10">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium text-lg">
              {vendor.superMarketName || vendor.supermarketName || vendor.supermarket_name || vendor.name || 'Unknown Supermarket'}
            </h3>
            <p className="text-sm text-gray-600">
              {vendor.owner || `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'Unknown Owner'}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Email:</span> {vendor.email || 'N/A'}</p>
          <p><span className="font-medium">Items:</span> {vendor.items || 0}</p>
          <p><span className="font-medium">Joined:</span> {vendor.createdAt?.split('T')[0] || "N/A"}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => onEdit(vendor)} className="flex-1">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(vendor.id)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const RiderCard = ({ rider, onEdit, onDelete }: any) => (
  <Card className="border-black/10">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-lg">
            {rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim()}
          </h3>
          <p className="text-sm text-gray-600">{rider.email}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center">
          <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">Rating:</span> {rider.rating || "N/A"}
        </div>
        <p><span className="font-medium">Deliveries:</span> {rider.totalDeliveries || 0}</p>
        <p><span className="font-medium">Assigned Orders:</span> {rider.assignedOrders || 0}</p>
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(rider)} className="flex-1">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(rider.id)}>
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
)

// Simplified pending order card with minimal information
const PendingOrderCard = ({ order, onAssignRider }: { order: PendingOrder, onAssignRider: (order: PendingOrder) => void }) => (
  <Card className="border-yellow-200 bg-yellow-50/30">
    <CardContent className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">#{order.orderId}</span>
            <Badge className={`text-xs ${statusColors[order.status.toLowerCase()] || statusColors.pending}`}>
              {order.status}
            </Badge>
          </div>
          
          <div className="text-xs text-gray-600 space-y-0.5">
            <div>{order.userId.firstName} {order.userId.lastName || ''}</div>
            <div>₦{order.totalAmount.toFixed(2)} • {order.items.length} items</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {order.assignedRider ? (
            <Badge variant="outline" className="text-xs">
              Assigned
            </Badge>
          ) : (
            <Button 
              size="sm" 
              onClick={() => onAssignRider(order)} 
              className="text-xs px-2 py-1 h-7"
            >
              <Truck className="h-3 w-3 mr-1" />
              Assign
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("users")
  const [stats, setStats] = useState({
    allUsersCount: 0,
    totalVendors: 0,
    totalRiders: 0,
    totalUsers: 0
  })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([])
   
  const [, setAllOrders] = useState<PendingOrder[]>([])
  const navigate = useNavigate();
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false)
  const [isEditRiderModalOpen, setIsEditRiderModalOpen] = useState(false)
  const [isAssignRiderModalOpen, setIsAssignRiderModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [selectedRider, setSelectedRider] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Helper function to get user display name
  const getUserDisplayName = (user: User) => {
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
  }

  // Helper function to get rider display name
  const getRiderDisplayName = (rider: Rider) => {
    return rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || 'Unknown Rider'
  }


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

  const filteredUsers = users.filter(
    (user) => {
      const displayName = getUserDisplayName(user).toLowerCase()
      const email = (user.email || '').toLowerCase()
      const query = searchQuery.toLowerCase()
      return displayName.includes(query) || email.includes(query)
    }
  )

  const filteredVendors = vendors.filter(
    (vendor) => {
      const superMarketName = (vendor.superMarketName || '').toLowerCase()
      const owner = (`${vendor.firstName || ''}  ${vendor.lastName || ''}`).toLowerCase()
      const email = (vendor.email || '').toLowerCase()
      const query = searchQuery.toLowerCase()
      return superMarketName.includes(query) || owner.includes(query) || email.includes(query)
    }
  )

  const filteredRiders = riders.filter(
    (rider) => {
      const displayName = getRiderDisplayName(rider).toLowerCase()
      const email = (rider.email || '').toLowerCase()
      const query = searchQuery.toLowerCase()
      return displayName.includes(query) || email.includes(query)
    }
  )

  // Filter pending orders based on search query
  const filteredPendingOrders = pendingOrders.filter(
    (order) => {
      const customerName = `${order.userId.firstName} ${order.userId.lastName || ''}`.toLowerCase()
      const customerEmail = order.userId.email.toLowerCase()
      const orderId = order.orderId.toLowerCase()
      const query = searchQuery.toLowerCase()
      return customerName.includes(query) || customerEmail.includes(query) || orderId.includes(query)
    }
  )

  const fetchAllOrders = async () => {
    try {
      setIsLoading(true)
      const response = await getAllOrders();
      // console.log(allOrders)
      setAllOrders(response)
      
      // Filter only pending orders (case-insensitive)
      const pendingOrdersFiltered = response.filter((order: any) => 
        order.status && order.status.toLowerCase() === "packed"
      )
      
      setPendingOrders(pendingOrdersFiltered)
      
    } catch (error) {
      console.error("Error fetching orders: ", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [])

  const fetchAdminDashboard = async () => {
    try {
      setIsLoading(true)
      const adminId = localStorage.getItem("userId")
      if (!adminId) {
        console.warn("No admin ID found in localStorage")
        return
      }
      const response = await getAdminDashboard(adminId)
      console.log("Dashboard stats:", response)
      setStats(response)
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      setIsLoading(true)
      const response = await getAllUsers()
      console.log("All users:", response)
      const transformedUsers = response.map((user: any) => ({
        ...user,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        joinDate: user.createdAt?.split('T')[0],
      }))
      setUsers(transformedUsers)
    } catch (error) {
      console.error('Error fetching all users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllVendors = async () => {
    try {
      setIsLoading(true)
      const response = await getAllVendors()
      console.log("Raw vendors API response:", response)
      
      const transformedVendors = response.map((vendor: any) => ({
        ...vendor,
        superMarketName: vendor.superMarketName || vendor.supermarketName || vendor.supermarket_name || vendor.name || 'Unknown Supermarket',
        owner: vendor.owner || `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'Unknown Owner',
        joinDate: vendor.createdAt?.split('T')[0],
        items: vendor.items || 0
      }))
      
      console.log("Transformed vendors:", transformedVendors)
      setVendors(transformedVendors)
    } catch (error) {
      console.error('Error fetching all vendors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllRiders = async () => {
    try {
      setIsLoading(true)
      const response = await getAllRiders()
      console.log("All riders:", response)
      const transformedRiders = response.map((rider: any) => ({
        ...rider,
        name: rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim(),
        joinDate: rider.createdAt?.split('T')[0],
        rating: rider.rating || 0,
        totalDeliveries: rider.totalDeliveries || 0,
        assignedOrders: rider.assignedOrders || 0
      }))
      setRiders(transformedRiders)
    } catch (error) {
      console.error('Error fetching all riders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchAdminDashboard(),
        fetchAllUsers(),
        fetchAllVendors(),
        fetchAllRiders()
      ])
    }
    
    fetchAllData()
  }, [])

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setIsEditUserModalOpen(true)
  }

  const handleEditVendor = (vendor: any) => {
    setSelectedVendor(vendor)
    setIsEditVendorModalOpen(true)
  }

  const handleEditRider = (rider: any) => {
    setSelectedRider(rider)
    setIsEditRiderModalOpen(true)
  }

  const handleAssignRider = (order: any) => {
    setSelectedOrder(order)
    setIsAssignRiderModalOpen(true)
  }

  // Save handlers
  const handleSaveUser = (updatedUser: any) => {
    setUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
    setSelectedUser(null)
  }

  const handleSaveVendor = (updatedVendor: any) => {
    setVendors(vendors.map((vendor) => (vendor.id === updatedVendor.id ? updatedVendor : vendor)))
    setSelectedVendor(null)
  }

  const handleSaveRider = (updatedRider: any) => {
    setRiders(riders.map((rider) => (rider.id === updatedRider.id ? updatedRider : rider)))
    setSelectedRider(null)
  }

  const handleAssignOrder = (orderId: string, riderId: string) => {
    // Update rider's assigned orders count
    setRiders(
      riders.map((rider) => 
        rider.id === riderId 
          ? { ...rider, assignedOrders: (rider.assignedOrders || 0) + 1 } 
          : rider
      )
    )

    // Update the order with assigned rider
    setPendingOrders(
      pendingOrders.map((order) => 
        order._id === orderId 
          ? { ...order, assignedRider: riderId } 
          : order
      )
    )

    console.log(`Assigned order ${orderId} to rider ${riderId}`)
    setSelectedOrder(null)
    
    // Refresh orders after assignment
    fetchAllOrders()
  }

  // Delete handlers
  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((user) => user.id !== userId))
    }
  }

  const handleDeleteVendor = (vendorId: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      setVendors(vendors.filter((vendor) => vendor.id !== vendorId))
    }
  }

  const handleDeleteRider = (riderId: string) => {
    if (confirm("Are you sure you want to delete this rider?")) {
      setRiders(riders.filter((rider) => rider.id !== riderId))
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">Agromat</h1>
          
          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm font-medium">Welcome, Admin</span>
             <a href="/profile/admin">
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

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="p-4 space-y-2">
              <div className="text-sm font-medium text-gray-600 mb-2">Welcome, Admin</div>
              <a href="/profile/admin">
              <Button variant="ghost" className="w-full justify-start">
                <User className="h-5 w-5 mr-2" />
                Profile
              </Button>
              </a>

              <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <h2 className="mb-4 md:mb-6 text-xl md:text-2xl font-bold">Admin Dashboard</h2>

        {/* Stats Grid */}
        <div className="mb-6 md:mb-8 grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Card className="border-gray-200 bg-white">
            <CardHeader className="p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="flex items-center">
                <ShoppingCart className="mr-2 h-4 md:h-5 w-4 md:w-5 text-gray-400" />
                <span className="text-lg md:text-2xl font-bold text-gray-500">
                  {isLoading ? '...' : pendingOrders.length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardHeader className="p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Total Users</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="flex items-center">
                <Users className="mr-2 h-4 md:h-5 w-4 md:w-5 text-gray-400" />
                <span className="text-lg md:text-2xl font-bold">
                  {isLoading ? '...' : stats.allUsersCount}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardHeader className="p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Total Vendors</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="flex items-center">
                <ShoppingCart className="mr-2 h-4 md:h-5 w-4 md:w-5 text-gray-400" />
                <span className="text-lg md:text-2xl font-bold">
                  {isLoading ? '...' : stats.totalVendors}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardHeader className="p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Total Riders</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="flex items-center">
                <Truck className="mr-2 h-4 md:h-5 w-4 md:w-5 text-gray-400" />
                <span className="text-lg md:text-2xl font-bold">
                  {isLoading ? '...' : stats.totalRiders}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardHeader className="p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Total Customers</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="flex items-center">
                <User className="mr-2 h-4 md:h-5 w-4 md:w-5 text-gray-400" />
                <span className="text-lg md:text-2xl font-bold">
                  {isLoading ? '...' : stats.totalUsers}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tabs Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="overflow-x-auto">
                <TabsList className="mb-0 w-max md:w-auto">
                  <TabsTrigger value="users" className="text-xs md:text-sm">
                    Users ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="vendors" className="text-xs md:text-sm">
                    Vendors ({vendors.length})
                  </TabsTrigger>
                  <TabsTrigger value="riders" className="text-xs md:text-sm relative">
                    Riders ({riders.length})
                    {pendingOrders.length > 0 && (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-1 py-0.5">
                        {pendingOrders.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs md:text-sm">Analytics</TabsTrigger>
                </TabsList>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-[250px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Users Tab */}
            <TabsContent value="users" className="border-none p-0 mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading users...</div>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto rounded-md border border-gray-200">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50 text-left">
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Phone</th>
                          <th className="px-4 py-3 font-medium">Join Date</th>
                          <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="px-4 py-3">{getUserDisplayName(user)}</td>
                            <td className="px-4 py-3">{user.email}</td>
                            <td className="px-4 py-3">{user.phone || "N/A"}</td>
                            <td className="px-4 py-3">
                              {user.createdAt?.split('T')[0] || "N/A"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id!)}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {filteredUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Vendors Tab */}
            <TabsContent value="vendors" className="border-none p-0 mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading vendors...</div>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto rounded-md border border-gray-200">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-50 text-left">
                          <th className="px-4 py-3 font-medium">Supermarket</th>
                          <th className="px-4 py-3 font-medium">Owner</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Items</th>
                          <th className="px-4 py-3 font-medium">Join Date</th>
                          <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVendors.map((vendor) => (
                          <tr key={vendor.id} className="border-b">
                            <td className="px-4 py-3">{vendor.superMarketName}</td>
                            <td className="px-4 py-3">{vendor.firstName} {vendor.lastName}</td>
                            <td className="px-4 py-3">{vendor.email}</td>
                            <td className="px-4 py-3">{vendor.items || 0}</td>
                            <td className="px-4 py-3">
                              {vendor.createdAt?.split('T')[0] || "N/A"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditVendor(vendor)}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteVendor(vendor.id!)}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {filteredVendors.map((vendor) => (
                      <VendorCard
                        key={vendor.id}
                        vendor={vendor}
                        onEdit={handleEditVendor}
                        onDelete={handleDeleteVendor}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Riders Tab - Combined with pending orders */}
            <TabsContent value="riders" className="border-none p-0 mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading riders...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pending Orders Section */}
                  {pendingOrders.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <ShoppingCart className="h-5 w-5 mr-2 text-yellow-500" />
                          Pending Orders ({filteredPendingOrders.length})
                        </h3>
                      </div>
                      
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPendingOrders.map((order) => (
                          <PendingOrderCard
                            key={order._id}
                            order={order}
                            onAssignRider={handleAssignRider}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Riders List Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-500" />
                        Riders List ({filteredRiders.length})
                      </h3>
                    </div>

                    {/* Desktop Riders Table */}
                    <div className="hidden md:block overflow-x-auto rounded-md border border-gray-200">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50 text-left">
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Rating</th>
                            <th className="px-4 py-3 font-medium">Deliveries</th>
                            <th className="px-4 py-3 font-medium">Assigned Orders</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRiders.map((rider) => (
                            <tr key={rider.id} className="border-b">
                              <td className="px-4 py-3">{getRiderDisplayName(rider)}</td>
                              <td className="px-4 py-3">{rider.email}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  {rider.rating || "N/A"}
                                </div>
                              </td>
                              <td className="px-4 py-3">{rider.totalDeliveries || 0}</td>
                              <td className="px-4 py-3">{rider.assignedOrders || 0}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEditRider(rider)}>
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRider(rider.id!)}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Rider Cards */}
                    <div className="md:hidden space-y-4">
                      {filteredRiders.map((rider) => (
                        <RiderCard
                          key={rider.id}
                          rider={rider}
                          onEdit={handleEditRider}
                          onDelete={handleDeleteRider}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="border-none p-0 mt-4">
              <Card className="border-black/10">
                <CardHeader>
                  <CardTitle className="text-lg">Platform Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-sm text-gray-500 mb-2">Pending Orders</h3>
                      <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
                      <p className="text-sm text-gray-600">Awaiting assignment</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-sm text-gray-500 mb-2">User Growth</h3>
                      <p className="text-2xl font-bold">{users.length}</p>
                      <p className="text-sm text-green-600">+12% from last month</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-sm text-gray-500 mb-2">Vendor Growth</h3>
                      <p className="text-2xl font-bold">{vendors.length}</p>
                      <p className="text-sm text-green-600">+8% from last month</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-sm text-gray-500 mb-2">Rider Growth</h3>
                      <p className="text-2xl font-bold">{riders.length}</p>
                      <p className="text-sm text-green-600">+15% from last month</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-gray-600">Detailed analytics dashboard coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false)
          setSelectedUser(null)
        }}
        onSave={handleSaveUser}
        user={selectedUser}
      />

      <EditVendorModal
        isOpen={isEditVendorModalOpen}
        onClose={() => {
          setIsEditVendorModalOpen(false)
          setSelectedVendor(null)
        }}
        onSave={handleSaveVendor}
        vendor={selectedVendor}
      />

      <EditRiderModal
        isOpen={isEditRiderModalOpen}
        onClose={() => {
          setIsEditRiderModalOpen(false)
          setSelectedRider(null)
        }}
        onSave={handleSaveRider}
        rider={selectedRider}
      />

      <AssignRiderModal
        isOpen={isAssignRiderModalOpen}
        onClose={() => {
          setIsAssignRiderModalOpen(false)
          setSelectedOrder(null)
        }}
        onAssign={handleAssignOrder}
        order={selectedOrder}
        // riders={riders}
      />

      <footer className="border-t border-gray-200 py-4 md:py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Agromat. All rights reserved.
        </div>
      </footer>
    </div>
  )
}