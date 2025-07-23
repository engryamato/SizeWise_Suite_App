# Application Security Architecture

**Purpose:** Comprehensive security architecture for SizeWise Suite's tier-based licensing system with offline-to-SaaS transition  
**Priority:** 🔒 **MISSION-CRITICAL** - Security gaps could compromise the entire tier-based licensing system

---

## 1. Security Overview

### 1.1 Security Principles

- **Defense in Depth**: Multiple security layers protecting tier enforcement
- **Zero Trust**: Validate all inputs, never trust client-side data
- **Cryptographic Integrity**: All licenses and feature flags cryptographically signed
- **Secure by Default**: Security measures active from first application launch

### 1.2 Threat Model

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **License Tampering** | Unauthorized tier access | Cryptographic signatures, OS keystore |
| **Feature Flag Bypass** | Free users accessing Pro features | Server-side validation, encrypted flags |
| **Database Manipulation** | Data corruption, tier bypass | SQLCipher encryption, integrity checks |
| **Reverse Engineering** | License key extraction | Code obfuscation, hardware binding |
| **Man-in-the-Middle** | SaaS credential theft | Certificate pinning, HTTPS enforcement |
| **Data Exfiltration** | Project data theft | Encryption at rest, secure transmission |

---

## 2. License Validation System

### 2.1 License Architecture

```typescript
// Secure license structure with cryptographic protection
interface SecureLicense {
  header: {
    version: string;
    algorithm: 'RSA-SHA256' | 'ECDSA-P256';
    keyId: string;
  };
  payload: {
    userId: string;
    email: string;
    tier: 'free' | 'pro' | 'enterprise';
    features: string[];
    issuedAt: number;
    expiresAt?: number;
    hardwareFingerprint?: string;
    organizationId?: string;
  };
  signature: string; // Base64-encoded cryptographic signature
}
```

### 2.2 License Validation Flow

```typescript
// electron/license/LicenseValidator.ts
export class LicenseValidator {
  private readonly publicKey: string;
  private readonly keystore: KeystoreManager;

  async validateLicense(licenseData: string): Promise<ValidationResult> {
    try {
      // 1. Parse license structure
      const license = this.parseLicense(licenseData);
      
      // 2. Verify cryptographic signature
      const isSignatureValid = await this.verifySignature(license);
      if (!isSignatureValid) {
        throw new SecurityError('Invalid license signature');
      }
      
      // 3. Check expiration
      if (license.payload.expiresAt && Date.now() > license.payload.expiresAt) {
        throw new SecurityError('License expired');
      }
      
      // 4. Validate hardware binding (if present)
      if (license.payload.hardwareFingerprint) {
        const currentFingerprint = await this.getHardwareFingerprint();
        if (currentFingerprint !== license.payload.hardwareFingerprint) {
          throw new SecurityError('License not valid for this device');
        }
      }
      
      // 5. Store in secure keystore
      await this.keystore.storeLicense(license);
      
      return { valid: true, license: license.payload };
      
    } catch (error) {
      await this.logSecurityEvent('license_validation_failed', { error: error.message });
      return { valid: false, error: error.message };
    }
  }

  private async verifySignature(license: SecureLicense): Promise<boolean> {
    const payload = JSON.stringify(license.payload);
    const signature = Buffer.from(license.signature, 'base64');
    
    return crypto.verify(
      license.header.algorithm,
      Buffer.from(payload),
      this.publicKey,
      signature
    );
  }

  private async getHardwareFingerprint(): Promise<string> {
    const machineId = await import('node-machine-id');
    const cpuInfo = os.cpus()[0];
    const networkInterfaces = os.networkInterfaces();
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(machineId.machineIdSync())
      .update(cpuInfo.model)
      .update(JSON.stringify(networkInterfaces))
      .digest('hex');
      
    return fingerprint;
  }
}
```

### 2.3 OS Keystore Integration

```typescript
// electron/license/KeystoreManager.ts
export class KeystoreManager {
  async storeLicense(license: LicensePayload): Promise<void> {
    const encryptedLicense = await this.encryptLicense(license);
    
    if (process.platform === 'win32') {
      // Windows Credential Manager
      await this.storeInWindowsCredentialManager(encryptedLicense);
    } else if (process.platform === 'darwin') {
      // macOS Keychain
      await this.storeInMacOSKeychain(encryptedLicense);
    } else {
      // Linux Secret Service
      await this.storeInLinuxSecretService(encryptedLicense);
    }
  }

  private async encryptLicense(license: LicensePayload): Promise<string> {
    const key = await this.deriveEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(license), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }

  private async deriveEncryptionKey(): Promise<Buffer> {
    const machineId = await import('node-machine-id');
    const salt = 'sizewise-license-salt-v1';
    
    return crypto.pbkdf2Sync(
      machineId.machineIdSync(),
      salt,
      100000, // iterations
      32,     // key length
      'sha256'
    );
  }
}
```

---

## 3. Database Encryption

### 3.1 SQLCipher Integration

```typescript
// backend/database/EncryptionManager.ts
export class EncryptionManager {
  private encryptionKey: Buffer;

  async initializeEncryption(): Promise<void> {
    this.encryptionKey = await this.deriveDbEncryptionKey();
  }

  async createEncryptedDatabase(dbPath: string): Promise<Database> {
    const db = new Database(dbPath);
    
    // Enable SQLCipher encryption
    db.pragma(`key = '${this.encryptionKey.toString('hex')}'`);
    db.pragma('cipher_page_size = 4096');
    db.pragma('cipher_hmac_algorithm = HMAC_SHA256');
    db.pragma('cipher_kdf_algorithm = PBKDF2_HMAC_SHA256');
    db.pragma('cipher_kdf_iter = 100000');
    
    // Verify encryption is working
    try {
      db.exec('CREATE TABLE IF NOT EXISTS encryption_test (id INTEGER)');
      db.exec('DROP TABLE encryption_test');
    } catch (error) {
      throw new SecurityError('Database encryption initialization failed');
    }
    
    return db;
  }

  async backupEncryptedDatabase(sourcePath: string, backupPath: string): Promise<void> {
    const sourceDb = await this.createEncryptedDatabase(sourcePath);
    
    // Create encrypted backup
    sourceDb.backup(backupPath, {
      progress: (info) => {
        console.log(`Backup progress: ${info.totalPages - info.remainingPages}/${info.totalPages}`);
      }
    });
    
    sourceDb.close();
  }

  private async deriveDbEncryptionKey(): Promise<Buffer> {
    const machineId = await import('node-machine-id');
    const userDataPath = app.getPath('userData');
    const salt = crypto.createHash('sha256').update(userDataPath).digest();
    
    return crypto.pbkdf2Sync(
      machineId.machineIdSync(),
      salt,
      100000,
      32,
      'sha256'
    );
  }
}
```

### 3.2 Data Integrity Verification

```typescript
// backend/database/IntegrityChecker.ts
export class IntegrityChecker {
  async verifyDatabaseIntegrity(db: Database): Promise<boolean> {
    try {
      // Check SQLCipher integrity
      const integrityResult = db.pragma('integrity_check');
      if (integrityResult[0].integrity_check !== 'ok') {
        throw new SecurityError('Database integrity check failed');
      }
      
      // Verify critical tables exist and have expected structure
      await this.verifyTableStructure(db, 'users');
      await this.verifyTableStructure(db, 'projects');
      await this.verifyTableStructure(db, 'feature_flags');
      
      // Check for suspicious data modifications
      await this.detectAnomalousChanges(db);
      
      return true;
    } catch (error) {
      await this.logSecurityEvent('database_integrity_failure', { error: error.message });
      return false;
    }
  }

  private async detectAnomalousChanges(db: Database): Promise<void> {
    // Check for impossible tier changes
    const suspiciousChanges = db.prepare(`
      SELECT * FROM change_log 
      WHERE entity_type = 'user' 
      AND json_extract(changes, '$.tier') IN ('pro', 'enterprise')
      AND timestamp > datetime('now', '-1 hour')
    `).all();
    
    if (suspiciousChanges.length > 0) {
      throw new SecurityError('Suspicious tier modifications detected');
    }
  }
}
```

---

## 4. Secure Feature Flag Validation

### 4.1 Cryptographic Feature Flag Protection

```typescript
// frontend/lib/security/SecureFeatureValidator.ts
export class SecureFeatureValidator {
  private readonly hmacKey: Buffer;

  constructor(licenseKey: string) {
    this.hmacKey = crypto.createHash('sha256').update(licenseKey).digest();
  }

  async validateFeatureAccess(
    featureName: string, 
    userTier: string, 
    timestamp: number
  ): Promise<boolean> {
    // 1. Generate expected HMAC for this feature access
    const expectedHmac = this.generateFeatureHmac(featureName, userTier, timestamp);
    
    // 2. Check against stored feature flags
    const storedFlag = await this.getStoredFeatureFlag(featureName);
    if (!storedFlag) {
      return this.isDefaultTierFeature(featureName, userTier);
    }
    
    // 3. Verify HMAC integrity
    const isValid = crypto.timingSafeEqual(
      Buffer.from(storedFlag.hmac, 'hex'),
      expectedHmac
    );
    
    if (!isValid) {
      await this.logSecurityEvent('feature_flag_tampering', { 
        feature: featureName, 
        tier: userTier 
      });
      return false;
    }
    
    // 4. Check expiration
    if (storedFlag.expiresAt && Date.now() > storedFlag.expiresAt) {
      return false;
    }
    
    return storedFlag.enabled;
  }

  private generateFeatureHmac(
    featureName: string, 
    userTier: string, 
    timestamp: number
  ): Buffer {
    const message = `${featureName}:${userTier}:${Math.floor(timestamp / 3600000)}`; // Hour-based
    return crypto.createHmac('sha256', this.hmacKey).update(message).digest();
  }

  async createSecureFeatureFlag(
    featureName: string,
    enabled: boolean,
    userTier: string,
    expiresAt?: number
  ): Promise<SecureFeatureFlag> {
    const timestamp = Date.now();
    const hmac = this.generateFeatureHmac(featureName, userTier, timestamp);
    
    return {
      featureName,
      enabled,
      userTier,
      timestamp,
      expiresAt,
      hmac: hmac.toString('hex')
    };
  }
}

interface SecureFeatureFlag {
  featureName: string;
  enabled: boolean;
  userTier: string;
  timestamp: number;
  expiresAt?: number;
  hmac: string;
}
```

### 4.2 Tier Enforcement Security

```typescript
// frontend/lib/security/TierEnforcer.ts
export class TierEnforcer {
  private readonly validator: SecureFeatureValidator;
  private readonly auditLogger: SecurityAuditLogger;

  async enforceProjectLimit(userId: string, currentCount: number): Promise<void> {
    const user = await this.getUserSecurely(userId);
    const isUnlimited = await this.validator.validateFeatureAccess(
      'unlimited_projects',
      user.tier,
      Date.now()
    );

    if (!isUnlimited && currentCount >= this.getTierProjectLimit(user.tier)) {
      await this.auditLogger.logViolationAttempt('project_limit_exceeded', {
        userId,
        tier: user.tier,
        currentCount,
        limit: this.getTierProjectLimit(user.tier)
      });
      
      throw new TierLimitExceededError(
        `${user.tier} tier limited to ${this.getTierProjectLimit(user.tier)} projects`
      );
    }
  }

  private getTierProjectLimit(tier: string): number {
    const limits = {
      'free': 3,
      'pro': Infinity,
      'enterprise': Infinity
    };
    return limits[tier] || 0;
  }

  private async getUserSecurely(userId: string): Promise<User> {
    // Always fetch from encrypted database, never trust cached data for security decisions
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new SecurityError('User not found');
    }
    
    // Verify user data integrity
    const isIntegrityValid = await this.verifyUserIntegrity(user);
    if (!isIntegrityValid) {
      throw new SecurityError('User data integrity check failed');
    }
    
    return user;
  }
}
```

---

## 5. Authentication & Authorization

### 5.1 Session Management

```typescript
// frontend/lib/auth/AuthenticationManager.ts
export class AuthenticationManager {
  private sessionToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;

  async authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // 1. Validate credentials format
      this.validateCredentials(credentials);
      
      // 2. Authenticate with secure backend
      const authResponse = await this.secureAuthenticate(credentials);
      
      // 3. Store tokens securely
      await this.storeTokensSecurely(authResponse.tokens);
      
      // 4. Initialize user session
      await this.initializeUserSession(authResponse.user);
      
      return { success: true, user: authResponse.user };
      
    } catch (error) {
      await this.logSecurityEvent('authentication_failed', {
        email: credentials.email,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async validateSession(): Promise<boolean> {
    if (!this.sessionToken || Date.now() > this.tokenExpiry) {
      return await this.refreshSession();
    }
    
    // Verify token integrity
    try {
      const payload = this.decodeJWT(this.sessionToken);
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  private async storeTokensSecurely(tokens: AuthTokens): Promise<void> {
    const keystore = new KeystoreManager();
    
    // Encrypt tokens before storage
    const encryptedSession = await this.encryptToken(tokens.sessionToken);
    const encryptedRefresh = await this.encryptToken(tokens.refreshToken);
    
    await keystore.storeCredential('session_token', encryptedSession);
    await keystore.storeCredential('refresh_token', encryptedRefresh);
    
    // Store in memory for current session
    this.sessionToken = tokens.sessionToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiry = tokens.expiresAt;
  }
}
```

### 5.2 Multi-Tenant Authorization

```typescript
// backend/auth/AuthorizationManager.ts
export class AuthorizationManager {
  async authorizeResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    try {
      // 1. Get user with organization context
      const user = await this.getUserWithOrganization(userId);
      
      // 2. Check resource ownership
      const isOwner = await this.checkResourceOwnership(user, resourceType, resourceId);
      if (isOwner) return true;
      
      // 3. Check organization permissions
      if (user.organizationId) {
        const hasOrgPermission = await this.checkOrganizationPermission(
          user.organizationId,
          resourceType,
          action
        );
        if (hasOrgPermission) return true;
      }
      
      // 4. Check shared access
      const hasSharedAccess = await this.checkSharedAccess(
        userId,
        resourceType,
        resourceId,
        action
      );
      
      return hasSharedAccess;
      
    } catch (error) {
      await this.logSecurityEvent('authorization_error', {
        userId,
        resourceType,
        resourceId,
        action,
        error: error.message
      });
      return false;
    }
  }

  private async checkResourceOwnership(
    user: User,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM ${resourceType}s 
      WHERE id = ? AND user_id = ?
    `;
    
    const result = await this.db.get(query, [resourceId, user.id]);
    return result.count > 0;
  }
}
```

---

## 6. Security Monitoring & Logging

### 6.1 Security Event Logging

```typescript
// frontend/lib/security/SecurityAuditLogger.ts
export class SecurityAuditLogger {
  private readonly logQueue: SecurityEvent[] = [];
  private readonly maxQueueSize = 1000;

  async logSecurityEvent(
    eventType: SecurityEventType,
    details: Record<string, any>
  ): Promise<void> {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: Date.now(),
      details: this.sanitizeDetails(details),
      severity: this.getEventSeverity(eventType),
      userAgent: navigator.userAgent,
      ipAddress: await this.getClientIP()
    };

    // Add to queue
    this.logQueue.push(event);
    
    // Maintain queue size
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift();
    }

    // Immediate action for critical events
    if (event.severity === 'CRITICAL') {
      await this.handleCriticalEvent(event);
    }

    // Persist to encrypted storage
    await this.persistSecurityEvent(event);
  }

  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    switch (event.type) {
      case 'license_tampering':
      case 'feature_flag_bypass':
        // Immediately disable application
        await this.emergencyShutdown(event);
        break;
      case 'multiple_failed_authentications':
        // Lock account temporarily
        await this.temporaryAccountLock(event);
        break;
    }
  }

  private getEventSeverity(eventType: SecurityEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityMap = {
      'license_validation_failed': 'HIGH',
      'feature_flag_tampering': 'CRITICAL',
      'database_integrity_failure': 'CRITICAL',
      'authentication_failed': 'MEDIUM',
      'authorization_denied': 'MEDIUM',
      'suspicious_activity': 'HIGH',
      'tier_limit_exceeded': 'LOW'
    };
    
    return severityMap[eventType] || 'MEDIUM';
  }
}

type SecurityEventType = 
  | 'license_validation_failed'
  | 'feature_flag_tampering'
  | 'database_integrity_failure'
  | 'authentication_failed'
  | 'authorization_denied'
  | 'suspicious_activity'
  | 'tier_limit_exceeded';
```

---

## 7. SaaS Security Considerations

### 7.1 Cloud Security Architecture

```typescript
// Cloud security patterns for SaaS transition
export class CloudSecurityManager {
  async establishSecureConnection(): Promise<void> {
    // Certificate pinning for API connections
    const trustedCertificates = await this.loadTrustedCertificates();
    
    // Configure HTTPS with strict security
    const httpsAgent = new https.Agent({
      ca: trustedCertificates,
      checkServerIdentity: this.customCertificateValidation,
      secureProtocol: 'TLSv1_3_method'
    });

    this.apiClient.defaults.httpsAgent = httpsAgent;
  }

  private customCertificateValidation(hostname: string, cert: any): Error | undefined {
    // Implement certificate pinning
    const expectedFingerprint = this.getExpectedCertificateFingerprint(hostname);
    const actualFingerprint = this.calculateCertificateFingerprint(cert);
    
    if (expectedFingerprint !== actualFingerprint) {
      return new Error('Certificate fingerprint mismatch');
    }
    
    return undefined;
  }
}
```

### 7.2 Data Protection in Transit

```typescript
// End-to-end encryption for sensitive data
export class DataProtectionManager {
  async encryptSensitiveData(data: any, recipientPublicKey: string): Promise<string> {
    // Generate ephemeral key pair
    const ephemeralKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048
    });

    // Encrypt data with AES
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', aesKey, iv);
    
    let encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Encrypt AES key with recipient's public key
    const encryptedAesKey = crypto.publicEncrypt(
      recipientPublicKey,
      aesKey
    );

    return JSON.stringify({
      encryptedData,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encryptedKey: encryptedAesKey.toString('base64')
    });
  }
}
```

---

**Status**: ✅ **COMPLETE** - Comprehensive security architecture documented  
**Next Step**: Create security implementation checklist (Task 0.12)
