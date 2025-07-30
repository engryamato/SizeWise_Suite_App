'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { securityService, MFASetupResult } from '@/lib/services/SecurityService';

interface MFASetupProps {
  onComplete: (success: boolean) => void;
  onCancel: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [mfaData, setMfaData] = useState<MFASetupResult | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodesDownloaded, setBackupCodesDownloaded] = useState(false);

  useEffect(() => {
    initializeMFA();
  }, []);

  const initializeMFA = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await securityService.setupMFA();
      setMfaData(result);
    } catch (err) {
      setError('Failed to initialize MFA setup. Please try again.');
      console.error('MFA setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await securityService.verifyMFASetup(verificationCode);
      
      if (success) {
        setStep('backup');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('MFA verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (!mfaData?.backupCodes) return;

    const content = [
      'SizeWise Suite - Backup Codes',
      '================================',
      '',
      'These backup codes can be used to access your account if you lose access to your authenticator app.',
      'Each code can only be used once. Store them in a safe place.',
      '',
      ...mfaData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      `Generated: ${new Date().toLocaleString()}`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sizewise-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupCodesDownloaded(true);
  };

  const completeMFASetup = () => {
    onComplete(true);
  };

  if (loading && !mfaData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Initializing MFA setup...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Up Two-Factor Authentication
        </h2>
        <p className="text-gray-600">
          Secure your account with an additional layer of protection
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step === 'setup' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'setup' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-green-100'
            }`}>
              {step === 'setup' ? '1' : '✓'}
            </div>
            <span className="ml-2 text-sm font-medium">Setup</span>
          </div>
          
          <div className={`flex items-center ${
            step === 'verify' ? 'text-blue-600' : 
            step === 'backup' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'verify' ? 'bg-blue-100 border-2 border-blue-600' :
              step === 'backup' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {step === 'backup' ? '✓' : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Verify</span>
          </div>
          
          <div className={`flex items-center ${step === 'backup' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'backup' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-gray-100'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Backup</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Setup Step */}
      {step === 'setup' && mfaData && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Install an Authenticator App</h3>
            <p className="text-gray-600 text-sm mb-4">
              Download and install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">2. Scan QR Code</h3>
            <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
              <QRCodeSVG 
                value={mfaData.qrCodeUrl} 
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">3. Manual Entry (Alternative)</h3>
            <p className="text-gray-600 text-sm mb-2">
              If you can&apos;t scan the QR code, enter this secret manually:
            </p>
            <div className="p-3 bg-gray-100 rounded font-mono text-sm break-all">
              {mfaData.secret}
            </div>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Verification
          </button>
        </div>
      )}

      {/* Verify Step */}
      {step === 'verify' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Verify Your Setup</h3>
            <p className="text-gray-600 text-sm mb-4">
              Enter the 6-digit code from your authenticator app to verify the setup.
            </p>
          </div>

          <div>
            <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
              maxLength={6}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('setup')}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={verifySetup}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes Step */}
      {step === 'backup' && mfaData && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Save Your Backup Codes</h3>
            <p className="text-gray-600 text-sm mb-4">
              These backup codes can be used to access your account if you lose your authenticator device. 
              Each code can only be used once.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              {mfaData.backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-white rounded border">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={downloadBackupCodes}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Download Backup Codes
            </button>

            <div className="flex items-center">
              <input
                id="backup-confirmation"
                type="checkbox"
                checked={backupCodesDownloaded}
                onChange={(e) => setBackupCodesDownloaded(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="backup-confirmation" className="ml-2 text-sm text-gray-700">
                I have saved my backup codes in a secure location
              </label>
            </div>

            <button
              onClick={completeMFASetup}
              disabled={!backupCodesDownloaded}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Complete Setup
            </button>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="w-full text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel Setup
        </button>
      </div>
    </div>
  );
};
