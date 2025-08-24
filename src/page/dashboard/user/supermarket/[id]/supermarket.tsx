import { useEffect, useState } from "react"
import { ArrowLeft, Clock, LogOut, Plus, Search, ShoppingBag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ItemFilter } from "@/comp/item-filter"
import { getProductsBySupermarket } from "@/service/productService"
import { getSupermarket} from "@/service/supermarketService";
import { toast } from "sonner"
import { useMemo } from "react";
import { addToCart, fetchCart } from "@/service/cartService"
import { useNavigate} from "react-router-dom";

export default function SupermarketPage() {
  interface Product {
  _id?: string;
  id?: string;
  name: string;
  category?: string;
  price: number;
  unit?: string;
  stock: number;
  quantity?: number;
  image?: string;
  description?: string;
  isAvailable?: boolean
  supermarket: string
  ownerId?: string;
  // Add any other fields your API returns
}

  interface CartItem {
    id: string;
    quantity: number;
    name: string;
    price: number;
    unit?: string;
    image?: string;
    supermarket?: string;
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
   
  // const { id } = useParams<{ id: string }>()
  const [searchQuery, setSearchQuery] = useState("")
  const [product, setProduct] = useState<Product[]>([])
  const [supermarket, setSupermarket] = useState<Supermarket>({});
   
  const [, setCart] = useState<Array<{ id: string; quantity: number }>>
  ([])
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const cartLength = cartItems.length
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Check if user is logged in
  const isLoggedIn = userId !== null;

const filteredItems = useMemo(() => {
  return product.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category || "")
    return matchesSearch && matchesCategory
  })
}, [product, searchQuery, selectedCategories])

const categoryCounts = useMemo(() => {
  const counts: Record<string, number> = {}

  product.forEach((item) => {
    const category = item.category || "uncategorized"
    counts[category] = (counts[category] || 0) + 1
  })

  return [
    { id: "all", name: "All Items", count: product.length },
    ...Object.entries(counts).map(([id, count]) => ({
      id,
      name: id.replace(/^\w/, (c) => c.toUpperCase()), 
      count,
    })),
  ]
}, [product])

  useEffect(() => {
    const storedId = localStorage.getItem("userId")
    if (storedId) setUserId(storedId)
  }, [])

  const fetchCartData = async (userId: string) => {
    try {
      const response = await fetchCart(userId);

       
     const transformedItems = response.items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .filter((item: any) => item.productId) // <-- skip null productId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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




  const getSupermarketPrducts = async (supermarketId: string) => {
    try {
      const products = await getProductsBySupermarket(supermarketId)
      setProduct(products)

    }catch (error){
      console.error("Error getting products by supermarket Id:", error)
    }
  }

  useEffect(() => {
      const supermarketId = supermarket?.ownerId
      if (supermarketId) {
        getSupermarketPrducts(supermarketId)
      }
    }, [supermarket?.ownerId])

   const getSupermarketInfo = async () => {
    try {
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
        toast.error("No supermarket data found");
      }
    } catch (error) {
      console.error("Error fetching supermarket:", error);
      toast.error("Failed to load supermarket data");
    } 
  };

    useEffect(() => {
    getSupermarketInfo();
  }, []);


  // const getItemQuantity = (itemId: string) => {
  //   const item = cart.find((item) => item.id === itemId)
  //   return item ? item.quantity : 0
  // }

  const totalItems = cartLength

  const supermarketName = supermarket?.name ||"No Name";
  const supermarketOpenTime = supermarket?.openTime || "9:00 AM";
  const supermarketCloseTime = supermarket?.closeTime || "9:00 PM";
  const supermarketDescription = supermarket?.description || "";
  const supermarketStatus = supermarket?.isOpen || false
  const supermarketImage = supermarket?.image || "/placeholder.svg?height=100&width=200";

  // Determine the back navigation path based on login status
  const backPath = isLoggedIn ? "/dashboard/user" : "/supermarketlist";

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <a href={backPath}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            </a>
            <h1 className="text-xl font-bold tracking-tight">{supermarketName}</h1>
            <Badge
              variant={supermarketStatus ? "default" : "outline"}
              className={supermarketStatus ? "bg-green-600" : "text-gray-500"}
            >
              {supermarketStatus ? "Open" : "Closed"}
            </Badge>
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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <img
            src={supermarketImage}
            alt={supermarketName}
            className="h-[100px] w-[200px] rounded-md object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold">{supermarketName}</h2>
            <p className="text-gray-600">{supermarketDescription}</p>
            <div className="mt-1 flex items-center text-sm text-gray-500">
              <Clock className="mr-1 h-4 w-4" />
              {supermarketOpenTime} - {supermarketCloseTime}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div>
          {/* <h3 className="mb-4 text-xl font-bold">Available Items</h3> */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search items..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mb-6">
        <ItemFilter
          categories={categoryCounts}
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          onClearFilters={() => setSelectedCategories([])}
        />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="border-black/10">
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
                      <Badge variant="outline" className="text-red-500">
                        Out of stock
                      </Badge>
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
      </main>

      <footer className="border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Agromat. All rights reserved.
        </div>
      </footer>
    </div>
  )
}