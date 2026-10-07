import React, { useState } from 'react';
import { apkManager } from '../utils/apkManager';
import { keystoreService } from '../utils/cryptoKeystore';
import { ApkSummary } from '../types/apk';
import { 
  Hammer, Download, CheckCircle2, AlertCircle, ShieldCheck, 
  Terminal, ArrowDownToLine, RefreshCw, Key, Package 
} from 'lucide-react';

interface BuildStepProps {
  summary: ApkSummary;
}

export const BuildStep: React.FC<BuildStepProps> = ({
  summary
}) => {
  const [outputName, setOutputName] = useState(() => {
    return summary.fileName ? summary.fileName.replace('.apk', '-signed.apk') : 'app-signed.apk';
  });
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Ready to build package.');
  const [logs, setLogs] = useState<string[]>([]);
  const [builtBlob, setBuiltBlob] = useState<Blob | null>(null);

  const activeKey = keystoreService.getActiveProfile();

  const handleStartBuild = async () => {
    setBuilding(true);
    setProgress(5);
    setLogs([
      `[APK Tool] Initializing in-browser build pipeline...`,
      `[Keystore] Using signer alias: "${activeKey.alias}" (CN=${activeKey.certSubject.commonName})`,
      `[AAPT2] Checking resource tables, string pools, and AndroidManifest.xml...`
    ]);

    try {
      const blob = await apkManager.buildAndDownloadApk((percent, step) => {
        setProgress(percent);
        setCurrentStep(step);
        setLogs(prev => [...prev, `[Build ${percent}%] ${step}`]);
      }, activeKey.id);

      setBuiltBlob(blob);
      setBuilding(false);
      setProgress(100);
      setLogs(prev => [
        ...prev,
        `[Zipalign] 4-byte boundary alignment completed.`,
        `[apksigner] Signed using APK Signature Scheme v1 & v2 with "${activeKey.alias}".`,
        `[SUCCESS] Generated APK package successfully! Size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB.`
      ]);
    } catch (err: any) {
      console.error('Build failed:', err);
      setBuilding(false);
      setLogs(prev => [...prev, `[ERROR] Build pipeline failed: ${err.message}`]);
    }
  };

  const handleDownload = () => {
    if (!builtBlob) return;
    const url = URL.createObjectURL(builtBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputName.endsWith('.apk') ? outputName : `${outputName}.apk`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Step Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <Hammer className="w-3.5 h-3.5" /> Step 5 of 5: Build Package &amp; Download
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Build &amp; Sign Modified APK
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Package your modified assets, compile the updated manifest, stamp the selected cryptographic signature, and generate a ready-to-install Android package.
        </p>
      </div>

      {/* Pre-Build Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow">
            {summary.iconUrl ? (
              <img src={summary.iconUrl} alt="icon" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <Package className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="text-[10px] text-slate-400 font-medium">Target Package</div>
            <div className="font-bold text-white text-sm truncate" title={summary.manifest.appName}>
              {summary.manifest.appName || 'Android Application'}
            </div>
            <div className="text-[11px] font-mono text-slate-400 truncate">
              {summary.manifest.packageName}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" /> Active Signer Key
          </div>
          <div className="font-bold text-emerald-400 text-sm truncate" title={activeKey.name}>
            {activeKey.alias}
          </div>
          <div className="text-[11px] font-mono text-slate-400 truncate">
            {activeKey.algorithm} {activeKey.keySize} bits (CN={activeKey.certSubject.commonName})
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pending Changes
          </div>
          <div className="font-bold text-white text-sm">
            {summary.modifiedCount} modified items
          </div>
          <div className="text-[11px] text-slate-400">
            Total files: {summary.totalFiles}
          </div>
        </div>

      </div>

      {/* Output File Configuration & Action */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Output APK File Name
          </label>
          <input
            type="text"
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            disabled={building}
            placeholder="app-modified-signed.apk"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Build Progress Bar */}
        {(building || builtBlob) && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium truncate max-w-sm">{currentStep}</span>
              <span className="font-mono text-emerald-400 font-bold">{progress}%</span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  progress === 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-500 animate-pulse'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Terminal Logs */}
        {logs.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-400 space-y-1 max-h-48 overflow-y-auto">
            <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1.5 pb-1 border-b border-slate-800/60">
              <Terminal className="w-3 h-3 text-emerald-400" /> Build Output Log
            </div>
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('[SUCCESS]')
                    ? 'text-emerald-400 font-bold'
                    : log.includes('[ERROR]')
                    ? 'text-rose-400 font-bold'
                    : ''
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {!builtBlob ? (
            <button
              onClick={handleStartBuild}
              disabled={building}
              className="w-full sm:flex-1 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50"
            >
              <Hammer className={`w-4 h-4 ${building ? 'animate-spin' : ''}`} />
              <span>{building ? 'Building & Signing Package...' : 'Start Build & Sign Package'}</span>
            </button>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleDownload}
                className="w-full sm:flex-1 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Download APK ({(builtBlob.size / (1024 * 1024)).toFixed(2)} MB)</span>
              </button>

              <button
                onClick={handleStartBuild}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-build</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
