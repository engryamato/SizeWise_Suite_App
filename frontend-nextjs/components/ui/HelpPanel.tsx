"use client";

import React, { useState } from "react";
import { 
  HelpCircle, 
  X, 
  Search, 
  Book, 
  Video, 
  MessageCircle, 
  FileText,
  ExternalLink,
  ChevronRight,
  Star
} from "lucide-react";

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpItem {
  id: string;
  title: string;
  description: string;
  type: "guide" | "video" | "faq" | "standards" | "contact";
  icon: React.ReactNode;
  href?: string;
  popular?: boolean;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const helpItems: HelpItem[] = [
    {
      id: "user-guide",
      title: "User Guide",
      description: "Complete guide to using SizeWise Suite",
      type: "guide",
      icon: <Book size={20} />,
      href: "/help/user-guide",
      popular: true,
    },
    {
      id: "air-duct-tutorial",
      title: "Air Duct Sizer Tutorial",
      description: "Step-by-step tutorial for duct sizing calculations",
      type: "video",
      icon: <Video size={20} />,
      href: "/help/tutorials/air-duct-sizer",
      popular: true,
    },
    {
      id: "smacna-standards",
      title: "SMACNA Standards Reference",
      description: "Understanding SMACNA standards and validation rules",
      type: "standards",
      icon: <FileText size={20} />,
      href: "/help/standards/smacna",
    },
    {
      id: "export-formats",
      title: "Export Formats & Options",
      description: "Learn about available export formats and customization",
      type: "guide",
      icon: <FileText size={20} />,
      href: "/help/exports",
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting Common Issues",
      description: "Solutions to frequently encountered problems",
      type: "faq",
      icon: <HelpCircle size={20} />,
      href: "/help/troubleshooting",
    },
    {
      id: "contact-support",
      title: "Contact Support",
      description: "Get help from our technical support team",
      type: "contact",
      icon: <MessageCircle size={20} />,
      href: "/support/contact",
    },
  ];

  const categories = [
    { id: "all", label: "All Topics", count: helpItems.length },
    { id: "guide", label: "User Guides", count: helpItems.filter(item => item.type === "guide").length },
    { id: "video", label: "Video Tutorials", count: helpItems.filter(item => item.type === "video").length },
    { id: "faq", label: "FAQ", count: helpItems.filter(item => item.type === "faq").length },
    { id: "standards", label: "Standards", count: helpItems.filter(item => item.type === "standards").length },
    { id: "contact", label: "Support", count: helpItems.filter(item => item.type === "contact").length },
  ];

  const filteredItems = helpItems.filter(item => {
    const matchesCategory = activeCategory === "all" || item.type === activeCategory;
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    const colors = {
      guide: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      video: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      faq: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      standards: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      contact: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[type as keyof typeof colors] || colors.guide;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Help & Documentation
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Find answers and learn how to use SizeWise Suite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Close help panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-neutral-200 dark:border-neutral-700 p-4 overflow-y-auto">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Search help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm"
              />
            </div>

            {/* Categories */}
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    activeCategory === category.id
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  }`}
                >
                  <span className="text-sm font-medium">{category.label}</span>
                  <span className="text-xs bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Popular Items */}
            {activeCategory === "all" && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  Popular Topics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {helpItems.filter(item => item.popular).map((item) => (
                    <a
                      key={item.id}
                      href={item.href}
                      className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors group"
                    >
                      <div className="text-blue-600 dark:text-blue-400">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {item.title}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-300">
                          {item.description}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* All Items */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                {activeCategory === "all" ? "All Topics" : categories.find(c => c.id === activeCategory)?.label}
              </h3>
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="flex items-start space-x-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors group"
                  >
                    <div className="text-blue-600 dark:text-blue-400 mt-1">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {item.title}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        {item.popular && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {item.description}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-1" />
                  </a>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                    No results found
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Try adjusting your search or browse different categories
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
