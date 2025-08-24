/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Truck, User, Star, MapPin, Package, Clock, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter, 
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { updateOrderStatus } from "@/service/orderService"

interface Rider {
  id?: string
  _id?: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  status?: "Active" | "Inactive" | "Suspended" | "Offline" | "active" | "inactive" | "suspended" | "offline"
  rating?: number
  totalDeliveries?: number
  assignedOrders?: number
  avatar?: string
  vehicleInfo?: {
    type: string
    number: string
    color: string
    model: string
  }
  deliveryZones?: string[]
  workingHours?: {
    startTime: string
    endTime: string
    availableDays: string[]
  }
}

interface PendingOrder {
  _id: string
  userId: {
    email: string
    firstName: string
    lastName?: string
    supermarket?: string
  }
  items: {
    product: {
      _id: string
      name: string
      price: number
      category?: string
    }
    quantity: number
  }[]
  totalAmount: number
  deliveryAddress: string
  deliveryInstructions?: string
  status: string
  orderId: string
  assignedRider?: string
  createdAt: string
  updatedAt?: string
  paymentMethod?: string
  deliveryFee?: number
}

interface AssignRiderModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (orderId: string, riderId: string) => void
  order: PendingOrder | null
}

import { assignToRider } from "@/service/orderService"
import { getAllRiders } from "@/service/dashboardService"

// Get available riders from your existing service
const getAllAvailableRiders = async (): Promise<Rider[]> => {
  try {
    const response = await getAllRiders()
    // Filter only active riders
    return response.filter((rider: Rider) => 
      rider.status?.toLowerCase() === 'active'
    )
  } catch (error) {
    console.error("Error fetching available riders:", error)
    throw error
  }
}

export function AssignRiderModal({ isOpen, onClose, onAssign, order }: AssignRiderModalProps) {
  const [riders, setRiders] = useState<Rider[]>([])
  const [filteredRiders, setFilteredRiders] = useState<Rider[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  // Fetch available riders when modal opens
  useEffect(() => {
    if (isOpen && order) {
      fetchAvailableRiders()
    }
  }, [isOpen, order])

  // Filter riders based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRiders(riders)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = riders.filter(rider => {
        const name = (rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim()).toLowerCase()
        const email = (rider.email || '').toLowerCase()
        const phone = (rider.phone || '').toLowerCase()
        return name.includes(query) || email.includes(query) || phone.includes(query)
      })
      setFilteredRiders(filtered)
    }
  }, [searchQuery, riders])

  const fetchAvailableRiders = async () => {
    try {
      setIsLoading(true)
      const availableRiders = await getAllAvailableRiders()
      // Filter only active riders
      const activeRiders = availableRiders.filter(rider => 
        rider.status?.toLowerCase() === 'active'
      )
      setRiders(activeRiders)
      setFilteredRiders(activeRiders)
    } catch (error) {
      console.error("Error fetching riders:", error)
      toast.error("Failed to load available riders")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignRider = async () => {
    if (!selectedRider || !order) {
      toast.error("Please select a rider")
      return
    }

    const riderId = selectedRider.id || selectedRider._id
    if (!riderId) {
      toast.error("Invalid rider selection")
      return
    }

    try {
      setIsAssigning(true)
      
      // Step 1: Assign rider to order
      const assignResponse = await assignToRider(order.orderId, riderId)
      
      if (!assignResponse) {
        throw new Error('Assignment failed - no response from server')
      }

      // Step 2: Update order status to "out-for-delivery"
      try {
        await updateOrderStatus(order.orderId, "out-for-delivery")
      } catch (statusError) {
        console.error("Error updating order status:", statusError)
        // Don't fail the entire operation if status update fails
        toast.warning("Rider assigned successfully, but status update failed")
      }
      
      // Call the parent callback to update the UI
      onAssign(order._id, riderId)
      
      const riderName = selectedRider.name || `${selectedRider.firstName} ${selectedRider.lastName}`
      toast.success(`Order #${order.orderId} assigned to ${riderName} and status updated to out-for-delivery`)
      
      // Reset and close modal
      setSelectedRider(null)
      setSearchQuery("")
      onClose()
      
    } catch (error: any) {
      console.error("Error assigning rider:", error)
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to assign rider to order'
      toast.error(errorMessage)
    } finally {
      setIsAssigning(false)
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRider(null)
      setSearchQuery("")
      setRiders([])
      setFilteredRiders([])
    }
  }, [isOpen])

  if (!order) return null

  const getRiderDisplayName = (rider: Rider) => {
    return rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim() || 'Unknown Rider'
  }

  const customerName = `${order.userId.firstName} ${order.userId.lastName || ''}`.trim()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0 sm:p-6">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-0 sm:pt-0 sm:pb-6 border-b sm:border-b-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
            Assign Rider to Order
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Select an available rider to assign to this order (status will be updated to out-for-delivery)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-0">
          <div className="space-y-4 sm:space-y-6 pb-4">
            {/* Order Summary */}
            <Card className="border-yellow-300 bg-yellow-50/30">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Package className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold text-yellow-900 text-sm sm:text-base">Order #{order.orderId}</span>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                          {order.status}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                          → out-for-delivery
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        {/* Customer Info */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <User className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="font-medium">Customer:</span> 
                            <span className="break-all">{customerName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="font-medium">Email:</span> 
                            <span className="break-all text-xs sm:text-sm">{order.userId.email}</span>
                          </div>
                        </div>
                        
                        {/* Delivery Info */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium">Delivery:</span> 
                              <span className="block sm:inline sm:ml-1 break-words text-xs sm:text-sm">{order.deliveryAddress}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="h-3 w-3 text-gray-500" />
                              <span className="font-medium">Items:</span> {order.items.length}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Total:</span> ₦{order.totalAmount.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Bar */}
            <div className="space-y-2">
              <Label htmlFor="riderSearch" className="text-sm sm:text-base">Search Available Riders</Label>
              <Input
                id="riderSearch"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm sm:text-base"
              />
            </div>

            {/* Riders List */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-semibold">Available Riders ({filteredRiders.length})</h3>
                {selectedRider && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs w-fit">
                    Selected: {getRiderDisplayName(selectedRider)}
                  </Badge>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500 text-sm sm:text-base">Loading available riders...</div>
                </div>
              ) : filteredRiders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                  {searchQuery ? "No riders found matching your search." : "No available riders at the moment."}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                  {filteredRiders.map((rider) => (
                    <Card 
                      key={rider.id || rider._id}
                      className={`cursor-pointer transition-all border-2 ${
                        selectedRider?.id === rider.id || selectedRider?._id === rider._id
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRider(rider)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Rider Info */}
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                              <AvatarImage src={rider.avatar || "/placeholder.svg"} alt={getRiderDisplayName(rider)} />
                              <AvatarFallback>
                                {rider.firstName ? rider.firstName[0] : <Truck className="h-4 w-4 sm:h-6 sm:w-6" />}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-sm sm:text-base break-words">{getRiderDisplayName(rider)}</span>
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 flex-shrink-0">
                                  {rider.status}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{rider.rating || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  <span>{rider.totalDeliveries || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{rider.assignedOrders || 0} assigned</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Contact & Vehicle Info */}
                          <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-4">
                            <div className="space-y-1 text-xs sm:text-sm text-gray-600 min-w-0">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="break-all">{rider.phone || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="break-all">{rider.email || 'N/A'}</span>
                              </div>
                            </div>
                            
                            {rider.vehicleInfo && (
                              <div className="text-xs text-gray-500 text-left sm:text-right">
                                <div className="font-medium">{rider.vehicleInfo.type}</div>
                                <div>{rider.vehicleInfo.number}</div>
                                <div>{rider.vehicleInfo.color} {rider.vehicleInfo.model}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 px-4 py-3 sm:px-0 sm:py-0 border-t sm:border-t-0 bg-white">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignRider} 
              disabled={!selectedRider || isAssigning}
              className="w-full sm:w-auto sm:min-w-32"
            >
              {isAssigning ? "Assigning..." : "Assign Rider & Update Status"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}