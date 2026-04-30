import * as React from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Target, ShieldAlert, Sparkles, Filter, MoreHorizontal, BarChart3 } from "lucide-react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome back Sajibur Rahman</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor and control what happens with your money today for financial health.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="hidden sm:flex bg-white px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-100 shadow-sm">
            📅 Sun, 12 June 2026
          </div>
          <Button className="w-full sm:w-auto gap-2 bg-slate-800 text-white hover:bg-slate-700">
            <ArrowUpRight className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Top Value Cards */}
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>

      {/* Middle Section: My Wallet & Overview Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-6">
          {/* Wallets */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">My Wallet</h3>
              <Button variant="ghost" className="text-slate-500 text-sm h-8 hover:bg-slate-100">+ Add New</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Card className="bg-white border-0 shadow-sm">
                 <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                       <span className="text-xs font-semibold text-slate-600 bg-slate-50 border rounded w-fit px-1.5 py-0.5">🇺🇸 USD</span>
                       <MoreHorizontal className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="font-bold text-lg text-slate-800">$22,678.00</div>
                    <div className="text-xs text-teal-500 font-medium">Active</div>
                 </CardContent>
               </Card>
               <Card className="bg-white border-0 shadow-sm">
                 <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                       <span className="text-xs font-semibold text-slate-600 bg-slate-50 border rounded w-fit px-1.5 py-0.5">🇪🇺 EUR</span>
                       <MoreHorizontal className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="font-bold text-lg text-slate-800">€18,345.00</div>
                    <div className="text-xs text-teal-500 font-medium">Active</div>
                 </CardContent>
               </Card>
            </div>
          </div>
          
          {/* Savings Plan */}
          <Card className="bg-white border-0 shadow-sm flex-1">
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Target className="h-5 w-5 text-teal-500" /> My Savings Plan
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-4 w-4 text-slate-400" /></Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                     <div className="h-6 w-6 rounded bg-teal-50 flex items-center justify-center"><Target className="h-3 w-3 text-teal-600" /></div> Investment Goal
                  </div>
                  <span className="font-bold">62%</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">$15,600/$25,000</span>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full w-[62%]"></div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                     <div className="h-6 w-6 rounded bg-rose-50 flex items-center justify-center"><ShieldAlert className="h-3 w-3 text-rose-600" /></div> Emergency Fund
                  </div>
                  <span className="font-bold">34%</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">$3,400/$10,000</span>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full w-[34%]"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overview Chart (Mockup) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">
          <Card className="bg-white border-0 shadow-sm flex-1">
             <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <BarChart3 className="h-5 w-5 text-teal-500" /> Overview
                </div>
                <div className="flex items-center gap-3 text-sm">
                   <div className="flex items-center gap-1 font-medium text-slate-600">
                     <div className="w-2 h-2 rounded-full bg-teal-500"></div> Earnings
                   </div>
                   <div className="bg-slate-50 border px-2 py-1 rounded-md font-medium flex items-center gap-1 cursor-pointer">
                     This Year <ArrowDownRight className="h-3 w-3" />
                   </div>
                </div>
             </CardHeader>
             <CardContent className="pt-6 relative h-64 flex items-end justify-between gap-2">
                {/* Mock Chart Bars */}
                {[40, 60, 75, 45, 20, 35, 30, 90, 65, 50, 30, 60].map((h, i) => (
                  <div key={i} className="relative group w-full mx-1 flex flex-col items-center justify-end h-full">
                     {/* The bar */}
                     <div 
                        className={cn("w-full transition-all duration-300 rounded-t-sm", h === 90 ? "bg-teal-500" : "bg-teal-100 group-hover:bg-teal-200")} 
                        style={{ height: `${h}%` }}
                     ></div>
                     
                     {/* Hover Value Tooltip */}
                     <div className="absolute -top-8 bg-white border shadow-md text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                       ${(h * 900).toLocaleString()}
                     </div>
                     
                     {/* Bottom Label */}
                     <span className="text-[10px] text-slate-400 mt-2 font-medium">
                       {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}
                     </span>
                  </div>
                ))}
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions List */}
      <Card className="bg-white border-0 shadow-sm">
         <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
             <div className="flex items-center gap-2 text-slate-800 font-bold">
               <ArrowRightLeft className="h-5 w-5 text-teal-500" /> Recent Transaction
             </div>
             <Button variant="outline" size="sm" className="h-8 gap-2 border-slate-200 text-slate-600 bg-white shadow-none hover:bg-slate-50">
               Filter <Filter className="h-3 w-3" />
             </Button>
         </CardHeader>
         <CardContent className="p-0">
             <div className="w-full overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-slate-50 text-slate-500 text-xs font-semibold">
                   <tr>
                     <th className="px-6 py-3 font-medium">Activity</th>
                     <th className="px-6 py-3 font-medium">Date</th>
                     <th className="px-6 py-3 font-medium">Price</th>
                     <th className="px-6 py-3 font-medium">Status</th>
                     <th className="px-6 py-3"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-slate-700">
                   <tr className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center font-bold">A</div>
                       <span className="font-medium text-slate-800">Mobile App Purchase</span>
                     </td>
                     <td className="px-6 py-4 text-slate-500">Wed, 12 Jun 2026</td>
                     <td className="px-6 py-4 font-bold text-slate-800">$806.50</td>
                     <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                         <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Success
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700"><MoreHorizontal className="h-4 w-4" /></Button>
                     </td>
                   </tr>
                   <tr className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center font-bold">A</div>
                       <span className="font-medium text-slate-800">Software License</span>
                     </td>
                     <td className="px-6 py-4 text-slate-500">Tue, 11 Jun 2026</td>
                     <td className="px-6 py-4 font-bold text-slate-800">$102.99</td>
                     <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                         <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Success
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700"><MoreHorizontal className="h-4 w-4" /></Button>
                     </td>
                   </tr>
                   <tr className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4 flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center font-bold">G</div>
                       <span className="font-medium text-slate-800">Grocery Purchase</span>
                     </td>
                     <td className="px-6 py-4 text-slate-500">Sun, 09 Jun 2026</td>
                     <td className="px-6 py-4 font-bold text-slate-800">$2,500.00</td>
                     <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                         <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Success
                       </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700"><MoreHorizontal className="h-4 w-4" /></Button>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
         </CardContent>
      </Card>

    </div>
  )
}
