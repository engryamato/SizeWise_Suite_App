'use client'

import React from 'react'
import { Crown, Lock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useProjectStore } from '@/stores/project-store'

interface TierLimits {
  rooms: number
  segments: number
  equipment: number
}

const FREE_TIER_LIMITS: TierLimits = {
  rooms: 3,
  segments: 25,
  equipment: 2
}

interface TierEnforcementProps {
  feature?: 'rooms' | 'segments' | 'equipment' | 'export' | 'validation'
  children?: React.ReactNode
  className?: string
}

export const TierEnforcement: React.FC<TierEnforcementProps> = ({
  feature,
  children,
  className = ''
}) => {
  const { user } = useAuthStore()
  const { currentProject } = useProjectStore()
  
  const isProUser = user?.tier === 'pro'
  
  if (isProUser) {
    return <>{children}</>
  }

  // If no feature specified, just show children for free users
  if (!feature) {
    return <>{children}</>
  }

  // Check if feature is locked for free users
  const isFeatureLocked = getFeatureLockStatus(feature, currentProject)
  
  if (isFeatureLocked.locked) {
    return (
      <div className={`relative ${className}`}>
        {children && (
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
          <div className="text-center p-4">
            <Lock className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-sm font-medium text-gray-700 mb-1">
              {isFeatureLocked.message}
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mx-auto">
              <Crown size={14} />
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Usage counter component
export const UsageCounter: React.FC<{
  type: 'rooms' | 'segments' | 'equipment'
  className?: string
}> = ({ type, className = '' }) => {
  const { user } = useAuthStore()
  const { currentProject } = useProjectStore()
  
  const isProUser = user?.tier === 'pro'
  
  if (isProUser) {
    return null // Pro users don't need usage counters
  }

  if (!currentProject) {
    return null
  }

  const current = getCurrentUsage(type, currentProject)
  const limit = FREE_TIER_LIMITS[type]
  const percentage = (current / limit) * 100
  const isAtLimit = current >= limit
  const isNearLimit = current >= limit * 0.8

  return (
    <div className={`bg-white border rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 capitalize">
          {type} Usage
        </span>
        <span className={`text-sm font-medium ${
          isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'
        }`}>
          {current} / {limit}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isAtLimit && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertTriangle size={12} />
          <span>Limit reached - upgrade to Pro for unlimited {type}</span>
        </div>
      )}
      
      {isNearLimit && !isAtLimit && (
        <div className="flex items-center gap-2 text-xs text-yellow-600">
          <AlertTriangle size={12} />
          <span>Approaching limit</span>
        </div>
      )}
    </div>
  )
}

// Pro feature badge
export const ProFeatureBadge: React.FC<{
  feature: string
  className?: string
}> = ({ feature, className = '' }) => {
  const { user } = useAuthStore()
  const isProUser = user?.tier === 'pro'

  if (isProUser) {
    return null
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium ${className}`}>
      <Crown size={12} />
      Pro Feature
    </div>
  )
}

// Upgrade prompt component
export const UpgradePrompt: React.FC<{
  feature: string
  benefits: string[]
  className?: string
}> = ({ feature, benefits, className = '' }) => {
  const { user } = useAuthStore()
  const isProUser = user?.tier === 'pro'

  if (isProUser) {
    return null
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Crown className="text-blue-600 flex-shrink-0 mt-1" size={20} />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">
            Upgrade to Pro for {feature}
          </h3>
          <ul className="text-sm text-gray-600 space-y-1 mb-3">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getFeatureLockStatus(feature: string, project: any): { locked: boolean; message: string } {
  if (!project) {
    return { locked: false, message: '' }
  }

  switch (feature) {
    case 'rooms':
      if (project.rooms.length >= FREE_TIER_LIMITS.rooms) {
        return {
          locked: true,
          message: `Free tier limited to ${FREE_TIER_LIMITS.rooms} rooms`
        }
      }
      break
      
    case 'segments':
      if (project.segments.length >= FREE_TIER_LIMITS.segments) {
        return {
          locked: true,
          message: `Free tier limited to ${FREE_TIER_LIMITS.segments} segments`
        }
      }
      break
      
    case 'equipment':
      if (project.equipment.length >= FREE_TIER_LIMITS.equipment) {
        return {
          locked: true,
          message: `Free tier limited to ${FREE_TIER_LIMITS.equipment} equipment units`
        }
      }
      break
      
    case 'export':
      return {
        locked: false,
        message: 'Export available with limitations'
      }
      
    case 'validation':
      return {
        locked: false,
        message: 'Basic validation available'
      }
  }

  return { locked: false, message: '' }
}

function getCurrentUsage(type: 'rooms' | 'segments' | 'equipment', project: any): number {
  if (!project) return 0
  
  switch (type) {
    case 'rooms':
      return project.rooms?.length || 0
    case 'segments':
      return project.segments?.length || 0
    case 'equipment':
      return project.equipment?.length || 0
    default:
      return 0
  }
}
