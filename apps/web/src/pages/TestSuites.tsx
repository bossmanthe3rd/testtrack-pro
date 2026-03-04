import React, { useState, useEffect } from 'react';
import { testSuiteApi } from '../services/testSuiteApi';
import { useNavigate } from 'react-router-dom';

interface TestSuite {
  id: string;
  name: string;
  description?: string;
}

export default function TestSuites() {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // HARDCODED FOR NOW: In a real app, this comes from a project selector dropdown
  const [projectId, setProjectId] = useState('00000000-0000-0000-0000-000000000000'); 

  const fetchSuites = async () => {
    try {
      const data = await testSuiteApi.getSuites();
      setSuites(data);
    } catch (error) {
      console.error("Failed to fetch suites", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuites();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // NOTE: We are using a dummy projectId right now just to test the UI! 
      // You will need to replace this with a real Project ID from your database later.
      await testSuiteApi.createSuite({ name, description, projectId });
      alert("Suite created successfully!");
      setName('');
      setDescription('');
      fetchSuites(); // Refresh the list
    } catch (error) {
      alert("Failed to create suite. Make sure you are using a valid Project ID in the code!");
      console.error(error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Test Suites</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: List of Suites */}
        <div className="md:col-span-2 bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">All Suites</h2>
          {loading ? (
            <p>Loading...</p>
          ) : suites.length === 0 ? (
            <p className="text-gray-500">No test suites found. Create one!</p>
          ) : (
            <ul className="space-y-3">
              {suites.map(suite => (
                <li key={suite.id} className="p-4 border rounded hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-blue-600">{suite.name}</h3>
                    <p className="text-sm text-gray-600">{suite.description}</p>
                  </div>
                  {/* NEW: Wired up the onClick event to navigate to the new page! */}
                  <button 
                    onClick={() => navigate(`/test-suites/${suite.id}`)}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                  >
                    Manage Test Cases
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* RIGHT COLUMN: Create Form */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Create New Suite</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Suite Name *</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="e.g., Login Regression"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border p-2 rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-red-500">Project ID (Temporary)</label>
              <input 
                type="text" 
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full border p-2 rounded bg-red-50"
                placeholder="Must be a valid UUID from your DB"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
              Create Suite
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}