import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { executionApi } from '../services/executionApi';
import { Play, CheckCircle2, XCircle, AlertTriangle, SkipForward } from 'lucide-react';

interface ExecutionHistoryProps { testCaseId: string; }

interface ExecutionRecord {
  id: string;
  startedAt: string;
  executedBy?: { name: string };
  overallStatus: string;
  duration: number;
}

const STATUS_CFG: Record<string, { cls: string; icon: React.ReactNode }> = {
  PASS:    { cls: 'bg-green-500/15 text-green-300 border-green-500/30',   icon: <CheckCircle2 className="h-3 w-3" /> },
  FAIL:    { cls: 'bg-red-500/15 text-red-300 border-red-500/30',         icon: <XCircle className="h-3 w-3" /> },
  BLOCKED: { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',   icon: <AlertTriangle className="h-3 w-3" /> },
  SKIPPED: { cls: 'bg-slate-600/30 text-slate-400 border-slate-600/30',   icon: <SkipForward className="h-3 w-3" /> },
};

export default function ExecutionHistory({ testCaseId }: ExecutionHistoryProps) {
  const [history, setHistory] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!testCaseId) return;
    executionApi.getExecutionHistory(testCaseId)
      .then(setHistory)
      .catch((e) => console.error('Failed to load execution history', e))
      .finally(() => setLoading(false));
  }, [testCaseId]);

  if (loading) return (
    <div className="mt-8 flex items-center gap-2 text-slate-500 text-sm">
      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-indigo-400" />
      Loading history…
    </div>
  );

  return (
    <div className="mt-8 border-t border-slate-800 pt-6">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-slate-200">Execution History</h3>
          {history.length > 0 && (
            <span className="bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              Last {history.length} run{history.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <button
          onClick={() => navigate(`/test-cases/${testCaseId}/execute`)}
          className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        >
          <Play className="h-3.5 w-3.5" /> Re-Execute
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-slate-500 italic">This test case has not been executed yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tester</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Result</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.map(exec => {
                const cfg = STATUS_CFG[exec.overallStatus];
                return (
                  <tr key={exec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-slate-300 whitespace-nowrap">
                      {new Date(exec.startedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 whitespace-nowrap">
                      {exec.executedBy?.name ?? 'Unknown'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg?.cls ?? 'bg-slate-700 text-slate-400'}`}>
                        {cfg?.icon} {exec.overallStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 whitespace-nowrap">
                      {exec.duration != null
                        ? exec.duration >= 60
                          ? `${Math.floor(exec.duration / 60)}m ${exec.duration % 60}s`
                          : `${exec.duration}s`
                        : <span className="text-slate-600 italic text-xs">incomplete</span>}


                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}