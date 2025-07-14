"use client";

import React, { useState } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Users, 
  Megaphone, 
  HelpCircle,
  Minimize2,
  Maximize2
} from "lucide-react";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

interface Message {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  type: "user" | "system" | "announcement";
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  onMinimize,
  isMinimized = false,
}) => {
  const [activeTab, setActiveTab] = useState<"chat" | "announcements" | "support">("chat");
  const [message, setMessage] = useState("");

  // Sample data
  const chatMessages: Message[] = [
    {
      id: "1",
      user: "John Smith",
      message: "Has anyone worked on the new office building project?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: "user",
    },
    {
      id: "2",
      user: "Sarah Johnson",
      message: "Yes, I'm handling the HVAC calculations. The duct sizing is almost complete.",
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      type: "user",
    },
    {
      id: "3",
      user: "Mike Chen",
      message: "Great! I'll need those numbers for the cost estimation.",
      timestamp: new Date(Date.now() - 1000 * 60 * 20),
      type: "user",
    },
  ];

  const announcements: Message[] = [
    {
      id: "a1",
      user: "System Admin",
      message: "New SMACNA standards update available. Please review the updated guidelines in the Help section.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: "announcement",
    },
    {
      id: "a2",
      user: "System Admin",
      message: "Scheduled maintenance on Sunday 2 AM - 4 AM EST. The system will be temporarily unavailable.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      type: "announcement",
    },
  ];

  const supportMessages: Message[] = [
    {
      id: "s1",
      user: "Support Team",
      message: "Your ticket #12345 regarding export issues has been resolved. Please try exporting again.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      type: "system",
    },
  ];

  const getCurrentMessages = () => {
    switch (activeTab) {
      case "chat":
        return chatMessages;
      case "announcements":
        return announcements;
      case "support":
        return supportMessages;
      default:
        return [];
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && activeTab === "chat") {
      // In a real app, this would send the message to the backend
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className={`
      fixed bottom-4 right-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 
      rounded-lg shadow-xl backdrop-blur-sm z-50 transition-all duration-300
      ${isMinimized ? "w-80 h-16" : "w-96 h-[540px]"}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {isMinimized ? "Chat" : "Team Communication"}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              <Users size={16} />
              <span>Team Chat</span>
              {chatMessages.length > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {chatMessages.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "announcements"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              <Megaphone size={16} />
              <span>Announcements</span>
              {announcements.length > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                  {announcements.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab("support")}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "support"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              <HelpCircle size={16} />
              <span>Support</span>
              {supportMessages.length > 0 && (
                <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                  {supportMessages.length}
                </span>
              )}
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-80">
            {getCurrentMessages().map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {msg.user}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div className={`text-sm p-3 rounded-lg ${
                  msg.type === "announcement" 
                    ? "bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200"
                    : msg.type === "system"
                    ? "bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200"
                    : "bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-white"
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* Input (only for chat tab) */}
          {activeTab === "chat" && (
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
