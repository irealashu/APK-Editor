import React, { useState, useEffect, useRef } from 'react';
import { ApkFileInfo } from '../types/apk';
import { apkManager } from '../utils/apkManager';
import { FolderTreeViewer } from './FolderTreeViewer';
import { 
  Layers, Image as ImageIcon, Music, Type, Folder, Upload, Download, 
  RotateCcw, Search, Check, FileCheck, Binary, FileCode, FolderOpen 
} from 'lucide-react';

interface SimpleEditProps {
  files: ApkFileInfo[];
  onFilesChanged: () => void;
}

type AssetCategory = 'images' | 'audios' | 'fonts' | 'dex' | 'xml' | 'assets' | 'all';

interface AssetPreview {
  file: ApkFileInfo;
  url?: string;
  isModified?: boolean;
}

export const SimpleEdit: React.FC<SimpleEditProps> = ({
  files,
  onFilesChanged
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('images');
  const [searchQuery, setSearchQuery] = useState('');
  const [previews, setPreviews] = useState<Map<string, AssetPreview>>(new Map());
  const [replacingFile, setReplacingFile] = useState<string | null>(null);
  const [selectedFileInFolder, setSelectedFileInFolder] = useState<ApkFileInfo | null>(null);
  const [folderImagePreview, setFolderImagePreview] = useState<string | null>(null);
  const [visibleFileCount, setVisibleFileCount] = useState<number>(100);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setVisibleFileCount(100);
  }, [selectedCategory, searchQuery]);

  // Filter files strictly by category (only that type of files)
  const filteredFiles = files.filter(f => {
    if (f.isDirectory) return false;
    const path = f.path.toLowerCase();
    
    // Strict category match - only that type of files
    let matchCat = false;
    if (selectedCategory === 'all') {
      matchCat = true;
    } else if (selectedCategory === 'images') {
      matchCat = /\.(png|webp|jpe?g|bmp|gif|ico|svg)$/i.test(path);
    } else if (selectedCategory === 'audios') {
      matchCat = /\.(mp3|ogg|wav|m4a|aac|flac|mid|midi|wma)$/i.test(path);
    } else if (selectedCategory === 'fonts') {
      matchCat = /\.(ttf|otf|woff2?)$/i.test(path);
    } else if (selectedCategory === 'dex') {
      matchCat = path.endsWith('.dex');
    } else if (selectedCategory === 'xml') {
      matchCat = path.endsWith('.xml');
    } else if (selectedCategory === 'assets') {
      matchCat = path.startsWith('assets/');
    }

    if (!matchCat) return false;

    // Search query match
    if (searchQuery.trim()) {
      return path.includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  // Track folder selected file preview
  useEffect(() => {
    if (!selectedFileInFolder) {
      setFolderImagePreview(null);
      return;
    }
    if (/\.(png|webp|jpe?g|bmp|gif|ico)$/i.test(selectedFileInFolder.path)) {
      apkManager.getFileContent(selectedFileInFolder.path).then(res => {
        if (res.blobUrl) setFolderImagePreview(res.blobUrl);
      }).catch(() => setFolderImagePreview(null));
    } else {
      setFolderImagePreview(null);
    }
  }, [selectedFileInFolder]);

  // Load preview URLs for displayed image files (limit first 60 for performance)
  useEffect(() => {
    let isCancelled = false;
    const loadImages = async () => {
      const newPreviews = new Map<string, AssetPreview>();
      const toLoad = filteredFiles.slice(0, 60);

      for (const file of toLoad) {
        if (/\.(png|webp|jpe?g|bmp|gif)$/i.test(file.path)) {
          try {
            const content = await apkManager.getFileContent(file.path);
            if (!isCancelled && content.blobUrl) {
              newPreviews.set(file.path, { file, url: content.blobUrl, isModified: file.isModified });
            }
          } catch {}
        } else {
          newPreviews.set(file.path, { file, isModified: file.isModified });
        }
      }

      if (!isCancelled) {
        setPreviews(newPreviews);
      }
    };

    loadImages();
    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, searchQuery, files]);

  const handleStartReplace = (filePath: string) => {
    setReplacingFile(filePath);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingFile) return;

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    apkManager.updateFile(replacingFile, uint8);
    onFilesChanged();
    setReplacingFile(null);
  };

  const handleDownloadFile = async (filePath: string) => {
    try {
      const content = await apkManager.getFileContent(filePath);
      const url = content.blobUrl || URL.createObjectURL(new Blob([content.text || '']));
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'resource';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Failed to download file:', e);
    }
  };

  const handleExportAllDrawables = async () => {
    try {
      const zipBlob = await apkManager.exportAllDrawablesZip();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = 'apk-drawables.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Failed to export drawables:', e);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden file input for replacement */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFilePicked}
      />

      {/* Step Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <Layers className="w-3.5 h-3.5" /> Step 3 of 5: Simple Edit (Resource Swap)
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Visual Asset Replacement
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Easily replace launcher icons, drawables, illustrations, audio clips, and fonts without modifying code.
            </p>
          </div>
          <button
            onClick={handleExportAllDrawables}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            title="Download all drawables and images as a ZIP"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Drawables (.zip)</span>
          </button>
        </div>
      </div>

      {/* Categories & Search Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 border border-slate-800/80 p-3 rounded-xl">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('images')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'images'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
            Images &amp; Icons
          </button>
          <button
            onClick={() => setSelectedCategory('audios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'audios'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-purple-300" />
            Audios
          </button>
          <button
            onClick={() => setSelectedCategory('fonts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'fonts'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-emerald-300" />
            Fonts
          </button>
          <button
            onClick={() => setSelectedCategory('dex')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'dex'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Binary className="w-3.5 h-3.5 text-amber-300" />
            DEX Code
          </button>
          <button
            onClick={() => setSelectedCategory('xml')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'xml'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-300" />
            XML Resources
          </button>
          <button
            onClick={() => setSelectedCategory('assets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'assets'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Folder className="w-3.5 h-3.5 text-amber-300" />
            Assets / Raw
          </button>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            All Files (Folder View)
          </button>
        </div>

        {/* Search input (for asset categories) */}
        {selectedCategory !== 'all' && (
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in category..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        )}

      </div>

      {/* Main Content: Folder View when Showing All Files, or Grid for Categories */}
      {selectedCategory === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Original Folder Tree View */}
          <div className="lg:col-span-8">
            <FolderTreeViewer
              files={files}
              selectedPath={selectedFileInFolder?.path}
              onSelectFile={(f) => setSelectedFileInFolder(f)}
              onReplaceFile={handleStartReplace}
              onDownloadFile={handleDownloadFile}
              maxHeight="h-[600px]"
            />
          </div>

          {/* Right: Selected File Inspector & Action Card */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-[600px] shadow">
            {selectedFileInFolder ? (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-slate-300 flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Resource Inspector
                  </span>
                  {selectedFileInFolder.isModified && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      Modified
                    </span>
                  )}
                </div>

                {/* Preview Box */}
                <div className="h-44 w-full rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-3 overflow-hidden">
                  {folderImagePreview ? (
                    <img
                      src={folderImagePreview}
                      alt={selectedFileInFolder.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow"
                    />
                  ) : (
                    <div className="text-center text-slate-500 space-y-1.5">
                      <FolderOpen className="w-10 h-10 mx-auto text-amber-400/60" />
                      <div className="text-xs font-mono text-slate-300 font-semibold">{selectedFileInFolder.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{selectedFileInFolder.path.split('.').pop() || 'FILE'} Resource</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">File Name</span>
                    <div className="font-semibold text-white truncate">{selectedFileInFolder.name}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Archive Path</span>
                    <div className="font-mono text-[11px] text-slate-300 break-all select-all bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/70">
                      {selectedFileInFolder.path}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 pt-1">
                    <span>File Size:</span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {formatSize(selectedFileInFolder.uncompressedSize || selectedFileInFolder.size)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleStartReplace(selectedFileInFolder.path)}
                    className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-blue-950/40"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Replace This File</span>
                  </button>
                  <button
                    onClick={() => handleDownloadFile(selectedFileInFolder.path)}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download / Export Original</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-2">
                <FolderOpen className="w-12 h-12 text-amber-500/40 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Select any file from the original folder tree to inspect, preview, replace, or download.</p>
                <p className="text-[11px] text-slate-500">You can also expand subfolders or use the type filter above.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grid of Replaceable Assets for specific category */
        <>
          {filteredFiles.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-12 text-center text-slate-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No files found matching current filter</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="mt-3 text-xs text-blue-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.slice(0, visibleFileCount).map((file) => {
                const preview = previews.get(file.path);
                const isImage = /\.(png|webp|jpe?g|bmp|gif)$/i.test(file.path);
                const isIcon = file.path.includes('ic_launcher') || file.path.includes('icon');

                return (
                  <div
                    key={file.path}
                    className={`bg-slate-900/80 border rounded-xl p-4 transition flex flex-col justify-between relative group ${
                      file.isModified
                        ? 'border-emerald-500/60 bg-emerald-950/10 shadow-lg shadow-emerald-950/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {file.isModified && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow">
                        <Check className="w-3 h-3 stroke-[3]" /> Replaced
                      </div>
                    )}

                    <div>
                      {/* Visual Preview Box */}
                      <div className="h-32 w-full rounded-lg bg-slate-950/80 border border-slate-800/60 flex items-center justify-center overflow-hidden relative mb-3 p-2">
                        {isImage && preview?.url ? (
                          <img
                            src={preview.url}
                            alt={file.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow"
                          />
                        ) : (
                          <div className="text-center text-slate-600">
                            {isImage ? (
                              <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                            ) : /\.(mp3|ogg|wav)$/i.test(file.path) ? (
                              <Music className="w-8 h-8 mx-auto mb-1 text-purple-400" />
                            ) : /\.(ttf|otf)$/i.test(file.path) ? (
                              <Type className="w-8 h-8 mx-auto mb-1 text-cyan-400" />
                            ) : (
                              <Folder className="w-8 h-8 mx-auto mb-1 text-amber-400" />
                            )}
                            <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400">
                              {file.name.split('.').pop() || 'FILE'}
                            </span>
                          </div>
                        )}

                        {isIcon && (
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            App Icon
                          </span>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="space-y-1">
                        <div className="font-medium text-xs text-white truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 truncate" title={file.path}>
                          {file.path}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Size: {formatSize(file.uncompressedSize || file.size)}
                        </div>
                      </div>
                    </div>

                    {/* Replace Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
                      <button
                        onClick={() => handleStartReplace(file.path)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Replace</span>
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file.path)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition cursor-pointer"
                        title="Export / Download original"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredFiles.length > visibleFileCount ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-5 pb-2">
              <span className="text-xs text-slate-400">
                Showing <strong className="text-emerald-400 font-mono">{Math.min(visibleFileCount, filteredFiles.length)}</strong> of <strong className="text-white font-mono">{filteredFiles.length}</strong> files
              </span>
              <button
                onClick={() => setVisibleFileCount(prev => prev + 100)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                Load next 100 files
              </button>
              <button
                onClick={() => setVisibleFileCount(filteredFiles.length)}
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-xs text-blue-300 border border-blue-500/40 transition cursor-pointer"
              >
                Show all {filteredFiles.length} files
              </button>
            </div>
          ) : filteredFiles.length > 100 ? (
            <div className="text-center text-xs text-emerald-400 pt-3">
              Showing all {filteredFiles.length} files in this category.
            </div>
          ) : null}
        </>
      )}

    </div>
  );
};
