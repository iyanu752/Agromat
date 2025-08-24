
import API_ENDPOINTS from "@/config/endpoints";
import axios from "axios";

interface OrderItem {
  product: string;
  quantity: number;
  supermarket?: string;
  status?: string;
}

interface CreateOrderPayload {
  userId: string;
  supermarketId?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentReference?: string; 
  paymentStatus?: string; 
  assignedRider?: string
  orderId?: string;
}

const createOrder = async (orderDetails: CreateOrderPayload) => {
  try {
   
    const response = await axios.post(`${API_ENDPOINTS.ORDER}/createOrder`, orderDetails);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating order:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
    }
    throw error; 
  }
};

const getOrdersByVendorId = async (vendorId: string) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.ORDER}/${vendorId}`)
    return response.data

  }catch( error) {
    console.error( "Error fetching orders by vendidId:", error)
  }
}

const verifyOrderCode = async ( orderId: string , code: string) => {
  try{
    const response = await axios.post(`${API_ENDPOINTS.ORDER}/verify/${orderId}`, {code})
    return response.data

  }catch(error) {
    console.error("Error verifying order code: ", error)
  }
}

const updateOrderStatus = async ( orderId: string , newStatus: string) => {
  try{
    const response = await axios.put(`${API_ENDPOINTS.ORDER}/updateStatus/${orderId}/${newStatus}`)
    return response.data
  }catch (error) {
    console.error ("Error updating order status: ", error)
  }
}

const getOrderbyId = async (orderId: string) => {
  try{
    const response = await axios.get(`${API_ENDPOINTS.ORDER}/vendor/${orderId}`)
    return response.data;
  }catch (error) {
    console.error("Error fetching order by Id: ", error)
  }
} 

const getOrderByUserId = async (userId: string) => {
  try{
    const response = await axios.get(`${API_ENDPOINTS.ORDER}/user/${userId}`)
    return response.data

  }catch (error) {
    console.error("Error getting orders by userId", error)
  }
}

const getAllOrders = async () => {
  try{
    const resposne = await axios.get(`${API_ENDPOINTS.ORDER}`)
    return  resposne.data

  }catch(error) {
    console.error("Error fetching all order:", error)
  }
}

const getOrderHistory = async (userId: string) => {
  const response = await axios.get(`${API_ENDPOINTS.ORDER}/history/${userId}`)
  return response.data
}

const assignToRider = async (orderId: string, userId: string) => {
  try{
    const response = await axios.post(`${API_ENDPOINTS.ORDER}/assignToRider/${orderId}/${userId}`)
    return response.data

  }catch (error) {
    console.error("Error assigning order to rider:", error)
  }
}

const getOrderByOrder = async (orderId: string) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.ORDER}/order/${orderId}`)
    return response.data

  }catch (error) {
    console.error("Error fetching order by orderId:", error)
  }
}


export { createOrder, getOrdersByVendorId, updateOrderStatus, getOrderbyId, getAllOrders, getOrderHistory, assignToRider, getOrderByUserId, getOrderByOrder, verifyOrderCode  };