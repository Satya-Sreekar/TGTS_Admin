import { useState, useEffect, useRef } from "react";
import { Megaphone, Bell, UploadCloud, CheckCircle, AlertCircle, X } from "lucide-react";
import clsx from "clsx";
import { adminService } from "../../services/adminService";
import { mediaService } from "../../services/mediaService";
import { translationService } from "../../services/translationService";

const audienceTypes = ["All Members", "Cadre Only", "Public"] as const;
const regions = ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Nalgonda"] as const;

export default function ContentPush() {
  const [mode, setMode] = useState<"news" | "push">("news");
  const [audience, setAudience] = useState<(typeof audienceTypes)[number]>("All Members");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [titleEn, setTitleEn] = useState("");
  const [titleTe, setTitleTe] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descTe, setDescTe] = useState("");
  const [fileName, setFileName] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if Telugu fields were manually edited
  const titleTeManualEdit = useRef(false);
  const descTeManualEdit = useRef(false);

  const estimatedReach = 15428; // placeholder to match screenshot

  // Auto-translate Title English to Telugu
  useEffect(() => {
    if (titleEn && !titleTeManualEdit.current) {
      const debouncedTranslate = translationService.createDebouncedTranslator(800);
      debouncedTranslate(titleEn, (translated) => {
        if (!titleTeManualEdit.current) {
          setTitleTe(translated);
        }
      });
    }
  }, [titleEn]);

  // Auto-translate Description English to Telugu
  useEffect(() => {
    if (descEn && !descTeManualEdit.current) {
      const debouncedTranslate = translationService.createDebouncedTranslator(800);
      debouncedTranslate(descEn, (translated) => {
        if (!descTeManualEdit.current) {
          setDescTe(translated);
        }
      });
    }
  }, [descEn]);

  // Create and cleanup image preview URL
  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setImagePreview(objectUrl);

      // Cleanup function to revoke the object URL
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const toggleRegion = (r: string) =>
    setSelectedRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  // Remove uploaded image
  const removeImage = () => {
    setImageFile(null);
    setFileName("");
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.getElementById('content-image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Map audience to roles
  const getRolesFromAudience = () => {
    if (audience === "All Members") return ["public", "cadre", "admin"];
    if (audience === "Cadre Only") return ["cadre", "admin"];
    if (audience === "Public") return ["public"];
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setSuccess(false);
    setError(null);

    // Validation
    if (!titleEn.trim()) {
      setError("Title (English) is required");
      return;
    }

    setLoading(true);

    try {
      // Prepare the payload
      const payload: any = {
        title: titleEn,
        title_te: titleTe.trim() || titleEn, // Use English as fallback
        message: descEn || titleEn,
        description_te: descTe.trim() || descEn || titleEn, // Use English as fallback
        target_roles: getRolesFromAudience(),
        target_regions: selectedRegions.length > 0 ? selectedRegions : undefined,
        content_type: mode === "news" ? "news" : "notification",
        category: "announcement"
      };

      // Handle image upload - create media item directly
      if (imageFile) {
        try {
          console.log("Uploading to Media Gallery:", imageFile.name);
          
          // Upload to media gallery
          const mediaItem = await mediaService.uploadMedia(imageFile, {
            type: 'photo',
            title_en: titleEn,
            title_te: titleTe || titleEn,
            is_published: true,
          });
          
          payload.image_url = mediaItem.url;
          console.log("Media uploaded successfully:", mediaItem);
        } catch (uploadErr) {
          console.error("Media upload failed:", uploadErr);
          setError("Failed to upload image. Content will be pushed without image.");
          // Continue without image
        }
      }

      // Still push the content notification
      await adminService.pushContent(payload);

      setSuccess(true);
      
      // Clear form after success
      setTimeout(() => {
        setTitleEn("");
        setTitleTe("");
        setDescEn("");
        setDescTe("");
        setFileName("");
        setImageFile(null);
        setImagePreview(null);
        setSelectedRegions([]);
        setSuccess(false);
        // Reset file input
        const fileInput = document.getElementById('content-image') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }, 3000);
      
    } catch (err: any) {
      console.error("Failed to push content:", err);
      setError(err.response?.data?.message || "Failed to push content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Content Push</h1>
        <p className="text-sm text-gray-500">Create and send content to members</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <div className="font-medium text-green-900">Content Sent Successfully!</div>
            <div className="text-sm text-green-700">Your content has been pushed to {estimatedReach.toLocaleString()} members.</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <div className="font-medium text-red-900">Error</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Form */}
          <div className="col-span-8 space-y-4">
            <div className="bg-white rounded-lg shadow-card p-4 space-y-4">
            {/* Mode toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("news")}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-md border text-sm",
                  mode === "news" ? "bg-gray-100 border-gray-300" : "hover:bg-gray-50"
                )}
              >
                <Megaphone className="w-4 h-4" />
                News/Update
              </button>
              <button
                type="button"
                onClick={() => setMode("push")}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-md border text-sm",
                  mode === "push" ? "bg-gray-100 border-gray-300" : "hover:bg-gray-50"
                )}
              >
                <Bell className="w-4 h-4" />
                Push Notification
              </button>
            </div>

            {/* Title English */}
            <div>
              <label className="text-sm font-medium">Title (English) *</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="Enter title in English"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
              />
            </div>

            {/* Title Telugu */}
            <div>
              <label className="text-sm font-medium">Title (Telugu) *</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="తెలుగులో శీర్షికను నమోదు చేయండి (Auto-translated)"
                value={titleTe}
                onChange={(e) => {
                  setTitleTe(e.target.value);
                  titleTeManualEdit.current = true;
                }}
              />
            </div>

            {/* Description English */}
            <div>
              <label className="text-sm font-medium">Description (English)</label>
              <textarea
                className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                rows={3}
                placeholder="Enter description in English"
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
              />
            </div>

            {/* Description Telugu */}
            <div>
              <label className="text-sm font-medium">Description (Telugu)</label>
              <textarea
                className="mt-1 w-full px-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                rows={3}
                placeholder="తెలుగులో వివరణను నమోదు చేయండి (Auto-translated)"
                value={descTe}
                onChange={(e) => {
                  setDescTe(e.target.value);
                  descTeManualEdit.current = true;
                }}
              />
            </div>

            {/* Upload Image */}
            <div>
              <label className="text-sm font-medium">Upload Image</label>
              
              {/* Upload Area - only show if no preview */}
              {!imagePreview && (
                <label
                  htmlFor="content-image"
                  className="mt-1 block h-40 rounded-md border border-dashed flex flex-col items-center justify-center text-gray-600 cursor-pointer hover:bg-gray-50"
                >
                  <UploadCloud className="w-6 h-6 mb-2" />
                  <span className="text-sm">
                    {fileName || "Click to upload or drag and drop"}
                  </span>
                  <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
                </label>
              )}
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-1 relative">
                  <div className="rounded-lg border border-gray-300 overflow-hidden bg-gray-50">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  
                  {/* Image Info and Remove Button */}
                  <div className="mt-2 flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="ml-2 p-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 flex-shrink-0"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Change Image Button */}
                  <label
                    htmlFor="content-image"
                    className="mt-2 inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Change Image
                  </label>
                </div>
              )}
              
              <input
                id="content-image"
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    // Validate file size (5MB)
                    if (f.size > 5 * 1024 * 1024) {
                      setError("Image size must be less than 5MB");
                      e.target.value = '';
                      return;
                    }
                    setFileName(f.name);
                    setImageFile(f);
                  } else {
                    setFileName("");
                    setImageFile(null);
                  }
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <div>
            <button 
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-3 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Sending...
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4" />
                  Send Content
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Audience + Reach */}
        <div className="col-span-4 space-y-4">
          {/* Target Audience */}
          <div className="bg-white rounded-lg shadow-card p-4 space-y-3">
            <div className="font-medium">Target Audience</div>

            {/* Audience Type */}
            <div className="space-y-1">
              <div className="text-sm text-gray-600">Audience Type</div>
              <div className="relative">
                <select
                  className="appearance-none w-full pl-3 pr-8 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as (typeof audienceTypes)[number])}
                >
                  {audienceTypes.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">▾</span>
              </div>
            </div>

            {/* Regions */}
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Select Regions</div>
              <div className="space-y-2">
                {regions.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedRegions.includes(r)}
                      onChange={() => toggleRegion(r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Estimated Reach */}
          <div className="bg-orange-50 rounded-lg shadow-card p-4">
            <div className="text-sm text-gray-700">Estimated Reach</div>
            <div className="text-3xl font-semibold text-orange-600 mt-2">{estimatedReach.toLocaleString()}</div>
            <div className="text-xs text-gray-600 mt-1">members will receive this content</div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}