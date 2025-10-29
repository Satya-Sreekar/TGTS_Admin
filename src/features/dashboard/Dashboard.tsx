import { useState, useEffect } from "react";
import { Users, Activity, Megaphone, CalendarDays } from "lucide-react";
import StatCard from "../../components/StatCard";
import SectionCard from "../../components/SectionCard";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { adminService } from "../../services/adminService";
import type { DashboardStats } from "../../services/adminService";

const membershipGrowth = [
  { month: "Apr", value: 12450 },
  { month: "May", value: 12820 },
  { month: "Jun", value: 13150 },
  { month: "Jul", value: 13420 },
  { month: "Aug", value: 13700 },
  { month: "Sep", value: 14030 },
  { month: "Oct", value: 14280 }
];

const membersByRegion = [
  { name: "Warangal", value: 3200 },
  { name: "Hyderabad", value: 4100 },
  { name: "Nizamabad", value: 2100 },
  { name: "Karimnagar", value: 1800 },
  { name: "Others", value: 2400 }
];
const regionColors = ["#10B981", "#F59E0B", "#6366F1", "#EF4444", "#6B7280"];

const engagement = [
  { month: "Apr", value: 9800 },
  { month: "May", value: 10150 },
  { month: "Jun", value: 10420 },
  { month: "Jul", value: 10800 },
  { month: "Aug", value: 11350 },
  { month: "Sep", value: 11920 },
  { month: "Oct", value: 12450 }
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard data. Using sample data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }
  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of key metrics and activities</p>
        {error && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Stats */}
        <div className="col-span-12 grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <StatCard 
              icon={Users} 
              value={stats?.total_users.toLocaleString() || "15,428"} 
              label="Total Members" 
              delta="+12.5%" 
              trend="up" 
            />
          </div>
          <div className="col-span-3">
            <StatCard 
              icon={Activity} 
              value={stats?.active_users.toLocaleString() || "8,942"} 
              label="Active Users" 
              delta="+8.2%" 
              trend="up" 
            />
          </div>
          <div className="col-span-3">
            <StatCard 
              icon={Megaphone} 
              value={stats?.published_news.toLocaleString() || "124"} 
              label="Published News" 
              delta="+23.1%" 
              trend="up" 
            />
          </div>
          <div className="col-span-3">
            <StatCard 
              icon={CalendarDays} 
              value={stats?.upcoming_events.toString() || "42"} 
              label="Upcoming Events" 
              delta="-3" 
              trend="down" 
            />
          </div>
        </div>

        {/* Membership Growth */}
        <div className="col-span-7">
          <SectionCard title="Membership Growth">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={membershipGrowth}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Members by Region */}
        <div className="col-span-5">
          <SectionCard title="Members by Region">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={membersByRegion} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                    {membersByRegion.map((_, i) => (
                      <Cell key={i} fill={regionColors[i % regionColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* User Engagement */}
        <div className="col-span-7">
          <SectionCard title="User Engagement">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagement}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#6366F1" fill="#A5B4FC" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Recent Activity */}
        <div className="col-span-5">
          <SectionCard title="Recent Activity">
            <ul className="space-y-3">
              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                stats.recent_activity.slice(0, 3).map((activity, index) => (
                  <li key={index} className="flex items-start justify-between">
                    <div>
                      <div className="text-sm">{activity.title}</div>
                      <div className="text-xs text-gray-500">{activity.type}</div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start justify-between">
                    <div>
                      <div className="text-sm">New member enrolled</div>
                      <div className="text-xs text-gray-500">Rajesh Kumar · Hyderabad</div>
                    </div>
                    <span className="text-xs text-gray-500">2m ago</span>
                  </li>
                  <li className="flex items-start justify-between">
                    <div>
                      <div className="text-sm">Post pushed to 4 districts</div>
                      <div className="text-xs text-gray-500">Social team</div>
                    </div>
                    <span className="text-xs text-gray-500">15m ago</span>
                  </li>
                  <li className="flex items-start justify-between">
                    <div>
                      <div className="text-sm">Event created</div>
                      <div className="text-xs text-gray-500">Nizamabad · Roadshow</div>
                    </div>
                    <span className="text-xs text-gray-500">1h ago</span>
                  </li>
                </>
              )}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}