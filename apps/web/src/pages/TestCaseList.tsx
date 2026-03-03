import React, { useState, useEffect } from 'react';
// NEW: Import useNavigate so we can redirect the user
import { useNavigate } from 'react-router-dom';
// NEW: Import cloneTestCase
import { getTestCases, cloneTestCase, type GetTestCasesFilters } from '../services/testCaseApi';
import type { TestCase, PaginationMeta } from '../types/testCase';

export const TestCaseList = () => {
  // NEW: Initialize the navigate hook
  const navigate = useNavigate();

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // State for our search and filters
  const [filters, setFilters] = useState<GetTestCasesFilters>({
    page: 1,
    limit: 10,
    search: '',
    priority: '',
    status: '',
    module: '',
  });

  // Fetch data whenever filters change
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
  }, [filters]);

  // Handler for filter changes
  const handleFilterChange = (key: keyof GetTestCasesFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 on filter change
  };

  // Handler for pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // NEW: Handler for cloning a test case
  const handleClone = async (id: string) => {
    // 1. Confirm with the user
    if (!window.confirm("Are you sure you want to clone this test case?")) return;

    try {
      // 2. Call the backend API
      const response = await cloneTestCase(id);
      
      // 3. Grab the new ID from the backend response
      const newTestCaseId = response.data.id;
      
      alert("Cloned successfully! Redirecting to edit page...");
      
      // 4. Redirect to the Edit page of the NEW test case
      navigate(`/test-cases/${newTestCaseId}/edit`);
    } catch (error) {
      console.error("Failed to clone:", error);
      alert("Failed to clone test case. Check console for details.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Test Cases</h1>
        <button 
          // NEW: You can wire this up to navigate to your create page!
          onClick={() => navigate('/test-cases/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition"
        >
          + Create Test Case
        </button>
      </div>

      {/* Filter Bar Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 border border-gray-100">
        <input
          type="text"
          placeholder="Search title or description..."
          className="border border-gray-300 rounded px-3 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select
          className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-700"
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="P1">P1 (Critical)</option>
          <option value="P2">P2 (High)</option>
          <option value="P3">P3 (Medium)</option>
          <option value="P4">P4 (Low)</option>
        </select>
        <select
          className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-700"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="REVIEW">Review</option>
          <option value="APPROVED">Approved</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wider border-b border-gray-200">
              <th className="py-4 px-6">ID</th>
              <th className="py-4 px-6">Title</th>
              <th className="py-4 px-6">Module</th>
              <th className="py-4 px-6">Priority</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Author</th>
              {/* NEW: Added an Actions column header */}
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  <div className="animate-pulse">Loading test cases...</div>
                </td>
              </tr>
            ) : testCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  No test cases found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              testCases.map((tc) => (
                <tr key={tc.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition duration-150">
                  <td className="py-4 px-6 font-medium text-gray-900">{tc.testCaseId}</td>
                  <td className="py-4 px-6 font-medium">{tc.title}</td>
                  <td className="py-4 px-6">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{tc.module}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      tc.priority === 'P1' ? 'bg-red-100 text-red-700' : 
                      tc.priority === 'P2' ? 'bg-orange-100 text-orange-700' : 
                      tc.priority === 'P3' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {tc.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      tc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      tc.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {tc.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500">{tc.createdBy?.name || "Unknown"}</td>
                  
                  {/* NEW: Added the Actions cell with the Clone button */}
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => handleClone(tc.id)}
                      className="bg-green-50 text-green-600 hover:bg-green-500 hover:text-white border border-green-200 px-3 py-1 rounded shadow-sm transition duration-150 text-xs font-semibold"
                    >
                      Clone
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-500">
            Showing Page <span className="font-medium text-gray-900">{meta.currentPage}</span> of <span className="font-medium text-gray-900">{meta.totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => handlePageChange(meta.currentPage - 1)}
              disabled={meta.currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                meta.currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              Previous
            </button>
            <button 
              onClick={() => handlePageChange(meta.currentPage + 1)}
              disabled={meta.currentPage === meta.totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                meta.currentPage === meta.totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
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