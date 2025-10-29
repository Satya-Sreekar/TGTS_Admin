import { useState, useEffect } from "react";
import { Image, Video, UploadCloud, CheckCircle, AlertCircle, Eye } from "lucide-react";
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

  useEffect(() => {
    loadMedia();
  }, [currentPage]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await mediaService.getMedia({ page: currentPage, per_page: 12 });
      setMediaItems(response.media);
      setTotalPages(response.pages);
      setTotalMedia(response.total);
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
      }, 2000);

    } catch (err: any) {
      console.error("Failed to upload media:", err);
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.message || err.message || "Failed to upload media. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const photoCount = mediaItems.filter(item => item.type === 'photo').length;
  const videoCount = mediaItems.filter(item => item.type === 'video').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Media Gallery</h1>
          <p className="text-sm text-gray-500">Manage photos and videos</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Media
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Image className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{totalMedia}</div>
              <div className="text-sm text-gray-500">Total Media</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Image className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{photoCount}</div>
              <div className="text-sm text-gray-500">Photos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Video className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{videoCount}</div>
              <div className="text-sm text-gray-500">Videos</div>
            </div>
          </div>
        </div>
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
            <div className="grid grid-cols-4 gap-4">
              {mediaItems.map((item) => (
                <div key={item.id} className="group relative rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
                  {item.type === 'photo' ? (
                    <img 
                      src={item.thumbnail || item.url} 
                      alt={item.title.en}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-800 flex items-center justify-center relative">
                      <Video className="w-12 h-12 text-white" />
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
                          onClick={() => window.open(item.url, '_blank')}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Media</h2>

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
                  className="mt-1 w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-300"
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
                  className="mt-1 w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-orange-300"
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
    </div>
  );
}

