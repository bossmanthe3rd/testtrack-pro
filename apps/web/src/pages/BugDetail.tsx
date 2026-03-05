import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBugById, updateBugStatus } from '../services/bugApi';
import type { Bug } from '../services/bugApi';
import { useAuthStore } from '../features/auth/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
// 🟢 ADDED: FileText and ImageIcon for the attachment viewer
import { ArrowLeft, GitCommit, CheckCircle2, RotateCcw, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';

// ── Status badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    NEW:         'bg-blue-500/15 text-blue-300 border-blue-500/30',
    OPEN:        'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    IN_PROGRESS: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    FIXED:       'bg-green-500/15 text-green-300 border-green-500/30',
    VERIFIED:    'bg-teal-500/15 text-teal-300 border-teal-500/30',
    CLOSED:      'bg-slate-500/15 text-slate-400 border-slate-500/30',
    REOPENED:    'bg-orange-500/15 text-orange-300 border-orange-500/30',
    DUPLICATE:   'bg-slate-500/15 text-slate-400 border-slate-500/30',
    WONT_FIX:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${map[status] ?? map.NEW}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const inputCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

export default function BugDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── Auth / role (UNCHANGED) ────────────────────────────────────────────────
  const { user } = useAuthStore();
  const isDeveloper = user?.role === 'DEVELOPER';
  const isTester = user?.role === 'TESTER';

  // ── State (UNCHANGED) ─────────────────────────────────────────────────────
  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [fixNotes, setFixNotes] = useState('');
  const [commitHash, setCommitHash] = useState('');
  const [reopenNotes, setReopenNotes] = useState('');

  // ── Data fetch (UNCHANGED) ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchBugData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getBugById(id);
        setBug(data);
      } catch (err) {
        console.error("Failed to load bug", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBugData();
  }, [id]);

  // ── handleStatusChange (UNCHANGED) ─────────────────────────────────────────
  const handleStatusChange = async (newStatus: Bug['status']) => {
    if (!bug || !id) return;

    if (newStatus === 'FIXED' && !fixNotes.trim()) {
      setActionError("Fix notes are required when marking a bug as fixed.");
      return;
    }
    if (newStatus === 'REOPENED' && !reopenNotes.trim()) {
      setActionError("Please provide a reason for reopening this bug.");
      return;
    }

    try {
      setActionError(null);
      const payloadNotes = newStatus === 'FIXED' ? fixNotes : newStatus === 'REOPENED' ? reopenNotes : undefined;
      const updatedBug = await updateBugStatus(id, {
        status: newStatus,
        fixNotes: payloadNotes,
        commitHash: newStatus === 'FIXED' ? commitHash : undefined,
      });
      setBug(updatedBug);
      if (newStatus === 'FIXED') { setFixNotes(''); setCommitHash(''); }
      if (newStatus === 'REOPENED') { setReopenNotes(''); }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setActionError(e.response?.data?.message || 'Failed to update status.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
        Loading bug details...
      </div>
    </div>
  );
  if (!bug) return <div className="p-10 text-center text-red-400">Bug not found.</div>;

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Back nav ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to List
      </button>

      {/* ── Page Title ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-mono text-indigo-400 font-bold">{bug.bugId}</span>
          <StatusBadge status={bug.status} />
        </div>
        <h1 className="text-3xl font-bold text-white leading-tight">{bug.title}</h1>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Bug Content (2/3 width) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Description & Steps */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-200">Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{bug.description}</p>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">
                  Steps to Reproduce
                </h4>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{bug.stepsToReproduce}</p>
              </div>

              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Expected Behavior</h4>
                  <p className="text-green-200 text-sm whitespace-pre-wrap">{bug.expectedBehavior}</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Actual Behavior</h4>
                  <p className="text-red-200 text-sm whitespace-pre-wrap">{bug.actualBehavior}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 🟢 NEW: Attachments Gallery Card */}
          {bug.attachments && bug.attachments.length > 0 && (
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-200">Supporting Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {bug.attachments.map((url: string, index: number) => {
                    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                    return (
                      <a 
                        key={index}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group relative flex flex-col items-center justify-center aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950 hover:border-indigo-500 transition-all shadow-sm"
                      >
                        {isImage ? (
                          <>
                            <img 
                              src={url} 
                              alt={`Attachment ${index + 1}`} 
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                              <span className="text-xs font-medium text-white bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-sm border border-slate-700 flex items-center gap-1.5">
                                <ImageIcon className="w-3 h-3" /> View Image
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                            <FileText className="w-8 h-8 mb-2" />
                            <span className="text-xs font-medium">View File</span>
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fix Notes (if developer marked fixed) */}
          {bug.fixNotes && (
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Developer Fix Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-200 text-sm">{bug.fixNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT: Metadata + Workflow Sidebar (1/3 width) ── */}
        <div className="space-y-5">

          {/* Metadata card */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-200">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {[
                { label: 'Severity', value: bug.severity },
                { label: 'Priority', value: bug.priority },
                { label: 'Environment', value: bug.environment },
                { label: 'Affected Version', value: bug.affectedVersion },
                { label: 'Assigned To', value: bug.assignedTo?.name ?? 'Unassigned' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">{label}</span>
                  <span className="text-slate-200 text-xs font-medium text-right">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Workflow Actions card */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-200">Workflow Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {actionError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4 text-red-400 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {actionError}
                </div>
              )}

              {/* ── DEVELOPER ACTIONS (UNCHANGED LOGIC) ── */}
              {isDeveloper && (
                <div className="space-y-3">
                  {bug.status === 'NEW' && (
                    <>
                      <button onClick={() => handleStatusChange('OPEN')} className="w-full py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-sm font-semibold transition-colors">
                        Accept Bug
                      </button>
                      <button onClick={() => handleStatusChange('DUPLICATE')} className="w-full py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 border border-slate-600 text-sm font-semibold transition-colors">
                        Mark Duplicate
                      </button>
                      <button onClick={() => handleStatusChange('WONT_FIX')} className="w-full py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 border border-slate-600 text-sm font-semibold transition-colors">
                        Won't Fix
                      </button>
                    </>
                  )}
                  {bug.status === 'OPEN' && (
                    <button onClick={() => handleStatusChange('IN_PROGRESS')} className="w-full py-2 rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/30 text-sm font-semibold transition-colors">
                      Start Work (In Progress)
                    </button>
                  )}
                  {(bug.status === 'IN_PROGRESS' || bug.status === 'REOPENED') && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelCls}>Fix Notes (Required)</label>
                        <textarea className={inputCls} rows={3} placeholder="Explain what you fixed..." value={fixNotes} onChange={(e) => setFixNotes(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelCls}>
                          <span className="flex items-center gap-1"><GitCommit className="h-3 w-3" /> Commit Hash</span>
                        </label>
                        <input type="text" className={inputCls} placeholder="e.g. 7a9b8c" value={commitHash} onChange={(e) => setCommitHash(e.target.value)} />
                      </div>
                      <button onClick={() => handleStatusChange('FIXED')} className="w-full py-2 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-300 border border-green-500/30 text-sm font-bold transition-colors">
                        Mark as Fixed &amp; Request Retest
                      </button>
                    </div>
                  )}
                  {bug.status === 'FIXED' && (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <CheckCircle2 className="h-4 w-4 shrink-0" /> Awaiting QA Verification
                    </div>
                  )}
                </div>
              )}

              {/* ── TESTER ACTIONS (UNCHANGED LOGIC) ── */}
              {isTester && (
                <div className="space-y-3">
                  {bug.status === 'FIXED' && (
                    <>
                      {bug.fixNotes && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-300 mb-2">
                          <strong className="block mb-1 text-green-400">Dev Fix Notes:</strong>
                          {bug.fixNotes}
                        </div>
                      )}
                      <button onClick={() => handleStatusChange('VERIFIED')} className="w-full py-2 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-300 border border-green-500/30 text-sm font-bold transition-colors">
                        Verify Fix ✓
                      </button>
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <label className={labelCls}>Still broken? (Reason required)</label>
                        <textarea className={inputCls} rows={2} placeholder="Explain why it's still failing..." value={reopenNotes} onChange={(e) => setReopenNotes(e.target.value)} />
                        <button onClick={() => handleStatusChange('REOPENED')} className="w-full py-2 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-sm font-bold transition-colors flex items-center justify-center gap-1.5">
                          <RotateCcw className="h-3.5 w-3.5" /> Reopen Bug
                        </button>
                      </div>
                    </>
                  )}
                  {bug.status === 'VERIFIED' && (
                    <button onClick={() => handleStatusChange('CLOSED')} className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors">
                      Close Bug
                    </button>
                  )}
                  {bug.status === 'CLOSED' && (
                    <p className="text-slate-500 text-sm text-center py-2">This bug has been closed.</p>
                  )}
                </div>
              )}

              {!isDeveloper && !isTester && (
                <p className="text-slate-500 text-sm">No workflow actions available for your role.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}