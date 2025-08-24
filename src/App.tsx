import "./App.css";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import Home from "@/page/home";
import Navbar from "@/comp/navbar";
import Footer from "@/comp/footer";
import { useEffect, useState } from "react";
import Signup from "@/page/signup";
import VendorDashboard from "./page/dashboard/vendor/vendorDashboard";
import Login from "@/page/login";
import { Toaster } from "sonner";
import UserDashboard from "./page/dashboard/user/userDashboard";
import SupermarketPage from "./page/dashboard/user/supermarket/[id]/supermarket";
import RiderDashboard from "./page/dashboard/rider/riderDashboard";
import CartPage from "./page/cart/cartPage";
import CheckoutPage from "./page/checkout/checkoutPage";
import OrderPage from "./page/orders/[id]/ordersPage";
import AdminDashboard from "./page/dashboard/admin/adminDashboard";
import VendorProfile from "./page/profile/vendorProfile/vendorProfile"
import UserProfile from "./page/profile/userProfile/userProfile"
import RiderProfile from "./page/profile/userProfile/userProfile";
import UserOrdersPage from "@/page/dashboard/user/orders/userOrdersPage"
import AdminProfile from "./page/profile/adminProfile/adminProfile";
import SupermarketList from "./page/dashboard/user/supermarketList";

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [showNavbarFooter, setShowNavbarFooter] = useState(true);

  useEffect(() => {
    const hiddenRoutes = ["/signup", "/login"];
    setShowNavbarFooter(!hiddenRoutes.includes(location.pathname));
  }, [location]);

  return (
    <>
      {showNavbarFooter && <Navbar />}
      {children}
      {showNavbarFooter && <Footer />}
    </>
  );
}

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <AppLayout>
          <Home />
        </AppLayout>
      ),
    },
    {
      path: "/signup",
      element: (
        <div>
          <Signup />
        </div>
      ),
    },
    {
      path: "/login",
      element: (
        <div>
          <Login />
        </div>
      ),
    },
    {
      path: "/dashboard/vendor",
      element: (
        <div>
          {" "}
          <VendorDashboard />{" "}
        </div>
      ),
    },
    {
      path: "/dashboard/user",
      element: (
        <div>
          {" "}
          <UserDashboard />{" "}
        </div>
      ),
    },
    {
      path: "/dashboard/admin",
      element: (
        <div>
          <AdminDashboard />
        </div>
      ),
    },
    {
      path: "/dashboard/user/supermarket/:id",
      element: (
        <div>
          <SupermarketPage />
        </div>
      ),
    },
    {
      path: "/dashboard/rider",
      element: (
        <div>
          {" "}
          <RiderDashboard />{" "}
        </div>
      ),
    },
    {
      path: "/cart/:id",
      element: (
        <div>
          <CartPage />
        </div>
      ),
    },
    {
      path: "/checkout",
      element: (
        <div>
          <CheckoutPage />
        </div>
      ),
    },
    {
      path: "/orders/:id",
      element: (
        <div>
          <OrderPage />
        </div>
      ),
    },
    { path: "/profile/vendor", element: <VendorProfile /> },
    { path: "/profile/user", element: <UserProfile/> },
    { path: "/profile/rider", element: <RiderProfile/>},
    { path: "/profile/admin", element: <AdminProfile/>},
    {path: "/supermarketlist", element: <SupermarketList/>}, 
    { path: "/dashboard/user/orders/:id", element: <UserOrdersPage/>},
  ]);

  return (
    <>
      <Toaster position="top-right" expand={true} richColors />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
