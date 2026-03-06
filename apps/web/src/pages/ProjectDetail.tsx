import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getProjectById,
  getProjectContent,
  type Project,
  type ProjectTestCase,
  type ProjectBug,
} from '../services/projectApi';
import { useAuthStore } from '../features/auth/authStore';
import { Card, CardContent } from '../components/ui/card';
import {
  Layers, Bug, FileText, Plus, ArrowLeft,
  CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronRight, Calendar,
} from 'lucide-react';

// ── Badge helpers ──────────────────────────────────────────────────────────────

const STATUS_TC: Record<string, { label: string; cls: string }> = {
  DRAFT:           { label: 'Draft',    cls: 'bg-slate-700 text-slate-300' },
  REVIEW:          { label: 'Review',   cls: 'bg-amber-500/20 text-amber-300' },
  READY_FOR_REVIEW:{ label: 'Review',   cls: 'bg-amber-500/20 text-amber-300' },
  APPROVED:        { label: 'Approved', cls: 'bg-green-500/20 text-green-300' },
  ARCHIVED:        { label: 'Archived', cls: 'bg-slate-600/40 text-slate-400' },
  DEPRECATED:      { label: 'Deprecated', cls: 'bg-red-500/10 text-red-400' },
};

const STATUS_BUG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  NEW:         { label: 'New',         cls: 'bg-blue-500/20 text-blue-300',   icon: <Clock className="h-3 w-3" /> },
  OPEN:        { label: 'Open',        cls: 'bg-yellow-500/20 text-yellow-300', icon: <AlertTriangle className="h-3 w-3" /> },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-indigo-500/20 text-indigo-300', icon: <Clock className="h-3 w-3" /> },
  FIXED:       { label: 'Fixed',       cls: 'bg-green-500/20 text-green-300', icon: <CheckCircle2 className="h-3 w-3" /> },
  VERIFIED:    { label: 'Verified',    cls: 'bg-teal-500/20 text-teal-300',   icon: <CheckCircle2 className="h-3 w-3" /> },
  CLOSED:      { label: 'Closed',      cls: 'bg-slate-600/40 text-slate-400', icon: <XCircle className="h-3 w-3" /> },
  REOPENED:    { label: 'Reopened',    cls: 'bg-orange-500/20 text-orange-300', icon: <AlertTriangle className="h-3 w-3" /> },
  WONT_FIX:    { label: "Won't Fix",   cls: 'bg-slate-600/40 text-slate-500', icon: <XCircle className="h-3 w-3" /> },
  DUPLICATE:   { label: 'Duplicate',   cls: 'bg-slate-600/40 text-slate-500', icon: <XCircle className="h-3 w-3" /> },
};

const PRIORITY_CLS: Record<string, string> = {
  P1: 'bg-red-500/20 text-red-300',
  P2: 'bg-orange-500/20 text-orange-300',
  P3: 'bg-amber-500/20 text-amber-300',
  P4: 'bg-slate-600/40 text-slate-400',
};

const Badge = ({ cls, children }: { cls: string; children: React.ReactNode }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
    {children}
  </span>
);

// ── Component ──────────────────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'TESTER';

  const [project, setProject]   = useState<Project | null>(null);
  const [testCases, setTestCases] = useState<ProjectTestCase[]>([]);
  const [bugs, setBugs]         = useState<ProjectBug[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [proj, content] = await Promise.all([
          getProjectById(id),
          getProjectContent(id),
        ]);
        setProject(proj);
        setTestCases(content.testCases);
        setBugs(content.bugs);
      } catch {
        setError('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
          Loading project…
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-lg">
        {error ?? 'Project not found.'}
      </div>
    );
  }

  const openBugs   = bugs.filter(b => !['CLOSED', 'WONT_FIX', 'DUPLICATE', 'VERIFIED'].includes(b.status)).length;
  const approvedTCs = testCases.filter(t => t.status === 'APPROVED').length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> All Projects
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-500/15 border border-indigo-500/25 rounded-xl">
              <Layers className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-slate-400 text-sm mt-0.5">{project.description}</p>
              )}
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Created {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT: content lists (2/3 width) ─────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Test Cases */}
          <Card className="bg-slate-900/60 border-slate-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span className="font-semibold text-slate-200 text-sm">Test Cases</span>
                <span className="ml-1 text-xs bg-slate-800 text-slate-400 rounded-full px-2 py-0.5">
                  {testCases.length}
                </span>
              </div>
              {canCreate && (
                <button
                  onClick={() => navigate('/test-cases/create')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Test Case
                </button>
              )}
            </div>
            <CardContent className="p-0">
              {testCases.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">No test cases yet in this project.</div>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {testCases.map(tc => (
                    <Link
                      key={tc.id}
                      to={`/test-cases`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/40 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-slate-300 group-hover:text-white truncate font-medium">{tc.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{tc.testCaseId}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Badge cls={PRIORITY_CLS[tc.priority] ?? 'bg-slate-700 text-slate-400'}>{tc.priority}</Badge>
                        <Badge cls={STATUS_TC[tc.status]?.cls ?? 'bg-slate-700 text-slate-400'}>
                          {STATUS_TC[tc.status]?.label ?? tc.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-slate-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bugs */}
          <Card className="bg-slate-900/60 border-slate-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-400" />
                <span className="font-semibold text-slate-200 text-sm">Defects & Bugs</span>
                <span className="ml-1 text-xs bg-slate-800 text-slate-400 rounded-full px-2 py-0.5">
                  {bugs.length}
                </span>
              </div>
              {canCreate && (
                <button
                  onClick={() => navigate('/bugs/create')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Report Bug
                </button>
              )}
            </div>
            <CardContent className="p-0">
              {bugs.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-sm">No bugs reported for this project.</div>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {bugs.map(bug => {
                    const s = STATUS_BUG[bug.status];
                    return (
                      <Link
                        key={bug.id}
                        to={`/bugs/${bug.id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-slate-300 group-hover:text-white truncate font-medium">{bug.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{bug.bugId}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <Badge cls={PRIORITY_CLS[bug.priority] ?? 'bg-slate-700 text-slate-400'}>{bug.priority}</Badge>
                          {s && (
                            <Badge cls={s.cls}>
                              {s.icon}{s.label}
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-slate-400" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT: stats + quick actions (1/3 width) ────────────────────── */}
        <div className="space-y-5">

          {/* Project Stats */}
          <Card className="bg-slate-900/60 border-slate-800">
            <div className="px-5 py-4 border-b border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Stats</p>
            </div>
            <CardContent className="p-5 space-y-4">
              <Stat icon={<FileText className="h-4 w-4 text-indigo-400" />} label="Total Test Cases" value={project._count?.testCases ?? testCases.length} />
              <Stat icon={<CheckCircle2 className="h-4 w-4 text-green-400" />} label="Approved TCs"   value={approvedTCs} />
              <Stat icon={<Bug className="h-4 w-4 text-red-400" />}           label="Total Bugs"      value={project._count?.bugs ?? bugs.length} />
              <Stat icon={<AlertTriangle className="h-4 w-4 text-amber-400" />} label="Open Bugs"    value={openBugs} accent="text-amber-300" />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {canCreate && (
            <Card className="bg-slate-900/60 border-slate-800">
              <div className="px-5 py-4 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Actions</p>
              </div>
              <CardContent className="p-5 space-y-3">
                <button
                  onClick={() => navigate('/test-cases/create')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 text-sm font-semibold transition-all"
                >
                  <Plus className="h-4 w-4" />
                  New Test Case
                </button>
                <button
                  onClick={() => navigate('/bugs/create')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-300 text-sm font-semibold transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Report a Bug
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper component ───────────────────────────────────────────────────────────

function Stat({ icon, label, value, accent = 'text-white' }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        {icon}
        {label}
      </div>
      <span className={`text-lg font-bold ${accent}`}>{value}</span>
    </div>
  );
}
