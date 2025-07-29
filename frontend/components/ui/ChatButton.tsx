"use client";

import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { ChatPanel } from "./ChatPanel";

export const ChatButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadCount] = useState(3); // This would come from a store/context in a real app

  const handleToggleChat = () => {
    if (isChatOpen && !isChatMinimized) {
      setIsChatOpen(false);
    } else {
      setIsChatOpen(true);
      setIsChatMinimized(false);
    }
  };

  const handleMinimizeChat = () => {
    setIsChatMinimized(!isChatMinimized);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setIsChatMinimized(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={handleToggleChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center justify-center group"
          aria-label="Open chat"
        >
          <MessageSquare size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Team Chat
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900"></div>
          </div>
        </button>
      )}

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        onMinimize={handleMinimizeChat}
        isMinimized={isChatMinimized}
      />
    </>
  );
};
