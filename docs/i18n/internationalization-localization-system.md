# Internationalization & Localization System

## Overview

The SizeWise Suite Internationalization & Localization (i18n) System provides comprehensive support for multiple languages, regional HVAC standards, currency handling, and cultural adaptations for global enterprise deployment.

## Features

### Multi-Language Support
- **12 Languages**: English, Spanish, French, German, Italian, Portuguese, Chinese (Simplified/Traditional), Japanese, Korean, Russian, Arabic
- **Translation Management**: Centralized translation system with automatic fallbacks
- **Dynamic Loading**: Real-time language switching without page reload
- **Missing Translation Detection**: Automated identification of incomplete translations

### Regional Localization
- **16 Regions**: US, Canada, Mexico, UK, Germany, France, Italy, Spain, Portugal, China, Japan, South Korea, Australia, Brazil, Russia, Saudi Arabia
- **Cultural Adaptations**: Date formats, number formats, currency display, text direction (RTL support)
- **Regional Preferences**: Locale-specific business rules and validation

### HVAC Standards Integration
- **ASHRAE** (North America): Imperial units, °F, psi, CFM, BTU/h
- **EN** (Europe): Metric units, °C, Pa, m³/h, kW
- **JIS** (Japan): Metric units with Japanese-specific efficiency metrics
- **GB** (China): Chinese national standards and units
- **AS** (Australia): Australian standards
- **ABNT** (Brazil): Brazilian standards
- **GOST** (Russia): Russian standards
- **SASO** (Saudi Arabia): Saudi standards

### Currency & Number Formatting
- **12 Currencies**: USD, EUR, GBP, JPY, CNY, CAD, AUD, BRL, RUB, SAR, KRW, MXN
- **Locale-Specific Formatting**: Decimal separators, thousands separators, currency symbols
- **Real-Time Conversion**: Dynamic formatting based on user locale

## Architecture

### Core Components

#### InternationalizationSystem
Main orchestrator class that coordinates all i18n functionality:

```python
from backend.i18n.internationalization_system import i18n_system

# Set user locale
i18n_system.set_locale(Language.SPANISH, Region.SPAIN)

# Translate text
translated = i18n_system.translate("nav.dashboard")  # Returns "Panel de Control"

# Format numbers and currency
formatted_number = i18n_system.format_number(1234567.89)  # Returns "1.234.567,89"
formatted_currency = i18n_system.format_currency(25000.50)  # Returns "25.000,50 €"

# Get HVAC units for current locale
units = i18n_system.get_hvac_units()
# Returns: {"temperature": "°C", "pressure": "Pa", "flow": "m³/h", "power": "kW"}
```

#### TranslationManager
Handles translation storage, loading, and management:

```python
from backend.i18n.internationalization_system import TranslationManager

translation_manager = TranslationManager()

# Add new translation
translation_manager.add_translation(
    "hvac.efficiency", 
    Language.SPANISH, 
    "Eficiencia"
)

# Get missing translations
missing = translation_manager.get_missing_translations()
```

#### LocaleManager
Manages locale configurations and formatting rules:

```python
from backend.i18n.internationalization_system import LocaleManager

locale_manager = LocaleManager()

# Get locale configuration
locale_config = locale_manager.get_locale(Language.GERMAN, Region.GERMANY)

# Get HVAC standard
hvac_standard = locale_manager.get_hvac_standard(HVACStandard.EN)
```

### Frontend Integration

#### React Hook Usage
```typescript
import { useI18n } from '@/hooks/useI18n';

function MyComponent() {
  const { t, locale, setLocale, formatNumber, formatCurrency } = useI18n();
  
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('message.welcome', { name: 'John' })}</p>
      <span>{formatCurrency(25000.50)}</span>
    </div>
  );
}
```

#### Dashboard Component
```typescript
import { InternationalizationDashboard } from '@/components/i18n/InternationalizationDashboard';

// Comprehensive i18n management interface
<InternationalizationDashboard />
```

## API Endpoints

### Locale Management
```http
GET /api/i18n/locales
POST /api/i18n/locale
GET /api/i18n/status
GET /api/i18n/units?locale=en_US
```

### Translation Management
```http
GET /api/i18n/translations/{language}
POST /api/i18n/translations/{language}
GET /api/i18n/export/{language}
```

### HVAC Standards
```http
GET /api/i18n/hvac-standards
GET /api/i18n/hvac-standards/{standard}
```

## Configuration

### Default Locales
The system includes pre-configured locales for major markets:

- **en_US**: English (United States) - ASHRAE, Imperial, USD
- **en_GB**: English (United Kingdom) - EN, Metric, GBP
- **es_ES**: Spanish (Spain) - EN, Metric, EUR
- **de_DE**: German (Germany) - EN, Metric, EUR
- **fr_FR**: French (France) - EN, Metric, EUR
- **zh_CN**: Chinese (China) - GB, Metric, CNY
- **ja_JP**: Japanese (Japan) - JIS, Metric, JPY

### Translation Files
Translation files are stored in JSON format:

```json
{
  "app.title": "SizeWise Suite",
  "nav.dashboard": "Dashboard",
  "hvac.heating": "Heating",
  "hvac.cooling": "Cooling",
  "units.temperature.celsius": "°C",
  "message.welcome": "Welcome, {name}!"
}
```

### HVAC Standard Configuration
```python
HVACStandardConfig(
    standard=HVACStandard.ASHRAE,
    name="ASHRAE Standards",
    region=[Region.UNITED_STATES, Region.CANADA],
    temperature_units="°F",
    pressure_units="psi",
    flow_units="CFM",
    power_units="BTU/h",
    efficiency_metrics=["SEER", "EER", "COP", "HSPF"],
    design_conditions={
        "summer_db": 95,  # °F
        "winter_db": 0,   # °F
        "humidity": 50    # %
    }
)
```

## Implementation Guide

### 1. Backend Setup
```python
# Initialize i18n system
from backend.i18n.internationalization_system import i18n_system

# Set default locale
i18n_system.set_locale(Language.ENGLISH, Region.UNITED_STATES)

# Add custom translations
i18n_system.translation_manager.add_translation(
    "custom.message",
    Language.SPANISH,
    "Mensaje personalizado"
)
```

### 2. Frontend Setup
```typescript
// Create i18n context provider
import { I18nProvider } from '@/contexts/I18nContext';

function App() {
  return (
    <I18nProvider>
      <YourApp />
    </I18nProvider>
  );
}
```

### 3. Component Usage
```typescript
function HVACCalculator() {
  const { t, locale, getHVACUnits } = useI18n();
  const units = getHVACUnits();
  
  return (
    <div>
      <h2>{t('hvac.load_calculation')}</h2>
      <label>{t('hvac.temperature')} ({units.temperature})</label>
      <input type="number" />
    </div>
  );
}
```

## Testing

### Translation Coverage
```bash
# Check translation completion rates
curl /api/i18n/status

# Export missing translations
curl /api/i18n/export/es?missing_only=true
```

### Locale Testing
```typescript
// Test locale switching
const testLocales = ['en_US', 'es_ES', 'de_DE', 'zh_CN'];

testLocales.forEach(locale => {
  i18n.setLocale(locale);
  expect(i18n.t('app.title')).toBeDefined();
  expect(i18n.formatCurrency(1000)).toMatch(/\d/);
});
```

## Best Practices

### 1. Translation Keys
- Use hierarchical naming: `module.component.element`
- Keep keys descriptive: `hvac.equipment.efficiency_rating`
- Avoid hardcoded text in components

### 2. Variable Interpolation
```typescript
// Good
t('message.welcome', { name: user.name, count: projects.length })

// Avoid
`Welcome ${user.name}, you have ${projects.length} projects`
```

### 3. Pluralization
```json
{
  "project.count": {
    "zero": "No projects",
    "one": "1 project",
    "other": "{count} projects"
  }
}
```

### 4. Regional Considerations
- Always use locale-specific number formatting
- Consider RTL languages for Arabic markets
- Validate HVAC standards match regional requirements
- Test currency formatting across all supported locales

## Deployment

### Production Configuration
```python
# Environment-specific settings
I18N_CONFIG = {
    "default_language": "en",
    "default_region": "US",
    "fallback_language": "en",
    "cache_translations": True,
    "translation_path": "/app/translations",
    "supported_locales": ["en_US", "es_ES", "fr_FR", "de_DE", "zh_CN", "ja_JP"]
}
```

### Performance Optimization
- Translation caching with Redis
- Lazy loading of translation files
- CDN distribution for static translation assets
- Compression of translation bundles

## Monitoring

### Translation Metrics
- Translation completion rates by language
- Missing translation alerts
- Usage analytics by locale
- Performance metrics for translation loading

### Health Checks
```http
GET /api/i18n/health
```

Returns system status, translation coverage, and performance metrics.

## Support

For technical support or feature requests related to the Internationalization & Localization system, please refer to the main SizeWise Suite documentation or contact the development team.
