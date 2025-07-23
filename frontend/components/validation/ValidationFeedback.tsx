'use client'

import React from 'react'
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface ValidationMessage {
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  standard?: string
}

interface ValidationFeedbackProps {
  messages: ValidationMessage[]
  className?: string
  showIcons?: boolean
  compact?: boolean
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  messages,
  className = '',
  showIcons = true,
  compact = false
}) => {
  if (messages.length === 0) return null

  const getIcon = (type: string) => {
    if (!showIcons) return null
    
    const iconProps = { size: compact ? 14 : 16, className: 'flex-shrink-0' }
    
    switch (type) {
      case 'error':
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-red-500`} />
      case 'warning':
        return <AlertTriangle {...iconProps} className={`${iconProps.className} text-yellow-500`} />
      case 'success':
        return <CheckCircle {...iconProps} className={`${iconProps.className} text-green-500`} />
      case 'info':
      default:
        return <Info {...iconProps} className={`${iconProps.className} text-blue-500`} />
    }
  }

  const getMessageStyle = (type: string) => {
    const baseStyle = compact ? 'text-xs' : 'text-sm'
    
    switch (type) {
      case 'error':
        return `${baseStyle} text-red-700 bg-red-50 border-red-200`
      case 'warning':
        return `${baseStyle} text-yellow-700 bg-yellow-50 border-yellow-200`
      case 'success':
        return `${baseStyle} text-green-700 bg-green-50 border-green-200`
      case 'info':
      default:
        return `${baseStyle} text-blue-700 bg-blue-50 border-blue-200`
    }
  }

  return (
    <div className={`space-y-${compact ? '1' : '2'} ${className}`}>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`
            flex items-start gap-2 p-${compact ? '2' : '3'} rounded-md border
            ${getMessageStyle(msg.type)}
          `}
        >
          {getIcon(msg.type)}
          <div className="flex-1 min-w-0">
            <p className="font-medium">{msg.message}</p>
            {msg.standard && (
              <p className={`${compact ? 'text-xs' : 'text-sm'} opacity-75 mt-1`}>
                Reference: {msg.standard}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper function to convert validation results to ValidationMessage format
export const formatValidationMessages = (
  errors: string[] = [],
  warnings: string[] = [],
  standardReference?: string
): ValidationMessage[] => {
  const messages: ValidationMessage[] = []
  
  errors.forEach(error => {
    messages.push({
      type: 'error',
      message: error,
      standard: standardReference
    })
  })
  
  warnings.forEach(warning => {
    messages.push({
      type: 'warning',
      message: warning,
      standard: standardReference
    })
  })
  
  return messages
}

// Component for inline validation (smaller, for form fields)
export const InlineValidation: React.FC<{
  errors?: string[]
  warnings?: string[]
  standardReference?: string
}> = ({ errors = [], warnings = [], standardReference }) => {
  const messages = formatValidationMessages(errors, warnings, standardReference)
  
  return (
    <ValidationFeedback
      messages={messages}
      compact={true}
      className="mt-1"
    />
  )
}

// Component for canvas object validation (with positioning)
export const CanvasValidation: React.FC<{
  x: number
  y: number
  errors?: string[]
  warnings?: string[]
  standardReference?: string
  visible?: boolean
}> = ({ x, y, errors = [], warnings = [], standardReference, visible = true }) => {
  const messages = formatValidationMessages(errors, warnings, standardReference)
  
  if (!visible || messages.length === 0) return null
  
  return (
    <div
      className="absolute z-10 pointer-events-none"
      style={{ left: x, top: y }}
    >
      <div className="bg-white shadow-lg rounded-lg border p-2 max-w-xs">
        <ValidationFeedback
          messages={messages}
          compact={true}
          showIcons={true}
        />
      </div>
    </div>
  )
}
