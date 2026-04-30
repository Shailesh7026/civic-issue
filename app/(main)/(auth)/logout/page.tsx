"use client"

import { useEffect } from "react"
import { signOut } from "@/app/actions/auth"
import { LogOut } from "lucide-react"

export default function LogoutPage() {
  useEffect(() => {
    const doLogout = async () => {
      await signOut()
    }
    doLogout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
          <LogOut className="h-6 w-6 text-red-600" />
        </div>
        <p className="text-lg font-medium text-muted-foreground animate-pulse">Logging out securely...</p>
      </div>
    </div>
  )
}
