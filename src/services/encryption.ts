// Secure credential encryption service
class CredentialManager {
  private static readonly STORAGE_KEY = 'gh_enterprise_creds'
  private static readonly IV_LENGTH = 16

  private static async deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  }

  private static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16))
  }

  private static generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.IV_LENGTH))
  }

  static async encryptCredentials(
    enterpriseName: string, 
    token: string, 
    masterPassword: string = 'default-key'
  ): Promise<void> {
    try {
      const salt = this.generateSalt()
      const iv = this.generateIV()
      const key = await this.deriveKey(masterPassword, salt.buffer as ArrayBuffer)

      const credentials = JSON.stringify({ enterpriseName, token })
      const encoder = new TextEncoder()
      const data = encoder.encode(credentials)

      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        data
      )

      const encryptedCredentials = {
        salt: Array.from(salt),
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encryptedData))
      }

      // Store encrypted credentials
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(encryptedCredentials))
    } catch (error) {
      console.error('Failed to encrypt credentials:', error)
      throw new Error('Credential encryption failed')
    }
  }

  static async decryptCredentials(
    masterPassword: string = 'default-key'
  ): Promise<{ enterpriseName: string; token: string } | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const encryptedCredentials = JSON.parse(stored)
      const salt = new Uint8Array(encryptedCredentials.salt)
      const iv = new Uint8Array(encryptedCredentials.iv)
      const data = new Uint8Array(encryptedCredentials.data)

      const key = await this.deriveKey(masterPassword, salt.buffer as ArrayBuffer)

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        data
      )

      const decoder = new TextDecoder()
      const credentials = JSON.parse(decoder.decode(decryptedData))

      return credentials
    } catch (error) {
      console.error('Failed to decrypt credentials:', error)
      return null
    }
  }

  static clearCredentials(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  static hasStoredCredentials(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null
  }
}

export default CredentialManager
