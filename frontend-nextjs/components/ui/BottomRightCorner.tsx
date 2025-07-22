"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Bell, 
  HelpCircle, 
  X, 
  Maximize2, 
  Minimize2,
  Send,
  Search,
  ExternalLink,
  User,
  Bot,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'update' | 'alert' | 'support';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'support' | 'system';
  message: string;
  timestamp: Date;
}

interface HelpSection {
  id: string;
  title: string;
  items: {
    id: string;
    title: string;
    description: string;
    url?: string;
  }[];
}

export const BottomRightCorner: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatMaximized, setChatMaximized] = useState(false);
  const [helpMaximized, setHelpMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'chat'>('notifications');
  const [messageInput, setMessageInput] = useState('');
  const [helpSearch, setHelpSearch] = useState('');

  // Mock data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'update',
      title: 'System Update',
      message: 'New SMACNA validation rules have been added',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false
    },
    {
      id: '2',
      type: 'alert',
      title: 'High Velocity Warning',
      message: 'Duct segment exceeds recommended velocity limits',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      read: true
    }
  ];

  const chatMessages: ChatMessage[] = [
    {
      id: '1',
      type: 'system',
      message: 'Welcome to SizeWise Suite support! How can we help you today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60)
    },
    {
      id: '2',
      type: 'user',
      message: 'I need help with duct sizing calculations',
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: '3',
      type: 'support',
      message: 'I\'d be happy to help with duct sizing! Are you working with rectangular or round ducts?',
      timestamp: new Date(Date.now() - 1000 * 60 * 25)
    }
  ];

  const helpSections: HelpSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        {
          id: 'quick-start',
          title: 'Quick Start Guide',
          description: 'Learn the basics of Air Duct Sizer in 5 minutes'
        },
        {
          id: 'first-project',
          title: 'Creating Your First Project',
          description: 'Step-by-step guide to setting up a new HVAC project'
        }
      ]
    },
    {
      id: 'air-duct-sizer',
      title: 'Air Duct Sizer',
      items: [
        {
          id: 'duct-sizing',
          title: 'Duct Sizing Methods',
          description: 'Understanding friction loss and velocity methods'
        },
        {
          id: 'validation-rules',
          title: 'SMACNA Validation Rules',
          description: 'Complete guide to SMACNA compliance checking'
        }
      ]
    },
    {
      id: 'video-tutorials',
      title: 'Video Tutorials',
      items: [
        {
          id: 'overview-video',
          title: 'Platform Overview (5 min)',
          description: 'Complete walkthrough of SizeWise Suite features',
          url: 'https://example.com/video1'
        },
        {
          id: 'advanced-features',
          title: 'Advanced Features (15 min)',
          description: 'Deep dive into professional HVAC workflows',
          url: 'https://example.com/video2'
        }
      ]
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Add message logic here
      setMessageInput('');
    }
  };

  const filteredHelpSections = helpSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      helpSearch === '' ||
      item.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(helpSearch.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
      {/* Chat & Notifications Button */}
      <motion.button
        onClick={() => setChatOpen(!chatOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative px-4 py-3 rounded-xl",
          "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md",
          "border border-white/20 dark:border-neutral-700/50",
          "shadow-lg hover:shadow-xl transition-all duration-200",
          "flex items-center space-x-2"
        )}
      >
        <MessageCircle className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Chat & Notifications
        </span>
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </div>
        )}
      </motion.button>

      {/* Help & Docs Button */}
      <motion.button
        onClick={() => setHelpOpen(!helpOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-12 h-12 rounded-full",
          "bg-blue-500 hover:bg-blue-600 text-white",
          "shadow-lg hover:shadow-xl transition-all duration-200",
          "flex items-center justify-center"
        )}
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat & Notifications Modal */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={cn(
              "absolute bottom-20 right-0",
              chatMaximized ? "w-96 h-96" : "w-80 h-80",
              "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md",
              "border border-white/20 dark:border-neutral-700/50",
              "rounded-xl shadow-2xl overflow-hidden flex flex-col"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 dark:border-neutral-700/50">
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                      activeTab === 'notifications'
                        ? "bg-blue-500 text-white"
                        : "text-neutral-600 dark:text-neutral-300 hover:bg-white/40 dark:hover:bg-white/10"
                    )}
                  >
                    Notifications
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                      activeTab === 'chat'
                        ? "bg-blue-500 text-white"
                        : "text-neutral-600 dark:text-neutral-300 hover:bg-white/40 dark:hover:bg-white/10"
                    )}
                  >
                    Chat
                  </button>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setChatMaximized(!chatMaximized)}
                    className="p-1 rounded hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                  >
                    {chatMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="p-1 rounded hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'notifications' ? (
                <div className="h-full overflow-y-auto p-4 space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        notification.read
                          ? "bg-white/20 dark:bg-white/5 border-white/20"
                          : "bg-blue-500/10 border-blue-500/20"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <Bell className={cn(
                          "w-4 h-4 mt-0.5",
                          notification.read ? "text-neutral-400" : "text-blue-500"
                        )} />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-neutral-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-neutral-500 mt-2">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-start space-x-3",
                          message.type === 'user' && "flex-row-reverse space-x-reverse"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          message.type === 'user' ? "bg-blue-500" : "bg-neutral-500"
                        )}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className={cn(
                          "max-w-xs p-3 rounded-lg",
                          message.type === 'user'
                            ? "bg-blue-500 text-white"
                            : "bg-white/40 dark:bg-white/10 text-neutral-900 dark:text-white"
                        )}>
                          <p className="text-sm">{message.message}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            message.type === 'user' ? "text-blue-100" : "text-neutral-500"
                          )}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-white/10 dark:border-neutral-700/50">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-sm",
                          "bg-white/40 dark:bg-white/10 backdrop-blur-sm",
                          "border border-white/20 dark:border-neutral-700/50",
                          "text-neutral-900 dark:text-white placeholder-neutral-500"
                        )}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Documentation Modal */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={cn(
              "absolute bottom-20 right-0",
              helpMaximized ? "w-96 h-96" : "w-80 h-80",
              "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md",
              "border border-white/20 dark:border-neutral-700/50",
              "rounded-xl shadow-2xl overflow-hidden flex flex-col"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 dark:border-neutral-700/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Help & Documentation
                </h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setHelpMaximized(!helpMaximized)}
                    className="p-1 rounded hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                  >
                    {helpMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setHelpOpen(false)}
                    className="p-1 rounded hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                  placeholder="Search documentation..."
                  className={cn(
                    "w-full pl-10 pr-3 py-2 rounded-lg text-sm",
                    "bg-white/40 dark:bg-white/10 backdrop-blur-sm",
                    "border border-white/20 dark:border-neutral-700/50",
                    "text-neutral-900 dark:text-white placeholder-neutral-500"
                  )}
                />
              </div>
            </div>

            {/* Help Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredHelpSections.map((section) => (
                <div key={section.id}>
                  <h4 className="font-medium text-neutral-900 dark:text-white mb-2">
                    {section.title}
                  </h4>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-white/20 dark:bg-white/5 border border-white/20 hover:bg-white/30 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => item.url && window.open(item.url, '_blank')}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm text-neutral-900 dark:text-white">
                            {item.title}
                          </h5>
                          {item.url && <ExternalLink className="w-4 h-4 text-neutral-500" />}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
