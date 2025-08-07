'use client'

/**
 * Pricing Page - Subscription Plans
 * SizeWise Suite - Pricing and Plans
 * 
 * This page displays subscription tiers and pricing information using data
 * from the AccountTierService. Follows Next.js App Router conventions.
 * 
 * @fileoverview Pricing page for subscription plans
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import React from 'react'
import { Check, Star, Zap, Building } from 'lucide-react'

/**
 * Pricing tier data based on AccountTierService
 */
const pricingTiers = [
  {
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    description: 'Perfect for getting started with basic HVAC design',
    icon: <Star className="w-6 h-6" />,
    color: 'blue',
    features: [
      'Basic snap detection',
      '2D visualization',
      'Basic export formats',
      'Community support',
      'Up to 100 snap points',
      'Maximum 10 centerlines',
      'Up to 3 projects'
    ],
    restrictions: [
      'Limited to 100 snap points',
      'Maximum 10 centerlines',
      'No 3D visualization',
      'Basic reports only'
    ],
    popular: false
  },
  {
    name: 'Pro',
    price: 49.99,
    yearlyPrice: 499.99,
    description: 'Advanced features for professional HVAC engineers',
    icon: <Zap className="w-6 h-6" />,
    color: 'purple',
    features: [
      'Unlimited snap points and centerlines',
      'Advanced 3D visualization',
      'All export formats',
      'SMACNA compliance validation',
      'Batch operations',
      'Priority support',
      'API access',
      'Up to 10 collaborators',
      'Advanced reporting'
    ],
    restrictions: [],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 199.99,
    yearlyPrice: 1999.99,
    description: 'Custom solutions for large organizations',
    icon: <Building className="w-6 h-6" />,
    color: 'green',
    features: [
      'All Pro features',
      'Unlimited storage',
      'Unlimited collaborators',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantees',
      'Custom HVAC standards',
      'Advanced analytics',
      'White-label options'
    ],
    restrictions: [],
    popular: false
  }
]

/**
 * Pricing Page Component
 */
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Professional HVAC engineering tools with standards compliance and real-time calculations.
            Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 ${
                tier.popular ? 'ring-2 ring-purple-500 scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`inline-flex p-3 rounded-full mb-4 ${
                  tier.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  tier.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {tier.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {tier.description}
                </p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    ${tier.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
                {tier.yearlyPrice > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or ${tier.yearlyPrice}/year (save ${(tier.price * 12 - tier.yearlyPrice).toFixed(2)})
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  tier.popular
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
                }`}
              >
                {tier.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can change your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All paid plans include a 14-day free trial. No credit card required.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Do you offer educational discounts?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, we offer special pricing for educational institutions. Contact us for details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
