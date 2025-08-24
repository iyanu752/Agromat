"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Upload } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createProduct, updateProduct } from "@/service/productService"
import { toast } from "sonner"
import { uploadImage } from "@/service/uploadService"

interface Item {
  id?: string
  name: string
  category?: string
  price: number
  unit?: string
  description?: string
  stock?: number
  image?: string
  ownerId?: string
  isAvailable?: boolean
}

interface AddEditItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Item) => void
  item?: Item | null 
  mode: "add" | "edit"
  ownerId: string 
}

const categories = [
  "Fruits",
  "Vegetables",
  "Meat & Poultry",
  "Seafood",
  "Dairy & Eggs",
  "Bakery",
  "Beverages",
  "Snacks & Candy",
  "Frozen Foods",
  "Pantry Staples",
  "Health & Beauty",
  "Household Items",
  "Baby Care",
  "Pet Supplies",
]

const units = [
  "per lb",
  "per kg",
  "each",
  "dozen",
  "bunch",
  "bag",
  "box",
  "bottle",
  "can",
  "jar",
  "pack",
  "gallon",
  "liter",
  "oz",
  "loaf",
]

export function AddEditItemModal({ isOpen, onClose, onSave, item, mode, ownerId }: AddEditItemModalProps) {
  const [formData, setFormData] = useState<Item>({
    name: "",
    category: "",
    price: 0,
    unit: "",
    description: "",
    stock: 0,
    image: "",
    isAvailable: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (item && mode === "edit") {
      setFormData(item)
    } else {
      setFormData({
        name: "",
        category: "",
        price: 0,
        unit: "",
        description: "",
        stock: 0,
        image: "",
        isAvailable: true
      })
    }
    // Reset file state when modal opens/closes or mode changes
    setFile(null)
  }, [item, mode, isOpen])

  const handleInputChange = (field: keyof Item, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast.error("Please select a valid image file")
        return
      }
      
      // Validate file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        return
      }
      
      setFile(selectedFile)
    }
  }

  // Handle image upload
  const handleImageUpload = async () => {
    if (!file) {
      toast.warning("Please select an image first")
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadImage(file)
      
      // Update form data with the uploaded image URL
      setFormData(prev => ({ ...prev, image: result.secure_url }))
      
      // Clear the file state since upload is complete
      setFile(null)
      
      toast.success("Image uploaded successfully!")
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.category || formData.price <= 0 || !formData.unit) {
      toast.warning("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: formData.price,
        isAvailable: formData.isAvailable,
        stock: formData.stock,
        image: formData.image,
        unit: formData.unit,
        ownerId: ownerId,
      }

      let response

      if (mode === "edit" && item?.id) {  
        response = await updateProduct(item.id, payload)
        toast.success("Item updated successfully")
      } else {
        response = await createProduct(payload)
        toast.success("Item created successfully")
      }

      if (response?.product) {
        onSave(response.product)
      }

      onClose()
    } catch (error) {
      console.error("Error saving item:", error)
      toast.error("An error occurred while saving the item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "add" ? <Plus className="h-5 w-5" /> : null}
            {mode === "add" ? "Add New Item" : "Edit Item"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Add a new item to your inventory" : "Update the item details and inventory information"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Product"
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && (
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleImageUpload}
                      disabled={isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? "Uploading..." : "Upload Selected Image"}
                    </Button>
                    <span className="text-xs text-gray-600">{file.name}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Fresh Apples"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing and Units */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", Number.parseFloat(e.target.value) || 0)}
                  className="pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Quantity in Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", Number.parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the product, its quality, origin, etc."
              rows={3}
            />
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <Label htmlFor="isAvailable" className="text-base font-medium">
                Available for Sale
              </Label>
              <p className="text-sm text-gray-500">Toggle to make this item available or unavailable to customers</p>
            </div>
            <Switch
              id="isAvailable"
              checked={formData.isAvailable}
              onCheckedChange={(checked) => handleInputChange("isAvailable", checked)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : mode === "add" ? "Add Item" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}