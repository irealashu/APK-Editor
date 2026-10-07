import React, { useState } from 'react';
import { ApkManifestInfo } from '../types/apk';
import { apkManager } from '../utils/apkManager';
import { Sliders, Save, CheckCircle2, Cpu } from 'lucide-react';

interface CommonEditProps {
  manifest: ApkManifestInfo;
  onManifestUpdated: (newManifest: ApkManifestInfo) => void;
}

const ANDROID_SDK_LEVELS = [
  { level: 14, name: 'Android 4.0 (Ice Cream Sandwich)' },
  { level: 16, name: 'Android 4.1 (Jelly Bean)' },
  { level: 19, name: 'Android 4.4 (KitKat)' },
  { level: 21, name: 'Android 5.0 (Lollipop)' },
  { level: 23, name: 'Android 6.0 (Marshmallow)' },
  { level: 24, name: 'Android 7.0 (Nougat)' },
  { level: 26, name: 'Android 8.0 (Oreo)' },
  { level: 28, name: 'Android 9.0 (Pie)' },
  { level: 29, name: 'Android 10' },
  { level: 30, name: 'Android 11' },
  { level: 31, name: 'Android 12' },
  { level: 33, name: 'Android 13 (Tiramisu)' },
  { level: 34, name: 'Android 14 (Upside Down Cake)' },
  { level: 35, name: 'Android 15 (Vanilla Ice Cream)' },
];

export const CommonEdit: React.FC<CommonEditProps> = ({
  manifest,
  onManifestUpdated
}) => {
  const resolvedName = manifest.appName && !manifest.appName.startsWith('@')
    ? manifest.appName
    : 'Android Application';

  const [formData, setFormData] = useState<ApkManifestInfo>({
    ...manifest,
    appName: resolvedName
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field: keyof ApkManifestInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSavedSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    apkManager.updateManifest(formData);
    onManifestUpdated(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClonePackage = () => {
    const clonedPkg = formData.packageName + '.mod';
    handleChange('packageName', clonedPkg);
    handleChange('appName', (formData.appName || 'App') + ' (Mod)');
  };

  const handleBumpVersion = () => {
    const parts = formData.versionName.split('.');
    if (parts.length >= 2) {
      const last = parseInt(parts[parts.length - 1], 10) || 0;
      parts[parts.length - 1] = (last + 1).toString();
      handleChange('versionName', parts.join('.'));
    } else {
      handleChange('versionName', formData.versionName + '.1');
    }
    handleChange('versionCode', formData.versionCode + 1);
  };

  const handleTargetLatestSdk = () => {
    handleChange('targetSdkVersion', 35);
  };

  const handleStripAdIdPermission = () => {
    const cleanPerms = formData.permissions.filter(p => p !== 'com.google.android.gms.permission.AD_ID' && p !== 'android.permission.ACCESS_AD_ID');
    handleChange('permissions', cleanPerms);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Step Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <Sliders className="w-3.5 h-3.5" /> Step 3 of 5: Common Edit
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Common Properties &amp; App Identity
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Modify Application Launcher Title, Package Name (App ID), Version Code &amp; Name, SDKs, and orientation flags.
            </p>
          </div>
          <button
            type="submit"
            form="common-edit-form"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Manifest updated successfully!</span>
          </div>
        )}
      </div>

      {/* Quick Presets Toolbar */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium px-2 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Quick Tweaks:
        </span>
        <button
          type="button"
          onClick={handleClonePackage}
          className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          Duplicate/Clone App ID
        </button>
        <button
          type="button"
          onClick={handleBumpVersion}
          className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          Increment Version (+1)
        </button>
        <button
          type="button"
          onClick={handleTargetLatestSdk}
          className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          Target Android 15 (API 35)
        </button>
        <button
          type="button"
          onClick={handleStripAdIdPermission}
          className="px-2.5 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 transition cursor-pointer"
        >
          Strip Ad ID (AD_ID)
        </button>
      </div>

      {/* Form */}
      <form id="common-edit-form" onSubmit={handleSave} className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-5 shadow-lg">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* App Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Application Name (App Title)
            </label>
            <input
              type="text"
              value={formData.appName || ''}
              onChange={(e) => handleChange('appName', e.target.value)}
              placeholder="e.g. My Custom App"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            />
            <p className="text-[11px] text-slate-500">The visible launcher title of the application on the Android home screen.</p>
          </div>

          {/* Package Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Package Name (Application ID)</span>
              <span className="text-[10px] text-emerald-400 font-mono">Unique ID</span>
            </label>
            <input
              type="text"
              value={formData.packageName}
              onChange={(e) => handleChange('packageName', e.target.value)}
              placeholder="e.g. com.developer.myapp"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition"
              required
            />
            <p className="text-[11px] text-slate-500">Changing this allows installing the app alongside the original without conflict.</p>
          </div>

          {/* Version Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Version Name (Display Version)
            </label>
            <input
              type="text"
              value={formData.versionName}
              onChange={(e) => handleChange('versionName', e.target.value)}
              placeholder="e.g. 1.10.0"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              required
            />
            <p className="text-[11px] text-slate-500">User-facing version string displayed in App Info.</p>
          </div>

          {/* Version Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Version Code (Build Number)
            </label>
            <input
              type="number"
              value={formData.versionCode}
              onChange={(e) => handleChange('versionCode', parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              min={1}
              required
            />
            <p className="text-[11px] text-slate-500">Monotonically increasing integer used by Android package manager for upgrade detection.</p>
          </div>

          {/* Min SDK */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Minimum Android Version (Min SDK)
            </label>
            <select
              value={formData.minSdkVersion}
              onChange={(e) => handleChange('minSdkVersion', parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            >
              {ANDROID_SDK_LEVELS.map(sdk => (
                <option key={sdk.level} value={sdk.level}>
                  API {sdk.level} — {sdk.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">Lowest Android OS level required to install and run the APK.</p>
          </div>

          {/* Target SDK */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Target Android Version (Target SDK)
            </label>
            <select
              value={formData.targetSdkVersion}
              onChange={(e) => handleChange('targetSdkVersion', parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            >
              {ANDROID_SDK_LEVELS.map(sdk => (
                <option key={sdk.level} value={sdk.level}>
                  API {sdk.level} — {sdk.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">API level the app was tested against for behavior compatibility.</p>
          </div>

          {/* Install Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Install Location Preference
            </label>
            <select
              value={formData.installLocation || 'auto'}
              onChange={(e) => handleChange('installLocation', e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="auto">auto — Let Android decide automatically</option>
              <option value="internalOnly">internalOnly — Internal flash storage only</option>
              <option value="preferExternal">preferExternal — Prefer SD Card / External storage</option>
            </select>
            <p className="text-[11px] text-slate-500">Storage target preference for device installation.</p>
          </div>

          {/* Screen Orientation */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Screen Orientation Lock
            </label>
            <select
              value={formData.screenOrientation || 'unspecified'}
              onChange={(e) => handleChange('screenOrientation', e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="unspecified">unspecified — Default sensor / user choice</option>
              <option value="portrait">portrait — Locked to vertical orientation</option>
              <option value="landscape">landscape — Locked to horizontal orientation</option>
              <option value="sensor">sensor — Dynamic 4-way orientation</option>
            </select>
            <p className="text-[11px] text-slate-500">Device rotation locking preference.</p>
          </div>

          {/* Application Flags Matrix */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2.5 p-3 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={!!formData.debuggable}
                onChange={(e) => handleChange('debuggable', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Enable Debugging</div>
                <div className="text-[10px] text-slate-500">android:debuggable</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={formData.allowBackup !== false}
                onChange={(e) => handleChange('allowBackup', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Allow ADB & Cloud Backup</div>
                <div className="text-[10px] text-slate-500">android:allowBackup</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={formData.hardwareAccelerated !== false}
                onChange={(e) => handleChange('hardwareAccelerated', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Hardware Acceleration</div>
                <div className="text-[10px] text-slate-500">android:hardwareAccelerated</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={formData.supportsRtl !== false}
                onChange={(e) => handleChange('supportsRtl', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Supports RTL Layout</div>
                <div className="text-[10px] text-slate-500">android:supportsRtl</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 bg-slate-950/70 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={formData.resizeableActivity !== false}
                onChange={(e) => handleChange('resizeableActivity', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Multi-Window Split Screen</div>
                <div className="text-[10px] text-slate-500">android:resizeableActivity</div>
              </div>
            </label>
          </div>

        </div>

      </form>

    </div>
  );
};
