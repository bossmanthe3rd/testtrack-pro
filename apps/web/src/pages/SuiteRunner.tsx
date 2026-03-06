import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { startSuiteRun, getSuiteReport } from '../services/testSuiteApi';
import { api } from '../services/api';
import { Play, Pause, Clock, AlertCircle } from 'lucide-react';
import CreateBugModal from '../components/CreateBugModal';

interface TestCaseRef {
  id: string;
  steps?: TestStep[];
}

interface TestStep {
  id: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
}

interface TestCaseDetails {
  id: string;
  title: string;
  testCaseId: string;
  description?: string;
  steps?: TestStep[];
}

interface StepResult {
  status: string;
  actualResult: string;
}

interface SuiteReport {
  testRunName: string;
  metrics: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
  };
}

export default function SuiteRunner() {
  const { suiteId } = useParams<{ suiteId: string }>();

  const [testRunId, setTestRunId] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCaseRef[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [currentTestCaseDetails, setCurrentTestCaseDetails] = useState<TestCaseDetails | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<string, StepResult>>({});
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const [isFinished, setIsFinished] = useState(false);
  const [finalReport, setFinalReport] = useState<SuiteReport | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalStepsInSuite, setTotalStepsInSuite] = useState(0);


  // BUG MODAL STATE
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [bugContext, setBugContext] = useState<{
    stepNumber: number;
    expected: string;
    actual: string;
    stepsToReproduce: string;
    executionStepId?: string;
  } | null>(null);

  // STEP MAPPING: stepNumber -> executionStepId
  const [stepMapping, setStepMapping] = useState<Record<number, string>>({});

  useEffect(() => {
    const initializeRun = async () => {
      try {
        if (!suiteId) return;
        const result = await startSuiteRun(suiteId);
        setTestRunId(result.testRunId);
        setTestCases(result.testCases);
        
        // Calculate total steps for granular progress
        const totalSteps = result.testCases.reduce((acc: number, tc: TestCaseRef) => acc + (tc.steps?.length || 0), 0);
        setTotalStepsInSuite(totalSteps);

        setLoading(false);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e.response?.data?.message || 'Failed to start suite run');
        setLoading(false);
      }
    };
    initializeRun();
  }, [suiteId]);

  useEffect(() => {
    const loadCurrentTestCase = async () => {
      if (testCases.length === 0 || currentIndex >= testCases.length || !testRunId) return;
      
      try {
        setLoading(true);
        const tcId = testCases[currentIndex].id;
        
        const tcResponse = await api.get(`/api/test-cases/${tcId}`);
        setCurrentTestCaseDetails(tcResponse.data.data || tcResponse.data);
        
        const execResponse = await api.post(`/api/executions/start`, {
          testCaseId: tcId,
          testRunId: testRunId
        });
        
        setCurrentExecutionId(execResponse.data.id || execResponse.data.data?.id);
        
        // Map execution steps for immediate updates
        const execSteps = execResponse.data.steps || execResponse.data.data?.steps || [];
        const mapping: Record<number, string> = {};
        execSteps.forEach((s: { stepNumber: number; id: string }) => {
          mapping[s.stepNumber] = s.id;
        });
        setStepMapping(mapping);

        setStepResults({}); 
        
        // NEW: Reset and start the timer for the new test case
        setElapsedSeconds(0);
        setIsPaused(false);
        
        setLoading(false);
      } catch {
        setError('Failed to load test case details');
        setLoading(false);
      }
    };

    loadCurrentTestCase();
  }, [currentIndex, testCases, testRunId]);

  // --- NEW: THE LIVE TICKER EFFECT ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    // Only tick if we are actively viewing a test case, not paused, and not loading
    if (currentTestCaseDetails && !isPaused && !isFinished && !loading) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    // Cleanup the interval when the component unmounts or state changes
    return () => clearInterval(interval);
  }, [currentTestCaseDetails, isPaused, isFinished, loading]);

  useEffect(() => {
    const fetchReport = async () => {
      if (isFinished && testRunId) {
        try {
          const report = await getSuiteReport(testRunId);
          setFinalReport(report);
        } catch (err: unknown) {
          console.error("Failed to fetch report", err);
        }
      }
    };
    fetchReport();
  }, [isFinished, testRunId]);

  const handleStepUpdate = async (stepNumber: number, stepId: string, status: string, actualResult: string) => {
    const executionStepId = stepMapping[stepNumber];
    if (!executionStepId) return;

    try {
      // Immediate persistence
      await api.patch(`/api/executions/steps/${executionStepId}`, {
        status,
        actualResult
      });

      // Update local state for UI feedback
      setStepResults(prev => ({
        ...prev,
        [stepId]: { status, actualResult }
      }));
    } catch (err) {
      console.error("Failed to update step", err);
    }
  };

  const openBugModal = (step: TestStep) => {
    const result = stepResults[step.id] || { status: 'FAIL', actualResult: '' };
    setBugContext({
      stepNumber: step.stepNumber,
      expected: step.expectedResult,
      actual: result.actualResult,
      stepsToReproduce: `1. ${step.action}`,
      executionStepId: stepMapping[step.stepNumber]
    });
    setIsBugModalOpen(true);
  };

  const completeCurrentTestAndAdvance = async () => {
    if (!currentExecutionId || !currentTestCaseDetails) return;
    
    try {
      setLoading(true);
      
      // Note: We don't need to save steps here anymore as they are updated immediately
      // But we call complete to aggregate overall status and duration


      // Note: For a true enterprise app, you would also pass `elapsedSeconds` 
      // in this body so the backend uses the paused time instead of raw timestamps!
      await api.post(`/api/executions/${currentExecutionId}/complete`, {
        durationOverride: elapsedSeconds
      });

      if (currentIndex + 1 < testCases.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsFinished(true); 
      }
    } catch {
      setError('Failed to save execution results');
      setLoading(false);
    }
  };

  // Helper to format seconds into MM:SS
  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading && !currentTestCaseDetails && !isFinished) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
          <span className="text-lg font-medium">Initializing Suite Execution Engine…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <p className="font-bold text-base mb-1">Something went wrong</p>
          {error}
        </div>
      </div>
    );
  }

  if (isFinished && finalReport) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-3xl mx-auto p-8 pt-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full mb-5">
              <span className="text-4xl">🏁</span>
            </div>
            <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-2">Suite Complete</p>
            <h1 className="text-4xl font-bold text-white mb-2">Suite Execution Complete!</h1>
            <p className="text-slate-400">{finalReport.testRunName}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total</p>
              <p className="text-4xl font-black text-white">{finalReport.metrics.total}</p>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 text-center">
              <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Passed</p>
              <p className="text-4xl font-black text-green-400">{finalReport.metrics.passed}</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 text-center">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Failed</p>
              <p className="text-4xl font-black text-red-400">{finalReport.metrics.failed}</p>
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5 text-center">
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">Blocked</p>
              <p className="text-4xl font-black text-yellow-400">{finalReport.metrics.blocked}</p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/test-suites"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-900/30 transition-all"
            >
              Return to Test Suites
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (currentTestCaseDetails) {
    const isLastTest = currentIndex === testCases.length - 1;
    
    // Calculate completed steps overall
    const stepsInPreviousTests = testCases.slice(0, currentIndex).reduce((acc, tc) => acc + (tc.steps?.length || 0), 0);
    const stepsInCurrentTest = Object.keys(stepResults).length;
    const totalCompletedSteps = stepsInPreviousTests + stepsInCurrentTest;
    
    const progressPercentage = totalStepsInSuite > 0 ? (totalCompletedSteps / totalStepsInSuite) * 100 : 0;


    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-5xl mx-auto p-8">

          {/* ── Header ── */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">
                Suite Runner — Sequential Execution
              </p>
              <h1 className="text-3xl font-bold text-white">{currentTestCaseDetails.title}</h1>
              <p className="text-sm font-mono text-slate-500 mt-1">{currentTestCaseDetails.testCaseId}</p>
            </div>
            <Link to="/test-suites" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors mt-2">
              ← Test Suites
            </Link>
          </div>

          {/* ── Progress + Timer bar ── */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Test {currentIndex + 1} of {testCases.length}
                </span>
                <span className="text-xs text-slate-500">{Math.round(progressPercentage)}% complete</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5">
                <div
                  className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-700 px-4 py-2 rounded-lg shrink-0">
              <Clock className={`h-5 w-5 ${isPaused ? 'text-amber-400' : 'text-indigo-400 animate-pulse'}`} />
              <span className={`text-2xl font-mono font-bold tabular-nums ${isPaused ? 'text-amber-400' : 'text-white'}`}>
                {formatTime(elapsedSeconds)}
              </span>
              <div className="h-6 w-px bg-slate-700 mx-1" />
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 rounded-lg transition-all ${isPaused ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                title={isPaused ? 'Resume Timer' : 'Pause Timer'}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* ── Steps ── */}
          {(currentTestCaseDetails.steps?.length ?? 0) === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-500 italic">
              No steps defined for this test case.
            </div>
          ) : (
            <div className={`space-y-5 transition-opacity duration-300 ${isPaused ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {currentTestCaseDetails.steps?.map((step: TestStep) => (
                <div key={step.id} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">

                  {/* Step ribbon */}
                  <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-3 flex items-center gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                      {step.stepNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step.stepNumber}</span>
                    <span className="text-slate-600">›</span>
                    <span className="text-xs text-slate-500 truncate">{step.action}</span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Action + Expected */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Action</p>
                        <p className="text-sm text-slate-200 leading-relaxed">{step.action}</p>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expected Result</p>
                        <p className="text-sm text-emerald-300 leading-relaxed">{step.expectedResult}</p>
                      </div>
                    </div>

                    {/* Actual Result */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Actual Result
                      </label>
                      <textarea
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows={2}
                        placeholder="What actually happened?"
                        value={stepResults[step.id]?.actualResult || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStepResults(prev => ({
                            ...prev,
                            [step.id]: { ...(prev[step.id] || { status: 'BLOCKED' }), actualResult: val }
                          }));
                        }}
                        onBlur={(e) => {
                          const result = stepResults[step.id] || { status: 'BLOCKED', actualResult: '' };
                          handleStepUpdate(step.stepNumber, step.id, result.status, e.target.value);
                        }}
                      />
                    </div>

                    {/* PASS / FAIL / BLOCKED */}
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => handleStepUpdate(step.stepNumber, step.id, 'PASS', stepResults[step.id]?.actualResult || '')}
                        className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl font-bold text-sm transition-all ${stepResults[step.id]?.status === 'PASS' ? 'bg-green-500/25 text-green-300 border-green-400/60' : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'}`}
                      >
                        ✓ PASS
                      </button>
                      <button
                        onClick={() => handleStepUpdate(step.stepNumber, step.id, 'FAIL', stepResults[step.id]?.actualResult || '')}
                        className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl font-bold text-sm transition-all ${stepResults[step.id]?.status === 'FAIL' ? 'bg-red-500/25 text-red-300 border-red-400/60' : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'}`}
                      >
                        ✕ FAIL
                      </button>
                      <button
                        onClick={() => handleStepUpdate(step.stepNumber, step.id, 'BLOCKED', stepResults[step.id]?.actualResult || '')}
                        className={`flex items-center gap-2 px-5 py-2.5 border rounded-xl font-bold text-sm transition-all ${stepResults[step.id]?.status === 'BLOCKED' ? 'bg-yellow-500/25 text-yellow-300 border-yellow-400/60' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20'}`}
                      >
                        ⏸ BLOCKED
                      </button>

                      {stepResults[step.id]?.status === 'FAIL' && (
                        <button
                          onClick={() => openBugModal(step)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-900/20 ml-auto"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Create Bug
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Footer CTA ── */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
            <button
              onClick={completeCurrentTestAndAdvance}
              disabled={loading || isPaused}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Saving…' : isLastTest ? 'Finish Suite Execution 🏁' : 'Save & Next Test Case →'}
            </button>
          </div>

          {/* ── Modal ── */}
          {bugContext && (
            <CreateBugModal
              isOpen={isBugModalOpen}
              onClose={() => setIsBugModalOpen(false)}
              testCaseId={currentTestCaseDetails.id}
              testCaseDisplayId={currentTestCaseDetails.testCaseId}
              stepNumber={bugContext.stepNumber}
              expectedBehavior={bugContext.expected}
              actualBehavior={bugContext.actual}
              stepsToReproduce={bugContext.stepsToReproduce}
              executionStepId={bugContext.executionStepId}
            />
          )}

        </div>
      </div>
    );
  }

  return null;
}
