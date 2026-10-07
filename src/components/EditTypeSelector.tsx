import React from 'react';
import { ActiveEditType, ApkSummary } from '../types/apk';
import { 
  Sliders, Layers, FileCode, Type, ShieldAlert, 
  ArrowRight, CheckCircle2 
} from 'lucide-react';

interface EditTypeSelectorProps {
  summary: ApkSummary;
  selectedEditType: ActiveEditType;
  onSelectType: (type: ActiveEditType) => void;
  onProceed: () => void;
}

export const EditTypeSelector: React.FC<EditTypeSelectorProps> = ({
  summary,
  selectedEditType,
  onSelectType,
  onProceed
}) => {
  const { drawableCount, assetCount, totalFiles, manifest } = summary;

  const modes = [
    {
      id: 'common' as ActiveEditType,
      title: 'Common Edit',
      badge: 'Fast & Recommended',
      icon: <Sliders className="w-6 h-6 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      description: 'Change Application Title, Package Name (App ID cloning), Version Name & Code, Min & Target SDK levels, Screen Orientation, and Application Flags.',
      stats: `Package: ${manifest.packageName}`
    },
    {
      id: 'simple' as ActiveEditType,
      title: 'Simple Edit (Resource Swap)',
      badge: `${drawableCount + assetCount} Assets`,
      icon: <Layers className="w-6 h-6 text-blue-400" />,
      iconBg: 'bg-blue-500/10 border-blue-500/30',
      description: 'One-click asset replacer mode. Replace launcher icons (ic_launcher.png), drawables, background artwork, sound effects, audio files, and fonts.',
      stats: 'Visual asset replacement'
    },
    {
      id: 'full' as ActiveEditType,
      title: 'Full Edit (Files & Code)',
      badge: `${totalFiles} Files`,
      icon: <FileCode className="w-6 h-6 text-purple-400" />,
      iconBg: 'bg-purple-500/10 border-purple-500/30',
      description: 'Browse the entire internal APK directory tree, inspect decompiled files, create new files, find & replace text, and view binary hex contents.',
      stats: 'Complete ZIP archive access'
    },
    {
      id: 'manifest' as ActiveEditType,
      title: 'Manifest XML Editor',
      badge: `${manifest.permissions.length} Permissions`,
      icon: <FileCode className="w-6 h-6 text-cyan-400" />,
      iconBg: 'bg-cyan-500/10 border-cyan-500/30',
      description: 'Manage declared Android permissions (Camera, Storage, Internet, Location), configure hardware features, and directly edit AndroidManifest.xml source code.',
      stats: `${manifest.activities.length} activities declared`
    },
    {
      id: 'strings' as ActiveEditType,
      title: 'Values & Localization Studio',
      badge: 'Strings & Colors',
      icon: <Type className="w-6 h-6 text-amber-400" />,
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      description: 'Search and translate localized text strings (strings.xml), edit color palettes with visual hex pickers (colors.xml), and export localized dictionaries.',
      stats: 'Localized strings & colors'
    },
    {
      id: 'adcleaner' as ActiveEditType,
      title: 'Ad & Tracker Scanner',
      badge: 'Audit & Cleaner',
      icon: <ShieldAlert className="w-6 h-6 text-rose-400" />,
      iconBg: 'bg-rose-500/10 border-rose-500/30',
      description: 'Audit APK for monetization ad SDKs (AdMob, Unity, AppLovin, IronSource), strip Google Advertising ID (AD_ID), disable interstitial activities, and clean layout banners.',
      stats: 'Ad & tracker elimination'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Step Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <Sliders className="w-3.5 h-3.5" /> Step 2 of 5: Choose Modification Mode
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Select What You Want to Edit
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Choose the editor mode that matches your goal. You can perform modifications in one mode and proceed to signing, or return here to edit additional sections.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Edit Modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const isSelected = selectedEditType === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => {
                onSelectType(mode.id);
                onProceed();
              }}
              className={`group p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between relative shadow-lg ${
                isSelected
                  ? 'bg-slate-900/90 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${mode.iconBg} group-hover:scale-105 transition`}>
                    {mode.icon}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {mode.badge}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition flex items-center justify-between">
                  {mode.title}
                  <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                </h3>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {mode.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{mode.stats}</span>
                <span className="text-emerald-400 font-semibold group-hover:underline">Select Mode →</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
