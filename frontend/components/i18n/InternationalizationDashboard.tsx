'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface LocaleConfig {
  key: string;
  language: string;
  region: string;
  display_name: string;
  currency: string;
  unit_system: string;
  hvac_standard: string;
}

interface TranslationStatus {
  total_keys: number;
  completion_rates: Record<string, number>;
  missing_translations: Record<string, string[]>;
  supported_languages: string[];
  supported_regions: string[];
  hvac_standards: string[];
}

interface HVACUnits {
  temperature: string;
  pressure: string;
  flow: string;
  power: string;
}

export const InternationalizationDashboard: React.FC = () => {
  const [locales, setLocales] = useState<LocaleConfig[]>([]);
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null);
  const [currentLocale, setCurrentLocale] = useState<string>('en_US');
  const [hvacUnits, setHvacUnits] = useState<HVACUnits | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'locales' | 'translations' | 'standards'>('overview');
  const [sampleValues, setSampleValues] = useState({
    number: 1234567.89,
    currency: 25000.50,
    date: new Date()
  });

  useEffect(() => {
    loadI18nData();
  }, []);

  const loadI18nData = async () => {
    setLoading(true);
    try {
      // Load supported locales
      const localesResponse = await fetch('/api/i18n/locales');
      const localesData = await localesResponse.json();
      setLocales(localesData.locales || []);

      // Load translation status
      const statusResponse = await fetch('/api/i18n/status');
      const statusData = await statusResponse.json();
      setTranslationStatus(statusData);

      // Load HVAC units for current locale
      const unitsResponse = await fetch(`/api/i18n/units?locale=${currentLocale}`);
      const unitsData = await unitsResponse.json();
      setHvacUnits(unitsData.units || null);

    } catch (error) {
      console.error('Failed to load i18n data:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeLocale = async (localeKey: string) => {
    try {
      const response = await fetch('/api/i18n/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: localeKey })
      });

      if (response.ok) {
        setCurrentLocale(localeKey);
        loadI18nData(); // Refresh data with new locale
        alert('Locale changed successfully!');
      } else {
        alert('Failed to change locale');
      }
    } catch (error) {
      alert('Failed to change locale');
    }
  };

  const exportTranslations = async (language: string) => {
    try {
      const response = await fetch(`/api/i18n/export/${language}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations_${language}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export translations');
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 95) return 'text-green-800 bg-green-100';
    if (rate >= 80) return 'text-yellow-800 bg-yellow-100';
    if (rate >= 60) return 'text-orange-800 bg-orange-100';
    return 'text-red-800 bg-red-100';
  };

  const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'zh-CN': '🇨🇳',
      'zh-TW': '🇹🇼',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ru': '🇷🇺',
      'ar': '🇸🇦'
    };
    return flags[language] || '🌐';
  };

  const formatSampleNumber = (value: number, locale: LocaleConfig) => {
    // Simulate locale-specific number formatting
    if (locale.language === 'de' || locale.language === 'es') {
      return value.toLocaleString('de-DE');
    } else if (locale.language === 'fr') {
      return value.toLocaleString('fr-FR');
    } else if (locale.language === 'zh-CN') {
      return value.toLocaleString('zh-CN');
    } else if (locale.language === 'ja') {
      return value.toLocaleString('ja-JP');
    }
    return value.toLocaleString('en-US');
  };

  const formatSampleCurrency = (value: number, locale: LocaleConfig) => {
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'BRL': 'R$',
      'RUB': '₽',
      'SAR': '﷼',
      'KRW': '₩',
      'MXN': '$'
    };
    
    const symbol = currencySymbols[locale.currency] || locale.currency;
    const formatted = formatSampleNumber(value, locale);
    
    if (locale.region === 'US' || locale.region === 'CA') {
      return `${symbol}${formatted}`;
    } else {
      return `${formatted} ${symbol}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading internationalization dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Internationalization & Localization</h1>
          <p className="text-gray-600 mt-1">
            Manage languages, regions, and cultural adaptations for global deployment
          </p>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={currentLocale}
            onChange={(e) => changeLocale(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {locales.map((locale) => (
              <option key={locale.key} value={locale.key}>
                {getLanguageFlag(locale.language)} {locale.display_name}
              </option>
            ))}
          </select>
          
          <button
            onClick={loadI18nData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Cards */}
      {translationStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Languages</p>
                <p className="text-2xl font-bold text-blue-600">{translationStatus.supported_languages.length}</p>
                <p className="text-xs text-gray-500">Supported</p>
              </div>
              <div className="text-3xl">🌐</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regions</p>
                <p className="text-2xl font-bold text-green-600">{translationStatus.supported_regions.length}</p>
                <p className="text-xs text-gray-500">Locales</p>
              </div>
              <div className="text-3xl">🗺️</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Translation Keys</p>
                <p className="text-2xl font-bold text-purple-600">{translationStatus.total_keys}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="text-3xl">🔑</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">HVAC Standards</p>
                <p className="text-2xl font-bold text-orange-600">{translationStatus.hvac_standards.length}</p>
                <p className="text-xs text-gray-500">Supported</p>
              </div>
              <div className="text-3xl">📐</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'locales', name: 'Locales', icon: '🌐' },
            { id: 'translations', name: 'Translations', icon: '🔤' },
            { id: 'standards', name: 'HVAC Standards', icon: '📐' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Locale Info */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Current Locale</h3>
            </div>
            
            <div className="p-6">
              {(() => {
                const locale = locales.find(l => l.key === currentLocale);
                if (!locale) return <p>No locale selected</p>;
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{getLanguageFlag(locale.language)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{locale.display_name}</h4>
                        <p className="text-sm text-gray-500">{locale.language} - {locale.region}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Currency:</span>
                        <span className="ml-2 font-medium">{locale.currency}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Unit System:</span>
                        <span className="ml-2 font-medium">{locale.unit_system}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">HVAC Standard:</span>
                        <span className="ml-2 font-medium">{locale.hvac_standard}</span>
                      </div>
                    </div>
                    
                    {hvacUnits && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">HVAC Units</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Temperature: {hvacUnits.temperature}</div>
                          <div>Pressure: {hvacUnits.pressure}</div>
                          <div>Flow: {hvacUnits.flow}</div>
                          <div>Power: {hvacUnits.power}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Formatting Examples */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Formatting Examples</h3>
            </div>
            
            <div className="p-6">
              {(() => {
                const locale = locales.find(l => l.key === currentLocale);
                if (!locale) return <p>No locale selected</p>;
                
                return (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Number Format</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-lg font-mono">
                        {formatSampleNumber(sampleValues.number, locale)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Currency Format</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-lg font-mono">
                        {formatSampleCurrency(sampleValues.currency, locale)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date Format</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-lg font-mono">
                        {format(sampleValues.date, 'PP')}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Sample Values</h5>
                      <div className="space-y-2 text-sm">
                        <div>
                          <label className="text-gray-600">Number:</label>
                          <input
                            type="number"
                            value={sampleValues.number}
                            onChange={(e) => setSampleValues({...sampleValues, number: parseFloat(e.target.value) || 0})}
                            className="ml-2 px-2 py-1 border rounded w-32"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600">Currency:</label>
                          <input
                            type="number"
                            value={sampleValues.currency}
                            onChange={(e) => setSampleValues({...sampleValues, currency: parseFloat(e.target.value) || 0})}
                            className="ml-2 px-2 py-1 border rounded w-32"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'locales' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Supported Locales</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HVAC Standard
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locales.map((locale) => (
                  <tr key={locale.key} className={`hover:bg-gray-50 ${currentLocale === locale.key ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getLanguageFlag(locale.language)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{locale.display_name}</div>
                          <div className="text-sm text-gray-500">{locale.key}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {locale.language}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {locale.region}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {locale.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {locale.unit_system}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {locale.hvac_standard}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => changeLocale(locale.key)}
                        disabled={currentLocale === locale.key}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {currentLocale === locale.key ? 'Current' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'translations' && translationStatus && (
        <div className="space-y-6">
          {/* Translation Completion Overview */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Translation Completion</h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(translationStatus.completion_rates).map(([language, rate]) => (
                  <div key={language} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getLanguageFlag(language)}</span>
                        <h4 className="font-medium text-gray-900">{language.toUpperCase()}</h4>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCompletionColor(rate)}`}>
                        {rate}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        {Math.round(translationStatus.total_keys * rate / 100)} / {translationStatus.total_keys} keys
                      </span>
                      <button
                        onClick={() => exportTranslations(language)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Export
                      </button>
                    </div>
                    
                    {translationStatus.missing_translations[language] && (
                      <div className="mt-2 text-xs text-red-600">
                        {translationStatus.missing_translations[language].length} missing keys
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'standards' && translationStatus && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">HVAC Standards</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {translationStatus.hvac_standards.map((standard) => (
                <div key={standard} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{standard}</h4>
                    <span className="text-2xl">📐</span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>Standard: {standard}</div>
                    <div>
                      Regions: {
                        standard === 'ASHRAE' ? 'North America' :
                        standard === 'EN' ? 'Europe' :
                        standard === 'JIS' ? 'Japan' :
                        standard === 'GB' ? 'China' :
                        'Various'
                      }
                    </div>
                    <div>
                      Units: {
                        standard === 'ASHRAE' ? 'Imperial' : 'Metric'
                      }
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
