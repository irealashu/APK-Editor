import React, { useState } from 'react';
import { ApkManifestInfo } from '../types/apk';
import { apkManager } from '../utils/apkManager';
import { FileCode, Save, Plus, Trash2, CheckCircle2, ShieldCheck, ShieldAlert, Code2 } from 'lucide-react';

interface ManifestEditorProps {
  manifest: ApkManifestInfo;
  onManifestUpdated: (newManifest: ApkManifestInfo) => void;
}

const COMMON_PERMISSIONS = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.WAKE_LOCK',
  'android.permission.VIBRATE',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.REQUEST_INSTALL_PACKAGES',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.BLUETOOTH',
  'android.permission.BLUETOOTH_CONNECT',
];

export const ManifestEditor: React.FC<ManifestEditorProps> = ({
  manifest,
  onManifestUpdated
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [rawXml, setRawXml] = useState(manifest.rawXml || '');
  const [newPermission, setNewPermission] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTogglePermission = (perm: string) => {
    let updatedPerms: string[];
    if (manifest.permissions.includes(perm)) {
      updatedPerms = manifest.permissions.filter(p => p !== perm);
    } else {
      updatedPerms = [...manifest.permissions, perm];
    }
    const updated = { ...manifest, permissions: updatedPerms };
    apkManager.updateManifest(updated);
    onManifestUpdated(updated);
    setRawXml(updated.rawXml || '');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddCustomPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermission.trim()) return;
    const cleanPerm = newPermission.trim().startsWith('android.permission.') || newPermission.includes('.')
      ? newPermission.trim()
      : `android.permission.${newPermission.trim()}`;

    if (!manifest.permissions.includes(cleanPerm)) {
      const updated = { ...manifest, permissions: [...manifest.permissions, cleanPerm] };
      apkManager.updateManifest(updated);
      onManifestUpdated(updated);
      setRawXml(updated.rawXml || '');
      setNewPermission('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleSaveXmlCode = () => {
    apkManager.updateFile('AndroidManifest.xml', rawXml);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <FileCode className="w-3.5 h-3.5" /> Step 3 of 5: Manifest XML Editor
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AndroidManifest.xml Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Configure system permissions, hardware features, activity declarations, and application flags.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'visual' ? 'bg-slate-800 text-cyan-300 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Visual Manager
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'code' ? 'bg-slate-800 text-cyan-300 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Raw XML
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Manifest saved successfully!</span>
          </div>
        )}
      </div>

      {viewMode === 'visual' ? (
        <div className="space-y-6">
          
          {/* Custom Permission Adder */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <form onSubmit={handleAddCustomPermission} className="flex gap-2">
              <input
                type="text"
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value)}
                placeholder="Add custom permission (e.g. android.permission.CAMERA or VIBRATE)..."
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Permission</span>
              </button>
            </form>
          </div>

          {/* Quick Checkbox Permission Matrix */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Standard Android Permissions
              </h3>
              <span className="text-xs text-slate-400">
                {manifest.permissions.length} active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMMON_PERMISSIONS.map((perm) => {
                const isActive = manifest.permissions.includes(perm);
                const shortName = perm.replace('android.permission.', '');

                return (
                  <div
                    key={perm}
                    onClick={() => handleTogglePermission(perm)}
                    className={`p-3 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
                      isActive
                        ? 'bg-cyan-950/20 border-cyan-500/50 text-cyan-200 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => {}} // Handled by container
                      className="mt-0.5 w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 pointer-events-none"
                    />
                    <div className="truncate">
                      <div className="font-mono text-xs font-medium truncate" title={perm}>
                        {shortName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {perm}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active declared permissions list */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              All Declared Manifest Permissions ({manifest.permissions.length})
            </h3>

            {manifest.permissions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No permissions currently declared.</p>
            ) : (
              <div className="space-y-2">
                {manifest.permissions.map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
                  >
                    <span className="text-cyan-300 truncate" title={perm}>
                      &lt;uses-permission android:name=&quot;{perm}&quot; /&gt;
                    </span>
                    <button
                      onClick={() => handleTogglePermission(perm)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                      title="Remove permission"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Raw XML Code Editor */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">AndroidManifest.xml</span>
            <button
              onClick={handleSaveXmlCode}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save XML</span>
            </button>
          </div>
          <textarea
            value={rawXml}
            onChange={(e) => setRawXml(e.target.value)}
            spellCheck={false}
            className="w-full h-[550px] p-4 bg-slate-950 font-mono text-xs text-cyan-300 leading-relaxed resize-none focus:outline-none focus:ring-0 border-0 selection:bg-cyan-500/30"
          />
        </div>
      )}

    </div>
  );
};
