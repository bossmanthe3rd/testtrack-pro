import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestCaseById } from '../services/testCaseApi';
import { executionApi } from '../services/executionApi';
import CreateBugModal from '../components/CreateBugModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Clock, CheckCircle2, XCircle, AlertTriangle, SkipForward, Bug, ChevronRight } from 'lucide-react';

interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
}

interface TestCaseDetails {
  title: string;
  testCaseId: string;
  steps?: TestStep[];
}

export default function ExecuteTestCase() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── State (ALL UNCHANGED) ──────────────────────────────────────────────────
  const [testCase, setTestCase] = useState<TestCaseDetails | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [actualResult, setActualResult] = useState('');
  const [notes, setNotes] = useState('');
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [failedStepData, setFailedStepData] = useState<{
    stepNumber: number;
    expectedBehavior: string;
    actualBehavior: string;
    action: string;
  } | null>(null);
  const hasStarted = useRef(false);

  // ── useEffect: init execution (UNCHANGED) ─────────────────────────────────
  useEffect(() => {
    const initializeExecution = async () => {
      if (!id || hasStarted.current) return;
      hasStarted.current = true;
      try {
        const fetchedTestCase = await getTestCaseById(id);
        setTestCase(fetchedTestCase);
        const execution = await executionApi.startExecution(id);
        setExecutionId(execution.id);
        setIsRunning(true);
      } catch (error) {
        console.error("Failed to initialize execution:", error);
        alert("Could not start execution. Check console.");
      }
    };
    initializeExecution();
  }, [id]);

  // ── useEffect: timer (UNCHANGED) ──────────────────────────────────────────
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (isRunning) {
      intervalId = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning]);

  // ── handleStepSubmit (UNCHANGED) ──────────────────────────────────────────
  const handleStepSubmit = async (stepNumber: number, status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED') => {
    if (!executionId) return;
    try {
      await executionApi.saveStepResult(executionId, stepNumber, status, actualResult, notes);
      alert(`Step ${stepNumber} marked as ${status}!`);
      setActualResult('');
      setNotes('');
    } catch (error) {
      console.error("Failed to save step:", error);
      alert("Failed to save step. Please try again.");
    }
  };

  // ── handleComplete (UNCHANGED) ────────────────────────────────────────────
  const handleComplete = async () => {
    if (!executionId) return;
    try {
      setIsRunning(false);
      await executionApi.completeExecution(executionId);
      alert("Execution complete!");
      navigate(`/test-cases`);
    } catch (error) {
      console.error("Failed to complete execution:", error);
      alert("Failed to complete. Check console.");
      setIsRunning(true);
    }
  };

  // ── formatTime (UNCHANGED) ────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!testCase) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
        Loading Execution Engine...
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">

      {/* ── Focus Mode Header ── */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">
            Focus Mode — Executing
          </p>
          <h1 className="text-3xl font-bold text-white leading-tight">{testCase.title}</h1>
          <p className="text-sm font-mono text-slate-500 mt-1">{testCase.testCaseId}</p>
        </div>

        {/* Live Timer */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
            <Clock className={`h-5 w-5 ${isRunning ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-3xl font-mono font-bold text-white tabular-nums">{formatTime(elapsedTime)}</span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1.5">Elapsed Time</p>
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="space-y-5">
        {testCase.steps?.map((step: TestStep, index: number) => (
          <Card key={index} className="bg-slate-900/60 border-slate-800 overflow-hidden">

            {/* Step Number ribbon */}
            <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-3 flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                {step.stepNumber}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step {step.stepNumber}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-xs text-slate-500 truncate">{step.action}</span>
            </div>

            <CardContent className="pt-5 space-y-5">
              {/* Action + Expected columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Action</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{step.action}</p>
                </div>
                <div className="bg-slate-950/50 border border-slate-700/50 rounded-lg p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expected Result</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{step.expectedResult}</p>
                </div>
              </div>

              {/* Actual Result input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Actual Result <span className="text-slate-600">(required for FAIL)</span>
                </label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                  placeholder="What actually happened?"
                  value={actualResult}
                  onChange={(e) => setActualResult(e.target.value)}
                />
              </div>

              {/* ── Action Buttons ── */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* PASS */}
                <button
                  onClick={() => handleStepSubmit(step.stepNumber, 'PASS')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-500/15 hover:bg-green-500/25 text-green-300 border border-green-500/40 hover:border-green-400/60 rounded-xl font-bold text-sm transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" /> PASS
                </button>

                {/* FAIL */}
                <button
                  onClick={() => handleStepSubmit(step.stepNumber, 'FAIL')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 hover:border-red-400/60 rounded-xl font-bold text-sm transition-all"
                >
                  <XCircle className="h-4 w-4" /> FAIL
                </button>

                {/* BLOCKED */}
                <button
                  onClick={() => handleStepSubmit(step.stepNumber, 'BLOCKED')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/40 hover:border-yellow-400/60 rounded-xl font-bold text-sm transition-all"
                >
                  <AlertTriangle className="h-4 w-4" /> BLOCKED
                </button>

                {/* SKIP */}
                <button
                  onClick={() => handleStepSubmit(step.stepNumber, 'SKIPPED')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-300 border border-slate-600 rounded-xl font-bold text-sm transition-all"
                >
                  <SkipForward className="h-4 w-4" /> SKIP
                </button>

                {/* Fail & Create Bug — separated */}
                <div className="ml-auto pl-3 border-l border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      if (!actualResult.trim()) {
                        alert("Please enter an Actual Result before logging a bug.");
                        return;
                      }
                      setFailedStepData({
                        stepNumber: step.stepNumber,
                        expectedBehavior: step.expectedResult,
                        actualBehavior: actualResult,
                        action: step.action
                      });
                      setIsBugModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-400/50 rounded-xl font-semibold text-sm transition-all"
                  >
                    <Bug className="h-4 w-4" /> Fail & Create Bug
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Complete Execution Footer ── */}
      <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
        <button
          onClick={handleComplete}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-sm"
        >
          <CheckCircle2 className="h-5 w-5" /> Complete Execution
        </button>
      </div>

      {/* ── Bug Modal (ALL UNCHANGED) ── */}
      {failedStepData && id && (
        <CreateBugModal
          isOpen={isBugModalOpen}
          onClose={() => setIsBugModalOpen(false)}
          testCaseId={id}
          testCaseDisplayId={testCase.testCaseId}
          stepNumber={failedStepData.stepNumber}
          expectedBehavior={failedStepData.expectedBehavior}
          actualBehavior={failedStepData.actualBehavior}
          stepsToReproduce={`Step ${failedStepData.stepNumber}: ${failedStepData.action}`}
        />
      )}
    </div>
  );
}