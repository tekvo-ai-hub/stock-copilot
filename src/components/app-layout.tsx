"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { ChatPanel } from "@/components/chat-panel";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<{ id: string; title: string } | undefined>();

  const handleNewChat = () => {
    console.log('Opening new chat...');
    setCurrentChat({
      id: Date.now().toString(),
      title: "New Chat",
    });
    setIsChatOpen(true);
    console.log('Chat should be open now');
  };

  const handleChatClick = (chat: { id: string; title: string }) => {
    setCurrentChat(chat);
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setCurrentChat(undefined);
  };

  const handleNavigation = () => {
    // Close chat when navigating to different sections
    setIsChatOpen(false);
    setCurrentChat(undefined);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        onNewChat={handleNewChat}
        onChatClick={handleChatClick}
        onNavigation={handleNavigation}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          {isChatOpen ? (
            <ChatPanel
              isOpen={isChatOpen}
              onClose={handleCloseChat}
              currentChat={currentChat}
            />
          ) : (
            <div className="h-full overflow-auto p-6">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
