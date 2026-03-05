import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBugs } from '../services/bugApi';
import { getDeveloperMetrics } from '../services/reportsApi';
import type { Bug } from '../services/bugApi';
import type { DeveloperPerformance } from '../services/reportsApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ClipboardList, CheckSquare, Timer, ShieldCheck } from 'lucide-react';

export default function DeveloperDashboard() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [devMetrics, setDevMetrics] = useState<DeveloperPerformance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const metrics = await getDeveloperMetrics();
        setDevMetrics(metrics);
      } catch (err) {
        console.error("Failed to load developer metrics", err);
      }
    };
    fetchMetrics();
  }, []);

  const fetchMyBugsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyBugs({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined
      });
      setBugs(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to fetch your bugs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBugsData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  const getStatusBadge = (status: Bug['status']) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
      case 'OPEN': return 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30';
      case 'IN_PROGRESS': return 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30';
      case 'FIXED': return 'bg-green-500/15 text-green-300 border border-green-500/30';
      case 'VERIFIED': case 'CLOSED': return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
      default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'P1': return 'text-red-400 font-bold';
      case 'P2': return 'text-orange-400 font-semibold';
      case 'P3': return 'text-yellow-400';
      case 'P4': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-8">

        {/* ── PAGE HEADER ── */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">Developer</p>
            <h1 className="text-4xl font-bold text-white">Developer Dashboard</h1>
            <p className="text-slate-400 mt-2">Your assigned bugs and performance at a glance.</p>
          </div>
          <Link
            to="/dashboard"
            className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 mt-2"
          >
            ← Main Dashboard
          </Link>
        </div>

        {/* ── BENTO GRID — METRICS ── */}
        {devMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Assigned</CardTitle>
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <ClipboardList className="h-4 w-4 text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{devMetrics.bugsAssigned}</p>
                <p className="text-xs text-slate-500 mt-1">Bugs assigned to you</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Resolved</CardTitle>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckSquare className="h-4 w-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-400">{devMetrics.bugsResolved}</p>
                <p className="text-xs text-slate-500 mt-1">Successfully fixed</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Avg Resolution</CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Timer className="h-4 w-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{devMetrics.averageResolutionHours}<span className="text-sm font-medium text-slate-500 ml-1">hrs</span></p>
                <p className="text-xs text-slate-500 mt-1">Average time to fix</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Fix Quality Score</CardTitle>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-400">{devMetrics.fixQualityScore}%</p>
                <p className="text-xs text-slate-500 mt-1">No-regression rate</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── FILTERS ── */}
        <Card className="bg-slate-900/60 border-slate-800 mb-6">
          <CardContent className="pt-5">
            <div className="flex flex-wrap gap-6 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <select
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="FIXED">Fixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                <select
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="P1">P1 — Urgent</option>
                  <option value="P2">P2 — High</option>
                  <option value="P3">P3 — Medium</option>
                  <option value="P4">P4 — Low</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── BUG TABLE ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        ) : bugs.length === 0 ? (
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CheckSquare className="h-12 w-12 text-green-400 mb-4 opacity-70" />
              <p className="text-slate-300 font-medium">All clear!</p>
              <p className="text-slate-500 text-sm mt-1">No bugs match these filters. Great work!</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Bug ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bugs.map((bug) => (
                    <tr key={bug.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-indigo-400">{bug.bugId}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-200 max-w-xs truncate">{bug.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getPriorityBadge(bug.priority)}`}>{bug.priority}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(bug.status)}`}>
                          {bug.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/bugs/${bug.id}`}
                          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}