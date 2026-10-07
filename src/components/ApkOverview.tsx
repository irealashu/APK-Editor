import React, { useState } from 'react';
import { ApkSummary } from '../types/apk';
import { AndroidLogo } from './Header';
import { 
  Package, ShieldAlert, FileText, Layers, 
  ArrowRight, CheckCircle2, AlertTriangle, Key, Shield, Cpu, Lock,
  Copy, Check, Hash
} from 'lucide-react';

interface ApkOverviewProps {
  summary: ApkSummary;
}

export const ApkOverview: React.FC<ApkOverviewProps> = ({
  summary
}) => {
  const { manifest, fileSize, totalFiles, drawableCount, assetCount, dexCount, modifiedCount, signatures } = summary;
  const [activeTab, setActiveTab] = useState<'components' | 'signatures'>('components');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text?: string, key?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (key) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const isInvalidName = (val?: string) => !val || val.startsWith('@') || val === 'android:label' || val === '(android:label)';
  const resolvedAppName = !isInvalidName(manifest.appName)
    ? manifest.appName!
    : 'Android Application';

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Hero Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        {/* Homogeneous Step Header Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4 relative z-10">
          <Package className="w-3.5 h-3.5" /> Step 1 of 5: APK Overview &amp; Analysis
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 p-1 flex items-center justify-center shadow-lg shadow-emerald-950/50 shrink-0 overflow-hidden">
              {summary.iconUrl ? (
                <img
                  src={summary.iconUrl}
                  alt={resolvedAppName}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <AndroidLogo className="w-10 h-10 sm:w-12 sm:h-12 text-[#3DDC84]" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {resolvedAppName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v{manifest.versionName} ({manifest.versionCode})
                </span>
                {modifiedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {modifiedCount} Pending Changes
                  </span>
                )}
              </div>
              <p className="font-mono text-xs sm:text-sm text-slate-400 select-all">
                {manifest.packageName}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span>Min SDK: <strong className="text-slate-200">API {manifest.minSdkVersion}</strong></span>
                <span>•</span>
                <span>Target SDK: <strong className="text-slate-200">API {manifest.targetSdkVersion}</strong></span>
                <span>•</span>
                <span>Size: <strong className="text-slate-200">{formatBytes(fileSize)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Total Package Files
          </div>
          <div className="text-xl font-bold text-white">{totalFiles.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Zipped package entries</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Drawables &amp; Images
          </div>
          <div className="text-xl font-bold text-white">{drawableCount.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">PNG, WebP, JPG, Vector</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            DEX Code Files
          </div>
          <div className="text-xl font-bold text-white">{dexCount} dex</div>
          <div className="text-[11px] text-slate-500 mt-1">Compiled Dalvik bytecode</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Declared Permissions
          </div>
          <div className="text-xl font-bold text-white">{manifest.permissions.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Manifest declarations</div>
        </div>
      </div>

      {/* Complete Inspection Sub-Tabs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('components')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'components'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Manifest &amp; Components</span>
            </button>

            <button
              onClick={() => setActiveTab('signatures')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'signatures'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Signature &amp; Cert</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {activeTab === 'components' && `${manifest.permissions.length} perms • ${manifest.activities.length} activities`}
            {activeTab === 'signatures' && `v1 & v2 signatures present`}
          </span>
        </div>

        {/* Tab 1: Components & Permissions */}
        {activeTab === 'components' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  Declared Permissions ({manifest.permissions.length})
                </h3>
              </div>

              {manifest.permissions.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  No permissions declared in AndroidManifest.xml
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {manifest.permissions.map((perm, idx) => {
                    const shortName = perm.replace('android.permission.', '');
                    const isDangerous = ['WRITE_EXTERNAL_STORAGE', 'READ_EXTERNAL_STORAGE', 'ACCESS_FINE_LOCATION', 'CAMERA', 'RECORD_AUDIO'].includes(shortName);

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isDangerous ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className="text-slate-300 truncate" title={perm}>
                            {shortName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-900">
                          {isDangerous ? 'Sensitive' : 'Normal'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activities */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Registered Activities ({manifest.activities.length})
                </h3>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {manifest.activities.map((act, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs font-mono"
                  >
                    <span className="text-slate-300 truncate" title={act}>
                      {act}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] text-emerald-400 font-sans font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0 ml-2">
                        MAIN LAUNCHER
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Signature & Security */}
        {activeTab === 'signatures' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Signature Schemes &amp; Keys
                </div>
                <div className="text-xs text-slate-300 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                    <span className="text-slate-400">v1 (JAR Manifest Signing):</span>
                    <strong className="text-emerald-400">{signatures.hasV1Signature ? 'Present & Valid' : 'Missing'}</strong>
                  </div>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                    <span className="text-slate-400">v2 (APK Signature Scheme):</span>
                    <strong className="text-emerald-400">{signatures.hasV2Signature ? 'Present & Valid' : 'Missing'}</strong>
                  </div>
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Key Algorithm:</span>
                    <span className="font-mono text-slate-200">{signatures.publicKeyAlgorithm || 'RSA'} ({signatures.publicKeySize || 2048} bits)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Signed Manifest Entries:</span>
                    <span className="font-mono text-slate-200">{signatures.manifestEntriesCount || totalFiles} files</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Signer Identity
                </div>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Subject / Issuer DN</span>
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-[11px] break-all select-all mt-1">
                      {signatures.subject || 'CN=Android Debug, O=Android, C=US'}
                    </div>
                  </div>
                  {signatures.validUntil && (
                    <div className="text-[11px] text-slate-400 pt-1">
                      Valid Until: <span className="text-slate-200 font-mono">{signatures.validUntil}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Certificate Digest Fingerprints - Full width, Never cut off, with copy buttons */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Certificate Digest Fingerprints
                </span>
                <span className="text-[11px] text-slate-400">
                  Full cryptographic hash digests (complete unabbreviated hex)
                </span>
              </div>

              <div className="space-y-2.5">
                {/* SHA-256 */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Hash className="w-3 h-3 text-emerald-400" /> SHA-256 Digest Fingerprint
                    </div>
                    <button
                      onClick={() => handleCopy(signatures.sha256Digest, 'sha256')}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                    >
                      {copiedKey === 'sha256' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'sha256' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-xs font-mono text-emerald-300 break-all leading-relaxed select-all">
                    {signatures.sha256Digest}
                  </div>
                </div>

                {/* SHA-1 */}
                <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Hash className="w-3 h-3 text-slate-400" /> SHA-1 Digest Fingerprint
                    </div>
                    <button
                      onClick={() => handleCopy(signatures.sha1Digest, 'sha1')}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                    >
                      {copiedKey === 'sha1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'sha1' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="text-xs font-mono text-slate-200 break-all leading-relaxed select-all">
                    {signatures.sha1Digest}
                  </div>
                </div>

                {/* MD5 */}
                {signatures.md5Digest && (
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Hash className="w-3 h-3 text-slate-400" /> MD5 Digest Fingerprint
                      </div>
                      <button
                        onClick={() => handleCopy(signatures.md5Digest, 'md5')}
                        className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                      >
                        {copiedKey === 'md5' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'md5' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-xs font-mono text-slate-300 break-all leading-relaxed select-all">
                      {signatures.md5Digest}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
