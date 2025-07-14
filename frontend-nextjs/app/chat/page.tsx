"use client";

import React from "react";
import { MessageSquare, Users, Megaphone, HelpCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Team Communication</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Collaborate with your team using real-time messaging and announcements
        </p>
      </div>

      {/* Communication Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Team Chat</h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 mb-4">
            Real-time messaging with your team members for project collaboration
          </p>
          <div className="text-sm text-neutral-500">
            3 active conversations
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Megaphone className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Announcements</h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 mb-4">
            Important updates and announcements from your team and administrators
          </p>
          <div className="text-sm text-neutral-500">
            2 new announcements
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <HelpCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Support</h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 mb-4">
            Get help from our technical support team and track your tickets
          </p>
          <div className="text-sm text-neutral-500">
            1 open ticket
          </div>
        </div>
      </div>

      {/* Chat Interface Placeholder */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            Use the Chat Panel
          </h3>
          <p className="text-neutral-600 dark:text-neutral-300 mb-6">
            Click the floating chat button in the bottom-right corner to start messaging
          </p>
          <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <MessageSquare size={20} />
            <span>Look for the chat button →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
