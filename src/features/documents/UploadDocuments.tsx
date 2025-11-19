import { useState, useEffect } from "react";
import { FileText, Upload as UploadIcon, Download, Trash2, HardDrive, X, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import type { ElementType } from "react";
import clsx from "clsx";
import { documentService, type Document } from "../../services/documentService";

type DocCategory = "Policy" | "Circular" | "Guidelines" | "Reports" | "Other";

function MetricCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: ElementType;
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-card p-4 flex items-center gap-4">
      <div className={clsx("p-2 rounded-md", color || "bg-gray-100")}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xl font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function CategoryPill({ category }: { category: DocCategory }) {
  const styles =
    category === "Policy"
      ? "bg-green-100 text-green-700 border border-green-200"
      : category === "Circular"
      ? "bg-blue-100 text-blue-700 border border-blue-200"
      : category === "Guidelines"
      ? "bg-amber-100 text-amber-700 border border-amber-200"
      : category === "Reports"
      ? "bg-purple-100 text-purple-700 border border-purple-200"
      : "bg-gray-100 text-gray-700 border border-gray-200";
  return <span className={clsx("px-3 py-1 rounded-full text-xs font-semibold", styles)}>{category}</span>;
}

function AccessPill({ label }: { label: "public" | "cadre" | "admin" }) {
  const styles =
    label === "public"
      ? "bg-white text-gray-700 border border-gray-300"
      : label === "cadre"
      ? "bg-green-50 text-green-700 border border-green-200"
      : "bg-orange-50 text-orange-700 border border-orange-200";
  return <span className={clsx("px-2 py-1 rounded-full text-xs", styles)}>{label}</span>;
}

export default function UploadDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titleEn, setTitleEn] = useState("");
  const [titleTe, setTitleTe] = useState("");
  const [category, setCategory] = useState<DocCategory>("Policy");
  const [accessLevels, setAccessLevels] = useState<Array<"public" | "cadre" | "admin">>(["public"]);
  const [isPublished, setIsPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  const categories: DocCategory[] = ["Policy", "Circular", "Guidelines", "Reports", "Other"];
  const accessLevelOptions: Array<"public" | "cadre" | "admin"> = ["public", "cadre", "admin"];

  useEffect(() => {
    loadDocuments();
  }, [currentPage]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.getDocuments({ page: currentPage, per_page: 20 });
      setDocuments(response.documents || []);
      setTotalDocs(response.total || 0);
      setTotalPages(response.pages || 1);
    } catch (err: any) {
      console.error("Failed to load documents:", err);
      setError(err.response?.data?.message || err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      
      // Auto-fill title from filename if empty
      if (!titleEn) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setTitleEn(nameWithoutExt);
      }
    }
  };

  const toggleAccessLevel = (level: "public" | "cadre" | "admin") => {
    setAccessLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
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

    if (accessLevels.length === 0) {
      setError("Please select at least one access level");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Upload the file
      const uploadResult = await documentService.uploadFile(selectedFile);
      
      // Step 2: Create the document record
      const documentData = {
        title_en: titleEn,
        title_te: titleTe || titleEn,
        category: category,
        file_url: uploadResult.url,
        file_type: uploadResult.file_type || selectedFile.name.split('.').pop() || 'pdf',
        file_size: uploadResult.file_size || selectedFile.size,
        access_level: accessLevels,
        is_published: isPublished,
      };

      await documentService.createDocument(documentData);

      setSuccess(true);
      
      // Clear form
      setTimeout(() => {
        setSelectedFile(null);
        setTitleEn("");
        setTitleTe("");
        setCategory("Policy");
        setAccessLevels(["public"]);
        setIsPublished(true);
        setShowUploadModal(false);
        setSuccess(false);
        loadDocuments(); // Reload documents list
      }, 2000);

    } catch (err: any) {
      console.error("Failed to upload document:", err);
      setError(err.response?.data?.message || err.message || "Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      // Document IDs are UUID strings, not integers
      await documentService.deleteDocument(documentId);
      loadDocuments();
    } catch (err: any) {
      console.error("Failed to delete document:", err);
      alert(err.response?.data?.message || err.message || "Failed to delete document");
    }
  };

  const isValidFileUrl = (fileUrl: string | null | undefined): boolean => {
    if (!fileUrl || fileUrl === 'None' || fileUrl === 'null' || fileUrl.trim() === '') {
      return false;
    }
    try {
      const url = new URL(fileUrl);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleDownload = (fileUrl: string | null | undefined, title: string) => {
    // Validate file URL
    if (!isValidFileUrl(fileUrl)) {
      setError(`Unable to download "${title}": File URL is missing or invalid.`);
      return;
    }

    // Create a temporary anchor element to trigger download
    try {
      const link = document.createElement('a');
      link.href = fileUrl!;
      link.download = title;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download "${title}". Please try again.`);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const calculateStorageUsed = () => {
    const totalBytes = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    return formatFileSize(totalBytes);
  };

  return (
    <div className="space-y-4">
      {/* Header + action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Upload Documents</h1>
          <p className="text-xs sm:text-sm text-gray-500">Upload and manage party documents</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm sm:text-base"
        >
          <UploadIcon className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div>
          <MetricCard icon={FileText} value={totalDocs} label="Total Documents" />
        </div>
        <div>
          <MetricCard icon={UploadIcon} value={documents.length} label="Current Page" color="bg-green-100" />
        </div>
        <div>
          <MetricCard icon={Download} value={0} label="Total Downloads" color="bg-indigo-100" />
        </div>
        <div>
          <MetricCard icon={HardDrive} value={calculateStorageUsed()} label="Storage Used" color="bg-amber-100" />
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No documents found. Upload your first document!</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-600">
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Access Level</th>
                <th className="px-4 py-3 font-medium">Upload Date</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <div>
                        <span className="font-medium text-gray-900">{doc.title_en}</span>
                        {doc.title_te && (
                          <div className="text-xs text-gray-500">{doc.title_te}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryPill category={doc.category as DocCategory} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {Array.isArray(doc.access_level) ? (
                        doc.access_level.map((level) => (
                          <AccessPill key={level} label={level as "public" | "cadre" | "admin"} />
                        ))
                      ) : (
                        <AccessPill label="public" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatFileSize(doc.file_size || 0)}</td>
                  <td className="px-4 py-3">
                    {doc.is_published ? (
                      <span className="flex items-center gap-1 text-green-700 text-xs">
                        <Eye className="w-3 h-3" />
                        Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <EyeOff className="w-3 h-3" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(doc.file_url, doc.title_en)}
                        disabled={!isValidFileUrl(doc.file_url)}
                        className={clsx(
                          "p-2 rounded-md transition-colors",
                          isValidFileUrl(doc.file_url)
                            ? "hover:bg-gray-100 cursor-pointer"
                            : "opacity-50 cursor-not-allowed"
                        )}
                        title={isValidFileUrl(doc.file_url) ? "Download" : "File URL is missing or invalid"}
                      >
                        <Download className={clsx(
                          "w-4 h-4",
                          isValidFileUrl(doc.file_url) ? "text-gray-700" : "text-gray-400"
                        )} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id.toString())}
                        className="p-2 rounded-md hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Upload Document</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setError(null);
                    setSuccess(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Document uploaded successfully!</span>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.odt,.ods,.odp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                  {selectedFile && (
                    <p className="mt-1 text-sm text-gray-500">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Telugu)
                  </label>
                  <input
                    type="text"
                    value={titleTe}
                    onChange={(e) => setTitleTe(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocCategory)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Level <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {accessLevelOptions.map((level) => (
                      <label key={level} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={accessLevels.includes(level)}
                          onChange={() => toggleAccessLevel(level)}
                          className="rounded w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-300 bg-white"
                        />
                        <span className="text-sm capitalize">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-300 bg-white"
                    />
                    <span className="text-sm">Publish immediately</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setError(null);
                      setSuccess(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-md border hover:bg-gray-50"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading..." : "Upload Document"}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
