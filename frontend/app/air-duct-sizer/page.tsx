'use client'

import React from 'react'
import { withAirDuctSizerAccess } from '@/components/hoc/withToolAccess'
import { AirDuctSizerWorkspace } from '@/components/modules/air-duct-sizer'

/**
 * Air Duct Sizer Tool Page
 *
 * This page provides access to the Air Duct Sizer tool with SMACNA standards compliance.
 * The tool includes 3D ductwork design, real-time calculations, and professional HVAC engineering features.
 *
 * Features:
 * - 3D ductwork design and visualization
 * - Real-time HVAC calculations
 * - SMACNA standards compliance
 * - Professional engineering tools
 * - Offline-first functionality
 */

function AirDuctSizerPage() {
  return (
    <div className="h-screen w-full">
      <AirDuctSizerWorkspace />
    </div>
  );
}

// Export with access control
export default withAirDuctSizerAccess(AirDuctSizerPage);
