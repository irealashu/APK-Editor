import React, { useState, useEffect } from 'react';
import { AdScanReport, DetectedAdSdk } from '../types/apk';
import { scanApkForAds, removeAdComponentsFromApk } from '../utils/adScanner';
import { ShieldCheck, ShieldAlert, Check, AlertTriangle, RefreshCw, Zap, Trash2, Eye, FileText, CheckCircle2 } from 'lucide-react';

interface AdCleanerProps {
  onAppliedChanges: () => void;
}

export const AdCleaner: React.FC<AdCleanerProps> = ({
  onAppliedChanges
}) => {
  const [report, setReport] = useState<AdScanReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState<string[] | null>(null);

  // Options
  const [removeAdId, setRemoveAdId] = useState(true);
  const [removeActivities, setRemoveActivities] = useState(true);
  const [removeServices, setRemoveServices] = useState(true);
  const [cleanLayouts, setCleanLayouts] = useState(true);

  // Auto-scan on mount
  useEffect(() => {
    handleScan();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setCleanSuccess(null);
    try {
      const res = await scanApkForAds();
      setReport(res);
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setScanning(false);
    }
  };

  const handleExecuteClean = async () => {
    setCleaning(true);
    try {
      const result = await removeAdComponentsFromApk({
        removeAdIdPermission: removeAdId,
        removeAdActivities: removeActivities,
        removeAdServices: removeServices,
        cleanLayoutViews: cleanLayouts,
        selectedSdkIds: report?.detectedSdks.map(s => s.id) || []
      });

      setCleanSuccess(result.modifiedItems.length > 0 ? result.modifiedItems : ['No further ad components required modification']);
      onAppliedChanges();

      // Refresh scan
      const updatedReport = await scanApkForAds();
      setReport(updatedReport);
    } catch (err: any) {
      console.error('Clean error:', err);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-3.5 h-3.5" /> Step 3 of 5: Ad &amp; Tracker Scanner
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Monetization Ad &amp; Tracker Cleaner
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Scan APK for advertising SDKs, tracking IDs, interstitial activities, and banner placeholders.
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin text-rose-400' : ''}`} />
            <span>Re-Scan APK</span>
          </button>
        </div>
      </div>

      {/* Clean Success Notification */}
      {cleanSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/40 text-emerald-200 text-xs space-y-2 animate-in fade-in">
          <div className="font-semibold flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Ad Removal Applied Successfully!
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] pl-1">
            {cleanSuccess.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Scan Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Ad Networks Detected</div>
          <div className="text-2xl font-bold text-white mt-1">
            {scanning ? '...' : report?.totalAdNetworksFound ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Known monetization SDKs</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Advertising ID (AD_ID)</div>
          <div className="text-xl font-bold mt-1">
            {scanning ? (
              '...'
            ) : report?.hasAdIdPermission ? (
              <span className="text-rose-400 flex items-center gap-1 text-base">
                <AlertTriangle className="w-4 h-4" /> Declared
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 text-base">
                <Check className="w-4 h-4" /> None Found
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Google Play Tracking ID</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Ad Activities &amp; Services</div>
          <div className="text-2xl font-bold text-white mt-1">
            {scanning ? '...' : (report ? report.adActivities.length + report.adServices.length : 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">In AndroidManifest.xml</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Layout Ad Placeholders</div>
          <div className="text-2xl font-bold text-white mt-1">
            {scanning ? '...' : report?.adLayoutFiles.length ?? 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Banner XML elements</div>
        </div>

      </div>

      {/* Cleaner Controls Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Ad Components Removal Settings
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select which components to disable and strip from the Android package.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRemoveAdId(true);
                setRemoveActivities(true);
                setRemoveServices(true);
                setCleanLayouts(true);
              }}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
            >
              Select All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-850 hover:border-slate-700 cursor-pointer transition">
            <input
              type="checkbox"
              checked={removeAdId}
              onChange={(e) => setRemoveAdId(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700"
            />
            <div>
              <div className="text-xs font-semibold text-white">
                Strip Advertising ID Permission
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Removes <code className="text-rose-300 font-mono">com.google.android.gms.permission.AD_ID</code> so ad networks cannot build targeted advertising profiles on Android 12+.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-850 hover:border-slate-700 cursor-pointer transition">
            <input
              type="checkbox"
              checked={removeActivities}
              onChange={(e) => setRemoveActivities(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700"
            />
            <div>
              <div className="text-xs font-semibold text-white">
                Remove Interstitial Ad Activities
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Strips AdMob, Unity, AppLovin, and Facebook fullscreen ad activities from <code className="text-slate-300 font-mono">AndroidManifest.xml</code> to prevent popup ads from displaying.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-850 hover:border-slate-700 cursor-pointer transition">
            <input
              type="checkbox"
              checked={removeServices}
              onChange={(e) => setRemoveServices(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700"
            />
            <div>
              <div className="text-xs font-semibold text-white">
                Remove Background Ad Services &amp; Receivers
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Strips background services that preload video advertisements and download tracking telemetry.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-850 hover:border-slate-700 cursor-pointer transition">
            <input
              type="checkbox"
              checked={cleanLayouts}
              onChange={(e) => setCleanLayouts(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700"
            />
            <div>
              <div className="text-xs font-semibold text-white">
                Neutralize XML Layout Banner Views
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Stubs out embedded banner tags (<code className="text-slate-300 font-mono">com.google.android.gms.ads.AdView</code>) inside XML layouts to prevent blank banner gaps.
              </div>
            </div>
          </label>

        </div>

        {/* Clean Action Button */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Changes will be committed directly to AndroidManifest.xml and package assets in memory.
          </span>
          <button
            onClick={handleExecuteClean}
            disabled={cleaning || (!removeAdId && !removeActivities && !removeServices && !cleanLayouts)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{cleaning ? 'Applying Ad Removal...' : 'Clean Ad Components from APK'}</span>
          </button>
        </div>

      </div>

      {/* Detected Ad SDKs List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-400" />
          Detected Ad Networks &amp; Trackers Breakdown
        </h3>

        {scanning ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
            Analyzing package classes, manifests, and layout XMLs...
          </div>
        ) : !report || report.detectedSdks.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
            <div className="text-white font-medium">No Known Ad SDKs Detected!</div>
            <p className="text-[11px] text-slate-500">
              The manifest does not contain standard AdMob, Unity, AppLovin, or IronSource ad signatures.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {report.detectedSdks.map((sdk) => (
              <div
                key={sdk.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{sdk.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {sdk.vendor}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold uppercase">
                        {sdk.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{sdk.description}</p>
                  </div>
                </div>

                {/* Detected Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60 text-xs">
                  {sdk.activities.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">
                        Registered Activities ({sdk.activities.length})
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[11px] text-slate-300">
                        {sdk.activities.map((act, i) => (
                          <div key={i} className="p-1 rounded bg-slate-950 truncate" title={act}>
                            {act}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sdk.permissions.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">
                        Associated Permissions ({sdk.permissions.length})
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[11px] text-rose-300">
                        {sdk.permissions.map((p, i) => (
                          <div key={i} className="p-1 rounded bg-slate-950 truncate" title={p}>
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sdk.dexClassMatches.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">
                        Bytecode Classes Sample ({sdk.dexClassMatches.length})
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[11px] text-slate-400">
                        {sdk.dexClassMatches.map((cls, i) => (
                          <div key={i} className="p-1 rounded bg-slate-950 truncate" title={cls}>
                            {cls}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sdk.layoutMatches.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">
                        Layout XML Files ({sdk.layoutMatches.length})
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[11px] text-amber-300">
                        {sdk.layoutMatches.map((lay, i) => (
                          <div key={i} className="p-1 rounded bg-slate-950 truncate" title={lay}>
                            {lay}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
