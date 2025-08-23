"use client";

import { useEffect, useState } from "react";
import {
  Building,
  ShoppingCart,
  User,
  Truck,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { loginUser } from "@/service/authService";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("user");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type");
    const signup = searchParams.get("signup");

    if (type && ["user", "vendor", "rider", "admin"].includes(type)) {
      setActiveTab(type);
    }

    if (signup === "success") {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userType = activeTab;
      const response = await loginUser(email, password, userType);

      if (response?.success) {
        toast.success(String(response.message));
        setTimeout(() => {
          navigate(`/dashboard/${activeTab}`);
        }, 500);
      } else {
        let errorMessage = "Login failed. Check your credentials.";

        if (response?.message) {
          if (Array.isArray(response.message)) {
            errorMessage = response.message.join(", ");
          } else if (
            typeof response.message === "object" &&
            response.message !== null &&
            "message" in response.message
          ) {
            errorMessage = (response.message as { message: string }).message;
          } else {
            errorMessage = String(response.message);
          }
        }

        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      toast.error("An unexpected error occurred while logging in.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoginForm = (role: string, label: string) => (
    <form className="mt-4 space-y-4" onSubmit={handleLogin}>
      <div className="space-y-2">
        <Label htmlFor={`${role}-email`}>Email</Label>
        <Input
          id={`${role}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`${role}@example.com`}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${role}-password`}>Password</Label>
        <div className="relative">
          <Input
            id={`${role}-password`}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="button"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      <Button type="submit" className="w-full  bg-green-600 hover:bg-green-700" disabled={isLoading}>
        {isLoading ? "Logging in..." : `Login as ${label}`}
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="w-full max-w-md border-black/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login to <span className="text-green-800">Agromat</span></CardTitle>
          <CardDescription>
            Access your account based on your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showSuccessMessage && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Account created successfully! You can now login with your
                credentials.
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Resident</span>
              </TabsTrigger>
              <TabsTrigger value="vendor" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Vendor</span>
              </TabsTrigger>
              <TabsTrigger value="rider" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Rider</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user">
              {renderLoginForm("user", "Resident")}
            </TabsContent>
            <TabsContent value="vendor">
              {renderLoginForm("vendor", "Vendor")}
            </TabsContent>
            <TabsContent value="rider">
              {renderLoginForm("rider", "Rider")}
            </TabsContent>
            <TabsContent value="admin">
              {renderLoginForm("admin", "Admin")}
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="underline">
              Sign up
            </a>
          </div>
          <div className="text-center text-sm text-gray-500">
            <a href="/forgot-password" className="underline">
              Forgot your password?
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
