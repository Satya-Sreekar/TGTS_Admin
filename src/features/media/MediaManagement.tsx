import { useState, useEffect } from "react";
import { Image, Video, UploadCloud, CheckCircle, AlertCircle, Eye, X } from "lucide-react";
import { mediaService } from "../../services/mediaService";
import type { MediaItem } from "../../services/mediaService";

export default function MediaManagement() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titleEn, setTitleEn] = useState("");
  const [titleTe, setTitleTe] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMedia, setTotalMedia] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<'photo' | 'video' | null>(null);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Load media when page or filter changes
  useEffect(() => {
    loadMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeFilter]);

  // Load totals once on mount
  useEffect(() => {
    loadTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTotals = async () => {
    try {
      const [allResponse, photosResponse, videosResponse] = await Promise.all([
        mediaService.getMedia({ page: 1, per_page: 1 }),
        mediaService.getMedia({ page: 1, per_page: 1, type: 'photo' }),
        mediaService.getMedia({ page: 1, per_page: 1, type: 'video' }),
      ]);
      setTotalMedia(allResponse.total);
      setTotalPhotos(photosResponse.total);
      setTotalVideos(videosResponse.total);
    } catch (err) {
      console.error("Failed to load totals:", err);
    }
  };

  // Handle Escape key to close media modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMedia) {
        setSelectedMedia(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedMedia]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const filters: { page: number; per_page: number; type?: 'photo' | 'video' } = {
        page: currentPage,
        per_page: 12,
      };
      if (activeFilter) {
        filters.type = activeFilter;
      }
      const response = await mediaService.getMedia(filters);
      setMediaItems(response.media);
      setTotalPages(response.pages);
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (mediaType === 'photo') {
        if (!file.type.startsWith('image/')) {
          setError('Please select an image file');
          return;
        }
      } else if (mediaType === 'video') {
        if (!file.type.startsWith('video/')) {
          setError('Please select a video file');
          return;
        }
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!titleEn.trim()) {
      setError("Title (English) is required");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await mediaService.uploadMedia(selectedFile, {
        type: mediaType,
        title_en: titleEn,
        title_te: titleTe || titleEn,
        is_published: isPublished,
      });

      console.log('Upload result:', result);
      setSuccess(true);
      
      // Clear form
      setTimeout(() => {
        setSelectedFile(null);
        setTitleEn("");
        setTitleTe("");
        setIsPublished(true);
        setShowUploadModal(false);
        setSuccess(false);
        loadMedia(); // Reload media list
        loadTotals(); // Reload totals to update counters
      }, 2000);

    } catch (err: any) {
      console.error("Failed to upload media:", err);
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.message || err.message || "Failed to upload media. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFilterClick = (filter: 'photo' | 'video' | null) => {
    setActiveFilter(filter === activeFilter ? null : filter);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Media Gallery</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage photos and videos</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm sm:text-base"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Media
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => handleFilterClick(null)}
          className={`bg-white rounded-lg shadow-card p-4 transition-all hover:shadow-lg ${
            activeFilter === null ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              activeFilter === null ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
              <Image className={`w-5 h-5 ${
                activeFilter === null ? 'text-orange-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <div className="text-2xl font-semibold">{totalMedia}</div>
              <div className="text-sm text-gray-500">Total Media</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => handleFilterClick('photo')}
          className={`bg-white rounded-lg shadow-card p-4 transition-all hover:shadow-lg cursor-pointer ${
            activeFilter === 'photo' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              activeFilter === 'photo' ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              <Image className={`w-5 h-5 ${
                activeFilter === 'photo' ? 'text-orange-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <div className="text-2xl font-semibold">{totalPhotos}</div>
              <div className="text-sm text-gray-500">Photos</div>
            </div>
          </div>
        </button>
        <button
          onClick={() => handleFilterClick('video')}
          className={`bg-white rounded-lg shadow-card p-4 transition-all hover:shadow-lg cursor-pointer ${
            activeFilter === 'video' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              activeFilter === 'video' ? 'bg-orange-100' : 'bg-purple-100'
            }`}>
              <Video className={`w-5 h-5 ${
                activeFilter === 'video' ? 'text-orange-600' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <div className="text-2xl font-semibold">{totalVideos}</div>
              <div className="text-sm text-gray-500">Videos</div>
            </div>
          </div>
        </button>
      </div>

      {/* Media Grid */}
      <div className="bg-white rounded-lg shadow-card p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading media...</p>
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No media items yet. Upload your first one!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="group relative rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
                  {item.type === 'photo' ? (
                    <img 
                      src={item.thumbnail || item.url} 
                      alt={item.title.en}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => setSelectedMedia(item)}
                    />
                  ) : (
                    <div 
                      className="w-full h-48 bg-gray-800 flex items-center justify-center relative cursor-pointer"
                      onClick={() => setSelectedMedia(item)}
                    >
                      <Video className="w-12 h-12 text-white z-10" />
                      <img 
                        src={item.thumbnail} 
                        alt={item.title.en}
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="font-medium text-sm truncate">{item.title.en}</div>
                    <div className="text-xs text-gray-500">{item.title.te}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setSelectedMedia(item)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 sm:p-6 my-auto">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Upload Media</h2>

            {/* Success Message */}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-900">Media uploaded successfully!</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-900">{error}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Media Type */}
              <div>
                <label className="text-sm font-medium">Media Type</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setMediaType('photo')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${
                      mediaType === 'photo' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${
                      mediaType === 'video' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    Video
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="text-sm font-medium">Select File *</label>
                <label className="mt-1 block h-32 rounded-md border-2 border-dashed flex flex-col items-center justify-center text-gray-600 cursor-pointer hover:bg-gray-50">
                  <UploadCloud className="w-8 h-8 mb-2" />
                  <span className="text-sm">{selectedFile ? selectedFile.name : 'Click to select file'}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {mediaType === 'photo' ? 'PNG, JPG up to 10MB' : 'MP4, MOV up to 100MB'}
                  </span>
                  <input
                    type="file"
                    accept={mediaType === 'photo' ? 'image/*' : 'video/*'}
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* Title English */}
              <div>
                <label className="text-sm font-medium">Title (English) *</label>
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="Enter title in English"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                />
              </div>

              {/* Title Telugu */}
              <div>
                <label className="text-sm font-medium">Title (Telugu)</label>
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="తెలుగులో శీర్షికను నమోదు చేయండి"
                  value={titleTe}
                  onChange={(e) => setTitleTe(e.target.value)}
                />
              </div>

              {/* Published Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isPublished" className="text-sm">Publish immediately</label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setTitleEn("");
                    setTitleTe("");
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-md border hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="flex-1 px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full flex flex-col">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-2 right-2 sm:top-6 sm:right-6 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors z-10"
              title="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            {/* Title at top for videos */}
            {selectedMedia.type === 'video' && (
              <div 
                className="mb-4 bg-black bg-opacity-50 rounded-lg p-4 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-semibold text-lg">{selectedMedia.title.en}</div>
                {selectedMedia.title.te && (
                  <div className="text-sm text-gray-300 mt-1">{selectedMedia.title.te}</div>
                )}
              </div>
            )}
            <div className="flex-1 flex items-center justify-center min-h-0">
              {selectedMedia.type === 'photo' ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title.en}
                  className="max-w-full max-h-full object-contain rounded-lg mx-auto"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-w-full max-h-full rounded-lg mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
            {/* Title at bottom for images */}
            {selectedMedia.type === 'photo' && (
              <div 
                className="mt-4 bg-black bg-opacity-50 rounded-lg p-4 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-semibold text-lg">{selectedMedia.title.en}</div>
                {selectedMedia.title.te && (
                  <div className="text-sm text-gray-300 mt-1">{selectedMedia.title.te}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

