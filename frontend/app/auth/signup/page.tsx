'use client'

/**
 * Signup Page - User Registration
 * SizeWise Suite - Authentication Flow
 *
 * This page provides user registration functionality using the existing
 * RegistrationPage component. Follows Next.js App Router conventions.
 *
 * @fileoverview Signup page for user registration
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import { RegistrationPage } from '@/components/auth/RegistrationPage'

/**
 * Signup Page Component
 *
 * Renders the registration form using the existing RegistrationPage component.
 * Handles user registration flow with trial activation.
 */
export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <RegistrationPage
        returnUrl="/dashboard"
        onRegistrationSuccess={(user) => {
          console.log('Registration successful:', user)
        }}
        onRegistrationError={(error) => {
          console.error('Registration error:', error)
        }}
      />
    </div>
  )
}
