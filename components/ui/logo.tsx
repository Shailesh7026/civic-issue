import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: number
}

export function Logo({ className, showText = true, size = 32 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div 
        className="relative flex items-center justify-center shrink-0 overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border shadow-sm" 
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="CivicIntel Logo"
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority
        />
      </div>
      {showText && (
        <span className="font-bold text-xl tracking-tight">CivicIntel</span>
      )}
    </div>
  )
}
