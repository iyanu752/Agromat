/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { CheckCircle, Clock, Package, Truck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOrderByOrder } from "@/service/orderService"
import { useEffect, useState } from "react"

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
  }[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryInstructions?: string;
  status?: string
  paymentReference?: string; 
  paymentStatus?: string; 
  assignedRider: {
    firstName: string;
    lastName: string;
    phone: string;
    rating: number
  },
  orderId?: string;
}

interface OrderTrackingProps {
  orderId: string;
  status: string;
  rider?: any; // This can be string or rider object based on your usage
  estimatedDelivery?: string;
}

const statusSteps = [
  { id: "pending", label: "Order Placed", icon: Clock },
  // { id: "confirmed", label: "Confirmed", icon: CheckCircle },
  { id: "packed", label: "packed", icon: Package },
  // { id: "picked_up", label: "Picked Up", icon: Truck },
  { id: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { id: "delivered", label: "Delivered", icon: CheckCircle },
]

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  // confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  packed: "bg-orange-100 text-orange-800 border-orange-300",
  // picked_up: "bg-purple-100 text-purple-800 border-purple-300",
  out_for_delivery: "bg-purple-100 text-purple-800 border-purple-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  "payment-failed": "bg-red-50 text-red-700 border-red-200",
};

export function OrderTracking({ orderId, status, estimatedDelivery }: OrderTrackingProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
 const [order, setOrder] = useState<Orders | null>(null);
const normalizedStatus = status.replace(/-/g, "_");
const currentStepIndex = statusSteps.findIndex((step) => step.id === normalizedStatus);

const getStepStatus = (stepIndex: number) => {
  if (currentStepIndex === -1) return "pending";
  if (stepIndex < currentStepIndex) return "completed";
  if (stepIndex === currentStepIndex) return "current";
  return "pending";
};

useEffect(() => {
  if (currentStepIndex === -1) {
    console.warn(`Unrecognized status: "${status}". Ensure it matches statusSteps`);
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentStepIndex]);

  const getStatusColor = (stepStatus: string) => {
    switch (stepStatus) {
      case "completed":
        return "text-green-600"
      case "current":
        return "text-blue-600"
      default:
        return "text-gray-400"
    }
  }

 const getStatusBadgeColor = (currentStatus: string) => {
  const normalizedStatus = currentStatus.replace(/-/g, "_");
  return statusColors[normalizedStatus] || "bg-gray-100 text-gray-800 border-gray-300"
}


  const fetchOrder = async () => {
    try {
      const userOrder = await getOrderByOrder(orderId);
      setOrder(userOrder)
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])


  return (
    <Card className="border-black/10 w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl">#{orderId}</CardTitle>
   <Badge 
  variant="outline" 
  className={`${getStatusBadgeColor(order?.status || "pending")} border self-start sm:self-auto`}
>
  {statusSteps.find((step) => step.id === order?.status)?.label || order?.status}
</Badge>
        </div>
        {estimatedDelivery && (
          <p className="text-sm text-gray-600 mt-2">
            Estimated delivery: {estimatedDelivery}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Progress Steps */}
          <div className="space-y-3">
            {statusSteps.map((step, index) => {
              const stepStatus = getStepStatus(index)
              const Icon = step.icon

              return (
                <div key={step.id} className="relative">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 flex-shrink-0 ${
                        stepStatus === "completed"
                          ? "border-green-600 bg-green-600 text-white"
                          : stepStatus === "current"
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm sm:text-base ${getStatusColor(stepStatus)}`}>
                        {step.label}
                      </p>
                      {stepStatus === "current" && (
                        <p className="text-xs text-gray-500">In progress...</p>
                      )}
                      {stepStatus === "completed" && (
                        <p className="text-xs text-green-600">Completed</p>
                      )}
                    </div>
                  </div>
                  {/* Connecting Line */}
                  {index < statusSteps.length - 1 && (
                    <div 
                      className={`absolute left-4 top-8 h-4 w-0.5 ${
                        stepStatus === "completed" ? "bg-green-600" : "bg-gray-300"
                      }`} 
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Rider Information */}
          {order?.assignedRider && (status === "picked_up" || status === "out_for_delivery") && (
            <div className="mt-6 rounded-md border border-gray-200 p-4">
              <h4 className="font-medium text-sm sm:text-base mb-3">Your Delivery Rider</h4>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-medium">{order?.assignedRider.firstName} {order?.assignedRider.lastName}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{order?.assignedRider.phone}</p>
                </div>
                <div className="flex items-center self-start sm:self-auto">
                  <span className="text-sm sm:text-base">⭐ {order?.assignedRider.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}