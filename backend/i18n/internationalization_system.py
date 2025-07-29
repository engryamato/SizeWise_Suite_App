"""
Internationalization & Localization System for SizeWise Suite
Comprehensive i18n support for multiple languages, regional HVAC standards, and cultural adaptations.
"""

import json
import os
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
import logging
from pathlib import Path
import locale
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Language(Enum):
    """Supported languages"""
    ENGLISH = "en"
    SPANISH = "es"
    FRENCH = "fr"
    GERMAN = "de"
    ITALIAN = "it"
    PORTUGUESE = "pt"
    CHINESE_SIMPLIFIED = "zh-CN"
    CHINESE_TRADITIONAL = "zh-TW"
    JAPANESE = "ja"
    KOREAN = "ko"
    RUSSIAN = "ru"
    ARABIC = "ar"

class Region(Enum):
    """Supported regions"""
    UNITED_STATES = "US"
    CANADA = "CA"
    MEXICO = "MX"
    UNITED_KINGDOM = "GB"
    GERMANY = "DE"
    FRANCE = "FR"
    ITALY = "IT"
    SPAIN = "ES"
    PORTUGAL = "PT"
    CHINA = "CN"
    JAPAN = "JP"
    SOUTH_KOREA = "KR"
    AUSTRALIA = "AU"
    BRAZIL = "BR"
    RUSSIA = "RU"
    SAUDI_ARABIA = "SA"

class HVACStandard(Enum):
    """HVAC standards by region"""
    ASHRAE = "ASHRAE"  # North America
    EN = "EN"  # Europe
    JIS = "JIS"  # Japan
    GB = "GB"  # China
    AS = "AS"  # Australia
    ABNT = "ABNT"  # Brazil
    GOST = "GOST"  # Russia
    SASO = "SASO"  # Saudi Arabia

class Currency(Enum):
    """Supported currencies"""
    USD = "USD"  # US Dollar
    EUR = "EUR"  # Euro
    GBP = "GBP"  # British Pound
    JPY = "JPY"  # Japanese Yen
    CNY = "CNY"  # Chinese Yuan
    CAD = "CAD"  # Canadian Dollar
    AUD = "AUD"  # Australian Dollar
    BRL = "BRL"  # Brazilian Real
    RUB = "RUB"  # Russian Ruble
    SAR = "SAR"  # Saudi Riyal
    KRW = "KRW"  # South Korean Won
    MXN = "MXN"  # Mexican Peso

class UnitSystem(Enum):
    """Unit systems"""
    IMPERIAL = "IMPERIAL"  # US/UK Imperial
    METRIC = "METRIC"  # International System
    MIXED = "MIXED"  # Mixed units (common in some regions)

@dataclass
class LocaleConfig:
    """Locale configuration"""
    language: Language
    region: Region
    currency: Currency
    unit_system: UnitSystem
    hvac_standard: HVACStandard
    date_format: str
    time_format: str
    number_format: str
    decimal_separator: str
    thousands_separator: str
    rtl: bool = False  # Right-to-left text direction

@dataclass
class TranslationEntry:
    """Translation entry"""
    key: str
    language: Language
    value: str
    context: Optional[str] = None
    pluralization: Optional[Dict[str, str]] = None
    variables: Optional[List[str]] = None

@dataclass
class HVACStandardConfig:
    """HVAC standard configuration"""
    standard: HVACStandard
    name: str
    region: List[Region]
    temperature_units: str
    pressure_units: str
    flow_units: str
    power_units: str
    efficiency_metrics: List[str]
    design_conditions: Dict[str, Any]
    code_requirements: Dict[str, Any]

class TranslationManager:
    """Translation management system"""
    
    def __init__(self, translations_path: str = "translations"):
        self.translations_path = Path(translations_path)
        self.translations_path.mkdir(exist_ok=True)
        self.translations: Dict[Language, Dict[str, str]] = {}
        self.load_translations()
    
    def load_translations(self):
        """Load all translation files"""
        for language in Language:
            translation_file = self.translations_path / f"{language.value}.json"
            if translation_file.exists():
                try:
                    with open(translation_file, 'r', encoding='utf-8') as f:
                        self.translations[language] = json.load(f)
                    logger.info(f"Loaded translations for {language.value}")
                except Exception as e:
                    logger.error(f"Failed to load translations for {language.value}: {e}")
                    self.translations[language] = {}
            else:
                self.translations[language] = {}
                self._create_default_translations(language)
    
    def _create_default_translations(self, language: Language):
        """Create default translations for a language"""
        default_translations = {
            # Common UI elements
            "app.title": "SizeWise Suite",
            "app.subtitle": "HVAC Design & Calculation Platform",
            "nav.dashboard": "Dashboard",
            "nav.projects": "Projects",
            "nav.calculations": "Calculations",
            "nav.reports": "Reports",
            "nav.settings": "Settings",
            
            # Actions
            "action.save": "Save",
            "action.cancel": "Cancel",
            "action.delete": "Delete",
            "action.edit": "Edit",
            "action.create": "Create",
            "action.export": "Export",
            "action.import": "Import",
            "action.calculate": "Calculate",
            
            # HVAC Terms
            "hvac.heating": "Heating",
            "hvac.cooling": "Cooling",
            "hvac.ventilation": "Ventilation",
            "hvac.airflow": "Airflow",
            "hvac.temperature": "Temperature",
            "hvac.pressure": "Pressure",
            "hvac.humidity": "Humidity",
            "hvac.efficiency": "Efficiency",
            "hvac.capacity": "Capacity",
            "hvac.load": "Load",
            
            # Units
            "units.temperature.celsius": "°C",
            "units.temperature.fahrenheit": "°F",
            "units.temperature.kelvin": "K",
            "units.pressure.pa": "Pa",
            "units.pressure.psi": "psi",
            "units.pressure.bar": "bar",
            "units.flow.cfm": "CFM",
            "units.flow.cms": "m³/s",
            "units.power.kw": "kW",
            "units.power.btu": "BTU/h",
            
            # Messages
            "message.success": "Operation completed successfully",
            "message.error": "An error occurred",
            "message.warning": "Warning",
            "message.info": "Information",
            "message.loading": "Loading...",
            "message.saving": "Saving...",
            "message.calculating": "Calculating...",
            
            # Validation
            "validation.required": "This field is required",
            "validation.invalid": "Invalid value",
            "validation.min": "Value must be at least {min}",
            "validation.max": "Value must be at most {max}",
            "validation.range": "Value must be between {min} and {max}",
        }
        
        # Apply language-specific translations
        if language == Language.SPANISH:
            default_translations.update({
                "app.title": "SizeWise Suite",
                "app.subtitle": "Plataforma de Diseño y Cálculo HVAC",
                "nav.dashboard": "Panel de Control",
                "nav.projects": "Proyectos",
                "nav.calculations": "Cálculos",
                "nav.reports": "Informes",
                "nav.settings": "Configuración",
                "action.save": "Guardar",
                "action.cancel": "Cancelar",
                "action.delete": "Eliminar",
                "action.edit": "Editar",
                "action.create": "Crear",
                "action.calculate": "Calcular",
                "hvac.heating": "Calefacción",
                "hvac.cooling": "Refrigeración",
                "hvac.ventilation": "Ventilación",
                "hvac.airflow": "Flujo de Aire",
                "hvac.temperature": "Temperatura",
                "hvac.pressure": "Presión",
                "hvac.humidity": "Humedad",
                "hvac.efficiency": "Eficiencia",
                "hvac.capacity": "Capacidad",
                "hvac.load": "Carga",
            })
        elif language == Language.FRENCH:
            default_translations.update({
                "app.title": "SizeWise Suite",
                "app.subtitle": "Plateforme de Conception et Calcul CVC",
                "nav.dashboard": "Tableau de Bord",
                "nav.projects": "Projets",
                "nav.calculations": "Calculs",
                "nav.reports": "Rapports",
                "nav.settings": "Paramètres",
                "action.save": "Enregistrer",
                "action.cancel": "Annuler",
                "action.delete": "Supprimer",
                "action.edit": "Modifier",
                "action.create": "Créer",
                "action.calculate": "Calculer",
                "hvac.heating": "Chauffage",
                "hvac.cooling": "Refroidissement",
                "hvac.ventilation": "Ventilation",
                "hvac.airflow": "Débit d'Air",
                "hvac.temperature": "Température",
                "hvac.pressure": "Pression",
                "hvac.humidity": "Humidité",
                "hvac.efficiency": "Efficacité",
                "hvac.capacity": "Capacité",
                "hvac.load": "Charge",
            })
        elif language == Language.GERMAN:
            default_translations.update({
                "app.title": "SizeWise Suite",
                "app.subtitle": "HLK-Design- und Berechnungsplattform",
                "nav.dashboard": "Dashboard",
                "nav.projects": "Projekte",
                "nav.calculations": "Berechnungen",
                "nav.reports": "Berichte",
                "nav.settings": "Einstellungen",
                "action.save": "Speichern",
                "action.cancel": "Abbrechen",
                "action.delete": "Löschen",
                "action.edit": "Bearbeiten",
                "action.create": "Erstellen",
                "action.calculate": "Berechnen",
                "hvac.heating": "Heizung",
                "hvac.cooling": "Kühlung",
                "hvac.ventilation": "Lüftung",
                "hvac.airflow": "Luftstrom",
                "hvac.temperature": "Temperatur",
                "hvac.pressure": "Druck",
                "hvac.humidity": "Feuchtigkeit",
                "hvac.efficiency": "Effizienz",
                "hvac.capacity": "Kapazität",
                "hvac.load": "Last",
            })
        elif language == Language.CHINESE_SIMPLIFIED:
            default_translations.update({
                "app.title": "SizeWise Suite",
                "app.subtitle": "暖通空调设计与计算平台",
                "nav.dashboard": "仪表板",
                "nav.projects": "项目",
                "nav.calculations": "计算",
                "nav.reports": "报告",
                "nav.settings": "设置",
                "action.save": "保存",
                "action.cancel": "取消",
                "action.delete": "删除",
                "action.edit": "编辑",
                "action.create": "创建",
                "action.calculate": "计算",
                "hvac.heating": "供暖",
                "hvac.cooling": "制冷",
                "hvac.ventilation": "通风",
                "hvac.airflow": "气流",
                "hvac.temperature": "温度",
                "hvac.pressure": "压力",
                "hvac.humidity": "湿度",
                "hvac.efficiency": "效率",
                "hvac.capacity": "容量",
                "hvac.load": "负荷",
            })
        elif language == Language.JAPANESE:
            default_translations.update({
                "app.title": "SizeWise Suite",
                "app.subtitle": "HVAC設計・計算プラットフォーム",
                "nav.dashboard": "ダッシュボード",
                "nav.projects": "プロジェクト",
                "nav.calculations": "計算",
                "nav.reports": "レポート",
                "nav.settings": "設定",
                "action.save": "保存",
                "action.cancel": "キャンセル",
                "action.delete": "削除",
                "action.edit": "編集",
                "action.create": "作成",
                "action.calculate": "計算",
                "hvac.heating": "暖房",
                "hvac.cooling": "冷房",
                "hvac.ventilation": "換気",
                "hvac.airflow": "気流",
                "hvac.temperature": "温度",
                "hvac.pressure": "圧力",
                "hvac.humidity": "湿度",
                "hvac.efficiency": "効率",
                "hvac.capacity": "容量",
                "hvac.load": "負荷",
            })
        
        self.translations[language] = default_translations
        self.save_translations(language)
    
    def save_translations(self, language: Language):
        """Save translations to file"""
        translation_file = self.translations_path / f"{language.value}.json"
        try:
            with open(translation_file, 'w', encoding='utf-8') as f:
                json.dump(self.translations[language], f, ensure_ascii=False, indent=2)
            logger.info(f"Saved translations for {language.value}")
        except Exception as e:
            logger.error(f"Failed to save translations for {language.value}: {e}")
    
    def get_translation(self, key: str, language: Language, variables: Dict[str, Any] = None) -> str:
        """Get translation for a key"""
        translation = self.translations.get(language, {}).get(key, key)
        
        # Replace variables if provided
        if variables:
            for var_key, var_value in variables.items():
                translation = translation.replace(f"{{{var_key}}}", str(var_value))
        
        return translation
    
    def add_translation(self, key: str, language: Language, value: str):
        """Add or update a translation"""
        if language not in self.translations:
            self.translations[language] = {}
        
        self.translations[language][key] = value
        self.save_translations(language)
    
    def get_missing_translations(self, base_language: Language = Language.ENGLISH) -> Dict[Language, List[str]]:
        """Get missing translations for each language"""
        base_keys = set(self.translations.get(base_language, {}).keys())
        missing = {}
        
        for language in Language:
            if language == base_language:
                continue
            
            lang_keys = set(self.translations.get(language, {}).keys())
            missing_keys = base_keys - lang_keys
            
            if missing_keys:
                missing[language] = list(missing_keys)
        
        return missing

class LocaleManager:
    """Locale management system"""
    
    def __init__(self):
        self.locales: Dict[str, LocaleConfig] = {}
        self.hvac_standards: Dict[HVACStandard, HVACStandardConfig] = {}
        self._initialize_locales()
        self._initialize_hvac_standards()
    
    def _initialize_locales(self):
        """Initialize default locale configurations"""
        default_locales = [
            LocaleConfig(
                language=Language.ENGLISH,
                region=Region.UNITED_STATES,
                currency=Currency.USD,
                unit_system=UnitSystem.IMPERIAL,
                hvac_standard=HVACStandard.ASHRAE,
                date_format="MM/dd/yyyy",
                time_format="h:mm a",
                number_format="#,##0.##",
                decimal_separator=".",
                thousands_separator=","
            ),
            LocaleConfig(
                language=Language.ENGLISH,
                region=Region.UNITED_KINGDOM,
                currency=Currency.GBP,
                unit_system=UnitSystem.METRIC,
                hvac_standard=HVACStandard.EN,
                date_format="dd/MM/yyyy",
                time_format="HH:mm",
                number_format="#,##0.##",
                decimal_separator=".",
                thousands_separator=","
            ),
            LocaleConfig(
                language=Language.SPANISH,
                region=Region.SPAIN,
                currency=Currency.EUR,
                unit_system=UnitSystem.METRIC,
                hvac_standard=HVACStandard.EN,
                date_format="dd/MM/yyyy",
                time_format="HH:mm",
                number_format="#.##0,##",
                decimal_separator=",",
                thousands_separator="."
            ),
            LocaleConfig(
                language=Language.GERMAN,
                region=Region.GERMANY,
                currency=Currency.EUR,
                unit_system=UnitSystem.METRIC,
                hvac_standard=HVACStandard.EN,
                date_format="dd.MM.yyyy",
                time_format="HH:mm",
                number_format="#.##0,##",
                decimal_separator=",",
                thousands_separator="."
            ),
            LocaleConfig(
                language=Language.FRENCH,
                region=Region.FRANCE,
                currency=Currency.EUR,
                unit_system=UnitSystem.METRIC,
                hvac_standard=HVACStandard.EN,
                date_format="dd/MM/yyyy",
                time_format="HH:mm",
                number_format="# ##0,##",
                decimal_separator=",",
                thousands_separator=" "
            ),
            LocaleConfig(
                language=Language.CHINESE_SIMPLIFIED,
                region=Region.CHINA,
                currency=Currency.CNY,
                unit_system=UnitSystem.METRIC,
                hvac_standard=HVACStandard.GB,
                date_format="yyyy/MM/dd",
                time_format="HH:mm",
                number_format="#,##0.##",
                decimal_separator=".",
                thousands_separator=","
            ),
            LocaleConfig(
                language=Language.JAPANESE,
                region=Region.JAPAN,
                currency=Currency.JPY,
                unit_system=UnitSystem.METRIC,
                hvac_standard=HVACStandard.JIS,
                date_format="yyyy/MM/dd",
                time_format="HH:mm",
                number_format="#,##0",
                decimal_separator=".",
                thousands_separator=","
            ),
        ]
        
        for locale_config in default_locales:
            locale_key = f"{locale_config.language.value}_{locale_config.region.value}"
            self.locales[locale_key] = locale_config
    
    def _initialize_hvac_standards(self):
        """Initialize HVAC standard configurations"""
        standards = [
            HVACStandardConfig(
                standard=HVACStandard.ASHRAE,
                name="ASHRAE Standards",
                region=[Region.UNITED_STATES, Region.CANADA, Region.MEXICO],
                temperature_units="°F",
                pressure_units="psi",
                flow_units="CFM",
                power_units="BTU/h",
                efficiency_metrics=["SEER", "EER", "COP", "HSPF"],
                design_conditions={
                    "summer_db": 95,  # °F
                    "winter_db": 0,   # °F
                    "humidity": 50    # %
                },
                code_requirements={
                    "ventilation_standard": "ASHRAE 62.1",
                    "energy_standard": "ASHRAE 90.1",
                    "load_calculation": "ASHRAE Handbook"
                }
            ),
            HVACStandardConfig(
                standard=HVACStandard.EN,
                name="European Standards",
                region=[Region.GERMANY, Region.FRANCE, Region.ITALY, Region.SPAIN, Region.UNITED_KINGDOM],
                temperature_units="°C",
                pressure_units="Pa",
                flow_units="m³/h",
                power_units="kW",
                efficiency_metrics=["SCOP", "SEER", "EER"],
                design_conditions={
                    "summer_db": 35,  # °C
                    "winter_db": -10, # °C
                    "humidity": 50    # %
                },
                code_requirements={
                    "ventilation_standard": "EN 16798",
                    "energy_standard": "EN 15232",
                    "load_calculation": "EN 12831"
                }
            ),
            HVACStandardConfig(
                standard=HVACStandard.JIS,
                name="Japanese Industrial Standards",
                region=[Region.JAPAN],
                temperature_units="°C",
                pressure_units="Pa",
                flow_units="m³/h",
                power_units="kW",
                efficiency_metrics=["APF", "COP"],
                design_conditions={
                    "summer_db": 35,  # °C
                    "winter_db": -5,  # °C
                    "humidity": 60    # %
                },
                code_requirements={
                    "ventilation_standard": "JIS A 1406",
                    "energy_standard": "JIS B 8616",
                    "load_calculation": "JIS A 2117"
                }
            ),
            HVACStandardConfig(
                standard=HVACStandard.GB,
                name="Chinese National Standards",
                region=[Region.CHINA],
                temperature_units="°C",
                pressure_units="Pa",
                flow_units="m³/h",
                power_units="kW",
                efficiency_metrics=["EER", "COP"],
                design_conditions={
                    "summer_db": 35,  # °C
                    "winter_db": -10, # °C
                    "humidity": 55    # %
                },
                code_requirements={
                    "ventilation_standard": "GB/T 18883",
                    "energy_standard": "GB 50189",
                    "load_calculation": "GB 50736"
                }
            ),
        ]
        
        for standard in standards:
            self.hvac_standards[standard.standard] = standard
    
    def get_locale(self, language: Language, region: Region) -> Optional[LocaleConfig]:
        """Get locale configuration"""
        locale_key = f"{language.value}_{region.value}"
        return self.locales.get(locale_key)
    
    def get_hvac_standard(self, standard: HVACStandard) -> Optional[HVACStandardConfig]:
        """Get HVAC standard configuration"""
        return self.hvac_standards.get(standard)
    
    def format_number(self, value: float, locale_config: LocaleConfig) -> str:
        """Format number according to locale"""
        # Simple number formatting implementation
        formatted = f"{value:,.2f}"
        
        # Replace separators based on locale
        if locale_config.decimal_separator != ".":
            formatted = formatted.replace(".", "TEMP_DECIMAL")
        if locale_config.thousands_separator != ",":
            formatted = formatted.replace(",", locale_config.thousands_separator)
        if locale_config.decimal_separator != ".":
            formatted = formatted.replace("TEMP_DECIMAL", locale_config.decimal_separator)
        
        return formatted
    
    def format_currency(self, value: float, locale_config: LocaleConfig) -> str:
        """Format currency according to locale"""
        formatted_number = self.format_number(value, locale_config)
        
        # Add currency symbol based on currency
        currency_symbols = {
            Currency.USD: "$",
            Currency.EUR: "€",
            Currency.GBP: "£",
            Currency.JPY: "¥",
            Currency.CNY: "¥",
            Currency.CAD: "C$",
            Currency.AUD: "A$",
            Currency.BRL: "R$",
            Currency.RUB: "₽",
            Currency.SAR: "﷼",
            Currency.KRW: "₩",
            Currency.MXN: "$"
        }
        
        symbol = currency_symbols.get(locale_config.currency, locale_config.currency.value)
        
        # Different currency formatting by region
        if locale_config.region in [Region.UNITED_STATES, Region.CANADA]:
            return f"{symbol}{formatted_number}"
        else:
            return f"{formatted_number} {symbol}"
    
    def format_date(self, date: datetime, locale_config: LocaleConfig) -> str:
        """Format date according to locale"""
        format_map = {
            "MM/dd/yyyy": "%m/%d/%Y",
            "dd/MM/yyyy": "%d/%m/%Y",
            "dd.MM.yyyy": "%d.%m.%Y",
            "yyyy/MM/dd": "%Y/%m/%d",
            "yyyy-MM-dd": "%Y-%m-%d"
        }
        
        python_format = format_map.get(locale_config.date_format, "%Y-%m-%d")
        return date.strftime(python_format)

class InternationalizationSystem:
    """Main internationalization system"""
    
    def __init__(self, db_service=None):
        self.db = db_service
        self.translation_manager = TranslationManager()
        self.locale_manager = LocaleManager()
        self.current_locale: Optional[LocaleConfig] = None
        
        # Set default locale
        self.set_locale(Language.ENGLISH, Region.UNITED_STATES)
        
        logger.info("Internationalization System initialized")
    
    def set_locale(self, language: Language, region: Region):
        """Set current locale"""
        locale_config = self.locale_manager.get_locale(language, region)
        if locale_config:
            self.current_locale = locale_config
            logger.info(f"Locale set to {language.value}_{region.value}")
        else:
            logger.warning(f"Locale not found: {language.value}_{region.value}")
    
    def translate(self, key: str, variables: Dict[str, Any] = None) -> str:
        """Translate a key using current locale"""
        if not self.current_locale:
            return key
        
        return self.translation_manager.get_translation(
            key, 
            self.current_locale.language, 
            variables
        )
    
    def format_number(self, value: float) -> str:
        """Format number using current locale"""
        if not self.current_locale:
            return str(value)
        
        return self.locale_manager.format_number(value, self.current_locale)
    
    def format_currency(self, value: float) -> str:
        """Format currency using current locale"""
        if not self.current_locale:
            return str(value)
        
        return self.locale_manager.format_currency(value, self.current_locale)
    
    def format_date(self, date: datetime) -> str:
        """Format date using current locale"""
        if not self.current_locale:
            return date.isoformat()
        
        return self.locale_manager.format_date(date, self.current_locale)
    
    def get_hvac_units(self) -> Dict[str, str]:
        """Get HVAC units for current locale"""
        if not self.current_locale:
            return {}
        
        standard_config = self.locale_manager.get_hvac_standard(self.current_locale.hvac_standard)
        if not standard_config:
            return {}
        
        return {
            "temperature": standard_config.temperature_units,
            "pressure": standard_config.pressure_units,
            "flow": standard_config.flow_units,
            "power": standard_config.power_units
        }
    
    def get_supported_locales(self) -> List[Dict[str, str]]:
        """Get list of supported locales"""
        locales = []
        for locale_key, locale_config in self.locale_manager.locales.items():
            locales.append({
                "key": locale_key,
                "language": locale_config.language.value,
                "region": locale_config.region.value,
                "display_name": f"{locale_config.language.value} ({locale_config.region.value})",
                "currency": locale_config.currency.value,
                "unit_system": locale_config.unit_system.value,
                "hvac_standard": locale_config.hvac_standard.value
            })
        
        return sorted(locales, key=lambda x: x["display_name"])
    
    def get_translation_status(self) -> Dict[str, Any]:
        """Get translation completion status"""
        missing = self.translation_manager.get_missing_translations()
        
        total_keys = len(self.translation_manager.translations.get(Language.ENGLISH, {}))
        completion_rates = {}
        
        for language in Language:
            lang_keys = len(self.translation_manager.translations.get(language, {}))
            completion_rate = (lang_keys / total_keys * 100) if total_keys > 0 else 0
            completion_rates[language.value] = round(completion_rate, 1)
        
        return {
            "total_keys": total_keys,
            "completion_rates": completion_rates,
            "missing_translations": {lang.value: keys for lang, keys in missing.items()},
            "supported_languages": [lang.value for lang in Language],
            "supported_regions": [region.value for region in Region],
            "hvac_standards": [std.value for std in HVACStandard]
        }

# Global internationalization system instance
i18n_system = InternationalizationSystem()
