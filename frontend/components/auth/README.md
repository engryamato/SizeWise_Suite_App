# Authentication Components

A comprehensive, modular authentication system for the SizeWise Suite desktop application, designed with offline-first architecture and future SaaS compatibility.

## 🏗️ Architecture Overview

The authentication system follows a modular, component-based architecture with clear separation of concerns:

- **Components**: Reusable UI components with accessibility and responsive design
- **Hooks**: Custom React hooks for state management and business logic
- **Validation**: Comprehensive form validation with real-time feedback
- **Configuration**: Centralized configuration for branding, features, and settings
- **Types**: TypeScript interfaces for type safety and developer experience

## 📁 File Structure

```
frontend/components/auth/
├── index.ts                 # Main export file
├── types.ts                 # TypeScript type definitions
├── config.tsx               # Configuration and constants
├── hooks.ts                 # Custom React hooks
├── validation.ts            # Form validation logic
├── LoginPage.tsx            # Main login page component
├── FormInput.tsx            # Reusable form input components
├── SocialButton.tsx         # Social authentication buttons
├── ToggleSwitch.tsx         # Toggle switch components
├── VideoBackground.tsx      # Video background component
├── __tests__/
│   └── auth.test.tsx        # Comprehensive test suite
└── README.md               # This documentation
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { LoginPage } from '@/components/auth';

export default function AuthPage() {
  return (
    <LoginPage
      videoUrl="/auth/background-video.mp4"
      fallbackImage="/auth/background-fallback.jpg"
      onLoginSuccess={(result) => {
        console.log('Login successful:', result);
      }}
      onLoginError={(error) => {
        console.error('Login failed:', error);
      }}
    />
  );
}
```

### Individual Components

```tsx
import { 
  FormInput, 
  EmailInput, 
  PasswordInput,
  SocialButton,
  ToggleSwitch 
} from '@/components/auth';

// Email input with validation
<EmailInput
  name="email"
  value={email}
  onChange={setEmail}
  label="Email Address"
  error={emailError}
  required
/>

// Password input with visibility toggle
<PasswordInput
  name="password"
  value={password}
  onChange={setPassword}
  label="Password"
  error={passwordError}
  required
/>

// Social authentication button
<SocialButton
  provider="google"
  icon={<FaGoogle />}
  label="Sign in with Google"
  onClick={handleGoogleLogin}
/>

// Remember me toggle
<ToggleSwitch
  checked={rememberMe}
  onChange={setRememberMe}
  label="Remember me"
/>
```

## 🎨 Components

### LoginPage

The main authentication page component that orchestrates all subcomponents.

**Props:**
- `videoUrl?: string` - URL for background video
- `fallbackImage?: string` - Fallback image if video fails
- `className?: string` - Additional CSS classes
- `onLoginSuccess?: (result: AuthResult) => void` - Success callback
- `onLoginError?: (error: Error) => void` - Error callback

**Features:**
- Glassmorphism design with video background
- Social login integration (UI ready, Phase 2 functionality)
- Form validation with real-time feedback
- Accessibility compliance (WCAG 2.1 AA)
- Responsive design for desktop, laptop, and tablet

### FormInput Components

Reusable form input components with floating labels and validation.

**Components:**
- `FormInput` - Base input component
- `EmailInput` - Specialized email input
- `PasswordInput` - Password input with visibility toggle
- `InputGroup` - Container for related inputs

**Features:**
- Floating labels with smooth animations
- Icon support with proper spacing
- Real-time validation feedback
- Accessibility attributes (ARIA labels, roles)
- Error states with visual indicators

### SocialButton Components

Social authentication buttons with loading states and accessibility.

**Components:**
- `SocialButton` - Individual social login button
- `SocialButtonGroup` - Group of social buttons
- `SocialDivider` - Divider with text
- `CompactSocialLogin` - Compact social login layout

**Features:**
- Provider-specific styling (Google, Microsoft, Yahoo)
- Loading states with spinners
- Hover effects and animations
- Keyboard navigation support
- Responsive layout options

### ToggleSwitch Components

Custom toggle switches with animations and accessibility.

**Components:**
- `ToggleSwitch` - Base toggle component
- `ToggleGroup` - Multiple toggles
- `RememberMeToggle` - Specialized remember me toggle
- `AnimatedToggleSwitch` - Enhanced with animations

**Features:**
- Smooth animations and transitions
- Multiple sizes (sm, md, lg)
- Keyboard navigation (Space, Enter)
- Screen reader support
- Custom styling options

### VideoBackground

Background video component with fallbacks and performance optimization.

**Features:**
- Automatic fallback to image or gradient
- Performance optimization with Intersection Observer
- Accessibility considerations (aria-hidden)
- Responsive video scaling
- Loading states and error handling

## 🔧 Hooks

### useAuthForm

Comprehensive form state management with validation.

```tsx
const { formState, updateField, handleSubmit, setErrors } = useAuthForm(
  async (data) => {
    // Handle form submission
    const result = await login(data);
    if (!result.success) {
      setErrors({ general: result.error });
    }
  }
);
```

### useAuthentication

Authentication state and actions.

```tsx
const { 
  user, 
  isAuthenticated, 
  login, 
  socialLogin, 
  logout 
} = useAuthentication();
```

### useFormValidation

Real-time form validation.

```tsx
const { validateField, validateForm } = useFormValidation();
```

## ✅ Validation

### Email Validation
- Required field validation
- Email format validation
- Common typo detection and suggestions
- Length limits (254 characters max)

### Password Validation
- Required field validation
- Minimum length (8 characters)
- Common password detection
- Optional strength checking (Phase 2)

### Real-time Validation
- Debounced validation (300ms default)
- Field-level and form-level validation
- Accessibility announcements
- Visual error indicators

## 🎯 Configuration

### Branding Configuration

```tsx
export const BRAND_CONFIG = {
  title: 'SizeWise',
  subtitle: 'Powerful Sizing, Effortless Workflow',
  logoUrl: '/sizewise-logo.svg',
  iconComponent: <SizeWiseIcon />,
};
```

### Feature Flags

```tsx
export const AUTH_FEATURES = {
  rememberMe: true,
  forgotPassword: true,
  socialLogin: true,
  createAccount: true,
  passwordStrengthIndicator: false, // Phase 2
  twoFactorAuth: false, // Phase 2
};
```

### Social Providers

```tsx
export const SOCIAL_PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    icon: <FaGoogle />,
    enabled: true,
  },
  // ... more providers
];
```

## 🧪 Testing

Run the test suite:

```bash
npm test components/auth
```

The test suite includes:
- Component rendering tests
- User interaction tests
- Validation logic tests
- Accessibility tests
- Hook behavior tests

## ♿ Accessibility

### WCAG 2.1 AA Compliance
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements
- Color contrast compliance
- Focus management

### Features
- Live regions for error announcements
- Descriptive button labels
- Form field associations
- Keyboard shortcuts
- High contrast support

## 📱 Responsive Design

### Breakpoints
- **Mobile**: Not supported (desktop-only app)
- **Tablet**: 768px and up
- **Laptop**: 1024px and up
- **Desktop**: 1280px and up

### Adaptive Features
- Responsive form layouts
- Scalable typography
- Touch-friendly targets (tablets)
- Flexible grid systems

## 🔄 Phase 1 vs Phase 2

### Phase 1 (Current - Offline Desktop)
- ✅ Complete UI components
- ✅ Form validation
- ✅ Local authentication
- ✅ Remember me functionality
- ❌ Social login (UI only)
- ❌ Forgot password (UI only)
- ❌ Account creation (UI only)

### Phase 2 (Future - SaaS)
- 🔄 Social OAuth integration
- 🔄 Password reset functionality
- 🔄 Account registration
- 🔄 Two-factor authentication
- 🔄 Password strength indicators
- 🔄 Biometric authentication

## 🚀 Performance

### Optimizations
- Lazy loading of components
- Debounced validation
- Memoized calculations
- Intersection Observer for video
- Minimal re-renders

### Bundle Size
- Tree-shakeable exports
- Minimal dependencies
- Optimized icons
- Compressed assets

## 🔧 Development

### Adding New Components

1. Create component file in `/components/auth/`
2. Add TypeScript types to `types.ts`
3. Export from `index.ts`
4. Add tests to `__tests__/`
5. Update documentation

### Customization

The system is highly customizable through:
- Configuration files
- CSS custom properties
- Theme variables
- Feature flags
- Component props

## 📄 License

Part of the SizeWise Suite application. All rights reserved.
