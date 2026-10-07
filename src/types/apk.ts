export interface ApkFileInfo {
  name: string;
  size: number;
  uncompressedSize: number;
  path: string;
  isDirectory: boolean;
  date: Date;
  isModified?: boolean;
  data?: Uint8Array;
}

export interface ApkManifestInfo {
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: number;
  targetSdkVersion: number;
  appName?: string;
  appIcon?: string;
  installLocation?: 'auto' | 'internalOnly' | 'preferExternal';
  debuggable?: boolean;
  allowBackup?: boolean;
  hardwareAccelerated?: boolean;
  screenOrientation?: 'unspecified' | 'portrait' | 'landscape' | 'sensor' | 'behind';
  supportsRtl?: boolean;
  resizeableActivity?: boolean;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
  rawXml?: string;
  isDecodedFromBinary?: boolean;
}

export interface ApkStringResource {
  id: string;
  name: string;
  value: string;
  locale?: string;
  originalValue: string;
  isModified?: boolean;
}

export interface ApkColorResource {
  id: string;
  name: string;
  hexValue: string;
  originalValue: string;
  isModified?: boolean;
}

export interface DexClassInfo {
  name: string;
  package: string;
  superClass?: string;
  interfaces?: string[];
  methodsCount: number;
  fieldsCount: number;
  sourceFile?: string;
}

export interface ApkSignatureInfo {
  hasV1Signature: boolean;
  hasV2Signature: boolean;
  hasV3Signature: boolean;
  manifestEntriesCount: number;
  certFiles: string[];
  sha1Digest?: string;
  sha256Digest?: string;
  md5Digest?: string;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validUntil?: string;
  serialNumber?: string;
  publicKeyAlgorithm?: string;
  publicKeySize?: number;
}

export interface KeystoreProfile {
  id: string;
  name: string;
  alias: string;
  password?: string;
  createdDate: string;
  validityYears: number;
  algorithm: 'RSA' | 'ECDSA';
  keySize: number; // 2048, 4096, 256
  isDefault?: boolean;
  certSubject: {
    commonName: string;
    organization: string;
    organizationalUnit?: string;
    locality?: string;
    state?: string;
    country: string;
  };
  sha1Fingerprint: string;
  sha256Fingerprint: string;
  publicKeyPem: string;
  privateKeyPem?: string;
  pkcs8Base64?: string;
  certPem: string;
  rawKeyData?: Uint8Array;
}

export interface DetectedAdSdk {
  id: string;
  name: string;
  vendor: string;
  category: 'ad_network' | 'analytics_tracker' | 'mediation';
  confidence: 'high' | 'medium' | 'low';
  description: string;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  metadataKeys: string[];
  dexClassMatches: string[];
  layoutMatches: string[];
  enabled: boolean;
}

export interface AdScanReport {
  scannedAt: Date;
  totalAdNetworksFound: number;
  totalAdComponentsFound: number;
  detectedSdks: DetectedAdSdk[];
  hasAdIdPermission: boolean;
  adPermissions: string[];
  adActivities: string[];
  adServices: string[];
  adReceivers: string[];
  adMetadata: string[];
  adLayoutFiles: string[];
}

export interface ApkSummary {
  fileName: string;
  fileSize: number;
  totalFiles: number;
  manifest: ApkManifestInfo;
  signatures: ApkSignatureInfo;
  dexClasses: DexClassInfo[];
  dexCount: number;
  resourceCount: number;
  drawableCount: number;
  assetCount: number;
  modifiedCount: number;
  iconUrl?: string;
  colors?: ApkColorResource[];
  adReport?: AdScanReport;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5; // 1: Overview, 2: Edit Selection, 3: Edit, 4: Sign, 5: Build
export type ActiveEditType = 'common' | 'simple' | 'full' | 'manifest' | 'strings' | 'adcleaner';

export type EditMode = 
  | 'overview' 
  | 'common' 
  | 'simple' 
  | 'full' 
  | 'manifest' 
  | 'strings' 
  | 'adcleaner' 
  | 'keystore' 
  | 'dex' 
  | 'signature';

