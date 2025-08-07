'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Calculator, 
  Wind, 
  Thermometer, 
  Zap, 
  Droplets, 
  Settings,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface ModuleCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  status: 'available' | 'coming-soon' | 'beta'
  features: string[]
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon,
  href,
  status,
  features
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </span>
        )
      case 'beta':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Beta
          </span>
        )
      case 'coming-soon':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-full">
            <Clock className="w-3 h-3 mr-1" />
            Coming Soon
          </span>
        )
    }
  }

  const CardContent = () => (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
          {icon}
        </div>
        {getStatusBadge()}
      </div>
      
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-neutral-600 dark:text-neutral-300 mb-4">
        {description}
      </p>
      
      <ul className="space-y-2 mb-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-neutral-600 dark:text-neutral-300">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      
      {status === 'available' && (
        <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
          Open Tool
          <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      )}
    </div>
  )

  if (status === 'available') {
    return (
      <Link href={href} className="block">
        <CardContent />
      </Link>
    )
  }

  return <CardContent />
}

const modules: ModuleCardProps[] = [
  {
    title: 'Air Duct Sizer',
    description: 'SMACNA standards-compliant duct sizing with velocity validation and pressure drop calculations.',
    icon: <Wind className="w-6 h-6 text-blue-600" />,
    href: '/air-duct-sizer',
    status: 'available',
    features: [
      'SMACNA compliance checking',
      'Real-time pressure calculations',
      'Velocity validation',
      '3D visualization',
      'Export to CAD formats'
    ]
  },
  {
    title: 'Load Calculator',
    description: 'ASHRAE-compliant heating and cooling load calculations for commercial and residential buildings.',
    icon: <Calculator className="w-6 h-6 text-blue-600" />,
    href: '/load-calculator',
    status: 'coming-soon',
    features: [
      'ASHRAE 90.1 compliance',
      'Manual J calculations',
      'Weather data integration',
      'Building envelope analysis',
      'Equipment sizing recommendations'
    ]
  },
  {
    title: 'Psychrometric Calculator',
    description: 'Advanced psychrometric calculations and chart generation for air conditioning processes.',
    icon: <Thermometer className="w-6 h-6 text-blue-600" />,
    href: '/psychrometric',
    status: 'coming-soon',
    features: [
      'Interactive psychrometric chart',
      'Process calculations',
      'Mixing calculations',
      'Coil performance analysis',
      'Custom chart generation'
    ]
  },
  {
    title: 'Electrical Load Analysis',
    description: 'Electrical load calculations and power distribution analysis for HVAC systems.',
    icon: <Zap className="w-6 h-6 text-blue-600" />,
    href: '/electrical',
    status: 'coming-soon',
    features: [
      'NEC compliance checking',
      'Motor load calculations',
      'Power factor analysis',
      'Circuit sizing',
      'Panel schedule generation'
    ]
  },
  {
    title: 'Hydronic Systems',
    description: 'Pipe sizing, pump selection, and hydronic system design calculations.',
    icon: <Droplets className="w-6 h-6 text-blue-600" />,
    href: '/hydronic',
    status: 'coming-soon',
    features: [
      'Pipe sizing calculations',
      'Pump curve analysis',
      'System balancing',
      'Expansion tank sizing',
      'Flow and pressure analysis'
    ]
  },
  {
    title: 'Equipment Selection',
    description: 'HVAC equipment selection and performance analysis tools.',
    icon: <Settings className="w-6 h-6 text-blue-600" />,
    href: '/equipment',
    status: 'coming-soon',
    features: [
      'Equipment databases',
      'Performance curves',
      'Energy analysis',
      'Cost comparison',
      'Manufacturer integration'
    ]
  }
]

export default function ModulesPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            HVAC Calculation Modules
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-300">
            Professional HVAC engineering tools with standards compliance and real-time calculations
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <ModuleCard key={index} {...module} />
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-neutral-600 dark:text-neutral-300">
            More modules are in development. Check back regularly for updates.
          </p>
        </div>
      </div>
    </div>
  )
}
