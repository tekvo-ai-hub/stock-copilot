"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Bell,
  User,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for demonstration
  const marketStatus = {
    isOpen: true,
    time: "09:30 AM EST",
    change: "+1.2%",
    isPositive: true,
  };

  const topMovers = [
    { symbol: "AAPL", change: "+2.3%", isPositive: true },
    { symbol: "TSLA", change: "-1.8%", isPositive: false },
    { symbol: "NVDA", change: "+4.1%", isPositive: true },
  ];

  return (
    <header className="bg-background border-b px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search stocks, symbols, or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Market Status & Top Movers */}
        <div className="flex items-center space-x-6">
          {/* Market Status */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">{marketStatus.time}</span>
          </div>

          {/* Top Movers */}
          <div className="hidden lg:flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Top Movers:</span>
            {topMovers.map((mover) => (
              <div key={mover.symbol} className="flex items-center space-x-1">
                <span className="text-sm font-medium">{mover.symbol}</span>
                <Badge
                  variant={mover.isPositive ? "default" : "destructive"}
                  className="text-xs"
                >
                  {mover.isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {mover.change}
                </Badge>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
