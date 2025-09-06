/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/service/productService";
import { addToCart, fetchCart } from "@/service/cartService";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  // ArrowLeft,
   LogOut, Plus, ShoppingBag } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate} from "react-router-dom";
interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  image: string;
  isAvailable: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  id: string;
  quantity: number;
  name: string;
  price: number;
  unit: string;
  image: string;
  supermarket: string;
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
  isOpen?: boolean
}

export default function UserDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [product, setProduct] = useState<Product[]>([])
  const [supermarket] = useState<Supermarket>({});
   const [, setCart] = useState<Array<{ id: string; quantity: number }>>
  ([])
  // const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories] = useState<string[]>([]);
    const [cartItems, setCartItems] = useState<CartItem[]>([])
  const cartLength = cartItems.length
  const [userId, setUserId] = useState<string | null>(null)
  // const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const isLoggedIn = userId !== null;
  const navigate = useNavigate();
    const totalItems = cartLength

  // const supermarketName = supermarket?.name ||"No Name";
  // const supermarketOpenTime = supermarket?.openTime || "9:00 AM";
  // const supermarketCloseTime = supermarket?.closeTime || "9:00 PM";
  // const supermarketDescription = supermarket?.description || "";
  // const supermarketStatus = supermarket?.isOpen || false
  // const supermarketImage = supermarket?.image || "/placeholder.svg?height=100&width=200";

//   const categoryCounts = useMemo(() => {
//   const counts: Record<string, number> = {}

//   product.forEach((item) => {
//     const category = item.category || "uncategorized"
//     counts[category] = (counts[category] || 0) + 1
//   })

//   return [
//     { id: "all", name: "All Items", count: product.length },
//     ...Object.entries(counts).map(([id, count]) => ({
//       id,
//       name: id.replace(/^\w/, (c) => c.toUpperCase()), 
//       count,
//     })),
//   ]
// }, [product])

  useEffect(() => {
    const storedId = localStorage.getItem("userId")
    if (storedId) setUserId(storedId)
  }, [])


const getSupermarketProducts = async () => {
  try {
    const response = await getProducts();
    if (response && Array.isArray(response.products)) {
      setProduct(response.products); 
    } else if (Array.isArray(response)) {
      setProduct(response);
    } else if (response && Array.isArray(response.data)) {
      setProduct(response.data);
    } else {
      console.error("Unexpected product format:", response);
      setProduct([]);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    setProduct([]);
  }
};



  // const fetchCartData = async (userId: string) => {
  //   try {
  //     const response = await fetchCart(userId);
  //     const transformedItems = response.items
  //       .filter((item: any) => item.productId)
  //       .map((item: any) => ({
  //         id: item._id,
  //         quantity: item.quantity,
  //         name: item.productId.name,
  //         price: item.productId.price,
  //         unit: item.productId.unit,
  //         image: item.productId.image,
  //         supermarket: item.productId.supermarket,
  //       }));

  //     setCart(transformedItems);
  //   } catch (error) {
  //     console.error("Error fetching cart data:", error);
  //   }
  // };

 
  useEffect(() => {
    getSupermarketProducts();
    // fetchCartData("USER_ID_HERE");
  }, []);

 
  // const filteredItems = product.filter((item) => {
  //   const matchesSearch = item.name
  //     .toLowerCase()
  //     .includes(searchQuery.toLowerCase());
  //   const matchesCategory =
  //     selectedCategories.length === 0 ||
  //     selectedCategories.includes(item.category || "");
  //   return matchesSearch && matchesCategory;
  // });

  const filteredItems = useMemo(() => {
    return product.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category || "")
      return matchesSearch && matchesCategory
    })
  }, [product, searchQuery, selectedCategories])

    const fetchCartData = async (userId: string) => {
    try {
      const response = await fetchCart(userId);

       
     const transformedItems = response.items
  
  .filter((item: any) => item.productId)
  .map((item: any) => ({
    id: item._id,
    quantity: item.quantity,
    name: item.productId.name,
    price: item.productId.price,
    unit: item.productId.unit,
    image: item.productId.image,
    supermarket: item.productId.Supermarket
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


  const addItemsToCart = async (itemId: string) => {
  const userId = localStorage.getItem("userId");
  const quantity = 1;

  if (!userId) {
    toast.error("Please log in to add items to cart");
     navigate(`/login`);
    return;
  }
  const payload = {
    userId,
    productId: itemId,
    quantity,
    supermarket: supermarket._id 
  }
  const result = await addToCart(payload);
  if (result.success) {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === itemId);
      if (existingItem) {
        return prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { id: itemId, quantity }];
      }
    });
    toast.success('Item added to cart successfully');
    fetchCartData(userId)
  } else {
    toast.error('Failed to add item to cart');
  }
};
  

  return (
    <div className="p-6">
            <header className="border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            {/* <a href={backPath}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            </a> */}
            {/* <h1 className="text-xl font-bold tracking-tight">{supermarketName}</h1> */}
            {/* <Badge
              variant={supermarketStatus ? "default" : "outline"}
              className={supermarketStatus ? "bg-green-600" : "text-gray-500"}
            >
              {supermarketStatus ? "Open" : "Closed"}
            </Badge> */}
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <a href={`/cart/${userId}`}>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Cart ({totalItems})</span>
                </Button>
              </a>
            )}
            {isLoggedIn && (
              <a href="/">
                <Button variant="ghost" size="icon">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>

      {/* 🔍 Search Bar */}
      <input
        type="text"
        placeholder="Search products..."
        className="border rounded px-3 py-2 w-full mb-4"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

  
<div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <Card key={item._id} className="border-black/10">
                <CardContent className="p-4">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="mx-auto h-[100px] w-[100px] object-cover"
                  />
                </CardContent>
                <CardContent className="p-4">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-500">{item.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <span className="font-medium">₦{item.price.toFixed(2)}</span>
                      <span className="text-xs text-gray-500"> / {item.unit}</span>
                    </div>
                    {!item.stock && (
                      <span className="border border-red-500 text-red-500 px-2 py-1 rounded text-xs">
                        Out of stock
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <Button onClick={() => addItemsToCart(item._id!)} className="w-full" disabled={!item.stock}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
          
                </CardFooter>
              </Card>
            ))}
          </div>
    </div>
  );
}
