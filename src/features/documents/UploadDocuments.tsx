import { FileText, Upload as UploadIcon, Download, Trash2, HardDrive } from "lucide-react";
import type { ElementType } from "react";
import clsx from "clsx";

type DocItem = {
  name: string;
  category: "Policy" | "Circular" | "Guidelines";
  access: Array<"public" | "cadre" | "admin">;
  uploadDate: string;
  downloads: number;
};

const documents: DocItem[] = [
  {
    name: "Party Manifesto 2025",
    category: "Policy",
    access: ["public", "cadre", "admin"],
    uploadDate: "15/1/2025",
    downloads: 496,
  },
  {
    name: "Monthly Circular - October 2025",
    category: "Circular",
    access: ["cadre", "admin"],
    uploadDate: "1/10/2025",
    downloads: 435,
  },
  {
    name: "Booth Management Guidelines",
    category: "Guidelines",
    access: ["cadre", "admin"],
    uploadDate: "20/9/2025",
    downloads: 566,
  },
];

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

function CategoryPill({ category }: { category: DocItem["category"] }) {
  const styles =
    category === "Policy"
      ? "bg-green-100 text-green-700 border border-green-200"
      : category === "Circular"
      ? "bg-blue-100 text-blue-700 border border-blue-200"
      : "bg-amber-100 text-amber-700 border border-amber-200";
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
  const totalDocs = 3;
  const uploadedThisMonth = 12;
  const totalDownloads = 3428;
  const storageUsed = "2.4 GB";

  return (
    <div className="space-y-4">
      {/* Header + action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Upload Documents</h1>
          <p className="text-sm text-gray-500">Upload and manage party documents</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-orange-500 text-white hover:bg-orange-600">
          <UploadIcon className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <MetricCard icon={FileText} value={totalDocs} label="Total Documents" />
        </div>
        <div className="col-span-3">
          <MetricCard icon={UploadIcon} value={uploadedThisMonth} label="Uploaded This Month" color="bg-green-100" />
        </div>
        <div className="col-span-3">
          <MetricCard icon={Download} value={totalDownloads} label="Total Downloads" color="bg-indigo-100" />
        </div>
        <div className="col-span-3">
          <MetricCard icon={HardDrive} value={storageUsed} label="Storage Used" color="bg-amber-100" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-600">
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Access Level</th>
              <th className="px-4 py-3 font-medium">Upload Date</th>
              <th className="px-4 py-3 font-medium">Downloads</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.name} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">{d.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CategoryPill category={d.category} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {d.access.map((a) => (
                      <AccessPill key={a} label={a} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{d.uploadDate}</td>
                <td className="px-4 py-3 text-gray-700">{d.downloads.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-md hover:bg-gray-100" title="Download">
                      <Download className="w-4 h-4 text-gray-700" />
                    </button>
                    <button className="p-2 rounded-md hover:bg-red-50" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}