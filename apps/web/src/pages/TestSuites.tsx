import { useState, useEffect } from 'react';
import { testSuiteApi } from '../services/testSuiteApi';
import { getProjectDropdownList, type ProjectListItem } from '../services/projectApi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FolderKanban, ArrowRight, PlayCircle } from 'lucide-react';

interface TestSuite {
  id: string;
  name: string;
  description?: string;
}

export default function TestSuites() {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);

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
    getProjectDropdownList()
      .then(setProjects)
      .catch(err => console.error('Failed to load projects', err));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      await testSuiteApi.createSuite({ name, description, projectId });
      setName('');
      setDescription('');
      setProjectId('');
      fetchSuites();
    } catch (error) {
      console.error('Failed to create suite.', error);
    }
  };

  const inputClass = "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const labelClass = "block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">Management</p>
        <h1 className="text-4xl font-bold text-white">Test Suites</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── LEFT: Suite List ── */}
        <div className="md:col-span-2">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-200">All Suites</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 py-8 justify-center text-slate-500 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                  Loading suites...
                </div>
              ) : suites.length === 0 ? (
                <div className="py-12 text-center">
                  <FolderKanban className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No test suites yet. Create one!</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {suites.map(suite => (
                    <li
                      key={suite.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center group gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors truncate">
                          {suite.name}
                        </h3>
                        {suite.description && (
                          <p className="text-sm text-slate-500 mt-0.5 truncate">{suite.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* NEW: Run Button */}
                        <button
                          onClick={() => navigate(`/test-suites/${suite.id}/run`)}
                          className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                        >
                          <PlayCircle className="h-3.5 w-3.5" /> Run Suite
                        </button>
                        
                        {/* EXISTING: Manage Button */}
                        <button
                          onClick={() => navigate(`/test-suites/${suite.id}`)}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          Manage <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: Create Form ── */}
        <div>
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-200">Create New Suite</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className={labelClass}>Suite Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g., Login Regression"
                  />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputClass + ' resize-none'}
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Project *</label>
                  <select
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="" disabled>— Choose a project —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-900/30 text-sm"
                >
                  Create Suite
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}