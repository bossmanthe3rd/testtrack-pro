import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestCaseById } from '../services/testCaseApi';
import { executionApi } from '../services/executionApi';
import CreateBugModal from '../components/CreateBugModal';

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

  // State to hold our data
  const [testCase, setTestCase] = useState<TestCaseDetails | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  
  // State for the timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // State for the form inputs for the current step
  const [actualResult, setActualResult] = useState('');
  const [notes, setNotes] = useState('');
  
  // --- NEW STATE FOR THE BUG MODAL ---
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [failedStepData, setFailedStepData] = useState<{
    stepNumber: number;
    expectedBehavior: string;
    actualBehavior: string;
    action: string;
  } | null>(null);
  
  // A ref to prevent React Strict Mode from calling the start API twice
  const hasStarted = useRef(false);

  // 1. Fetch the Test Case and Start Execution when the page loads
  useEffect(() => {
    const initializeExecution = async () => {
      if (!id || hasStarted.current) return;
      hasStarted.current = true;

      try {
        // Fetch the test case details
        const fetchedTestCase = await getTestCaseById(id);
        setTestCase(fetchedTestCase);

        // Tell the backend we are starting an execution
        const execution = await executionApi.startExecution(id);
        setExecutionId(execution.id);
        
        // Start the timer
        setIsRunning(true);
      } catch (error) {
        console.error("Failed to initialize execution:", error);
        alert("Could not start execution. Check console.");
      }
    };

    initializeExecution();
  }, [id]);

  // 2. The Timer Logic
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (isRunning) {
      intervalId = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000); // Add 1 second every 1000 milliseconds
    }
    return () => clearInterval(intervalId); // Cleanup when component unmounts
  }, [isRunning]);

  // 3. Handle marking a step as Pass/Fail/Blocked/Skipped
  const handleStepSubmit = async (stepNumber: number, status: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED') => {
    if (!executionId) return;

    try {
      await executionApi.saveStepResult(executionId, stepNumber, status, actualResult, notes);
      alert(`Step ${stepNumber} marked as ${status}!`);
      // Clear the inputs for the next step
      setActualResult('');
      setNotes('');
    } catch (error) {
      console.error("Failed to save step:", error);
      alert("Failed to save step. Please try again.");
    }
  };

  // 4. Handle completing the entire test
  const handleComplete = async () => {
    if (!executionId) return;

    try {
      setIsRunning(false); // Stop the timer
      await executionApi.completeExecution(executionId);
      alert("Execution complete!");
      // Send them back to the test case details or listing page
      navigate(`/test-cases`); 
    } catch (error) {
      console.error("Failed to complete execution:", error);
      alert("Failed to complete. Check console.");
      setIsRunning(true); // Restart timer if it failed to save
    }
  };

  // Format the seconds into MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!testCase) return <div className="p-8 text-center text-gray-500">Loading Execution Engine...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-8 relative">
      
      {/* Header & Timer */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Executing: {testCase.title}</h1>
          <p className="text-sm text-gray-500">{testCase.testCaseId}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-indigo-600">{formatTime(elapsedTime)}</div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Elapsed Time</p>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-8">
        {testCase.steps?.map((step: TestStep, index: number) => (
          <div key={index} className="border rounded-md p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-2">Step {step.stepNumber}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-white p-3 border rounded shadow-sm">
                <span className="font-bold text-gray-600 block mb-1">Action:</span>
                {step.action}
              </div>
              <div className="bg-white p-3 border rounded shadow-sm">
                <span className="font-bold text-gray-600 block mb-1">Expected Result:</span>
                {step.expectedResult}
              </div>
            </div>

            {/* Inputs for Actual Results */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Actual Result (Required for failures)</label>
              <textarea 
                className="w-full border rounded-md p-2 text-sm"
                rows={2}
                placeholder="What actually happened?"
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={() => handleStepSubmit(step.stepNumber, 'PASS')} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium">PASS</button>
              <button onClick={() => handleStepSubmit(step.stepNumber, 'FAIL')} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-medium">FAIL</button>
              <button onClick={() => handleStepSubmit(step.stepNumber, 'BLOCKED')} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm font-medium">BLOCKED</button>
              <button onClick={() => handleStepSubmit(step.stepNumber, 'SKIPPED')} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-medium">SKIP</button>
              
              {/* --- NEW QUICK BUG BUTTON --- */}
              <div className="ml-auto border-l pl-4 border-gray-300">
                <button 
                  type="button"
                  onClick={() => {
                    if (!actualResult.trim()) {
                      alert("Please enter an Actual Result before logging a bug.");
                      return;
                    }
                    // Save the data of this specific step to pass into the modal
                    setFailedStepData({
                      stepNumber: step.stepNumber,
                      expectedBehavior: step.expectedResult,
                      actualBehavior: actualResult,
                      action: step.action
                    });
                    setIsBugModalOpen(true);
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 text-sm font-medium transition-colors"
                >
                  Fail & Create Bug
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Complete Button */}
      <div className="mt-10 border-t pt-6 text-right">
        <button 
          onClick={handleComplete}
          className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold shadow-lg"
        >
          Complete Execution
        </button>
      </div>

      {/* --- RENDER THE MODAL AT THE BOTTOM --- */}
      {failedStepData && id && (
        <CreateBugModal
          isOpen={isBugModalOpen}
          onClose={() => setIsBugModalOpen(false)}
          testCaseId={id} // The database UUID from the URL params
          testCaseDisplayId={testCase.testCaseId} // The readable ID (TC-XXXX)
          stepNumber={failedStepData.stepNumber}
          expectedBehavior={failedStepData.expectedBehavior}
          actualBehavior={failedStepData.actualBehavior}
          stepsToReproduce={`Step ${failedStepData.stepNumber}: ${failedStepData.action}`}
        />
      )}

    </div>
  );
}