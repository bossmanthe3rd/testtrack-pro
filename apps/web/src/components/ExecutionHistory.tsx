import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { executionApi } from '../services/executionApi';

// "Props" are how we pass variables into a React component. 
// Here, we tell the component which test case to load history for.
interface ExecutionHistoryProps {
  testCaseId: string;
}

interface ExecutionRecord {
  id: string;
  startedAt: string;
  executedBy?: {
    name: string;
  };
  overallStatus: string;
  duration: number;
}

export default function ExecutionHistory({ testCaseId }: ExecutionHistoryProps) {
  const [history, setHistory] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch the history when this component appears on screen
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await executionApi.getExecutionHistory(testCaseId);
        setHistory(data);
      } catch (error) {
        console.error("Failed to load execution history", error);
      } finally {
        setLoading(false);
      }
    };

    if (testCaseId) {
      fetchHistory();
    }
  }, [testCaseId]);

  if (loading) return <div className="text-sm text-gray-500 mt-4">Loading history...</div>;

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Execution History</h3>
        {/* Button to re-execute the test case [cite: 229, 230] */}
        <button 
          onClick={() => navigate(`/test-cases/${testCaseId}/execute`)}
          className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-sm font-medium hover:bg-indigo-100"
        >
          ▶ Re-Execute
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-gray-500 italic">This test case has not been executed yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((execution) => (
                <tr key={execution.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(execution.startedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {execution.executedBy?.name || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {/* Color-code the status */}
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${execution.overallStatus === 'PASS' ? 'bg-green-100 text-green-800' : ''}
                      ${execution.overallStatus === 'FAIL' ? 'bg-red-100 text-red-800' : ''}
                      ${execution.overallStatus === 'BLOCKED' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${execution.overallStatus === 'SKIPPED' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {execution.overallStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {execution.duration} seconds
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}