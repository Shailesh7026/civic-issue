"use client"

import { useUserStore } from "@/store/useUserStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { profile, user, userRole } = useUserStore()

  if (!profile && !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  const initials = profile?.first_name || profile?.last_name 
    ? `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase()
    : "U"

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">
                  {profile?.first_name} {profile?.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
                <div className="mt-2">
                  <Badge variant="secondary" className="capitalize">
                    Role: {userRole?.role || "Citizen"}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Can add more fields here if needed */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              More settings and notification preferences will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
