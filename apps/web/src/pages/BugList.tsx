import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBugs, type Bug, type BugListResponse } from '../services/bugApi';
import { Card, CardContent } from '../components/ui/card';

// ── Badge helpers ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    NEW:         'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    OPEN:        'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    IN_PROGRESS: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
    FIXED:       'bg-green-500/15 text-green-300 border border-green-500/30',
    VERIFIED:    'bg-teal-500/15 text-teal-300 border border-teal-500/30',
    CLOSED:      'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] ?? styles.CLOSED}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const styles: Record<string, string> = {
    BLOCKER:  'bg-red-600/20 text-red-300 border border-red-500/40',
    CRITICAL: 'bg-red-500/15 text-red-300 border border-red-500/30',
    MAJOR:    'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    MINOR:    'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
    TRIVIAL:  'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[severity] ?? styles.TRIVIAL}`}>
      {severity}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles: Record<string, string> = {
    P1: 'text-red-400 font-bold',
    P2: 'text-orange-400 font-semibold',
    P3: 'text-yellow-400',
    P4: 'text-slate-400',
  };
  return <span className={`text-xs ${styles[priority] ?? 'text-slate-400'}`}>{priority}</span>;
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function BugList() {
  const navigate = useNavigate();

  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  useEffect(() => {
    const fetchBugs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response: BugListResponse = await getBugs({
          page,
          limit: 10,
          status: statusFilter,
          severity: severityFilter,
          priority: priorityFilter,
        });

        setBugs(response.data);
        setTotalPages(response.pagination.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch bugs:", err);
        setError("Failed to load bugs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBugs();
  }, [page, statusFilter, severityFilter, priorityFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectClass = "bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-sm font-medium text-red-400 uppercase tracking-widest mb-1">Tracker</p>
          <h1 className="text-4xl font-bold text-white">Bug Tracker</h1>
        </div>
        <button
          onClick={() => navigate('/bugs/create')}
          className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-red-900/30 text-sm"
        >
          + Report New Bug
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <Card className="bg-slate-900/60 border-slate-800 mb-6">
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-6 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Status</label>
              <select
                className={selectClass}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="FIXED">Fixed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Severity</label>
              <select
                className={selectClass}
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Severities</option>
                <option value="BLOCKER">Blocker</option>
                <option value="CRITICAL">Critical</option>
                <option value="MAJOR">Major</option>
                <option value="MINOR">Minor</option>
                <option value="TRIVIAL">Trivial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Priority</label>
              <select
                className={selectClass}
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Priorities</option>
                <option value="P1">P1 — Urgent</option>
                <option value="P2">P2 — High</option>
                <option value="P3">P3 — Medium</option>
                <option value="P4">P4 — Low</option>
              </select>
            </div>

            <div className="flex items-end pb-0.5">
              <button
                onClick={() => { setStatusFilter(''); setSeverityFilter(''); setPriorityFilter(''); setPage(1); }}
                className="text-sm text-slate-400 hover:text-indigo-400 transition-colors underline-offset-2 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-400 bg-red-500/5">{error}</div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
            Loading bugs...
          </div>
        ) : bugs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No bugs found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bug ID</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned To</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bugs.map((bug) => (
                  <tr
                    key={bug.id}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/bugs/${bug.id}`)}
                  >
                    <td className="p-4">
                      <span className="text-sm font-mono text-indigo-400">{bug.bugId}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-200 max-w-xs truncate">{bug.title}</td>
                    <td className="p-4">
                      <SeverityBadge severity={bug.severity} />
                    </td>
                    <td className="p-4">
                      <PriorityBadge priority={bug.priority} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={bug.status} />
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {bug.assignedTo ? bug.assignedTo.name : <span className="text-slate-600 italic">Unassigned</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-500">{formatDate(bug.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Pagination ── */}
      {!loading && bugs.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-slate-400">
            Page <span className="font-medium text-slate-200">{page}</span> of{' '}
            <span className="font-medium text-slate-200">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}