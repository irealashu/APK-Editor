import React, { useState, useEffect, useRef } from 'react';
import { ApkSignatureInfo, KeystoreProfile } from '../types/apk';
import { keystoreService } from '../utils/cryptoKeystore';
import { apkManager } from '../utils/apkManager';
import { 
  Shield, Key, Plus, Upload, Download, Check, Trash2, Hash, 
  FileCheck, ShieldCheck, RefreshCw, Copy, CheckCircle2,
  Lock, AlertCircle, X
} from 'lucide-react';

interface KeystoreManagerProps {
  currentSignature: ApkSignatureInfo;
  onSignatureUpdated: () => void;
}

type TabType = 'profiles' | 'create' | 'import' | 'current';

export const KeystoreManager: React.FC<KeystoreManagerProps> = ({
  currentSignature,
  onSignatureUpdated
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profiles');
  const [profiles, setProfiles] = useState<KeystoreProfile[]>(keystoreService.getAllProfiles());
  const [activeProfile, setActiveProfile] = useState<KeystoreProfile>(keystoreService.getActiveProfile());
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [signingStatus, setSigningStatus] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: 'My Custom Release Key',
    alias: 'my_release_key',
    password: '',
    algorithm: 'RSA' as 'RSA' | 'ECDSA',
    keySize: 2048,
    validityYears: 25,
    commonName: 'Android Developer',
    organization: 'My Software Studio',
    organizationalUnit: 'Mobile Engineering',
    locality: 'San Francisco',
    state: 'CA',
    country: 'US'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Import State
  const [importAlias, setImportAlias] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshProfiles = () => {
    setProfiles(keystoreService.getAllProfiles());
    setActiveProfile(keystoreService.getActiveProfile());
  };

  const handleSelectActive = (id: string) => {
    keystoreService.setActiveProfile(id);
    refreshProfiles();
    onSignatureUpdated();
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const newProfile = await keystoreService.createNewKeyProfile({
        name: createForm.name,
        alias: createForm.alias,
        password: createForm.password,
        algorithm: createForm.algorithm,
        keySize: createForm.keySize,
        validityYears: createForm.validityYears,
        subject: {
          commonName: createForm.commonName,
          organization: createForm.organization,
          organizationalUnit: createForm.organizationalUnit,
          locality: createForm.locality,
          state: createForm.state,
          country: createForm.country
        }
      });

      refreshProfiles();
      setActiveTab('profiles');
      setSigningStatus(`Created key "${newProfile.alias}" and set as active signer!`);
      setTimeout(() => setSigningStatus(null), 3500);
      onSignatureUpdated();
    } catch (err: any) {
      console.error('Failed generating key:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const imported = await keystoreService.importKeyFile(file, importAlias, importPassword);
      refreshProfiles();
      setActiveTab('profiles');
      setSigningStatus(`Imported "${file.name}" successfully!`);
      setTimeout(() => setSigningStatus(null), 3500);
      onSignatureUpdated();
    } catch (err: any) {
      console.error('Import error:', err);
      setImportError('Failed parsing key file: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = (profile: KeystoreProfile, format: 'jks' | 'pk8' | 'pem') => {
    const a = document.createElement('a');
    let blob: Blob;

    if (format === 'pem') {
      const pemStr = keystoreService.exportProfileAsPem(profile.id);
      blob = new Blob([pemStr], { type: 'text/plain' });
      a.download = `${profile.alias}.pem`;
    } else if (format === 'pk8') {
      const pk8Bytes = keystoreService.exportProfileAsPk8(profile.id);
      blob = new Blob([pk8Bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
      a.download = `${profile.alias}.pk8`;
    } else {
      const jksBytes = keystoreService.exportProfileAsJks(profile.id);
      blob = new Blob([jksBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
      a.download = `${profile.alias}.jks`;
    }

    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteProfile = (id: string, name?: string) => {
    keystoreService.deleteProfile(id);
    if (name) {
      keystoreService.deleteProfileByName(name);
    }
    refreshProfiles();
    onSignatureUpdated();
    setDeleteConfirmId(null);
    setSigningStatus(`Deleted profile "${name || id}"`);
    setTimeout(() => setSigningStatus(null), 3000);
  };

  const handleResetToDefault = () => {
    keystoreService.clearAllCustomProfiles();
    refreshProfiles();
    onSignatureUpdated();
    setDeleteConfirmId(null);
    setSigningStatus('Reset to standard AOSP Android Debug Key');
    setTimeout(() => setSigningStatus(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden Import Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".keystore,.jks,.pk8,.pem,.crt,.cer,.p12,.pfx,.der,.key"
        className="hidden"
        onChange={handleFilePicked}
      />

      {/* Step Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <Key className="w-3.5 h-3.5" /> Step 4 of 5: Sign &amp; Keystore Studio
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Keystore &amp; Digital Signer Studio
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Generate custom X.509 keystores, import key files (.jks, .keystore, .pk8, .pem), and manage APK package signatures.
            </p>
          </div>
        </div>

        {signingStatus && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> {signingStatus}
            </span>
          </div>
        )}
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profiles'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Keystore Profiles ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'create'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Generate New Key</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'import'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Key File</span>
        </button>

        <button
          onClick={() => setActiveTab('current')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'current'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Current APK Certificate</span>
        </button>
      </div>

      {/* TAB 1: Keystore Profiles & Selector */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <span>Select the active signing key for packaging your APK.</span>
            <div className="flex items-center gap-3">
              <span>Active Key: <strong className="text-emerald-400">{activeProfile.name}</strong></span>
              {profiles.some(p => !p.id.startsWith('key_android_debug')) && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition cursor-pointer"
                  title="Remove all custom keys and reset to default standard key"
                >
                  Reset Keys to Default
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfile.id;

              return (
                <div
                  key={profile.id}
                  className={`p-5 rounded-xl border transition flex flex-col justify-between relative shadow-lg ${
                    isActive
                      ? 'bg-slate-900/90 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow">
                      <Check className="w-3 h-3 stroke-[3]" /> ACTIVE SIGNER
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <Key className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <h3 className="font-bold text-white text-sm truncate" title={profile.name}>
                        {profile.name}
                      </h3>
                    </div>

                    <div className="mt-2 space-y-1.5 text-xs font-mono">
                      <div className="text-slate-400 flex items-center justify-between">
                        <span className="text-slate-500">Alias:</span>
                        <span className="text-slate-200">{profile.alias}</span>
                      </div>
                      <div className="text-slate-400 flex items-center justify-between">
                        <span className="text-slate-500">Algorithm:</span>
                        <span className="text-slate-200">{profile.algorithm} ({profile.keySize} bits)</span>
                      </div>
                      <div className="text-slate-400 flex items-center justify-between">
                        <span className="text-slate-500">Validity:</span>
                        <span className="text-slate-200">{profile.validityYears} years</span>
                      </div>
                      <div className="text-slate-400 flex items-center justify-between">
                        <span className="text-slate-500">Subject:</span>
                        <span className="text-slate-300 truncate max-w-[200px]" title={profile.certSubject.commonName}>
                          CN={profile.certSubject.commonName}
                        </span>
                      </div>
                    </div>

                    {/* Fingerprint block */}
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-850 space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                        <span>SHA-256 Fingerprint</span>
                        <button
                          onClick={() => handleCopy(profile.sha256Fingerprint, profile.id)}
                          className="hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedText === profile.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-[10px] text-emerald-400/90 break-all leading-tight">
                        {profile.sha256Fingerprint}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {!isActive ? (
                      <button
                        onClick={() => handleSelectActive(profile.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-medium transition cursor-pointer"
                      >
                        Set as Active
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-medium">Ready to sign</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleExport(profile, 'jks')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition cursor-pointer"
                        title="Export as Java KeyStore (.jks)"
                      >
                        .JKS
                      </button>
                      <button
                        onClick={() => handleExport(profile, 'pk8')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition cursor-pointer"
                        title="Export as PKCS#8 (.pk8)"
                      >
                        .PK8
                      </button>
                      <button
                        onClick={() => handleExport(profile, 'pem')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition cursor-pointer"
                        title="Export as Certificate PEM (.pem)"
                      >
                        .PEM
                      </button>

                      {!profile.id.startsWith('key_android_debug') && (
                        deleteConfirmId === profile.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-800 rounded px-1.5 py-0.5 ml-1">
                            <span className="text-[10px] text-rose-300 font-semibold">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteProfile(profile.id, profile.name)}
                              className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition cursor-pointer"
                              title="Confirm delete"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-0.5 rounded text-slate-400 hover:text-white transition cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(profile.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer ml-1"
                            title={`Delete ${profile.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Generate New Keystore / Keypair */}
      {activeTab === 'create' && (
        <form onSubmit={handleGenerateKey} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              Generate Self-Signed X.509 Android Keystore
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates a cryptographically strong private key and X.509 certificate directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Profile Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Key Alias</label>
              <input
                type="text"
                value={createForm.alias}
                onChange={(e) => setCreateForm({ ...createForm, alias: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Key Algorithm</label>
              <select
                value={createForm.algorithm}
                onChange={(e) => setCreateForm({ ...createForm, algorithm: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="RSA">RSA (Recommended for full Android compatibility)</option>
                <option value="ECDSA">ECDSA P-256 (Modern elliptic curve)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Key Size / Modulus</label>
              <select
                value={createForm.keySize}
                onChange={(e) => setCreateForm({ ...createForm, keySize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                disabled={createForm.algorithm === 'ECDSA'}
              >
                <option value="2048">2048 bits (Standard Google Play / AOSP)</option>
                <option value="4096">4096 bits (High security)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Validity (Years)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={createForm.validityYears}
                onChange={(e) => setCreateForm({ ...createForm, validityYears: parseInt(e.target.value) || 25 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-[10px] text-slate-500">Android requires certificate validity of at least 25 years for Play Store.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Keystore Password (Optional)</label>
              <input
                type="password"
                placeholder="Optional password..."
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>

          {/* Certificate Subject Information */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Certificate Owner Info (X.500 Distinguished Name)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">First and Last Name (CN)</label>
                <input
                  type="text"
                  value={createForm.commonName}
                  onChange={(e) => setCreateForm({ ...createForm, commonName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Organization (O)</label>
                <input
                  type="text"
                  value={createForm.organization}
                  onChange={(e) => setCreateForm({ ...createForm, organization: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Organizational Unit (OU)</label>
                <input
                  type="text"
                  value={createForm.organizationalUnit}
                  onChange={(e) => setCreateForm({ ...createForm, organizationalUnit: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">City or Locality (L)</label>
                <input
                  type="text"
                  value={createForm.locality}
                  onChange={(e) => setCreateForm({ ...createForm, locality: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">State or Province (ST)</label>
                <input
                  type="text"
                  value={createForm.state}
                  onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Country Code (2 letters, C)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={createForm.country}
                  onChange={(e) => setCreateForm({ ...createForm, country: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Keys are generated strictly in memory and saved to your browser storage.
            </span>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>{isGenerating ? 'Generating Keypair...' : 'Create Keystore'}</span>
            </button>
          </div>

        </form>
      )}

      {/* TAB 3: Import Custom Key / Keystore */}
      {activeTab === 'import' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              Import Key File (.keystore, .jks, .pk8, .pem, .p12, .crt)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports all standard Android signing file formats. Select or drag &amp; drop your key file below.
            </p>
          </div>

          {importError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Key Alias (Optional)</label>
              <input
                type="text"
                value={importAlias}
                onChange={(e) => setImportAlias(e.target.value)}
                placeholder="Leave blank to use file name"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Keystore Password (Optional)</label>
              <input
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="If protected by password"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-2xl p-10 text-center cursor-pointer bg-slate-950/60 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition">
              <Upload className="w-6 h-6" />
            </div>
            <div className="font-semibold text-sm text-white">Click or Drag &amp; Drop Key File</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Supported file types: <code className="text-emerald-400">.keystore</code>, <code className="text-emerald-400">.jks</code>, <code className="text-emerald-400">.pk8</code>, <code className="text-emerald-400">.pem</code>, <code className="text-emerald-400">.p12</code>, <code className="text-emerald-400">.crt</code>
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: Current APK Certificate */}
      {activeTab === 'current' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active Signing Certificate for Export
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Certificates that will be stamped into <code className="text-slate-300">META-INF/CERT.RSA</code> and <code className="text-slate-300">META-INF/MANIFEST.MF</code> upon build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400">Signer Identity (Issuer &amp; Subject)</div>
              <div className="text-xs font-mono text-emerald-400 break-all">
                {currentSignature.issuer || `CN=${activeProfile.certSubject.commonName}, O=${activeProfile.certSubject.organization}, C=${activeProfile.certSubject.country}`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400">Signature Schemes &amp; Validity</div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>v1 (JAR Manifest): <span className="text-emerald-400 font-bold">Enabled</span></div>
                <div>v2 (APK Signature Scheme): <span className="text-emerald-400 font-bold">Enabled</span></div>
                <div>Algorithm: <span className="font-mono text-slate-200">{activeProfile.algorithm} {activeProfile.keySize} bits</span></div>
              </div>
            </div>
          </div>

          {/* Fingerprints */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>SHA-256 Digest Fingerprint</span>
                <button
                  onClick={() => handleCopy(activeProfile.sha256Fingerprint, 'sha256')}
                  className="hover:text-emerald-400 text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedText === 'sha256' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 break-all select-all">
                {activeProfile.sha256Fingerprint}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>SHA-1 Digest Fingerprint</span>
                <button
                  onClick={() => handleCopy(activeProfile.sha1Fingerprint, 'sha1')}
                  className="hover:text-emerald-400 text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedText === 'sha1' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 break-all select-all">
                {activeProfile.sha1Fingerprint}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
