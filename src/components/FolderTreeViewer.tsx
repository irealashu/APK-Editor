import React, { useState, useMemo } from 'react';
import { ApkFileInfo } from '../types/apk';
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, 
  FileCode, Image as ImageIcon, Binary, Music, Type, FileText, 
  Upload, Download, Trash2, Check, Search, Filter
} from 'lucide-react';

interface FolderTreeViewerProps {
  files: ApkFileInfo[];
  selectedPath?: string;
  onSelectFile: (file: ApkFileInfo) => void;
  onReplaceFile?: (path: string) => void;
  onDownloadFile?: (path: string) => void;
  onDeleteFile?: (path: string, e: React.MouseEvent) => void;
  maxHeight?: string;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  file?: ApkFileInfo;
  children: Map<string, TreeNode>;
  totalFilesCount: number;
}

export const FolderTreeViewer: React.FC<FolderTreeViewerProps> = ({
  files,
  selectedPath,
  onSelectFile,
  onReplaceFile,
  onDownloadFile,
  onDeleteFile,
  maxHeight = 'h-[540px]'
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // Default open top-level folders
    return new Set<string>(['res', 'assets', 'META-INF']);
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'xml' | 'images' | 'dex' | 'audio' | 'assets'>('all');

  // Filter files by type & search
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const p = f.path.toLowerCase();
      // Type filter
      if (typeFilter === 'xml' && !p.endsWith('.xml')) return false;
      if (typeFilter === 'images' && !/\.(png|webp|jpe?g|bmp|gif|ico|svg)$/i.test(p)) return false;
      if (typeFilter === 'dex' && !p.endsWith('.dex')) return false;
      if (typeFilter === 'audio' && !/\.(mp3|ogg|wav|m4a|aac|flac|mid|midi|wma)$/i.test(p)) return false;
      if (typeFilter === 'assets' && !p.startsWith('assets/')) return false;

      // Search term
      if (searchTerm.trim() && !p.includes(searchTerm.toLowerCase().trim())) {
        return false;
      }

      return true;
    });
  }, [files, typeFilter, searchTerm]);

  // Build hierarchical tree
  const tree = useMemo(() => {
    const root: TreeNode = {
      name: '',
      fullPath: '',
      isFolder: true,
      children: new Map(),
      totalFilesCount: 0
    };

    for (const file of filteredFiles) {
      const parts = file.path.split('/');
      let current = root;
      current.totalFilesCount++;

      let curPath = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        curPath = curPath ? `${curPath}/${part}` : part;
        const isLast = i === parts.length - 1;

        if (!current.children.has(part)) {
          current.children.set(part, {
            name: part,
            fullPath: curPath,
            isFolder: !isLast,
            file: isLast ? file : undefined,
            children: new Map(),
            totalFilesCount: 0
          });
        }

        const next = current.children.get(part)!;
        if (!isLast) {
          next.totalFilesCount++;
        }
        current = next;
      }
    }

    return root;
  }, [filteredFiles]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    const collect = (node: TreeNode) => {
      if (node.isFolder && node.fullPath) all.add(node.fullPath);
      for (const child of node.children.values()) {
        collect(child);
      }
    };
    collect(tree);
    setExpandedFolders(all);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const getFileIcon = (path: string) => {
    const p = path.toLowerCase();
    if (p.endsWith('.xml')) return <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    if (/\.(png|webp|jpe?g|bmp|gif|ico|svg)$/i.test(p)) return <ImageIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    if (p.endsWith('.dex')) return <Binary className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    if (/\.(mp3|ogg|wav|m4a|aac|flac)$/i.test(p)) return <Music className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    if (/\.(ttf|otf|woff2?)$/i.test(p)) return <Type className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  // Recursive tree renderer
  const renderTree = (node: TreeNode, depth: number = 0): React.ReactNode => {
    // Sort: Folders first (alphabetically), then Files
    const sortedChildren = Array.from(node.children.values()).sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return sortedChildren.map((child) => {
      if (child.isFolder) {
        const isExpanded = searchTerm.trim().length > 0 || expandedFolders.has(child.fullPath);
        return (
          <div key={child.fullPath} className="select-none">
            <div
              onClick={() => toggleFolder(child.fullPath)}
              style={{ paddingLeft: `${depth * 14 + 6}px` }}
              className="flex items-center justify-between py-1 px-2 rounded-lg text-xs hover:bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer transition group"
            >
              <div className="flex items-center gap-1.5 truncate min-w-0">
                <span className="text-slate-500 group-hover:text-slate-300">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-amber-500/80 shrink-0" />
                )}
                <span className="font-semibold text-slate-200 truncate">{child.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1 bg-slate-950/60 px-1.5 py-0.2 rounded border border-slate-800/60">
                {child.totalFilesCount}
              </span>
            </div>

            {isExpanded && (
              <div className="border-l border-slate-800/60 ml-3.5">
                {renderTree(child, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      // Render file node
      const isSelected = selectedPath === child.fullPath;
      const file = child.file!;

      return (
        <div
          key={child.fullPath}
          onClick={() => onSelectFile(file)}
          style={{ paddingLeft: `${depth * 14 + 18}px` }}
          className={`group flex items-center justify-between py-1 px-2 rounded-lg text-xs font-mono transition cursor-pointer ${
            isSelected
              ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 font-semibold'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            {getFileIcon(child.fullPath)}
            <span className="truncate" title={child.fullPath}>
              {child.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {file.isModified && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9px] font-bold">
                MOD
              </span>
            )}

            {onReplaceFile && (
              <button
                onClick={(e) => { e.stopPropagation(); onReplaceFile(child.fullPath); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 rounded transition cursor-pointer"
                title="Replace file"
              >
                <Upload className="w-3 h-3" />
              </button>
            )}

            {onDownloadFile && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownloadFile(child.fullPath); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-emerald-400 rounded transition cursor-pointer"
                title="Export / Download file"
              >
                <Download className="w-3 h-3" />
              </button>
            )}

            {onDeleteFile && (
              <button
                onClick={(e) => onDeleteFile(child.fullPath, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition cursor-pointer"
                title="Delete file"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-xl overflow-hidden border border-slate-800 shadow">
      
      {/* Top Search & Filter Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Original Folder Structure</span>
            <span className="text-[10px] text-slate-500 font-mono">({filteredFiles.length} files)</span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={expandAll}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Expand all folders"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Collapse all folders"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files or paths (e.g. res/layout, ic_launcher)..."
            className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        {/* File Type Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pt-0.5 no-scrollbar">
          {(['all', 'xml', 'images', 'dex', 'audio', 'assets'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider transition cursor-pointer shrink-0 ${
                typeFilter === type
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {type === 'all' ? 'All Files' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Tree Content */}
      <div className={`flex-1 overflow-y-auto p-2 space-y-0.5 ${maxHeight}`}>
        {filteredFiles.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 space-y-1">
            <p>No files match current folder/type filter.</p>
            <button
              onClick={() => { setSearchTerm(''); setTypeFilter('all'); }}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          renderTree(tree, 0)
        )}
      </div>

    </div>
  );
};
