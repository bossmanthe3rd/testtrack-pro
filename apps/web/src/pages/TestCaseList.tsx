import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TestCase, PaginationMeta } from '../types/testCase';
import { getTestCases, cloneTestCase, deleteTestCase, type GetTestCasesFilters } from '../services/testCaseApi';
import { Card, CardContent } from '../components/ui/card';

// ── Badge helpers ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    APPROVED:         'bg-green-500/15 text-green-300 border border-green-500/30',
    READY_FOR_REVIEW: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
    DRAFT:            'bg-slate-500/15 text-slate-400 border border-slate-500/30',
    RETIRED:          'bg-red-500/15 text-red-300 border border-red-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] ?? styles.DRAFT}`}>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles: Record<string, string> = {
    P1: 'bg-red-500/15 text-red-300 border border-red-500/30',
    P2: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    P3: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
    P4: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[priority] ?? 'bg-slate-500/15 text-slate-400'}`}>
      {priority}
    </span>
  );
};

// ── Component ──────────────────────────────────────────────────────────────────

export const TestCaseList = () => {
  const navigate = useNavigate();

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // NEW: State to trigger a re-fetch when an item is deleted
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State for our search and filters
  const [filters, setFilters] = useState<GetTestCasesFilters>({
    page: 1,
    limit: 10,
    search: '',
    priority: '',
    status: '',
    module: '',
  });

  // Fetch data whenever filters OR refreshTrigger change
  useEffect(() => {
    const fetchTestCases = async () => {
      setIsLoading(true);
      try {
        const response = await getTestCases(filters);
        setTestCases(response.data);
        setMeta(response.meta);
      } catch (error) {
        console.error("Failed to fetch test cases:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce to prevent spamming the backend while typing
    const delayDebounceFn = setTimeout(() => {
      fetchTestCases();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [filters, refreshTrigger]); // NEW: Added refreshTrigger here!

  // Handler for filter changes
  const handleFilterChange = (key: keyof GetTestCasesFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 on filter change
  };

  // Handler for pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handler for cloning a test case
  const handleClone = async (id: string) => {
  // 1. Guard Clause: Ensure a valid string ID was actually passed
  if (!id || typeof id !== 'string') {
    console.error("Clone failed: Invalid ID provided. Make sure you are passing testCase.id");
    return;
  }

  if (!window.confirm("Are you sure you want to clone this test case?")) return;

  try {
    const response = await cloneTestCase(id);
    
    // The service already unwraps the API envelope, so `response` is a plain TestCase.
    const newTestCaseId = response?.id;

    if (!newTestCaseId) {
       throw new Error("Could not find the new test case ID in the server response.");
    }

    alert("Cloned successfully! Redirecting to edit page...");
    navigate(`/test-cases/${newTestCaseId}/edit`);
  } catch (error) {
    console.error("Failed to clone:", error);
    alert("Failed to clone test case. Check console for details.");
  }
};

  // NEW: Handler for deleting a test case
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test case? This cannot be easily undone.")) {
      return;
    }

    try {
      await deleteTestCase(id);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete test case.");
    }
  };

  const selectClass = "bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-4xl font-bold text-white">Test Cases</h1>
        </div>
        <button
          onClick={() => navigate('/test-cases/create')}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-900/30 text-sm"
        >
          + Create Test Case
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <Card className="bg-slate-900/60 border-slate-800 mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-grow">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Search</label>
              <input
                type="text"
                placeholder="Search title or description..."
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Priority</label>
              <select className={selectClass} value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
                <option value="">All Priorities</option>
                <option value="P1">P1 (Critical)</option>
                <option value="P2">P2 (High)</option>
                <option value="P3">P3 (Medium)</option>
                <option value="P4">P4 (Low)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Status</label>
              <select className={selectClass} value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="READY_FOR_REVIEW">Ready for Review</option>
                <option value="APPROVED">Approved</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Data Table ── */}
      <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Module</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Author</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                      Loading test cases...
                    </div>
                  </td>
                </tr>
              ) : testCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    No test cases found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                testCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-800/50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <span className="text-sm font-mono text-indigo-400">{tc.testCaseId}</span>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-200 max-w-xs truncate">{tc.title}</td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs">{tc.module}</span>
                    </td>
                    <td className="py-4 px-6">
                      <PriorityBadge priority={tc.priority} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={tc.status} />
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-400">{tc.createdBy?.name || "Unknown"}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/test-cases/${tc.id}`)}
                          className="bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600 px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/test-cases/${tc.id}/edit`)}
                          className="bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleClone(tc.id)}
                          className="bg-green-500/10 text-green-300 hover:bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                        >
                          Clone
                        </button>
                        <button
                          onClick={() => handleDelete(tc.id)}
                          className="bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-md text-xs font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Pagination ── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-slate-400">
            Page <span className="font-medium text-slate-200">{meta.currentPage}</span> of{' '}
            <span className="font-medium text-slate-200">{meta.totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(meta.currentPage - 1)}
              disabled={meta.currentPage === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg transition bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(meta.currentPage + 1)}
              disabled={meta.currentPage === meta.totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg transition bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseList;