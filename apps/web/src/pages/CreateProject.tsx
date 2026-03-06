import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createProject } from '../services/projectApi';
import { Card, CardContent } from '../components/ui/card';
import { Layers, ArrowLeft } from 'lucide-react';

export default function CreateProject() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createProject({ name: name.trim(), description: description.trim() || undefined });
      navigate('/projects');
    } catch {
      setError('Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 bg-indigo-500/15 border border-indigo-500/25 rounded-xl">
            <Layers className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest">Workspace</p>
            <h1 className="text-3xl font-bold text-white">Create Project</h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Project Details */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Project Details</h2>

            <div>
              <label className={labelCls}>
                Project Name <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="e.g. TestTrack Web Application"
                required
                autoFocus
              />
              <p className="text-xs text-slate-600 mt-1">Choose a clear, descriptive name for this project.</p>
            </div>

            <div>
              <label className={labelCls}>Description <span className="text-slate-600 normal-case font-normal tracking-normal">(optional)</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
                rows={3}
                placeholder="Briefly describe the scope and purpose of this project…"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/projects"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
