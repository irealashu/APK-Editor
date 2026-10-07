import React, { useState } from 'react';
import { ApkStringResource, ApkColorResource } from '../types/apk';
import { apkManager } from '../utils/apkManager';
import { Type, Palette, Search, Check, RotateCcw, Plus, Download, FileCheck } from 'lucide-react';

interface StringEditorProps {
  onStringsChanged: () => void;
}

export const StringEditor: React.FC<StringEditorProps> = ({
  onStringsChanged
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'strings' | 'colors'>('strings');
  const [strings, setStrings] = useState<ApkStringResource[]>(apkManager.getStrings());
  const [colors, setColors] = useState<ApkColorResource[]>(apkManager.getColors());
  const [search, setSearch] = useState('');
  const [onlyModified, setOnlyModified] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New string / color modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleStringChange = (id: string, newVal: string) => {
    apkManager.updateString(id, newVal);
    setStrings([...apkManager.getStrings()]);
    onStringsChanged();
    setSavedSuccess(false);
  };

  const handleColorChange = (id: string, hexVal: string) => {
    apkManager.updateColor(id, hexVal);
    setColors([...apkManager.getColors()]);
    onStringsChanged();
    setSavedSuccess(false);
  };

  const handleRevert = (id: string) => {
    const s = strings.find(item => item.id === id);
    if (s) {
      handleStringChange(id, s.originalValue);
    }
  };

  const handleRevertColor = (id: string) => {
    const c = colors.find(item => item.id === id);
    if (c) {
      handleColorChange(id, c.originalValue);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    if (activeSubTab === 'strings') {
      apkManager.updateString(newKey.trim(), newValue.trim());
      setStrings([...apkManager.getStrings()]);
    } else {
      apkManager.addColor(newKey.trim(), newValue.trim() || '#10B981');
      setColors([...apkManager.getColors()]);
    }

    onStringsChanged();
    setShowAddModal(false);
    setNewKey('');
    setNewValue('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportJson = () => {
    let data: any;
    let filename = '';
    if (activeSubTab === 'strings') {
      const obj: Record<string, string> = {};
      strings.forEach(s => { obj[s.name] = s.value; });
      data = JSON.stringify(obj, null, 2);
      filename = 'strings.json';
    } else {
      const obj: Record<string, string> = {};
      colors.forEach(c => { obj[c.name] = c.hexValue; });
      data = JSON.stringify(obj, null, 2);
      filename = 'colors.json';
    }

    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredStrings = strings.filter(s => {
    if (onlyModified && !s.isModified) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || s.value.toLowerCase().includes(q);
  });

  const filteredColors = colors.filter(c => {
    if (onlyModified && !c.isModified) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return c.name.toLowerCase().includes(q) || c.hexValue.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Add New {activeSubTab === 'strings' ? 'String' : 'Color'} Resource
            </h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Resource Key Name (e.g. welcome_msg or primary_theme)</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={activeSubTab === 'strings' ? 'btn_confirm' : 'colorBrand'}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Value</label>
                {activeSubTab === 'strings' ? (
                  <textarea
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Enter string translation value..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newValue || '#10B981'}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="w-10 h-10 rounded border border-slate-700 bg-slate-950 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="#10B981"
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white"
                >
                  Add Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <Type className="w-3.5 h-3.5" /> Step 3 of 5: Values &amp; Localization Studio
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Strings &amp; Resource Color Editor
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Search and modify string resources (<code className="text-slate-300">strings.xml</code>) and color values (<code className="text-slate-300">colors.xml</code>).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add Resource</span>
            </button>
            <button
              onClick={handleExportJson}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              title="Export as JSON"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Changes applied successfully!</span>
          </div>
        )}
      </div>

      {/* Sub-Tab Selector */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/50 border border-slate-800/80 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('strings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'strings'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Strings ({strings.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('colors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'colors'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Colors ({colors.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search key or value..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <label className="hidden sm:flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyModified}
              onChange={(e) => setOnlyModified(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
            />
            <span>Modified only</span>
          </label>
        </div>
      </div>

      {/* Content Table */}
      {activeSubTab === 'strings' ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-1/4">Key Name</th>
                  <th className="px-4 py-3 w-1/2">String Value</th>
                  <th className="px-4 py-3 w-1/4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStrings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                      No strings found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStrings.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition ${item.isModified ? 'bg-cyan-950/20' : 'hover:bg-slate-850/50'}`}
                    >
                      <td className="px-4 py-3 align-top font-mono text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-semibold">{item.name}</span>
                          {item.isModified && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-sans">
                              Edited
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => handleStringChange(item.id, e.target.value)}
                          className={`w-full px-3 py-1.5 rounded bg-slate-950 border text-xs text-slate-100 transition focus:outline-none focus:border-cyan-500 ${
                            item.isModified ? 'border-cyan-500/60 font-medium' : 'border-slate-800'
                          }`}
                        />
                        {item.isModified && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            Original: <span className="text-slate-400 font-mono">{item.originalValue}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 align-top text-right">
                        {item.isModified ? (
                          <button
                            onClick={() => handleRevert(item.id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revert</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">Unchanged</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Colors Table */
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-1/4">Color Key</th>
                  <th className="px-4 py-3 w-1/2">Hex Value &amp; Preview</th>
                  <th className="px-4 py-3 w-1/4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredColors.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                      No colors found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredColors.map((color) => (
                    <tr
                      key={color.id}
                      className={`transition ${color.isModified ? 'bg-cyan-950/20' : 'hover:bg-slate-850/50'}`}
                    >
                      <td className="px-4 py-3 align-middle font-mono text-slate-300">
                        <span className="text-cyan-400 font-semibold">{color.name}</span>
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={color.hexValue.startsWith('#') && color.hexValue.length === 7 ? color.hexValue : '#10B981'}
                            onChange={(e) => handleColorChange(color.id, e.target.value)}
                            className="w-8 h-8 rounded border border-slate-700 bg-slate-950 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={color.hexValue}
                            onChange={(e) => handleColorChange(color.id, e.target.value)}
                            className="w-36 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                          />
                          <div
                            className="w-6 h-6 rounded-full border border-slate-700 shadow-inner"
                            style={{ backgroundColor: color.hexValue }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle text-right">
                        {color.isModified ? (
                          <button
                            onClick={() => handleRevertColor(color.id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revert</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">Unchanged</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
