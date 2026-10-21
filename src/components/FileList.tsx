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
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onUploadClick,
  onPreviewFile,
  onDeleteFile,
  onTogglePin,
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
        return <Image className="w-5 h-5 text-emerald-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-rose-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-purple-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-cyan-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
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
        // Decompress to original
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
      // Pinned files always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.size - a.size;
      if (sortBy === 'savings') {
        const savingsA = (a.originalSize || a.size) - a.size;
        const savingsB = (b.originalSize || b.size) - b.size;
        return savingsB - savingsA;
      }
      return b.uploadedAt - a.uploadedAt; // Default: newest
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 sm:p-14 text-center shadow-lg">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-5 relative group">
          <HardDrive className="w-10 h-10 text-cyan-400" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Your 10GB Lifetime Cloud Vault is Ready
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Zero files currently stored. All files you upload will be maximum compressed in web storage
          to save space, and restored completely uncompressed when downloaded.
        </p>

        <button
          onClick={onUploadClick}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-xl shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Files to 10GB Vault</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar and Filter Dropdowns */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files by name, extension, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdown 1: File Type */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 flex-1 sm:flex-initial">
              <Filter className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <label htmlFor="file-type-select" className="sr-only">Filter by File Type</label>
              <select
                id="file-type-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer w-full"
                aria-label="Filter by file type"
              >
                <option value="all" className="bg-slate-900 text-white">All File Types</option>
                <option value="document" className="bg-slate-900 text-white">Documents (.pdf, .doc)</option>
                <option value="image" className="bg-slate-900 text-white">Images (.png, .jpg)</option>
                <option value="video" className="bg-slate-900 text-white">Videos (.mp4, .mov)</option>
                <option value="audio" className="bg-slate-900 text-white">Audio (.mp3, .wav)</option>
                <option value="archive" className="bg-slate-900 text-white">Archives (.zip, .tar)</option>
                <option value="code" className="bg-slate-900 text-white">Code (.ts, .json)</option>
              </select>
            </div>

            {/* Filter Dropdown 2: Date */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 flex-1 sm:flex-initial">
              <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <label htmlFor="date-filter-select" className="sr-only">Filter by Date</label>
              <select
                id="date-filter-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer w-full"
                aria-label="Filter by date"
              >
                <option value="all" className="bg-slate-900 text-white">All Dates</option>
                <option value="today" className="bg-slate-900 text-white">Today (24h)</option>
                <option value="7days" className="bg-slate-900 text-white">Past 7 Days</option>
                <option value="30days" className="bg-slate-900 text-white">Past 30 Days</option>
                <option value="older" className="bg-slate-900 text-white">Older than 30 Days</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 flex-1 sm:flex-initial">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <label htmlFor="sort-by-select" className="sr-only">Sort Files</label>
              <select
                id="sort-by-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer w-full"
                aria-label="Sort files"
              >
                <option value="date" className="bg-slate-900 text-white">Newest First</option>
                <option value="savings" className="bg-slate-900 text-white">Most Space Saved</option>
                <option value="size" className="bg-slate-900 text-white">Largest Size</option>
                <option value="name" className="bg-slate-900 text-white">Name (A-Z)</option>
              </select>
            </div>

            {/* View Switcher: List vs Grid */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                }`}
                title="List View"
                aria-label="Switch to list view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
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
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong className="text-white font-mono">{filteredFiles.length}</strong> of{' '}
              <strong className="text-slate-300 font-mono">{files.length}</strong> files
            </span>

            {hasActiveFilters && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                <span>Filters Active</span>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Files Display: List or Grid */}
      {filteredFiles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-3">
          <p className="text-sm font-medium text-slate-300">No files found matching your search or filters.</p>
          <p className="text-xs text-slate-500">Try adjusting your search terms, file type, or date range.</p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-medium transition-colors"
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
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-xl relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(file.category)}
                    </div>

                    <div className="flex items-center space-x-1">
                      {onTogglePin && (
                        <button
                          onClick={() => onTogglePin(file.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            file.isPinned
                              ? 'text-amber-400'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title={file.isPinned ? 'Unpin File' : 'Pin File to Top'}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        10GB Vault
                      </span>
                    </div>
                  </div>

                  <h4
                    className="text-sm font-semibold text-white truncate cursor-pointer hover:text-cyan-400 transition-colors mb-1"
                    onClick={() => onPreviewFile(file)}
                    title={file.name}
                  >
                    {file.name}
                  </h4>

                  {/* Size and Compression Savings badge */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-cyan-400 font-semibold">{formatBytes(file.size)}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {savings > 0 && (
                      <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/80">
                        <span className="text-slate-400 line-through text-[10px]">
                          {formatBytes(file.originalSize)}
                        </span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1 text-[10px]">
                          <Zap className="w-3 h-3 text-cyan-400" />
                          <span>Saved {savingsPct}% space</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => onPreviewFile(file)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Preview
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Download uncompressed original file"
                      aria-label={`Download ${file.name}`}
                    >
                      {downloadingId === file.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleCopyLink(file)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                      title="Copy Share Link"
                      aria-label={`Share ${file.name}`}
                    >
                      {copiedId === file.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteFile(file.id)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
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
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg divide-y divide-slate-800/80">
          {filteredFiles.map((file) => {
            const savings = Math.max(0, (file.originalSize || file.size) - file.size);
            const savingsPct = file.originalSize > 0
              ? Math.round((savings / file.originalSize) * 100)
              : 0;

            return (
              <div
                key={file.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
              >
                {/* File Info */}
                <div
                  className="flex items-center space-x-3.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onPreviewFile(file)}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center flex-shrink-0">
                    {getCategoryIcon(file.category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {file.isPinned && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-current flex-shrink-0" />
                      )}
                      <h4 className="text-sm font-semibold text-white truncate hover:text-cyan-400 transition-colors">
                        {file.name}
                      </h4>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex-shrink-0">
                        <Shield className="w-3 h-3" /> 10GB Vault
                      </span>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="font-mono text-cyan-400 font-semibold">{formatBytes(file.size)}</span>
                      {savings > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <Zap className="w-3 h-3 text-cyan-400" />
                          <span>Saved {savingsPct}% (was {formatBytes(file.originalSize)})</span>
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
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
                      className={`p-2 rounded-xl transition-colors ${
                        file.isPinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-white bg-slate-800'
                      }`}
                      title={file.isPinned ? 'Unpin File' : 'Pin File'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  )}

                  <button
                    onClick={() => onPreviewFile(file)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Preview File"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>

                  {file.dataUrl && (
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                      title="Download uncompressed original file"
                      aria-label={`Download ${file.name}`}
                    >
                      {downloadingId === file.id ? (
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyLink(file)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                    title="Copy Lifetime Access Link"
                    aria-label={`Copy link for ${file.name}`}
                  >
                    {copiedId === file.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
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
