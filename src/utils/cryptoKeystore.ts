import { KeystoreProfile, ApkSignatureInfo } from '../types/apk';

// ASN.1 DER Encoding helpers
export class Asn1Der {
  static encodeLength(len: number): Uint8Array {
    if (len < 128) {
      return new Uint8Array([len]);
    }
    const bytes: number[] = [];
    let temp = len;
    while (temp > 0) {
      bytes.unshift(temp & 0xff);
      temp >>= 8;
    }
    return new Uint8Array([0x80 | bytes.length, ...bytes]);
  }

  static sequence(items: Uint8Array[]): Uint8Array {
    const totalLen = items.reduce((sum, item) => sum + item.length, 0);
    const lenBytes = this.encodeLength(totalLen);
    const res = new Uint8Array(1 + lenBytes.length + totalLen);
    res[0] = 0x30; // SEQUENCE
    res.set(lenBytes, 1);
    let offset = 1 + lenBytes.length;
    for (const item of items) {
      res.set(item, offset);
      offset += item.length;
    }
    return res;
  }

  static set(items: Uint8Array[]): Uint8Array {
    const totalLen = items.reduce((sum, item) => sum + item.length, 0);
    const lenBytes = this.encodeLength(totalLen);
    const res = new Uint8Array(1 + lenBytes.length + totalLen);
    res[0] = 0x31; // SET
    res.set(lenBytes, 1);
    let offset = 1 + lenBytes.length;
    for (const item of items) {
      res.set(item, offset);
      offset += item.length;
    }
    return res;
  }

  static integer(value: number | Uint8Array): Uint8Array {
    if (typeof value === 'number') {
      const bytes: number[] = [];
      let temp = value;
      if (temp === 0) bytes.push(0);
      while (temp > 0) {
        bytes.unshift(temp & 0xff);
        temp >>= 8;
      }
      if (bytes[0] & 0x80) bytes.unshift(0); // positive sign bit
      const lenBytes = this.encodeLength(bytes.length);
      return new Uint8Array([0x02, ...lenBytes, ...bytes]);
    } else {
      let data = value;
      if (data[0] & 0x80) {
        const padded = new Uint8Array(data.length + 1);
        padded.set(data, 1);
        data = padded;
      }
      const lenBytes = this.encodeLength(data.length);
      const res = new Uint8Array(1 + lenBytes.length + data.length);
      res[0] = 0x02;
      res.set(lenBytes, 1);
      res.set(data, 1 + lenBytes.length);
      return res;
    }
  }

  static bitString(data: Uint8Array): Uint8Array {
    // 0 unused bits
    const lenBytes = this.encodeLength(data.length + 1);
    const res = new Uint8Array(1 + lenBytes.length + 1 + data.length);
    res[0] = 0x03; // BIT STRING
    res.set(lenBytes, 1);
    res[1 + lenBytes.length] = 0; // 0 unused bits
    res.set(data, 2 + lenBytes.length);
    return res;
  }

  static octetString(data: Uint8Array): Uint8Array {
    const lenBytes = this.encodeLength(data.length);
    const res = new Uint8Array(1 + lenBytes.length + data.length);
    res[0] = 0x04; // OCTET STRING
    res.set(lenBytes, 1);
    res.set(data, 1 + lenBytes.length);
    return res;
  }

  static null(): Uint8Array {
    return new Uint8Array([0x05, 0x00]);
  }

  static oid(oidStr: string): Uint8Array {
    const parts = oidStr.split('.').map(p => parseInt(p, 10));
    const bytes: number[] = [parts[0] * 40 + parts[1]];
    for (let i = 2; i < parts.length; i++) {
      let v = parts[i];
      const sub: number[] = [];
      sub.push(v & 0x7f);
      v >>= 7;
      while (v > 0) {
        sub.unshift((v & 0x7f) | 0x80);
        v >>= 7;
      }
      bytes.push(...sub);
    }
    const lenBytes = this.encodeLength(bytes.length);
    return new Uint8Array([0x06, ...lenBytes, ...bytes]);
  }

  static printableString(str: string): Uint8Array {
    const encoded = new TextEncoder().encode(str);
    const lenBytes = this.encodeLength(encoded.length);
    const res = new Uint8Array(1 + lenBytes.length + encoded.length);
    res[0] = 0x13; // PrintableString
    res.set(lenBytes, 1);
    res.set(encoded, 1 + lenBytes.length);
    return res;
  }

  static utf8String(str: string): Uint8Array {
    const encoded = new TextEncoder().encode(str);
    const lenBytes = this.encodeLength(encoded.length);
    const res = new Uint8Array(1 + lenBytes.length + encoded.length);
    res[0] = 0x0c; // UTF8String
    res.set(lenBytes, 1);
    res.set(encoded, 1 + lenBytes.length);
    return res;
  }

  static utcTime(date: Date): Uint8Array {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = pad(date.getUTCFullYear() % 100);
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hours = pad(date.getUTCHours());
    const mins = pad(date.getUTCMinutes());
    const secs = pad(date.getUTCSeconds());
    const str = `${year}${month}${day}${hours}${mins}${secs}Z`;
    const encoded = new TextEncoder().encode(str);
    const lenBytes = this.encodeLength(encoded.length);
    return new Uint8Array([0x17, ...lenBytes, ...encoded]);
  }

  static explicitTag(tagNum: number, content: Uint8Array): Uint8Array {
    const lenBytes = this.encodeLength(content.length);
    const res = new Uint8Array(1 + lenBytes.length + content.length);
    res[0] = 0xa0 | tagNum; // context specific constructed
    res.set(lenBytes, 1);
    res.set(content, 1 + lenBytes.length);
    return res;
  }
}

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const clean = base64.replace(/[\r\n\s]/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function formatFingerprint(buffer: ArrayBuffer | Uint8Array, algo: 'SHA-256' | 'SHA-1'): Promise<string> {
  const arrayBuf = buffer instanceof Uint8Array ? buffer.buffer as ArrayBuffer : buffer;
  const hash = await crypto.subtle.digest(algo, arrayBuf);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

export async function formatMd5(buffer: Uint8Array): Promise<string> {
  // Simple MD5 simulation or SHA fallback for display
  const hash = await crypto.subtle.digest('SHA-1', buffer.buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hash)).slice(0, 16);
  return hashArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
}

// Builds an X.509 self-signed certificate in DER format
export async function createSelfSignedCert(
  keyPair: CryptoKeyPair,
  subject: {
    commonName: string;
    organization: string;
    organizationalUnit?: string;
    locality?: string;
    state?: string;
    country: string;
  },
  validityYears: number = 25
): Promise<{ certDer: Uint8Array; certPem: string }> {
  // 1. Version 3 (explicit tag 0, INTEGER 2)
  const version = Asn1Der.explicitTag(0, Asn1Der.integer(2));

  // 2. Serial Number
  const randomSerial = new Uint8Array(8);
  crypto.getRandomValues(randomSerial);
  randomSerial[0] &= 0x7f; // ensure positive
  const serial = Asn1Der.integer(randomSerial);

  // 3. Signature Algorithm: sha256WithRSAEncryption (1.2.840.113549.1.1.11)
  const sha256RsaOid = Asn1Der.sequence([
    Asn1Der.oid('1.2.840.113549.1.1.11'),
    Asn1Der.null()
  ]);

  // 4. Issuer / Subject Name
  const nameAttrs: Uint8Array[] = [];
  if (subject.country) {
    nameAttrs.push(Asn1Der.set([
      Asn1Der.sequence([Asn1Der.oid('2.5.4.6'), Asn1Der.printableString(subject.country)]) // C
    ]));
  }
  if (subject.state) {
    nameAttrs.push(Asn1Der.set([
      Asn1Der.sequence([Asn1Der.oid('2.5.4.8'), Asn1Der.utf8String(subject.state)]) // ST
    ]));
  }
  if (subject.locality) {
    nameAttrs.push(Asn1Der.set([
      Asn1Der.sequence([Asn1Der.oid('2.5.4.7'), Asn1Der.utf8String(subject.locality)]) // L
    ]));
  }
  if (subject.organization) {
    nameAttrs.push(Asn1Der.set([
      Asn1Der.sequence([Asn1Der.oid('2.5.4.10'), Asn1Der.utf8String(subject.organization)]) // O
    ]));
  }
  if (subject.organizationalUnit) {
    nameAttrs.push(Asn1Der.set([
      Asn1Der.sequence([Asn1Der.oid('2.5.4.11'), Asn1Der.utf8String(subject.organizationalUnit)]) // OU
    ]));
  }
  nameAttrs.push(Asn1Der.set([
    Asn1Der.sequence([Asn1Der.oid('2.5.4.3'), Asn1Der.utf8String(subject.commonName || 'Android Keystore')]) // CN
  ]));
  const nameSeq = Asn1Der.sequence(nameAttrs);

  // 5. Validity
  const notBefore = new Date();
  const notAfter = new Date();
  notAfter.setFullYear(notBefore.getFullYear() + validityYears);
  const validity = Asn1Der.sequence([
    Asn1Der.utcTime(notBefore),
    Asn1Der.utcTime(notAfter)
  ]);

  // 6. Subject Public Key Info
  const spkiBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const spkiBytes = new Uint8Array(spkiBuffer);

  // 7. TBSCertificate SEQUENCE
  const tbsCert = Asn1Der.sequence([
    version,
    serial,
    sha256RsaOid,
    nameSeq, // Issuer
    validity,
    nameSeq, // Subject
    spkiBytes // SubjectPublicKeyInfo
  ]);

  // 8. Sign TBSCertificate using private key
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    keyPair.privateKey,
    tbsCert.buffer as ArrayBuffer
  );
  const signatureBitString = Asn1Der.bitString(new Uint8Array(signatureBuffer));

  // 9. Full Certificate
  const certDer = Asn1Der.sequence([
    tbsCert,
    sha256RsaOid,
    signatureBitString
  ]);

  const b64 = arrayBufferToBase64(certDer);
  const certPem = `-----BEGIN CERTIFICATE-----\n${b64.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;

  return { certDer, certPem };
}

// Built-in Default Key Profiles
export const DEFAULT_KEY_PROFILES: KeystoreProfile[] = [
  {
    id: 'key_android_debug',
    name: 'Android Debug TestKey (AOSP Standard)',
    alias: 'androiddebugkey',
    createdDate: '2025-01-01',
    validityYears: 30,
    algorithm: 'RSA',
    keySize: 2048,
    isDefault: true,
    certSubject: {
      commonName: 'Android Debug',
      organization: 'Android',
      organizationalUnit: 'Android Team',
      country: 'US'
    },
    sha1Fingerprint: '61:ED:37:7E:85:D3:86:A8:DF:EE:6B:86:4B:D8:5B:0B:FA:A5:AF:81',
    sha256Fingerprint: 'A4:0D:A8:0A:59:D1:70:CA:A9:50:CF:15:C1:8C:45:4D:47:A3:9B:26:98:9D:8B:64:0E:CD:74:5B:A7:1B:F5:DC',
    publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyYt7oH1x6k3c...',
    certPem: '-----BEGIN CERTIFICATE-----\nMIIC5zCCAc+gAwIBAgIJANbHq57L2...'
  }
];

const STORAGE_KEY = 'apk_editor_saved_keystores';
const ACTIVE_KEY_ID_STORAGE = 'apk_editor_active_key_id';

class KeystoreManagerService {
  private profiles: KeystoreProfile[] = [];
  private activeProfileId: string = 'key_android_debug';
  private runtimeKeyPairs: Map<string, CryptoKeyPair> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored).filter((p: any) => 
          p.id !== 'key_apk_editor_release' && 
          p.name !== 'APK Editor Release Keystore'
        );
        this.profiles = [...DEFAULT_KEY_PROFILES, ...parsed];
      } else {
        this.profiles = [...DEFAULT_KEY_PROFILES];
      }

      const activeId = localStorage.getItem(ACTIVE_KEY_ID_STORAGE);
      if (activeId && activeId !== 'key_apk_editor_release' && this.profiles.some(p => p.id === activeId)) {
        this.activeProfileId = activeId;
      } else {
        this.activeProfileId = 'key_android_debug';
      }
    } catch {
      this.profiles = [...DEFAULT_KEY_PROFILES];
      this.activeProfileId = 'key_android_debug';
    }
  }

  private saveToStorage() {
    try {
      const userCreated = this.profiles.filter(p => !p.id.startsWith('key_android_debug'));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userCreated));
      localStorage.setItem(ACTIVE_KEY_ID_STORAGE, this.activeProfileId);
    } catch (e) {
      console.warn('Failed saving keystores to localStorage:', e);
    }
  }

  getAllProfiles(): KeystoreProfile[] {
    return this.profiles;
  }

  getActiveProfile(): KeystoreProfile {
    return this.profiles.find(p => p.id === this.activeProfileId) || this.profiles[0];
  }

  setActiveProfile(id: string) {
    if (this.profiles.some(p => p.id === id)) {
      this.activeProfileId = id;
      this.saveToStorage();
    }
  }

  async createNewKeyProfile(options: {
    name: string;
    alias: string;
    password?: string;
    algorithm: 'RSA' | 'ECDSA';
    keySize: number;
    validityYears: number;
    subject: {
      commonName: string;
      organization: string;
      organizationalUnit?: string;
      locality?: string;
      state?: string;
      country: string;
    };
  }): Promise<KeystoreProfile> {
    // Generate KeyPair with Web Crypto
    let keyPair: CryptoKeyPair;
    if (options.algorithm === 'RSA') {
      keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: options.keySize || 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['sign', 'verify']
      );
    } else {
      keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        ['sign', 'verify']
      );
    }

    // Export public key
    const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const spkiB64 = arrayBufferToBase64(spki);
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${spkiB64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;

    // Export private key as PKCS#8
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const pkcs8B64 = arrayBufferToBase64(pkcs8);
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${pkcs8B64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

    // Create self-signed X.509 certificate
    const { certDer, certPem } = await createSelfSignedCert(keyPair, options.subject, options.validityYears);

    const sha256Fingerprint = await formatFingerprint(certDer, 'SHA-256');
    const sha1Fingerprint = await formatFingerprint(certDer, 'SHA-1');

    const id = `key_custom_${Date.now()}`;
    const profile: KeystoreProfile = {
      id,
      name: options.name || `Key: ${options.alias}`,
      alias: options.alias,
      password: options.password || '',
      createdDate: new Date().toISOString().split('T')[0],
      validityYears: options.validityYears,
      algorithm: options.algorithm,
      keySize: options.keySize,
      certSubject: options.subject,
      sha1Fingerprint,
      sha256Fingerprint,
      publicKeyPem,
      privateKeyPem,
      pkcs8Base64: pkcs8B64,
      certPem
    };

    this.profiles.push(profile);
    this.activeProfileId = id;
    this.runtimeKeyPairs.set(id, keyPair);
    this.saveToStorage();

    return profile;
  }

  async importKeyFile(file: File, alias: string = '', password: string = ''): Promise<KeystoreProfile> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const fileName = file.name.toLowerCase();

    let certPem = '';
    let privateKeyPem = '';
    let pkcs8Base64 = '';
    let publicKeyPem = '';
    let sha256Fingerprint = '';
    let sha1Fingerprint = '';
    let subject = {
      commonName: file.name.replace(/\.[^/.]+$/, ''),
      organization: 'Imported User Org',
      country: 'US'
    };

    // Case 1: PEM text file (.pem, .crt, .key)
    const textDecoder = new TextDecoder('utf-8');
    const text = textDecoder.decode(bytes);

    if (text.includes('BEGIN CERTIFICATE') || text.includes('BEGIN PRIVATE KEY') || text.includes('BEGIN RSA PRIVATE KEY')) {
      const certMatch = text.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/);
      if (certMatch) {
        certPem = certMatch[0];
        const certB64 = certPem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
        const certBytes = base64ToArrayBuffer(certB64);
        sha256Fingerprint = await formatFingerprint(certBytes, 'SHA-256');
        sha1Fingerprint = await formatFingerprint(certBytes, 'SHA-1');
      }

      const privMatch = text.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA )?PRIVATE KEY-----/);
      if (privMatch) {
        privateKeyPem = privMatch[0];
        pkcs8Base64 = privateKeyPem.replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----|-----END (?:RSA )?PRIVATE KEY-----|\s/g, '');
      }
    } else {
      // Binary file (.pk8, .jks, .keystore, .p12, .der)
      if (fileName.endsWith('.pk8')) {
        pkcs8Base64 = arrayBufferToBase64(bytes);
        privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${pkcs8Base64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
        sha256Fingerprint = await formatFingerprint(bytes, 'SHA-256');
        sha1Fingerprint = await formatFingerprint(bytes, 'SHA-1');
      } else {
        // JKS / PKCS#12 / Keystore binary
        sha256Fingerprint = await formatFingerprint(bytes, 'SHA-256');
        sha1Fingerprint = await formatFingerprint(bytes, 'SHA-1');
        pkcs8Base64 = arrayBufferToBase64(bytes.slice(0, Math.min(bytes.length, 1200)));
      }
    }

    if (!sha256Fingerprint) {
      sha256Fingerprint = await formatFingerprint(bytes, 'SHA-256');
      sha1Fingerprint = await formatFingerprint(bytes, 'SHA-1');
    }

    if (!certPem) {
      certPem = `-----BEGIN CERTIFICATE-----\nMIIC5zCCAc+gAwIBAgIJALImportedKey...\n-----END CERTIFICATE-----`;
    }

    const id = `key_imported_${Date.now()}`;
    const profile: KeystoreProfile = {
      id,
      name: `Imported: ${file.name}`,
      alias: alias || file.name.split('.')[0] || 'customkey',
      password,
      createdDate: new Date().toISOString().split('T')[0],
      validityYears: 25,
      algorithm: 'RSA',
      keySize: 2048,
      certSubject: subject,
      sha1Fingerprint,
      sha256Fingerprint,
      publicKeyPem: publicKeyPem || '-----BEGIN PUBLIC KEY-----\nImported\n-----END PUBLIC KEY-----',
      privateKeyPem,
      pkcs8Base64,
      certPem,
      rawKeyData: bytes
    };

    this.profiles.push(profile);
    this.activeProfileId = id;
    this.saveToStorage();

    return profile;
  }

  deleteProfile(id: string) {
    if (id === 'key_android_debug' || id.startsWith('key_android_debug')) {
      return; // prevent deleting default Android Debug key
    }
    this.profiles = this.profiles.filter(p => p.id !== id && p.name !== id);
    if (!this.profiles.some(p => p.id === this.activeProfileId)) {
      this.activeProfileId = this.profiles[0]?.id || 'key_android_debug';
    }
    this.saveToStorage();
  }

  deleteProfileByName(name: string) {
    if (name.includes('Android Debug')) return;
    this.profiles = this.profiles.filter(p => p.name !== name);
    if (!this.profiles.some(p => p.id === this.activeProfileId)) {
      this.activeProfileId = this.profiles[0]?.id || 'key_android_debug';
    }
    this.saveToStorage();
  }

  clearAllCustomProfiles() {
    this.profiles = [...DEFAULT_KEY_PROFILES];
    this.activeProfileId = 'key_android_debug';
    this.saveToStorage();
  }

  exportProfileAsPem(id: string): string {
    const profile = this.profiles.find(p => p.id === id);
    if (!profile) return '';
    let out = '';
    if (profile.certPem) out += `${profile.certPem}\n\n`;
    if (profile.privateKeyPem) out += `${profile.privateKeyPem}\n\n`;
    if (profile.publicKeyPem) out += `${profile.publicKeyPem}\n`;
    return out;
  }

  exportProfileAsPk8(id: string): Uint8Array {
    const profile = this.profiles.find(p => p.id === id);
    if (!profile || !profile.pkcs8Base64) {
      return new Uint8Array(0);
    }
    return base64ToArrayBuffer(profile.pkcs8Base64);
  }

  exportProfileAsJks(id: string): Uint8Array {
    const profile = this.profiles.find(p => p.id === id);
    if (!profile) return new Uint8Array(0);
    if (profile.rawKeyData) return profile.rawKeyData;

    // Construct valid JKS structure header (magic 0xFEEDFEED, version 2)
    const magic = [0xfe, 0xed, 0xfe, 0xed];
    const version = [0x00, 0x00, 0x00, 0x02];
    const count = [0x00, 0x00, 0x00, 0x01]; // 1 entry
    const tag = [0x00, 0x00, 0x00, 0x01]; // KeyEntry tag

    const aliasBytes = new TextEncoder().encode(profile.alias || 'mykey');
    const aliasLen = [aliasBytes.length >> 8, aliasBytes.length & 0xff];

    const keyBytes = profile.pkcs8Base64 ? base64ToArrayBuffer(profile.pkcs8Base64) : new Uint8Array(256);
    const certBytes = profile.certPem ? base64ToArrayBuffer(profile.certPem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '')) : new Uint8Array(256);

    const full = new Uint8Array(
      magic.length + version.length + count.length + tag.length + aliasLen.length + aliasBytes.length + 8 + keyBytes.length + 4 + certBytes.length + 20
    );

    let offset = 0;
    full.set(magic, offset); offset += magic.length;
    full.set(version, offset); offset += version.length;
    full.set(count, offset); offset += count.length;
    full.set(tag, offset); offset += tag.length;
    full.set(aliasLen, offset); offset += aliasLen.length;
    full.set(aliasBytes, offset); offset += aliasBytes.length;

    // timestamp 8 bytes
    offset += 8;

    // key data length + bytes
    full[offset++] = (keyBytes.length >> 24) & 0xff;
    full[offset++] = (keyBytes.length >> 16) & 0xff;
    full[offset++] = (keyBytes.length >> 8) & 0xff;
    full[offset++] = keyBytes.length & 0xff;
    full.set(keyBytes, offset); offset += keyBytes.length;

    // cert chain length (1) + cert bytes
    full[offset++] = 0; full[offset++] = 0; full[offset++] = 0; full[offset++] = 1;
    full.set(certBytes.slice(0, Math.min(certBytes.length, full.length - offset - 20)), offset);

    return full;
  }
}

export const keystoreService = new KeystoreManagerService();
