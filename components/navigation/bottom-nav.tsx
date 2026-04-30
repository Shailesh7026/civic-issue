"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { IconDotsCircleHorizontal, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  bottomPrimaryItems,
  useNavCategories,
} from "@/app/config/navigation"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navCategories = useNavCategories()

  return (
    <>
      {/* ── Bottom Bar (mobile only) ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex items-stretch justify-around h-16 px-1">

          {/* Primary 4 items */}
          {bottomPrimaryItems.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.url}
                href={item.url}
                className="relative flex flex-col items-center justify-center flex-1 gap-0.5 py-2 group"
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavPill"
                    className="absolute inset-x-2 top-1.5 h-8 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}

                {/* Icon with spring pop on active */}
                <motion.div
                  animate={isActive ? { y: -2, scale: 1.15 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="relative z-10"
                >
                  <Icon
                    className={cn(
                      "size-5 transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                    stroke={isActive ? 2.2 : 1.6}
                  />
                </motion.div>

                <span
                  className={cn(
                    "relative z-10 text-[10px] font-medium leading-none transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            )
          })}

          {/* More button — 5th slot */}
          <button
            onClick={() => setOpen(true)}
            className="relative flex flex-col items-center justify-center flex-1 gap-0.5 py-2 group"
          >
            <motion.div
              animate={open ? { rotate: 90, scale: 1.15 } : { rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <IconDotsCircleHorizontal
                className="size-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200"
                stroke={1.6}
              />
            </motion.div>
            <span className="text-[10px] font-medium leading-none text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ── More Drawer ───────────────────────────────────────────────── */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between pb-0">
            <DrawerTitle className="text-base">Navigations</DrawerTitle>
            <DrawerClose asChild>
              <button className="rounded-full p-1.5 hover:bg-muted transition-colors">
                <IconX className="size-4" />
                <span className="sr-only">Close</span>
              </button>
            </DrawerClose>
          </DrawerHeader>

          {/* Scrollable category list */}
          <div className="overflow-y-auto px-4 pb-8 pt-2 space-y-5">
            <AnimatePresence>
              {navCategories.map((category, ci) => (
                <motion.div
                  key={category.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.06, duration: 0.3, ease: "easeOut" }}
                >
                  {/* Category label */}
                  <p className="mb-2 px-1 text-xs font-semibold tracking-wider text-muted-foreground">
                    {category.label}
                  </p>

                  {/* Items grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {category.items.map((item, ii) => {
                      const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                      const Icon = item.icon

                      return (
                        <motion.div
                          key={item.url}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: ci * 0.06 + ii * 0.04, duration: 0.25 }}
                        >
                          <Link
                            href={item.url}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all duration-200 active:scale-95",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-muted/50 text-foreground hover:bg-muted"
                            )}
                          >
                            <Icon
                              className="size-5 shrink-0"
                              stroke={isActive ? 2.2 : 1.6}
                            />
                            <span className="text-[10px] font-medium leading-tight line-clamp-1">
                              {item.title}
                            </span>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
