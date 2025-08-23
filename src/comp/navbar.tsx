import {Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function Navbar() {
  return (
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold text-green-800">AgroMat</span>
          </a>
        </div>
            <div className="flex items-center gap-4">
              <a href="/signup">
                <Button variant="outline">Sign Up</Button>
              </a>
              <a href="/login">
                <Button className="bg-green-600 hover:bg-green-700">Login</Button>
              </a>
            </div>
          </div>
        </div>
      </header>
  );
}
