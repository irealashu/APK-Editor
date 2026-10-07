import React, { useState, useEffect } from 'react';
import { ApkFileInfo } from '../types/apk';
import { apkManager } from '../utils/apkManager';
import { FolderTreeViewer } from './FolderTreeViewer';
import { FileCode, Folder, FolderOpen, FileText, Image as ImageIcon, Save, Trash2, Download, Search, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface FullEditProps {
  files: ApkFileInfo[];
  onFilesChanged: () => void;
}

export const FullEdit: React.FC<FullEditProps> = ({
  files,
  onFilesChanged
}) => {
  const [selectedPath, setSelectedPath] = useState<string>('AndroidManifest.xml');
  const [fileContent, setFileContent] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isBinary, setIsBinary] = useState<boolean>(false);
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [viewHex, setViewHex] = useState<boolean>(false);
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [showNewFileModal, setShowNewFileModal] = useState<boolean>(false);
  const [newFilePath, setNewFilePath] = useState<string>('');
  const [newFileDefaultText, setNewFileDefaultText] = useState<string>('');

  // Group files into folder tree
  const filteredFiles = files.filter(f => {
    if (!searchTerm.trim()) return true;
    return f.path.toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  // Load selected file
  useEffect(() => {
    if (!selectedPath) return;

    let isCancelled = false;
    setLoadingFile(true);
    setSaveStatus(null);
    setImageUrl(null);

    apkManager.getFileContent(selectedPath)
      .then(res => {
        if (isCancelled) return;
        if (res.blobUrl) {
          setImageUrl(res.blobUrl);
          setIsBinary(true);
        } else if (res.text !== undefined) {
          setFileContent(res.text);
          setIsBinary(false);
        } else {
          setIsBinary(true);
        }
      })
      .catch(err => {
        console.error('Failed to load file content:', err);
        setFileContent('// Error loading file: ' + err.message);
        setIsBinary(false);
      })
      .finally(() => {
        if (!isCancelled) setLoadingFile(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedPath]);

  const handleSaveContent = () => {
    if (!selectedPath || isBinary) return;
    apkManager.updateFile(selectedPath, fileContent);
    onFilesChanged();
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleDeleteFile = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    apkManager.deleteFile(path);
    onFilesChanged();
    if (selectedPath === path) {
      setSelectedPath('AndroidManifest.xml');
    }
  };

  const handleDownloadCurrentFile = () => {
    if (!selectedPath) return;
    const a = document.createElement('a');
    if (imageUrl) {
      a.href = imageUrl;
    } else {
      const blob = new Blob([fileContent], { type: 'text/plain' });
      a.href = URL.createObjectURL(blob);
    }
    a.download = selectedPath.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCreateNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    apkManager.addNewFile(newFilePath.trim(), newFileDefaultText);
    onFilesChanged();
    setSelectedPath(newFilePath.trim());
    setShowNewFileModal(false);
    setNewFilePath('');
    setNewFileDefaultText('');
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const updated = fileContent.replace(regex, replaceText);
    setFileContent(updated);
  };

  return (
    <div className="space-y-4">
      
      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              Add New File into APK
            </h3>
            <form onSubmit={handleCreateNewFile} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">File Path (e.g. assets/config.json or res/xml/network_security_config.xml)</label>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  placeholder="assets/settings.json"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Initial Content</label>
                <textarea
                  value={newFileDefaultText}
                  onChange={(e) => setNewFileDefaultText(e.target.value)}
                  placeholder="File contents here..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <FileCode className="w-3.5 h-3.5" /> Step 3 of 5: Full Edit (Files &amp; Code)
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Decompiled File &amp; Archive Editor
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Browse the entire package directory tree, inspect and edit decompiled files, perform find &amp; replace, and save changes.
            </p>
          </div>
        </div>
      </div>

      {/* Main Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[650px]">
        
        {/* Left Tree Explorer: Original Folder View */}
        <div className="lg:col-span-5 h-full overflow-hidden flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-300">
              Original Folder View ({files.length} files)
            </span>
            <button
              onClick={() => setShowNewFileModal(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shadow"
              title="Create a new file in APK"
            >
              + New File
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <FolderTreeViewer
              files={files}
              selectedPath={selectedPath}
              onSelectFile={(file) => setSelectedPath(file.path)}
              onDeleteFile={handleDeleteFile}
              maxHeight="h-[580px]"
            />
          </div>
        </div>

        {/* Right Editor / Viewer Pane */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden shadow">
          
          {/* File Toolbar */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/40">
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="text-xs font-mono text-slate-300 font-semibold truncate" title={selectedPath}>
                {selectedPath}
              </span>
              {isBinary && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Binary
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {saveStatus && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" /> {saveStatus}
                </span>
              )}

              {!isBinary && (
                <>
                  <button
                    onClick={() => setShowFindReplace(!showFindReplace)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      showFindReplace ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title="Find and replace in file"
                  >
                    Find / Replace
                  </button>

                  <button
                    onClick={handleSaveContent}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save into APK</span>
                  </button>
                </>
              )}

              <button
                onClick={handleDownloadCurrentFile}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs transition cursor-pointer"
                title="Download this file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Find & Replace Bar */}
          {!isBinary && showFindReplace && (
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Find text..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-white w-40 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-white w-40 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleReplaceAll}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium cursor-pointer"
              >
                Replace All
              </button>
            </div>
          )}

          {/* Editor Body */}
          <div className="flex-1 overflow-hidden relative bg-slate-950">
            {loadingFile ? (
              <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                <span className="text-xs">Reading archive file...</span>
              </div>
            ) : isBinary ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                {imageUrl ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl inline-block max-w-md max-h-96 overflow-hidden">
                      <img src={imageUrl} alt={selectedPath} className="max-h-80 max-w-full object-contain mx-auto" />
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{selectedPath}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AlertCircle className="w-12 h-12 text-slate-600 mx-auto" />
                    <div className="text-sm font-semibold text-slate-300">Compiled Binary Asset</div>
                    <p className="text-xs text-slate-500 max-w-sm">
                      This is a compiled binary file (e.g. DEX bytecode, native ELF .so library, or raw resource table). Use the Simple Edit tab to replace it.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                spellCheck={false}
                className="w-full h-full p-4 bg-slate-950 font-mono text-xs text-emerald-300 leading-relaxed resize-none focus:outline-none focus:ring-0 border-0 selection:bg-purple-500/30"
              />
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
