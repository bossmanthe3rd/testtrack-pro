import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestCaseById, updateTestCaseStatus } from '../services/testCaseApi';
import { useAuthStore } from '../features/auth/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, ChevronDown, CheckCircle2, AlertTriangle, Play, Edit, Clock, Tag, Box } from 'lucide-react';
import type { TestCase, TestStep, TestCaseStatus } from '../types/testCase';

// ── Status badge helper ────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    DRAFT:            'bg-slate-500/15 text-slate-400 border-slate-500/30',
    READY_FOR_REVIEW: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    APPROVED:         'bg-green-500/15 text-green-300 border-green-500/30',
    RETIRED:          'bg-red-500/15 text-red-300 border-red-500/30',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${map[status] ?? map.DRAFT}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// ── Priority badge helper ──────────────────────────────────────────────────────
const PriorityBadge = ({ priority }: { priority: string }) => {
  const map: Record<string, string> = {
    P1: 'bg-red-500/15 text-red-300 border-red-500/30',
    P2: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    P3: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    P4: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[priority] ?? 'bg-slate-500/15 text-slate-400'}`}>
      {priority}
    </span>
  );
};

export default function TestCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [testCase, setTestCase] = useState<TestCase | null>(null); 
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getTestCaseById(id);
        setTestCase(data);
      } catch (err: unknown) {
        console.error("Failed to load test case", err);
        setError("Failed to load test case details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || updating || !testCase) return;
    try {
      setUpdating(true);
      setError(null);
      await updateTestCaseStatus(id, newStatus);
      setTestCase((prev) => prev ? ({ ...prev, status: newStatus as TestCaseStatus }) : null);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || err.message || "Failed to update status.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
        Loading test case...
      </div>
    </div>
  );

  if (!testCase) {
    return (
      <div className="p-20 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Test Case not found</h2>
        <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
          {error || "The requested test case could not be located or has been decommissioned."}
        </p>
        <button 
          onClick={() => navigate('/test-cases')}
          className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all border border-slate-700"
        >
          Return to Repository
        </button>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const isTester = user?.role === 'TESTER';

  const getAvailableStatuses = () => {
    if (isAdmin) return ['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'RETIRED'];
    if (isTester) return ['READY_FOR_REVIEW'];
    return [];
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate('/test-cases')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Repository
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-indigo-400 font-bold">{testCase.testCaseId}</span>
            <StatusBadge status={testCase.status} />
            <PriorityBadge priority={testCase.priority} />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{testCase.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/test-cases/${id}/execute`)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Play className="h-4 w-4 fill-current" /> Execute Test
          </button>
          <button 
            onClick={() => navigate(`/test-cases/${id}/edit`)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl font-bold border border-slate-700 transition-all"
          >
            <Edit className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
                    <Box className="h-3 w-3" /> Module
                  </span>
                  <p className="text-sm font-semibold text-slate-200">{testCase.module}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
                    <Tag className="h-3 w-3" /> Type
                  </span>
                  <p className="text-sm font-semibold text-slate-200">{testCase.type}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
                    <Clock className="h-3 w-3" /> Estimated
                  </span>
                  <p className="text-sm font-semibold text-slate-200">{testCase.estimatedDuration || 0} mins</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
                    <Edit className="h-3 w-3" /> Version
                  </span>
                  <p className="text-sm font-semibold text-slate-200">v{testCase.version || 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/60 overflow-hidden">
            <CardHeader className="border-b border-slate-800/60 bg-slate-950/20">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Background & Context</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">Objective</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{testCase.description}</p>
              </div>

              {testCase.preConditions && (
                <div className="pt-4 border-t border-slate-800/40">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 italic">Pre-conditions</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{testCase.preConditions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/60 overflow-hidden">
            <CardHeader className="border-b border-slate-800/60 bg-slate-950/20 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Execution Blueprint</CardTitle>
              <span className="text-[10px] font-mono text-slate-500">{testCase.steps?.length || 0} Steps</span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/40">
                {testCase.steps?.map((step: TestStep, index: number) => (
                  <div key={index} className="p-6 hover:bg-slate-800/20 transition-colors group">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-grow space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Action</label>
                          <p className="text-slate-200 text-sm leading-relaxed font-bold">{step.action}</p>
                        </div>
                        {step.testData && (
                          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                            <label className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest block mb-1">Test Data</label>
                            <code className="text-indigo-300 text-xs font-mono">{step.testData}</code>
                          </div>
                        )}
                        <div className="pt-2">
                          <label className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest block mb-1">Expected Result</label>
                          <p className="text-emerald-400/90 text-sm font-medium">{step.expectedResult}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-indigo-500/30 shadow-xl shadow-indigo-500/5 overflow-hidden">
            <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/20">
              <CardTitle className="text-xs font-bold text-indigo-400 uppercase tracking-widest italic flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Governance & Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 text-red-400 text-xs animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block italic">Management Actions</label>
                  {availableStatuses.length > 0 ? (
                    <div className="space-y-3">
                      <div className="relative group">
                        <select
                          disabled={updating}
                          value={testCase.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition-all disabled:opacity-50 cursor-pointer hover:border-slate-500"
                        >
                          <option value={testCase.status}>{testCase.status.replace(/_/g, ' ')} (Current)</option>
                          {availableStatuses
                            .filter(s => s !== testCase.status)
                            .map(s => (
                              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                            ))
                          }
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                      </div>
                      {updating && (
                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
                          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce"></div>
                          Syncing with Core...
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No management actions available level.</p>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-800/60 space-y-4">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-500 uppercase tracking-widest italic">Clearance Level</span>
                    <span className="font-mono text-indigo-400 font-bold">{testCase.status === 'APPROVED' ? 'SR. TESTER / ADMIN' : 'TESTER'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-500 uppercase tracking-widest italic">Origin Representative</span>
                    <span className="font-bold text-white tracking-widest uppercase">{testCase.createdBy?.name || 'SYSTEM_CORE'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/40 border-slate-800/60 overflow-hidden">
            <CardHeader className="bg-slate-950/20 border-b border-slate-800/60">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Core Properties</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
               {[
                { label: 'Severity Index', value: testCase.severity },
                { label: 'Priority Matrix', value: testCase.priority },
                { label: 'Validation Protocol', value: testCase.type },
                { label: 'Temporal Signature', value: testCase.createdAt ? new Date(testCase.createdAt).toLocaleDateString() : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">{label}</span>
                  <span className="text-slate-200 text-[10px] font-bold text-right tracking-tight">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
