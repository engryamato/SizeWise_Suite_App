/**
 * HardwareFingerprint - Device Binding for License Protection
 * 
 * MISSION-CRITICAL: Prevents license sharing between devices
 * Generates unique, stable hardware fingerprints for device binding
 * 
 * @see docs/implementation/security/application-security-guide.md section 2.4
 * @see docs/implementation/security/security-implementation-checklist.md section 1.1
 */

import * as crypto from 'crypto';
import * as os from 'os';
import { execSync } from 'child_process';

/**
 * Hardware fingerprint components
 */
interface FingerprintComponents {
  cpuInfo: string;
  systemInfo: string;
  networkInfo: string;
  diskInfo: string;
  platformSpecific: string;
}

/**
 * Production-grade hardware fingerprint generator
 * Creates stable, unique device identifiers for license binding
 */
export class HardwareFingerprint {
  private cachedFingerprint: string | null = null;
  private readonly fingerprintVersion = '1.0';

  /**
   * Generate unique hardware fingerprint for current device
   * CRITICAL: Must be stable across reboots but unique per device
   */
  async generate(): Promise<string> {
    try {
      // Use cached fingerprint if available (for performance)
      if (this.cachedFingerprint) {
        return this.cachedFingerprint;
      }

      const components = await this.gatherHardwareComponents();
      const fingerprint = this.createFingerprint(components);
      
      // Cache for subsequent calls
      this.cachedFingerprint = fingerprint;
      
      return fingerprint;
      
    } catch (error) {
      throw new Error(`Hardware fingerprint generation failed: ${error.message}`);
    }
  }

  /**
   * Validate if current hardware matches provided fingerprint
   */
  async validate(expectedFingerprint: string): Promise<boolean> {
    try {
      const currentFingerprint = await this.generate();
      return currentFingerprint === expectedFingerprint;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get fingerprint components for debugging (without sensitive data)
   */
  async getComponents(): Promise<Partial<FingerprintComponents>> {
    try {
      const components = await this.gatherHardwareComponents();
      
      // Return sanitized components for debugging
      return {
        cpuInfo: components.cpuInfo.substring(0, 20) + '...',
        systemInfo: components.systemInfo.substring(0, 20) + '...',
        networkInfo: 'MAC addresses (hashed)',
        diskInfo: 'Disk serials (hashed)',
        platformSpecific: 'Platform data (hashed)'
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Gather hardware components for fingerprinting
   */
  private async gatherHardwareComponents(): Promise<FingerprintComponents> {
    const platform = os.platform();
    
    return {
      cpuInfo: this.getCPUInfo(),
      systemInfo: this.getSystemInfo(),
      networkInfo: await this.getNetworkInfo(),
      diskInfo: await this.getDiskInfo(),
      platformSpecific: await this.getPlatformSpecificInfo(platform)
    };
  }

  /**
   * Get CPU information for fingerprinting
   */
  private getCPUInfo(): string {
    try {
      const cpus = os.cpus();
      if (cpus.length === 0) {
        return 'unknown-cpu';
      }
      
      // Use CPU model and count (stable across reboots)
      const cpuModel = cpus[0].model.replace(/\s+/g, ' ').trim();
      const cpuCount = cpus.length;
      
      return `${cpuModel}|${cpuCount}`;
    } catch (error) {
      return 'cpu-error';
    }
  }

  /**
   * Get system information for fingerprinting
   */
  private getSystemInfo(): string {
    try {
      const info = [
        os.platform(),
        os.arch(),
        os.release(),
        os.totalmem().toString()
      ];
      
      return info.join('|');
    } catch (error) {
      return 'system-error';
    }
  }

  /**
   * Get network interface information (MAC addresses)
   */
  private async getNetworkInfo(): Promise<string> {
    try {
      const interfaces = os.networkInterfaces();
      const macAddresses: string[] = [];
      
      for (const [name, addrs] of Object.entries(interfaces)) {
        if (addrs) {
          for (const addr of addrs as any[]) {
            if (addr.mac && addr.mac !== '00:00:00:00:00:00' && !addr.internal) {
              macAddresses.push(addr.mac);
            }
          }
        }
      }
      
      // Sort for consistency and hash for privacy
      macAddresses.sort();
      const macString = macAddresses.join('|');
      
      return crypto.createHash('sha256').update(macString).digest('hex');
    } catch (error) {
      return 'network-error';
    }
  }

  /**
   * Get disk information for fingerprinting
   */
  private async getDiskInfo(): Promise<string> {
    try {
      const platform = os.platform();
      let diskInfo = '';
      
      switch (platform) {
        case 'win32':
          diskInfo = await this.getWindowsDiskInfo();
          break;
        case 'darwin':
          diskInfo = await this.getMacOSDiskInfo();
          break;
        case 'linux':
          diskInfo = await this.getLinuxDiskInfo();
          break;
        default:
          diskInfo = 'unknown-platform';
      }
      
      // Hash disk info for privacy
      return crypto.createHash('sha256').update(diskInfo).digest('hex');
    } catch (error) {
      return 'disk-error';
    }
  }

  /**
   * Get Windows-specific disk information
   */
  private async getWindowsDiskInfo(): Promise<string> {
    try {
      // Get disk serial numbers using wmic
      const output = execSync('wmic diskdrive get serialnumber /format:csv', { 
        encoding: 'utf8',
        timeout: 5000 
      });
      
      const serials = output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.includes('SerialNumber') && !line.includes('Node'))
        .map(line => line.split(',').pop()?.trim())
        .filter(serial => serial && serial !== '')
        .sort();
      
      return serials.join('|') || 'no-disk-serials';
    } catch (error) {
      return 'windows-disk-error';
    }
  }

  /**
   * Get macOS-specific disk information
   */
  private async getMacOSDiskInfo(): Promise<string> {
    try {
      // Get disk information using system_profiler
      const output = execSync('system_profiler SPStorageDataType -json', { 
        encoding: 'utf8',
        timeout: 5000 
      });
      
      const data = JSON.parse(output);
      const serials: string[] = [];
      
      if (data.SPStorageDataType) {
        for (const disk of data.SPStorageDataType) {
          if (disk.device_serial) {
            serials.push(disk.device_serial);
          }
        }
      }
      
      serials.sort();
      return serials.join('|') || 'no-disk-serials';
    } catch (error) {
      return 'macos-disk-error';
    }
  }

  /**
   * Get Linux-specific disk information
   */
  private async getLinuxDiskInfo(): Promise<string> {
    try {
      // Get disk serial numbers using lsblk
      const output = execSync('lsblk -d -o NAME,SERIAL --json', { 
        encoding: 'utf8',
        timeout: 5000 
      });
      
      const data = JSON.parse(output);
      const serials: string[] = [];
      
      if (data.blockdevices) {
        for (const device of data.blockdevices) {
          if (device.serial && device.serial.trim() !== '') {
            serials.push(device.serial.trim());
          }
        }
      }
      
      serials.sort();
      return serials.join('|') || 'no-disk-serials';
    } catch (error) {
      return 'linux-disk-error';
    }
  }

  /**
   * Get platform-specific information
   */
  private async getPlatformSpecificInfo(platform: string): Promise<string> {
    try {
      switch (platform) {
        case 'win32':
          return await this.getWindowsSpecificInfo();
        case 'darwin':
          return await this.getMacOSSpecificInfo();
        case 'linux':
          return await this.getLinuxSpecificInfo();
        default:
          return 'unknown-platform';
      }
    } catch (error) {
      return 'platform-error';
    }
  }

  /**
   * Get Windows-specific system information
   */
  private async getWindowsSpecificInfo(): Promise<string> {
    try {
      const output = execSync('wmic csproduct get uuid /format:csv', { 
        encoding: 'utf8',
        timeout: 5000 
      });
      
      const uuid = output
        .split('\n')
        .find(line => line.includes('-'))
        ?.split(',')
        .pop()
        ?.trim();
      
      return uuid || 'no-windows-uuid';
    } catch (error) {
      return 'windows-error';
    }
  }

  /**
   * Get macOS-specific system information
   */
  private async getMacOSSpecificInfo(): Promise<string> {
    try {
      const output = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { 
        encoding: 'utf8',
        timeout: 5000 
      });
      
      const uuid = output.split(':')[1]?.trim();
      return uuid || 'no-macos-uuid';
    } catch (error) {
      return 'macos-error';
    }
  }

  /**
   * Get Linux-specific system information
   */
  private async getLinuxSpecificInfo(): Promise<string> {
    try {
      // Try to get machine ID
      const output = execSync('cat /etc/machine-id', { 
        encoding: 'utf8',
        timeout: 5000 
      });
      
      return output.trim() || 'no-linux-machine-id';
    } catch (error) {
      return 'linux-error';
    }
  }

  /**
   * Create final fingerprint from components
   */
  private createFingerprint(components: FingerprintComponents): string {
    try {
      // Combine all components with version
      const combined = [
        this.fingerprintVersion,
        components.cpuInfo,
        components.systemInfo,
        components.networkInfo,
        components.diskInfo,
        components.platformSpecific
      ].join('||');
      
      // Create SHA-256 hash of combined components
      const hash = crypto.createHash('sha256').update(combined).digest('hex');
      
      // Format as readable fingerprint
      return `HW-${hash.substring(0, 8)}-${hash.substring(8, 16)}-${hash.substring(16, 24)}-${hash.substring(24, 32)}`;
      
    } catch (error) {
      throw new Error(`Fingerprint creation failed: ${error.message}`);
    }
  }

  /**
   * Clear cached fingerprint (for testing)
   */
  clearCache(): void {
    this.cachedFingerprint = null;
  }
}
