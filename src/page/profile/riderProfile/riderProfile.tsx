import { useState, useEffect } from "react"
import { ArrowLeft, Camera, Edit, LogOut, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getVendorProfile, updateProfile } from "@/service/profileService"
import { toast } from "sonner"

export default function RiderProfile() {
  const [isEditing, setIsEditing] = useState(false)
const [profileData, setProfileData] = useState<RiderProfileType>({})

  interface RiderProfileType {
  id?: string  
  firstName?: string
  lastName?: string
  email?: string
  phone?: string | number
  address?: string
  createdAt?: string
  estate?: string
  userType?: string
  // [key: string]: any // to catch any additional fields safely
}

const handleSave = async () => {
  const user = localStorage.getItem("user")
  const userId = user ? JSON.parse(user).id : null
  if (userId) {
    try {
      const updatedProfile = await updateUserProfile(userId, profileData)
      
      // Update localStorage with the new profile data
      if (user) {
        const userData = JSON.parse(user)
        const updatedUser = {
          ...userData,
          ...updatedProfile.user // Assuming the API returns the updated user data in this structure
        }
        localStorage.setItem("user", JSON.stringify(updatedUser))
      }
      
      await getProfile() // Refresh the profile data in state
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to update profile')
    }
  }
}


  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const getProfile = async () => {
    try {
      const user = localStorage.getItem('user')
      if (user) {
        const userData = JSON.parse(user)
        const vendorId = userData.id;
        const profile = await getVendorProfile(vendorId)
        setProfileData(profile.user)
        return profile
      }
    } catch (error) {
      console.error('Could not fetch vendor profile', error)
    }
  }

const updateUserProfile = async (id: string, updatedProfile: RiderProfileType) => {
  try {
    const response = await updateProfile(id, updatedProfile)
    setProfileData(response.user) // Assuming the API returns the updated user data in response.user
    toast.success('Profile updated successfully')
    return response // Return the full response so we can use it in handleSave
  } catch (error) {
    console.error('Could not update vendor profile', error)
    toast.error('Failed to update profile')
    throw error // Re-throw the error so handleSave can catch it
  }
}

  useEffect(() => {
    getProfile()
  }, [])
  

  const getDashboardLink = () => {
    return `/dashboard/rider`
  }

  // Helper function to get full name
  // const getFullName = () => {
  //   return `${profileData.firstName} ${profileData.lastName}`.trim()
  // }

  // Helper function to get initials for avatar
  // const getInitials = () => {
  //   const firstName = profileData.firstName || ""
  //   const lastName = profileData.lastName || ""
  //   return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  // }

  // Helper function to format date
  const formatJoinDate = () => {
    if (!profileData.createdAt) return "N/A"
    return new Date(profileData.createdAt).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <a href={getDashboardLink()}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Button>
            </a>
            <h1 className="text-xl font-bold tracking-tight">User Profile</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/">
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Card className="border-black/10">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Profile Information</CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  {/* <Avatar className="h-20 w-20">
                    <AvatarImage src={""} alt={getFullName()} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar> */}
                  {isEditing && (
                    <Button variant="outline" size="sm">
                      <Camera className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                      />
                    ) : (
                      <p className="rounded-md border border-gray-200 px-3 py-2">
                        {profileData.firstName || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                      />
                    ) : (
                      <p className="rounded-md border border-gray-200 px-3 py-2">
                        {profileData.lastName || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    ) : (
                      <p className="rounded-md border border-gray-200 px-3 py-2">
                        {profileData.email || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={profileData.phone?.toString() || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    ) : (
                      <p className="rounded-md border border-gray-200 px-3 py-2">
                        {profileData.phone || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                      />
                    ) : (
                      <p className="rounded-md border border-gray-200 px-3 py-2">
                        {profileData.address || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <p className="rounded-md border border-gray-200 px-3 py-2">
                      {formatJoinDate()}
                    </p>
                  </div>
                </div>

                {/* Business Information */}
                <div className="grid gap-4 sm:grid-cols-2">  
                  <div className="space-y-2">
                    <Label htmlFor="estate">Estate</Label>
                    {isEditing ? (
                      <Input
                        id="estate"
                        value={profileData.estate}
                        onChange={(e) => handleInputChange("estate", e.target.value)}
                      />
                    ) : (
                      <p className="rounded-md border border-gray-200 px-3 py-2">
                        {profileData.estate || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>User Type</Label>
                    <p className="rounded-md border border-gray-200 px-3 py-2">
                      {profileData.userType || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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