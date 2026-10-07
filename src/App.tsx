import React, { useState, useEffect, useRef } from 'react';
import { apkManager } from './utils/apkManager';
import { ApkSummary, WizardStep, ActiveEditType } from './types/apk';
import { Header, AndroidLogo } from './components/Header';
import { ApkOverview } from './components/ApkOverview';
import { EditTypeSelector } from './components/EditTypeSelector';
import { CommonEdit } from './components/CommonEdit';
import { SimpleEdit } from './components/SimpleEdit';
import { FullEdit } from './components/FullEdit';
import { ManifestEditor } from './components/ManifestEditor';
import { StringEditor } from './components/StringEditor';
import { AdCleaner } from './components/AdCleaner';
import { KeystoreManager } from './components/KeystoreManager';
import { BuildStep } from './components/BuildStep';
import { 
  Package, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  Layers, 
  Sliders, 
  FileCode, 
  Key, 
  Hammer,
  Sparkles
} from 'lucide-react';

export const App: React.FC = () => {
  const [summary, setSummary] = useState<ApkSummary | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedEditType, setSelectedEditType] = useState<ActiveEditType>('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changeEditType = (type: ActiveEditType) => {
    setSelectedEditType(type);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getEditTypeLabel = (type: ActiveEditType): string => {
    switch (type) {
      case 'common': return 'Common';
      case 'simple': return 'Visuals';
      case 'full': return 'File Tree';
      case 'manifest': return 'Manifest';
      case 'strings': return 'Strings';
      case 'adcleaner': return 'Ad Cleaner';
      default: return 'Edit';
    }
  };

  const handleCustomApkUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const resSummary = await apkManager.loadApk(buffer, file.name);
      setSummary(resSummary);
      setCurrentStep(1);
    } catch (e: any) {
      console.error('Failed to load uploaded APK:', e);
      setError('Failed to parse APK: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCustomApkUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.apk') || file.name.endsWith('.zip') || file.name.endsWith('.xapk'))) {
      handleCustomApkUpload(file);
    }
  };

  const refreshSummary = () => {
    if (summary) {
      setSummary(apkManager.getSummary());
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${
        isDragging ? 'ring-4 ring-emerald-500 ring-inset' : ''
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Hidden Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".apk,.xapk,.zip"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Clean Header: Site Name and Open APK */}
      <Header
        onUploadClick={() => fileInputRef.current?.click()}
        loading={loading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="px-2 py-1 bg-rose-900/50 hover:bg-rose-900 rounded text-[11px] transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#3DDC84]/10 border border-[#3DDC84]/30 flex items-center justify-center animate-pulse">
                <AndroidLogo className="w-8 h-8 text-[#3DDC84]" />
              </div>
              <RefreshCw className="w-6 h-6 text-[#3DDC84] animate-spin absolute -bottom-2 -right-2" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-white text-base">Decompressing &amp; Parsing APK...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Parsing Android binary manifest, resource tables, string pools, and DEX bytecode
              </p>
            </div>
          </div>
        ) : summary ? (
          <div>
            {/* Homogeneous Top Stepper (Clickable from any step without scrolling) */}
            <div className="mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 sm:p-3 shadow-xl">
              <div className="grid grid-cols-5 gap-1 sm:gap-2">
                {[
                  { step: 1 as WizardStep, num: '1', title: 'Step 1: Overview', sub: 'APK Details' },
                  { step: 2 as WizardStep, num: '2', title: 'Step 2: Mode', sub: 'Select Type' },
                  { step: 3 as WizardStep, num: '3', title: 'Step 3: Edit', sub: getEditTypeLabel(selectedEditType) },
                  { step: 4 as WizardStep, num: '4', title: 'Step 4: Sign', sub: 'Keystore' },
                  { step: 5 as WizardStep, num: '5', title: 'Step 5: Build', sub: 'Download' },
                ].map((item) => {
                  const isActive = currentStep === item.step;
                  const isPassed = currentStep > item.step;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => goToStep(item.step)}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl text-left transition cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-sm'
                          : isPassed
                          ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : isPassed
                            ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : item.num}
                      </div>
                      <div className="hidden sm:block min-w-0">
                        <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 1: Complete Overview */}
            {currentStep === 1 && (
              <ApkOverview
                summary={summary}
              />
            )}

            {/* STEP 2: Edit Type Selection */}
            {currentStep === 2 && (
              <EditTypeSelector
                summary={summary}
                selectedEditType={selectedEditType}
                onSelectType={(type) => setSelectedEditType(type)}
                onProceed={() => goToStep(3)}
              />
            )}

            {/* STEP 3: Active Edit Mode */}
            {currentStep === 3 && (
              <div>
                {/* Step 3 Quick Bar: Instant Back & Direct Mode Switching at top without scrolling */}
                <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-lg">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" />
                    <span>← Back to Step 2: Choose Mode</span>
                  </button>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {[
                      { id: 'common' as ActiveEditType, label: 'Common Properties' },
                      { id: 'simple' as ActiveEditType, label: 'Visual Replacement' },
                      { id: 'full' as ActiveEditType, label: 'File Tree' },
                      { id: 'manifest' as ActiveEditType, label: 'AndroidManifest' },
                      { id: 'strings' as ActiveEditType, label: 'Strings & Colors' },
                      { id: 'adcleaner' as ActiveEditType, label: 'Ad Cleaner' },
                    ].map((sub) => {
                      const isCurrent = selectedEditType === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => changeEditType(sub.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap border ${
                            isCurrent
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedEditType === 'common' && (
                  <CommonEdit
                    manifest={summary.manifest}
                    onManifestUpdated={() => {
                      setSummary(apkManager.getSummary());
                    }}
                  />
                )}

                {selectedEditType === 'simple' && (
                  <SimpleEdit
                    files={apkManager.getAllFiles()}
                    onFilesChanged={refreshSummary}
                  />
                )}

                {selectedEditType === 'full' && (
                  <FullEdit
                    files={apkManager.getAllFiles()}
                    onFilesChanged={refreshSummary}
                  />
                )}

                {selectedEditType === 'manifest' && (
                  <ManifestEditor
                    manifest={summary.manifest}
                    onManifestUpdated={() => {
                      setSummary(apkManager.getSummary());
                    }}
                  />
                )}

                {selectedEditType === 'strings' && (
                  <StringEditor
                    onStringsChanged={refreshSummary}
                  />
                )}

                {selectedEditType === 'adcleaner' && (
                  <AdCleaner
                    onAppliedChanges={refreshSummary}
                  />
                )}
              </div>
            )}

            {/* STEP 4: Keystore Management & Signing */}
            {currentStep === 4 && (
              <KeystoreManager
                currentSignature={summary.signatures}
                onSignatureUpdated={refreshSummary}
              />
            )}

            {/* STEP 5: Final Build, Align & Download */}
            {currentStep === 5 && (
              <BuildStep
                summary={summary}
              />
            )}
          </div>
        ) : (
          /* Empty / Upload Prompt state */
          <div className="h-[60vh] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center bg-slate-900/30">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Open an APK to start editing</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Drag &amp; drop an Android package (.apk) file here, or click below to select from your device.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Browse &amp; Open APK</span>
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
