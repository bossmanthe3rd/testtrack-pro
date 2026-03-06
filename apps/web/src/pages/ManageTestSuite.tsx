import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testSuiteApi } from '../services/testSuiteApi';
import { getTestCases } from '../services/testCaseApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, FolderKanban, PlusCircle, Trash2, FlaskConical, Play } from 'lucide-react'; // Added Play

interface TestCase {
  id: string;
  testCaseId: string;
  title: string;
}

interface SuiteTestCaseLink {
  testCaseId: string;
  testCase: TestCase;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: SuiteTestCaseLink[];
}

export default function ManageTestSuite() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [suite, setSuite] = useState<TestSuite | null>(null);
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!id) return;
        const suiteData = await testSuiteApi.getSuiteById(id);
        setSuite(suiteData);
        const testCasesData = await getTestCases({ limit: 50 });
        setAllTestCases(testCasesData.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        alert("Failed to load suite details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, refreshTrigger]);

  const handleAdd = async (testCaseId: string) => {
    try {
      await testSuiteApi.addTestCases(id as string, [testCaseId]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to add test case:", error);
      alert("Failed to add test case.");
    }
  };

  const handleRemove = async (testCaseId: string) => {
    try {
      await testSuiteApi.removeTestCase(id as string, testCaseId);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to remove test case:", error);
      alert("Failed to remove test case.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
        Loading suite data...
      </div>
    </div>
  );

  if (!suite) return <div className="p-8 text-center text-red-400">Suite not found.</div>;

  const testCasesInSuiteIds = suite.testCases.map((link: SuiteTestCaseLink) => link.testCaseId);
  const availableTestCases = allTestCases.filter(tc => !testCasesInSuiteIds.includes(tc.id));
  
  const isSuiteEmpty = suite.testCases.length === 0;

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Header ── */}
      <button
        onClick={() => navigate('/test-suites')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Suites
      </button>

      {/* NEW: Flex container to align title and RUN button on opposite sides */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <FolderKanban className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-400 uppercase tracking-widest mb-0.5">Test Suite</p>
            <h1 className="text-3xl font-bold text-white">{suite.name}</h1>
            {suite.description && <p className="text-slate-400 text-sm mt-1">{suite.description}</p>}
          </div>
        </div>

        {/* NEW: Big Run Suite Button */}
        <button
          onClick={() => navigate(`/test-suites/${suite.id}/run`)}
          disabled={isSuiteEmpty}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${
            isSuiteEmpty 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-900/40 hover:shadow-emerald-900/60 transform hover:-translate-y-0.5'
          }`}
        >
          <Play className="h-5 w-5 fill-current" />
          {isSuiteEmpty ? 'Add Tests to Run' : 'Run Entire Suite'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Left: Test Cases In Suite ── */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold text-slate-200">In This Suite</CardTitle>
            <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {suite.testCases.length}
            </span>
          </CardHeader>
          <CardContent>
            {isSuiteEmpty ? (
              <div className="py-10 text-center">
                <FlaskConical className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm italic">Suite is empty. Add test cases →</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {suite.testCases.map((link: SuiteTestCaseLink) => (
                  <li
                    key={link.testCaseId}
                    className="flex justify-between items-center p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg hover:border-purple-500/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-purple-400 block">{link.testCase.testCaseId}</span>
                      <span className="text-xs text-slate-400 truncate block">{link.testCase.title}</span>
                    </div>
                    <button
                      onClick={() => handleRemove(link.testCaseId)}
                      className="ml-3 flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── Right: Available Test Cases ── */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-200">Available to Add</CardTitle>
          </CardHeader>
          <CardContent>
            {availableTestCases.length === 0 ? (
              <div className="py-10 text-center">
                <FlaskConical className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm italic">No more test cases available!</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {availableTestCases.map(tc => (
                  <li
                    key={tc.id}
                    className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-700/50 rounded-lg hover:border-slate-600 transition-colors"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-indigo-400 block">{tc.testCaseId}</span>
                      <span className="text-xs text-slate-400 truncate block">{tc.title}</span>
                    </div>
                    <button
                      onClick={() => handleAdd(tc.id)}
                      className="ml-3 flex items-center gap-1 text-green-300 hover:text-green-200 text-xs font-semibold bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                    >
                      <PlusCircle className="h-3 w-3" /> Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}