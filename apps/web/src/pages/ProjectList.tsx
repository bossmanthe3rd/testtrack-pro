import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects, type Project } from '../services/projectApi';
import { useAuthStore } from '../features/auth/authStore';
import { Card, CardContent } from '../components/ui/card';
import { Layers, Plus, Calendar, FileText, Bug, FolderKanban, ChevronRight } from 'lucide-react';

export default function ProjectList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'TESTER';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch {
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
          Loading projects…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">Workspace</p>
          <h1 className="text-4xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/projects/create')}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-900/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        )}
      </div>

      {/* Empty state */}
      {projects.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
            <Layers className="h-8 w-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No projects yet</h3>
          <p className="text-slate-500 text-sm mb-6">Create your first project to start organizing test cases and bugs.</p>
          {canCreate && (
            <button
              onClick={() => navigate('/projects/create')}
              className="inline-flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              <Plus className="h-4 w-4" /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-indigo-500/15 border border-indigo-500/25 rounded-lg">
                        <Layers className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-5 text-xs text-slate-500 pt-4 border-t border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-600" />
                      {project._count?.testCases ?? 0} test cases
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bug className="h-3.5 w-3.5 text-slate-600" />
                      {project._count?.bugs ?? 0} bugs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5 text-slate-600" />
                      {project._count?.testSuites ?? 0} suites
                    </span>
                    <span className="flex items-center gap-1.5 ml-auto">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
