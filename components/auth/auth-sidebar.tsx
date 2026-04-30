"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, ShieldAlert, Users, ChevronRight, ChevronLeft } from "lucide-react"
import { Logo } from "@/components/ui/logo"

const SLIDES = [
  {
    id: 1,
    title: "Report Civic Issues Instantly",
    description: "Help improve your community by reporting issues like potholes, broken streetlights, or water leaks with just a few clicks.",
    icon: MapPin,
  },
  {
    id: 2,
    title: "Track Resolution Progress",
    description: "Stay updated on the status of your reports. Get notified when city officials acknowledge and resolve the problems.",
    icon: ShieldAlert,
  },
  {
    id: 3,
    title: "Empower Your Community",
    description: "Join thousands of residents working together to make your city safer, cleaner, and more efficient.",
    icon: Users,
  }
]

export function AuthSidebar() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)

  return (
    <div className="hidden lg:flex relative w-1/2 flex-col justify-between p-12 overflow-hidden m-4 rounded-3xl bg-primary">
      {/* Static Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <svg className="w-full h-full text-primary-foreground" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="plus-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20 15V25M15 20H25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#plus-pattern)" />
        </svg>
      </div>

      {/* Top Logo Area */}
      <div className="relative z-20 flex items-center text-primary-foreground">
        <Logo size={40} className="text-primary-foreground [&_span]:text-primary-foreground" />
      </div>

      {/* Bottom Slider Area */}
      <div className="relative z-20 mt-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8"
          >
            <h2 className="text-4xl xl:text-5xl font-extrabold mb-4 leading-tight tracking-tight text-primary-foreground drop-shadow-sm">
              {SLIDES[currentSlide].title}
            </h2>
            <p className="text-lg xl:text-xl text-primary-foreground/80 leading-relaxed font-medium max-w-md">
              {SLIDES[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Slider Controls */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-2">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 transition-all duration-300 rounded-full ${
                  currentSlide === index 
                    ? "w-8 bg-primary-foreground" 
                    : "w-2 bg-primary-foreground/40 hover:bg-primary-foreground/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/20 backdrop-blur-md flex items-center justify-center text-primary-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/20 backdrop-blur-md flex items-center justify-center text-primary-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
