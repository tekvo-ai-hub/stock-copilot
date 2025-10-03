"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Search,
  Settings,
  HelpCircle,
  Menu,
  X,
  Home,
  PieChart,
  Activity,
  DollarSign,
  MessageCircle,
  Plus,
  Clock,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Stock Analysis", href: "/analysis", icon: BarChart3 },
  { name: "Predictions", href: "/predictions", icon: TrendingUp },
  { name: "Portfolio", href: "/portfolio", icon: PieChart },
  { name: "Market Data", href: "/market", icon: Activity },
  { name: "Search", href: "/search", icon: Search },
];

const chatSection = {
  newChat: { name: "New Chat", icon: Plus },
  recentChats: [
    { id: "1", title: "AAPL Analysis", time: "2 min ago", icon: MessageCircle },
    { id: "2", title: "Market Trends", time: "1 hour ago", icon: MessageCircle },
    { id: "3", title: "Portfolio Review", time: "3 hours ago", icon: MessageCircle },
    { id: "4", title: "NVDA Prediction", time: "Yesterday", icon: MessageCircle },
  ]
};

const bottomTools = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

interface SidebarProps {
  onNewChat?: () => void;
  onChatClick?: (chat: { id: string; title: string }) => void;
}

export function Sidebar({ onNewChat, onChatClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={cn(
      "flex flex-col bg-card border-r transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">StockAI</h1>
              <p className="text-xs text-muted-foreground">Prediction Platform</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Chat Section Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

        {/* Chat Section */}
        <div className="space-y-2">
          <div className="px-3 py-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {!isCollapsed && "Chat"}
            </h3>
          </div>
          
          {/* New Chat Button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-9"
            onClick={onNewChat}
          >
            <chatSection.newChat.icon className="w-4 h-4" />
            {!isCollapsed && <span>{chatSection.newChat.name}</span>}
          </Button>

          {/* Recent Chats */}
          {!isCollapsed && (
            <div className="space-y-1">
              {chatSection.recentChats.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
                  onClick={() => onChatClick?.(chat)}
                >
                  <chat.icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{chat.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {chat.time}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Tools Section */}
      <div className="p-4 border-t">
        <div className="space-y-1">
          {bottomTools.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs">
              v1.0.0
            </Badge>
            <span>StockAI Platform</span>
          </div>
        </div>
      )}
    </div>
  );
}
