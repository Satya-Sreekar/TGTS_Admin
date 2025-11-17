import { useMemo, useState, useEffect } from "react";
import {
  Search,
  Upload,
  UserPlus,
  ChevronDown,
  EllipsisVertical,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import { userService } from "../../services/userService";
import type { User } from "../../services/authService";

type UserRow = {
  name: string;
  email: string;
  contact: string;
  region: string;
  role: "CADRE" | "PUBLIC" | "ADMIN";
  date: string;
  status: "active" | "inactive";
};

const allUsers: UserRow[] = [
  {
    name: "Rajesh Kumar",
    email: "rajesh@example.com",
    contact: "+91 9876543210",
    region: "Hyderabad",
    role: "CADRE",
    date: "15/9/2025",
    status: "active",
  },
  {
    name: "Priya Sharma",
    email: "priya@example.com",
    contact: "+91 9876543211",
    region: "Warangal",
    role: "CADRE",
    date: "20/9/2025",
    status: "active",
  },
  {
    name: "Suresh Reddy",
    email: "suresh@example.com",
    contact: "+91 9876543212",
    region: "Nizamabad",
    role: "PUBLIC",
    date: "1/10/2025",
    status: "active",
  },
  {
    name: "Lakshmi Devi",
    email: "lakshmi@example.com",
    contact: "+91 9876543213",
    region: "Karimnagar",
    role: "CADRE",
    date: "5/10/2025",
    status: "active",
  },
  {
    name: "Venkat Rao",
    email: "venkat@example.com",
    contact: "+91 9876543214",
    region: "Hyderabad",
    role: "ADMIN",
    date: "10/8/2025",
    status: "active",
  },
];

const roleOptions = ["All Roles", "CADRE", "ADMIN", "PUBLIC"] as const;
const regionOptions = ["All Regions", "Hyderabad", "Warangal", "Nizamabad", "Karimnagar"] as const;

function RolePill({ role }: { role: UserRow["role"] }) {
  const classes = {
    CADRE: "bg-green-100 text-green-700 border border-green-200",
    ADMIN: "bg-orange-100 text-orange-700 border border-orange-200",
    PUBLIC: "bg-white text-gray-700 border border-gray-300",
  }[role];
  return <span className={clsx("px-3 py-1 rounded-full text-xs font-semibold", classes)}>{role}</span>;
}

function StatusPill({ status }: { status: UserRow["status"] }) {
  const isActive = status === "active";
  return (
    <span
      className={clsx(
        "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1",
        isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-700 border"
      )}
    >
      <CheckCircle2 className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function UserManagement() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof roleOptions)[number]>("All Roles");
  const [region, setRegion] = useState<(typeof regionOptions)[number]>("All Regions");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserRow[]>(allUsers);
  const [totalCount, setTotalCount] = useState(15428);
  const [loading, setLoading] = useState(false);

  const pageSize = 5;

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await userService.getUsers({
          page,
          per_page: pageSize,
          role: role !== "All Roles" ? role : undefined,
          search: query || undefined,
        });
        
        // Map API users to UserRow format
        const mappedUsers: UserRow[] = response.data.map((user: User) => ({
          name: user.name || 'Unknown',
          email: user.phone,
          contact: user.phone,
          region: user.region || 'Unknown',
          role: user.role.toUpperCase() as "CADRE" | "PUBLIC" | "ADMIN",
          date: user.enrollment_date ? new Date(user.enrollment_date).toLocaleDateString('en-GB') : 'N/A',
          status: (user.is_active ?? user.isActive) ? 'active' as const : 'inactive' as const,
        }));
        
        setUsers(mappedUsers);
        setTotalCount(response.total);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        // Fall back to sample data
        setUsers(allUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, role, query]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRegion = region === "All Regions" || u.region === region;
      return matchesRegion;
    });
  }, [users, region]);

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const paged = filtered;

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">User Management</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage members and their access levels</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-md border hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Upload</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-md bg-orange-500 text-white hover:bg-orange-600">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Member</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[260px]">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm"
          />
        </div>

        {/* Role dropdown */}
        <div className="relative sm:w-auto w-full">
          <select
            className="appearance-none pl-3 pr-8 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-gray-900 w-full sm:w-auto"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as (typeof roleOptions)[number]);
              setPage(1);
            }}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Region dropdown */}
        <div className="relative sm:w-auto w-full">
          <select
            className="appearance-none pl-3 pr-8 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-gray-900 w-full sm:w-auto"
            value={region}
            onChange={(e) => {
              setRegion(e.target.value as (typeof regionOptions)[number]);
              setPage(1);
            }}
          >
            {regionOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Table - Desktop, Cards - Mobile */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading users...</div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Region</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((u, idx) => (
                  <tr key={`${u.email}-${idx}`} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.contact}</td>
                    <td className="px-4 py-3 text-gray-700">{u.region}</td>
                    <td className="px-4 py-3">
                      <RolePill role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.date}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={u.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-2 rounded-md hover:bg-gray-100" aria-label="More actions">
                        <EllipsisVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>
                        No users match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {paged.map((u, idx) => (
                <div key={`${u.email}-${idx}`} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{u.email}</div>
                      <div className="text-sm text-gray-700 mt-1">{u.contact}</div>
                    </div>
                    <button className="p-2 rounded-md hover:bg-gray-100 flex-shrink-0" aria-label="More actions">
                      <EllipsisVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex-1 min-w-[120px]">
                      <span className="text-gray-500">Region:</span>
                      <span className="ml-2 text-gray-700">{u.region}</span>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2 text-gray-700">{u.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RolePill role={u.role} />
                    <StatusPill status={u.status} />
                  </div>
                </div>
              ))}
              {paged.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500">
                  No users match your filters.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
          Showing {(clampedPage - 1) * pageSize + 1}-{Math.min(clampedPage * pageSize, filtered.length)} of {totalCount.toLocaleString()}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 text-xs sm:text-sm rounded-md border hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={clampedPage <= 1}
          >
            Previous
          </button>
          <button
            className="px-3 py-2 text-xs sm:text-sm rounded-md border hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={clampedPage >= pageCount}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}