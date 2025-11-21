import { useState, useEffect, useRef } from "react";
import { Search, Edit2, Save, X, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { constituencyService } from "../../services/constituencyService";
import type { ParliamentaryConstituency, ConstituencyUpdateData } from "../../services/constituencyService";
import { translationService } from "../../services/translationService";

export default function ConstituencyManagement() {
  const [constituencies, setConstituencies] = useState<ParliamentaryConstituency[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<ConstituencyUpdateData>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New state for expansion
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [assemblyData, setAssemblyData] = useState<Record<number, any[]>>({});
  const [loadingAssembly, setLoadingAssembly] = useState<Set<number>>(new Set());

  // Track if Telugu field was manually edited
  const nameTeManualEdit = useRef(false);

  useEffect(() => {
    fetchConstituencies();
  }, []);

  // Auto-translate Constituency Name English to Telugu (edit form)
  useEffect(() => {
    if (!editData.name_en || nameTeManualEdit.current || editingId === null) {
      return;
    }
    
    const debouncedTranslate = translationService.createDebouncedTranslator(800);
    const currentNameEn = editData.name_en;
    
    debouncedTranslate(currentNameEn, (translated) => {
      if (!nameTeManualEdit.current && editingId !== null) {
        setEditData((prev) => {
          // Only update if English hasn't changed since translation started
          if (prev.name_en === currentNameEn) {
            return { ...prev, name_te: translated };
          }
          return prev;
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData.name_en, editingId]);

  const fetchConstituencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await constituencyService.getConstituencies({
        state: 'Telangana',
        is_active: undefined, // Get all
      });
      setConstituencies(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch constituencies');
      console.error('Failed to fetch constituencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (constituency: ParliamentaryConstituency) => {
    setEditingId(constituency.id);
    setEditData({
      name_en: constituency.name_en,
      name_te: constituency.name_te || constituency.name_en,
      state: constituency.state,
      description: constituency.description || '',
      isActive: constituency.isActive,
    });
    setError(null);
    setSuccess(null);
    nameTeManualEdit.current = false; // Reset manual edit flag when opening edit
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
    setError(null);
    setSuccess(null);
    nameTeManualEdit.current = false; // Reset manual edit flag
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await constituencyService.updateConstituency(id, editData);
      setConstituencies(constituencies.map(c => c.id === id ? updated : c));
      setEditingId(null);
      setEditData({});
      setSuccess('Constituency updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update constituency');
      console.error('Failed to update constituency:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = async (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
      setExpandedRows(newExpanded);
    } else {
      newExpanded.add(id);
      setExpandedRows(newExpanded);
      
      // Fetch data if not present
      if (!assemblyData[id]) {
        setLoadingAssembly(prev => new Set(prev).add(id));
        try {
            const data = await constituencyService.getAssemblyConstituencies({
                parliamentary_constituency_id: id
            });
            setAssemblyData(prev => ({ ...prev, [id]: data }));
        } catch (err) {
            console.error("Failed to fetch assembly constituencies", err);
            // Optionally set error state specific to this expansion
        } finally {
            setLoadingAssembly(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
      }
    }
  };

  const filteredConstituencies = constituencies.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name_en.toLowerCase().includes(query) ||
      (c.name_te && c.name_te.toLowerCase().includes(query)) ||
      c.constituencyNumber.toString().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Constituency Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage parliamentary constituencies and view assembly segments</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search constituencies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading constituencies...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-600">
                  <th className="w-10 px-4 py-3"></th> {/* Expand toggle column */}
                  <th className="px-4 py-3 font-medium">Number</th>
                  <th className="px-4 py-3 font-medium">Name (English)</th>
                  <th className="px-4 py-3 font-medium">Name (Telugu)</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConstituencies.map((constituency) => (
                  <>
                  <tr key={constituency.id} className={clsx("border-t", expandedRows.has(constituency.id) ? "bg-gray-50" : "")}>
                     {/* Expand Toggle */}
                     <td className="px-4 py-3">
                        <button 
                            onClick={() => toggleExpand(constituency.id)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title={expandedRows.has(constituency.id) ? "Collapse" : "Expand"}
                        >
                            {expandedRows.has(constituency.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                     </td>

                    {editingId === constituency.id ? (
                      <>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{constituency.constituencyNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editData.name_en || ''}
                            onChange={(e) => setEditData({ ...editData, name_en: e.target.value })}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editData.name_te || ''}
                            onChange={(e) => {
                              setEditData({ ...editData, name_te: e.target.value });
                              nameTeManualEdit.current = true;
                            }}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Auto-translated"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editData.state || ''}
                            onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                            className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={editData.isActive ? 'true' : 'false'}
                            onChange={(e) => setEditData({ ...editData, isActive: e.target.value === 'true' })}
                            className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(constituency.id)}
                              disabled={saving}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md transition disabled:opacity-50"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={saving}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{constituency.constituencyNumber}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{constituency.name_en}</td>
                        <td className="px-4 py-3 text-gray-700">{constituency.name_te || constituency.name_en}</td>
                        <td className="px-4 py-3 text-gray-700">{constituency.state}</td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1",
                              constituency.isActive
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-gray-50 text-gray-700 border"
                            )}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {constituency.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleEdit(constituency)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                  {expandedRows.has(constituency.id) && (
                      <tr key={`expanded-${constituency.id}`} className="bg-gray-50 border-b">
                          <td colSpan={7} className="px-4 py-4 pl-12">
                            {loadingAssembly.has(constituency.id) ? (
                                <div className="flex items-center justify-center py-4">
                                    <div className="text-sm text-gray-500 animate-pulse">Loading assembly constituencies...</div>
                                </div>
                            ) : assemblyData[constituency.id]?.length > 0 ? (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        Assembly Constituencies
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {assemblyData[constituency.id].map((ac: any) => (
                                            <div key={ac.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-gray-900 truncate" title={typeof ac.name === 'object' ? ac.name?.en : ac.name}>
                                                            {typeof ac.name === 'object' ? ac.name?.en : ac.name}
                                                        </div>
                                                        {(ac.name_te || ac.name?.te) && (
                                                            <div className="text-xs text-gray-500 truncate" title={ac.name_te || ac.name?.te}>
                                                                {ac.name_te || ac.name?.te}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0 text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">
                                                        {ac.constituencyNumber || ac.assembly_constituency_number || ac.number || ac.id}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic py-2 pl-2 border-l-2 border-gray-300">No assembly constituencies found.</div>
                            )}
                          </td>
                      </tr>
                  )}
                  </>
                ))}
                {filteredConstituencies.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                      {searchQuery ? 'No constituencies match your search.' : 'No constituencies found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredConstituencies.length} of {constituencies.length} constituencies
      </div>
    </div>
  );
}
