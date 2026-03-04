import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBugs, type Bug, type BugListResponse } from '../services/bugApi';

export default function BugList() {
  const navigate = useNavigate(); // Added navigation hook
  
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

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      
      {/* HEADER WITH NEW BUTTON */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bug Tracker</h1>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-sm text-indigo-600 hover:underline mt-1"
          >
            &larr; Back to Dashboard
          </button>
        </div>
        
        <button 
          onClick={() => navigate('/bugs/create')}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold shadow-md transition"
        >
          + Report New Bug
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Status</label>
          <select 
            className="border p-2 rounded text-sm w-40"
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
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Severity</label>
          <select 
            className="border p-2 rounded text-sm w-40"
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
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Priority</label>
          <select 
            className="border p-2 rounded text-sm w-40"
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 - Urgent</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>
        </div>

        <div className="flex items-end">
          <button 
            onClick={() => {
              setStatusFilter('');
              setSeverityFilter('');
              setPriorityFilter('');
              setPage(1);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline pb-2"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : loading ? (
          <div className="p-8 text-center text-gray-500">Loading bugs...</div>
        ) : bugs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No bugs found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-sm text-gray-600">
                  <th className="p-4 font-semibold">Bug ID</th>
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Severity / Priority</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Assigned To</th>
                  <th className="p-4 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {bugs.map((bug) => (
                  <tr key={bug.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-blue-600">{bug.bugId}</td>
                    <td className="p-4 text-gray-800">{bug.title}</td>
                    <td className="p-4">
                      <div className="text-xs font-bold text-red-600">{bug.severity}</div>
                      <div className="text-xs text-gray-500">{bug.priority}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 border rounded text-xs font-medium">
                        {bug.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {bug.assignedTo ? bug.assignedTo.name : 'Unassigned'}
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(bug.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Section */}
      {!loading && bugs.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button 
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}