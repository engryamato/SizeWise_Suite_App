"use client";

import React, { useState } from "react";
import { 
  HelpCircle, 
  Search, 
  Book, 
  Video, 
  MessageCircle, 
  FileText,
  ExternalLink,
  ChevronRight,
  Star,
  Play
} from "lucide-react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpSections = [
    {
      title: "Getting Started",
      items: [
        { title: "Quick Start Guide", type: "guide", icon: <Book size={20} />, popular: true },
        { title: "Interface Overview", type: "video", icon: <Video size={20} />, popular: true },
        { title: "Creating Your First Project", type: "guide", icon: <FileText size={20} /> },
      ]
    },
    {
      title: "HVAC Tools",
      items: [
        { title: "Air Duct Sizer Tutorial", type: "video", icon: <Play size={20} />, popular: true },
        { title: "Understanding SMACNA Standards", type: "guide", icon: <FileText size={20} /> },
        { title: "Velocity and Pressure Calculations", type: "guide", icon: <Book size={20} /> },
      ]
    },
    {
      title: "Standards & Compliance",
      items: [
        { title: "SMACNA Standards Reference", type: "guide", icon: <FileText size={20} /> },
        { title: "ASHRAE Guidelines", type: "guide", icon: <FileText size={20} /> },
        { title: "NFPA 96 Compliance", type: "guide", icon: <FileText size={20} /> },
      ]
    },
    {
      title: "Export & Reports",
      items: [
        { title: "Export Formats Guide", type: "guide", icon: <FileText size={20} /> },
        { title: "Custom Report Templates", type: "guide", icon: <Book size={20} /> },
        { title: "Batch Export Operations", type: "video", icon: <Video size={20} /> },
      ]
    }
  ];

  const quickActions = [
    {
      title: "Contact Support",
      description: "Get help from our technical team",
      icon: <MessageCircle size={24} />,
      href: "/support/contact",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
      icon: <Video size={24} />,
      href: "/help/videos",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
    },
    {
      title: "User Manual",
      description: "Complete documentation",
      icon: <Book size={24} />,
      href: "/help/manual",
      color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
    },
    {
      title: "FAQ",
      description: "Frequently asked questions",
      icon: <HelpCircle size={24} />,
      href: "/help/faq",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400"
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
          <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Help & Documentation
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
          Find answers, learn how to use SizeWise Suite, and get the most out of your HVAC engineering workflow
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search help articles, tutorials, and guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-lg"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className="group p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:shadow-md transition-all hover:scale-105"
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${action.color}`}>
              {action.icon}
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {action.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-300">
              {action.description}
            </p>
          </a>
        ))}
      </div>

      {/* Popular Articles */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
          <Star className="w-6 h-6 text-yellow-500 mr-2" />
          Popular Articles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {helpSections.flatMap(section => section.items.filter(item => item.popular)).map((item, index) => (
            <a
              key={index}
              href="#"
              className="flex items-center space-x-3 p-3 bg-white dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group"
            >
              <div className="text-blue-600 dark:text-blue-400">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {item.title}
                </div>
                <div className="text-sm text-neutral-500 capitalize">{item.type}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </a>
          ))}
        </div>
      </div>

      {/* Help Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {helpSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <a
                  key={itemIndex}
                  href="#"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors group"
                >
                  <div className="text-blue-600 dark:text-blue-400">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center">
                      {item.title}
                      {item.popular && <Star className="w-4 h-4 text-yellow-500 ml-2" />}
                    </div>
                    <div className="text-sm text-neutral-500 capitalize">{item.type}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <MessageCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Still need help?
        </h3>
        <p className="text-neutral-600 dark:text-neutral-300 mb-4">
          Our support team is here to help you with any questions or issues
        </p>
        <a
          href="/support/contact"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MessageCircle size={20} />
          <span>Contact Support</span>
        </a>
      </div>
    </div>
  );
}
