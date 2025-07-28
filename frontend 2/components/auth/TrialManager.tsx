"use client"

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { tierEnforcementService } from '@/lib/services/HybridTierEnforcementService'
import { AlertTriangle, Crown, Clock, X, Zap } from 'lucide-react'

interface TrialManagerProps {
  className?: string
  showDismiss?: boolean
  onDismiss?: () => void
}

export const TrialManager: React.FC<TrialManagerProps> = ({
  className = '',
  showDismiss = false,
  onDismiss
}) => {
  const { tierStatus, user } = useAuthStore()
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const updateTrialStatus = async () => {
      if (tierStatus?.tier === 'trial' && tierStatus.trial_expires) {
        const expiryDate = new Date(tierStatus.trial_expires)
        const now = new Date()
        const diffTime = expiryDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setDaysRemaining(diffDays)
      } else {
        // Try to get tier info from service
        try {
          const tierInfo = await tierEnforcementService.getTierInfo()
          if (tierInfo.isTrialActive && tierInfo.trialDaysRemaining !== undefined) {
            setDaysRemaining(tierInfo.trialDaysRemaining)
          }
        } catch (error) {
          console.error('Failed to get tier info:', error)
        }
      }
    }

    updateTrialStatus()
    
    // Update every hour
    const interval = setInterval(updateTrialStatus, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [tierStatus])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const handleUpgrade = () => {
    // TODO: Integrate with payment system
    console.log('Upgrade to Premium clicked')
    // For now, just log the action
    window.open('https://sizewise.com/pricing', '_blank')
  }

  // Don't show for super admin
  if (user?.tier === 'super_admin') {
    return null
  }

  // Don't show if dismissed
  if (!isVisible) {
    return null
  }

  const currentTier = tierStatus?.tier || user?.tier
  
  // Don't show for premium users
  if (currentTier === 'premium') {
    return null
  }

  const isTrialActive = currentTier === 'trial'
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3
  const isExpired = daysRemaining !== null && daysRemaining <= 0
  const isFreeTier = currentTier === 'free'

  // Don't show if not trial or free tier
  if (!isTrialActive && !isFreeTier) {
    return null
  }

  const getVariantStyles = () => {
    if (isExpired) {
      return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
    }
    if (isExpiringSoon) {
      return 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200'
    }
    if (isFreeTier) {
      return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
    }
    return 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200'
  }

  const getIcon = () => {
    if (isExpired) return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
    if (isExpiringSoon) return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
    if (isFreeTier) return <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    return <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
  }

  const getTitle = () => {
    if (isExpired) return 'Trial Expired'
    if (isExpiringSoon) return 'Trial Expiring Soon'
    if (isFreeTier) return 'Free Tier Active'
    return 'Premium Trial Active'
  }

  const getMessage = () => {
    if (isExpired) {
      return 'Your Premium trial has expired. Upgrade to continue using Premium features.'
    }
    if (isExpiringSoon) {
      return `Your Premium trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Upgrade now to keep all features.`
    }
    if (isFreeTier) {
      return 'You\'re using the Free tier. Upgrade to Premium for unlimited projects, segments, and high-resolution exports.'
    }
    return `${daysRemaining} days remaining in your Premium trial. Enjoy unlimited access to all features!`
  }

  const getButtonText = () => {
    if (isExpired || isFreeTier) return 'Upgrade to Premium'
    return 'Upgrade Now'
  }

  const getButtonStyles = () => {
    if (isExpired) {
      return 'bg-red-600 hover:bg-red-700 text-white'
    }
    if (isExpiringSoon) {
      return 'bg-amber-600 hover:bg-amber-700 text-white'
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white'
  }

  return (
    <div className={`relative p-4 rounded-lg border ${getVariantStyles()} ${className}`}>
      {showDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">
            {getTitle()}
          </h3>
          <p className="text-sm opacity-90 mb-3">
            {getMessage()}
          </p>
          
          {/* Feature highlights for free tier */}
          {isFreeTier && (
            <div className="mb-3 text-xs opacity-75">
              <div className="grid grid-cols-2 gap-2">
                <div>✓ 3 Projects</div>
                <div>✓ 25 Segments/Project</div>
                <div>✗ High-Res Exports</div>
                <div>✗ API Access</div>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleUpgrade}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${getButtonStyles()}`}
            >
              {getButtonText()}
            </button>
            
            {isTrialActive && !isExpired && (
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-sm font-medium opacity-75 hover:opacity-100 transition-opacity"
              >
                Remind me later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact version for header/navbar
export const TrialManagerCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { tierStatus, user } = useAuthStore()
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (tierStatus?.tier === 'trial' && tierStatus.trial_expires) {
      const expiryDate = new Date(tierStatus.trial_expires)
      const now = new Date()
      const diffTime = expiryDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays)
    }
  }, [tierStatus])

  // Don't show for super admin or premium users
  if (user?.tier === 'super_admin' || tierStatus?.tier === 'premium') {
    return null
  }

  const currentTier = tierStatus?.tier || user?.tier
  const isTrialActive = currentTier === 'trial'
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3
  const isExpired = daysRemaining !== null && daysRemaining <= 0

  if (!isTrialActive && currentTier !== 'free') {
    return null
  }

  const handleUpgrade = () => {
    window.open('https://sizewise.com/pricing', '_blank')
  }

  if (isTrialActive) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        isExpired ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
        isExpiringSoon ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200' :
        'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
      } ${className}`}>
        <Crown className="w-3 h-3" />
        <span>
          {isExpired ? 'Trial Expired' : 
           isExpiringSoon ? `${daysRemaining}d left` : 
           `Trial: ${daysRemaining}d`}
        </span>
        <button
          onClick={handleUpgrade}
          className="ml-1 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
        >
          Upgrade
        </button>
      </div>
    )
  }

  // Free tier
  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 ${className}`}>
      <Zap className="w-3 h-3" />
      <span>Free Tier</span>
      <button
        onClick={handleUpgrade}
        className="ml-1 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
      >
        Upgrade
      </button>
    </div>
  )
}
