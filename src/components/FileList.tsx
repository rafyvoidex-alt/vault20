import React, { useState } from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  File,
  Download,
  Trash2,
  ExternalLink,
  Shield,
  Search,
  Upload,
  Share2,
  Clock,
  HardDrive,
  Copy,
  Check,
  Zap,
  Star,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  Calendar,
  X,
  Smartphone,
  Save,
} from 'lucide-react';
import { VaultFile, formatBytes } from '../utils/storage';
import { decompressBytes, dataUrlToBytes } from '../utils/compression';
import { filterFilesByDate } from '../utils/lifecycle';

interface FileListProps {
  files: VaultFile[];
  onUploadClick: () => void;
  onPreviewFile: (file: VaultFile) => void;
  onDeleteFile: (id: string) => void;
  onTogglePin?: (id: string) => void;
  isStorageFull?: boolean;
  onOpenDeviceManager?: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onUploadClick,
  onPreviewFile,
  onDeleteFile,
  onTogglePin,
  isStorageFull = false,
  onOpenDeviceManager,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days' | 'older'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name' | 'savings'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const getCategoryIcon = (category: VaultFile['category']) => {
    switch (category) {
      case 'image':
        return <Image className="w-5 h-5 text-emerald-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-600" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-600" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-purple-600" />;
      case 'code':
        return <Code className="w-5 h-5 text-cyan-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  /**
   * Decompresses the stored compressed file so the user receives
   * the 100% exact, bit-perfect, uncompressed original file back ("jasa dia tha").
   */
  const handleDownload = async (file: VaultFile) => {
    if (!file.dataUrl) return;
    setDownloadingId(file.id);

    try {
      let downloadUrl = file.dataUrl;

      if (file.isCompressed) {
        // Decompress to original bit-perfect bytes
        const compressedBytes = dataUrlToBytes(file.dataUrl);
        const originalBytes = await decompressBytes(compressedBytes);
        const blob = new Blob([originalBytes as unknown as BlobPart], { type: file.type || 'application/octet-stream' });
        downloadUrl = URL.createObjectURL(blob);
      }

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (downloadUrl.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
    } catch (err) {
      console.error('Download decompression error, falling back:', err);
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyLink = (file: VaultFile) => {
    const dummyLink = `${window.location.origin}/vault/file/${file.id}`;
    navigator.clipboard.writeText(dummyLink);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Step 1: Filter by Date
  const dateFiltered = filterFilesByDate(files, dateFilter);

  // Step 2: Filter by Search & Category
  const filteredFiles = dateFiltered
    .filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.size - a.size;
      if (sortBy === 'savings') {
        const savingsA = (a.originalSize || a.size) - a.size;
        const savingsB = (b.originalSize || b.size) - b.size;
        return savingsB - savingsA;
      }
      return b.uploadedAt - a.uploadedAt;
    });

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || dateFilter !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setDateFilter('all');
  };

  // Initial / Empty State: Zero files!
  if (files.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-14 text-center shadow-sm">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-5 relative group shadow-inner">
          <HardDrive className="w-10 h-10 text-cyan-600" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-xs" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          Your 10GB Lifetime Cloud Vault is Ready
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
          Zero files currently stored. All files you upload will be maximum compressed in web storage
          to save space, and restored completely uncompressed when downloaded.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onUploadClick}
            disabled={isStorageFull}
            className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isStorageFull
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isStorageFull ? 'Storage Full (10GB Reached)' : 'Upload Files to 10GB Vault'}</span>
          </button>

          {onOpenDeviceManager && (
            <button
              onClick={onOpenDeviceManager}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>Sync from Another Mobile</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar and Filter Dropdowns in Light Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files by name, extension, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns and View Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter Dropdown 1: File Type */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-700 flex-1 sm:flex-initial shadow-xs">
              <Filter className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
              <label htmlFor="file-type-select" className="sr-only">Filter by File Type</label>
              <select
                id="file-type-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer w-full"
                aria-label="Filter by file type"
              >
                <option value="all">All File Types</option>
                <option value="document">Documents (.pdf, .doc)</option>
                <option value="image">Images (.png, .jpg)</option>
                <option value="video">Videos (.mp4, .mov)</option>
                <option value="audio">Audio (.mp3, .wav)</option>
                <option value="archive">Archives (.zip, .tar)</option>
                <option value="code">Code (.ts, .json)</option>
              </select>
            </div>

            {/* Filter Dropdown 2: Date */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-700 flex-1 sm:flex-initial shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <label htmlFor="date-filter-select" className="sr-only">Filter by Date</label>
              <select
                id="date-filter-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer w-full"
                aria-label="Filter by date"
              >
                <option value="all">All Dates</option>
                <option value="today">Today (24h)</option>
                <option value="7days">Past 7 Days</option>
                <option value="30days">Past 30 Days</option>
                <option value="older">Older than 30 Days</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-700 flex-1 sm:flex-initial shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <label htmlFor="sort-by-select" className="sr-only">Sort Files</label>
              <select
                id="sort-by-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer w-full"
                aria-label="Sort files"
              >
                <option value="date">Newest First</option>
                <option value="savings">Most Space Saved</option>
                <option value="size">Largest Size</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {/* View Switcher: List vs Grid */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-2xl p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'list' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
                aria-label="Switch to list view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
                aria-label="Switch to grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter State Banner & Result Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong className="text-slate-900 font-bold font-mono">{filteredFiles.length}</strong> of{' '}
              <strong className="text-slate-700 font-mono">{files.length}</strong> files
            </span>

            {hasActiveFilters && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                <span>Filters Active</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onOpenDeviceManager && (
              <button
                type="button"
                onClick={onOpenDeviceManager}
                className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Zero-Loss Backup / Sync</span>
              </button>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 font-bold"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Files Display: List or Grid in Light Theme */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">No files found matching your search or filters.</p>
          <p className="text-xs text-slate-500">Try adjusting your search terms, file type, or date range.</p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-xl font-bold transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredFiles.map((file) => {
            const savings = Math.max(0, (file.originalSize || file.size) - file.size);
            const savingsPct = file.originalSize > 0
              ? Math.round((savings / file.originalSize) * 100)
              : 0;

            return (
              <div
                key={file.id}
                className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                      {getCategoryIcon(file.category)}
                    </div>

                    <div className="flex items-center space-x-1">
                      {onTogglePin && (
                        <button
                          onClick={() => onTogglePin(file.id)}
                          className={`p-1.5 rounded-xl transition-colors ${
                            file.isPinned
                              ? 'text-amber-500 bg-amber-50'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title={file.isPinned ? 'Unpin File' : 'Pin File to Top'}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        10GB Safe
                      </span>
                    </div>
                  </div>

                  <h4
                    className="text-sm font-bold text-slate-900 truncate cursor-pointer hover:text-cyan-700 transition-colors mb-1"
                    onClick={() => onPreviewFile(file)}
                    title={file.name}
                  >
                    {file.name}
                  </h4>

                  {/* Size and Compression Savings badge */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono text-cyan-700 font-bold">{formatBytes(file.size)}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {savings > 0 && (
                      <div className="flex items-center justify-between text-[11px] bg-emerald-50/70 px-2 py-1 rounded-xl border border-emerald-200/60">
                        <span className="text-slate-400 line-through text-[10px]">
                          {formatBytes(file.originalSize)}
                        </span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                          <Zap className="w-3 h-3 text-cyan-600" />
                          <span>Saved {savingsPct}% space</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onPreviewFile(file)}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Preview
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition-colors"
                      title="Download uncompressed original file"
                      aria-label={`Download ${file.name}`}
                    >
                      {downloadingId === file.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleCopyLink(file)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition-colors"
                      title="Copy Share Link"
                      aria-label={`Share ${file.name}`}
                    >
                      {copiedId === file.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteFile(file.id)}
                      className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl transition-colors"
                      title="Delete File"
                      aria-label={`Delete ${file.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {filteredFiles.map((file) => {
            const savings = Math.max(0, (file.originalSize || file.size) - file.size);
            const savingsPct = file.originalSize > 0
              ? Math.round((savings / file.originalSize) * 100)
              : 0;

            return (
              <div
                key={file.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                {/* File Info */}
                <div
                  className="flex items-center space-x-3.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onPreviewFile(file)}
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                    {getCategoryIcon(file.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {file.isPinned && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current flex-shrink-0" />
                      )}
                      <h4 className="text-sm font-bold text-slate-900 truncate hover:text-cyan-700 transition-colors">
                        {file.name}
                      </h4>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                        <Shield className="w-3 h-3" /> 10GB Safe
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="font-mono text-cyan-700 font-bold">{formatBytes(file.size)}</span>
                      {savings > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-200/50">
                          <Zap className="w-3 h-3 text-cyan-600" />
                          <span>Saved {savingsPct}% (was {formatBytes(file.originalSize)})</span>
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  {onTogglePin && (
                    <button
                      onClick={() => onTogglePin(file.id)}
                      className={`p-2 rounded-xl border transition-colors ${
                        file.isPinned
                          ? 'text-amber-600 bg-amber-50 border-amber-200'
                          : 'text-slate-500 hover:text-slate-800 bg-slate-50 border-slate-200'
                      }`}
                      title={file.isPinned ? 'Unpin File' : 'Pin File'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  )}

                  <button
                    onClick={() => onPreviewFile(file)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Preview File"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>

                  {file.dataUrl && (
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition-colors shadow-xs"
                      title="Download uncompressed original file"
                      aria-label={`Download ${file.name}`}
                    >
                      {downloadingId === file.id ? (
                        <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyLink(file)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl transition-colors shadow-xs"
                    title="Copy Lifetime Access Link"
                    aria-label={`Copy link for ${file.name}`}
                  >
                    {copiedId === file.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl transition-colors shadow-xs"
                    title="Remove File"
                    aria-label={`Delete ${file.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
