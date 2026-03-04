import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testSuiteApi } from '../services/testSuiteApi';
import { getTestCases } from '../services/testCaseApi'; // To fetch available test cases

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
  const { id } = useParams(); // Grabs the suite ID from the URL
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
        
        // 1. Fetch the suite details (which includes connected test cases)
        const suiteData = await testSuiteApi.getSuiteById(id);
        setSuite(suiteData);

        // 2. Fetch ALL test cases in the database
        // Note: We send empty filters to just grab the first page of results for now
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

  // Handler to ADD a test case to this suite
  const handleAdd = async (testCaseId: string) => {
    try {
      // The API expects an array of IDs, even if we just send one
      await testSuiteApi.addTestCases(id as string, [testCaseId]);
      setRefreshTrigger(prev => prev + 1); // Refresh the page data
    } catch (error) {
      console.error("Failed to add test case:", error);
      alert("Failed to add test case.");
    }
  };

  // Handler to REMOVE a test case from this suite
  const handleRemove = async (testCaseId: string) => {
    try {
      await testSuiteApi.removeTestCase(id as string, testCaseId);
      setRefreshTrigger(prev => prev + 1); // Refresh the page data
    } catch (error) {
      console.error("Failed to remove test case:", error);
      alert("Failed to remove test case.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading suite data...</div>;
  if (!suite) return <div className="p-8 text-center text-red-500">Suite not found.</div>;

  // 🧠 SMART FILTERING: 
  // We don't want to show test cases in the "Available" list if they are ALREADY in the suite!
  // We map through the suite's test cases to get an array of just the IDs.
  const testCasesInSuiteIds = suite.testCases.map((link: SuiteTestCaseLink) => link.testCaseId);
  
  // Then we filter the "All" list to exclude the ones we already have.
  const availableTestCases = allTestCases.filter(tc => !testCasesInSuiteIds.includes(tc.id));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/test-suites')}
          className="text-blue-600 hover:underline text-sm font-medium mb-2 inline-block"
        >
          &larr; Back to Suites
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{suite.name}</h1>
        <p className="text-gray-600 mt-2">{suite.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* COLUMN 1: Currently In Suite */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700 flex items-center justify-between">
            Test Cases in Suite
            <span className="bg-purple-100 text-purple-700 text-sm py-1 px-3 rounded-full">
              {suite.testCases.length}
            </span>
          </h2>
          
          {suite.testCases.length === 0 ? (
            <p className="text-gray-500 italic text-sm p-4 bg-gray-50 rounded border border-dashed">
              This suite is empty. Add some test cases from the list!
            </p>
          ) : (
            <ul className="space-y-3">
              {suite.testCases.map((link: SuiteTestCaseLink) => (
                <li key={link.testCaseId} className="p-3 border rounded border-purple-100 bg-purple-50 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sm text-gray-800 block">{link.testCase.testCaseId}</span>
                    <span className="text-sm text-gray-600">{link.testCase.title}</span>
                  </div>
                  <button 
                    onClick={() => handleRemove(link.testCaseId)}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold bg-white px-2 py-1 rounded border border-red-200"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* COLUMN 2: Available to Add */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Available Test Cases</h2>
          
          {availableTestCases.length === 0 ? (
            <p className="text-gray-500 italic text-sm p-4 bg-gray-50 rounded border border-dashed">
              No more test cases available to add!
            </p>
          ) : (
            <ul className="space-y-3">
              {availableTestCases.map(tc => (
                <li key={tc.id} className="p-3 border rounded hover:bg-blue-50 flex justify-between items-center transition">
                  <div>
                    <span className="font-bold text-sm text-gray-800 block">{tc.testCaseId}</span>
                    <span className="text-sm text-gray-600">{tc.title}</span>
                  </div>
                  <button 
                    onClick={() => handleAdd(tc.id)}
                    className="text-blue-600 hover:bg-blue-600 hover:text-white text-sm font-semibold bg-blue-50 px-3 py-1 rounded border border-blue-200 transition"
                  >
                    + Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}