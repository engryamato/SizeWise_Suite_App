// Mock for lucide-react icons
const React = require('react');

// Create a generic mock icon component
const MockIcon = ({ size = 24, color = 'currentColor', ...props }) =>
  React.createElement('svg', {
    width: size,
    height: size,
    fill: color,
    'data-testid': 'mock-icon',
    ...props
  });

// Export all the icons used in the application
module.exports = {
  MousePointer: MockIcon,
  Square: MockIcon,
  Minus: MockIcon,
  Settings: MockIcon,
  Hand: MockIcon,
  Grid3X3: MockIcon,
  ZoomIn: MockIcon,
  ZoomOut: MockIcon,
  RotateCcw: MockIcon,
  Zap: MockIcon,
  Upload: MockIcon,
  Ruler: MockIcon,
  Crown: MockIcon,
  Home: MockIcon,
  FileText: MockIcon,
  Download: MockIcon,
  Save: MockIcon,
  FolderOpen: MockIcon,
  Trash2: MockIcon,
  Edit: MockIcon,
  Copy: MockIcon,
  Eye: MockIcon,
  EyeOff: MockIcon,
  Lock: MockIcon,
  Unlock: MockIcon,
  User: MockIcon,
  Users: MockIcon,
  Mail: MockIcon,
  Phone: MockIcon,
  MapPin: MockIcon,
  Calendar: MockIcon,
  Clock: MockIcon,
  Star: MockIcon,
  Heart: MockIcon,
  ThumbsUp: MockIcon,
  MessageCircle: MockIcon,
  Share: MockIcon,
  Search: MockIcon,
  Filter: MockIcon,
  SortAsc: MockIcon,
  SortDesc: MockIcon,
  ChevronUp: MockIcon,
  ChevronDown: MockIcon,
  ChevronLeft: MockIcon,
  ChevronRight: MockIcon,
  ArrowUp: MockIcon,
  ArrowDown: MockIcon,
  ArrowLeft: MockIcon,
  ArrowRight: MockIcon,
  Plus: MockIcon,
  X: MockIcon,
  Check: MockIcon,
  AlertCircle: MockIcon,
  AlertTriangle: MockIcon,
  Info: MockIcon,
  HelpCircle: MockIcon,
  Menu: MockIcon,
  MoreHorizontal: MockIcon,
  MoreVertical: MockIcon,
  default: MockIcon
};
