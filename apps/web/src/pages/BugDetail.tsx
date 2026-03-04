import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBugById, updateBugStatus } from '../services/bugApi';
import type { Bug } from '../services/bugApi';
// 🟢 NEW: Import your auth store to know who is logged in
import { useAuthStore } from '../features/auth/authStore';

export default function BugDetail() {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();
  
  // 🟢 NEW: Get the current user from Zustand state
  const { user } = useAuthStore();
  const isDeveloper = user?.role === 'DEVELOPER';
  const isTester = user?.role === 'TESTER';
  
  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const [fixNotes, setFixNotes] = useState('');
  const [commitHash, setCommitHash] = useState('');
  // 🟢 NEW: Notes for when a tester reopens a bug
  const [reopenNotes, setReopenNotes] = useState('');

  useEffect(() => {
    const fetchBugData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getBugById(id);
        setBug(data);
      } catch (err) {
        console.error("Failed to load bug", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBugData();
  }, [id]);

  const handleStatusChange = async (newStatus: Bug['status']) => {
    if (!bug || !id) return;
    
    // Developer validation
    if (newStatus === 'FIXED' && !fixNotes.trim()) {
      setActionError("Fix notes are required when marking a bug as fixed.");
      return;
    }

    // Tester validation
    if (newStatus === 'REOPENED' && !reopenNotes.trim()) {
      setActionError("Please provide a reason for reopening this bug.");
      return;
    }

    try {
      setActionError(null);
      
      // We pass fixNotes if the Developer is fixing it.
      // We pass reopenNotes (as fixNotes) if the Tester is reopening it, so the dev knows why.
      const payloadNotes = newStatus === 'FIXED' ? fixNotes : newStatus === 'REOPENED' ? reopenNotes : undefined;

      const updatedBug = await updateBugStatus(id, {
        status: newStatus,
        fixNotes: payloadNotes,
        commitHash: newStatus === 'FIXED' ? commitHash : undefined,
      });
      
      setBug(updatedBug);
      
      if (newStatus === 'FIXED') {
        setFixNotes('');
        setCommitHash('');
      }
      if (newStatus === 'REOPENED') {
        setReopenNotes('');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setActionError(e.response?.data?.message || 'Failed to update status.');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading bug details...</div>;
  if (!bug) return <div className="p-10 text-center text-red-600">Bug not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline mb-4 block">
        ← Back to List
      </button>

      {/* Header Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {bug.bugId}: {bug.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Current Status: <span className="font-bold text-black">{bug.status}</span></p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm mt-6">
          <div><span className="font-medium text-gray-700">Severity:</span> {bug.severity}</div>
          <div><span className="font-medium text-gray-700">Priority:</span> {bug.priority}</div>
          <div><span className="font-medium text-gray-700">Environment:</span> {bug.environment}</div>
          <div><span className="font-medium text-gray-700">Affected Version:</span> {bug.affectedVersion}</div>
        </div>
      </div>

      {/* Detailed Content */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 border-b pb-2 mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{bug.description}</p>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 border-b pb-2 mb-2">Steps to Reproduce</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{bug.stepsToReproduce}</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="font-bold text-green-900 mb-2">Expected Behavior</h3>
            <p className="text-green-800 text-sm whitespace-pre-wrap">{bug.expectedBehavior}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-md">
            <h3 className="font-bold text-red-900 mb-2">Actual Behavior</h3>
            <p className="text-red-800 text-sm whitespace-pre-wrap">{bug.actualBehavior}</p>
          </div>
        </div>
      </div>

      {/* 🟢 WORKFLOW CONTROLS 🟢 */}
      <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200">
        <h2 className="text-lg font-bold text-blue-900 mb-4">Workflow Actions</h2>
        
        {actionError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{actionError}</div>}

        <div className="flex flex-wrap gap-3">
          
          {/* =========================================
              DEVELOPER ACTIONS
              ========================================= */}
          {isDeveloper && (
            <>
              {bug.status === 'NEW' && (
                <>
                  <button onClick={() => handleStatusChange('OPEN')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Accept Bug</button>
                  <button onClick={() => handleStatusChange('DUPLICATE')} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium">Mark Duplicate</button>
                  <button onClick={() => handleStatusChange('WONT_FIX')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">Won't Fix</button>
                </>
              )}

              {bug.status === 'OPEN' && (
                <button onClick={() => handleStatusChange('IN_PROGRESS')} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-medium">Start Work (In Progress)</button>
              )}

              {(bug.status === 'IN_PROGRESS' || bug.status === 'REOPENED') && (
                <div className="w-full space-y-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fix Notes (Required)</label>
                    <textarea 
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border" 
                      rows={3} 
                      placeholder="Explain what you fixed..."
                      value={fixNotes}
                      onChange={(e) => setFixNotes(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commit Hash (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                      placeholder="e.g. 7a9b8c"
                      value={commitHash}
                      onChange={(e) => setCommitHash(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => handleStatusChange('FIXED')} 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                  >
                    Mark as Fixed & Request Retest
                  </button>
                </div>
              )}

              {bug.status === 'FIXED' && (
                <div className="text-green-800 font-medium flex items-center gap-2">
                  <span>✓ Awaiting QA Verification. You fixed this!</span>
                  {(bug.fixNotes) && <span className="text-sm text-gray-600 block mt-1">Notes: {bug.fixNotes}</span>}
                </div>
              )}
            </>
          )}

          {/* =========================================
              TESTER (QA) ACTIONS
              ========================================= */}
          {isTester && (
            <>
              {bug.status === 'FIXED' && (
                <div className="w-full space-y-4">
                  <div className="p-4 bg-green-100 rounded text-green-800 mb-4 border border-green-200">
                    <strong>Developer Fix Notes:</strong> {bug.fixNotes || "No notes provided."}
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={() => handleStatusChange('VERIFIED')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                      Verify Fix
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Still Broken? (Reason required)</label>
                    <textarea 
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border mb-2" 
                      rows={2} 
                      placeholder="Explain why it's still failing..."
                      value={reopenNotes}
                      onChange={(e) => setReopenNotes(e.target.value)}
                    />
                    <button onClick={() => handleStatusChange('REOPENED')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">
                      Reopen Bug
                    </button>
                  </div>
                </div>
              )}

              {bug.status === 'VERIFIED' && (
                <button onClick={() => handleStatusChange('CLOSED')} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 font-medium">
                  Close Bug
                </button>
              )}

              {bug.status === 'CLOSED' && (
                <div className="text-gray-600 font-medium">
                  This bug has been closed.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}