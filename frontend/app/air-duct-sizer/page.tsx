'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Wrench } from 'lucide-react'

export default function AirDuctSizerRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to V1 after a short delay to show the message
    const timer = setTimeout(() => {
      router.replace('/air-duct-sizer-v1')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  const handleRedirectNow = () => {
    router.replace('/air-duct-sizer-v1')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-6 bg-orange-500/20 rounded-full flex items-center justify-center"
        >
          <Wrench className="w-8 h-8 text-orange-500" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-neutral-900 dark:text-white mb-4"
        >
          Redirecting to V1
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-neutral-600 dark:text-neutral-300 mb-6"
        >
          The Air Duct Sizer has been upgraded to V1 with enhanced 3D visualization, 
          real-time calculations, and improved SMACNA compliance checking.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={handleRedirectNow}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Go to V1 Now</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-neutral-500 dark:text-neutral-400 mt-4"
        >
          Automatically redirecting in 3 seconds...
        </motion.p>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 3, ease: "linear" }}
          className="h-1 bg-orange-500 rounded-full mt-2"
        />
      </motion.div>
    </div>
  )
}
