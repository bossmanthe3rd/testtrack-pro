import { useState, useEffect } from 'react';
import { getMyProfile, getMyStats, updateMyProfile, type UserProfile, type UserStats } from '../services/profileApi';
import { useAuthStore } from '../features/auth/authStore';
import { Card, CardContent } from '../components/ui/card';
import {
  User, Mail, ShieldCheck, Calendar, Bug,
  FileText, Zap, CheckCircle2, Edit3, Save, X,
  Clock, BarChart2
} from 'lucide-react';

// ── Role badge ─────────────────────────────────────────────────────────────────
const ROLE_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  ADMIN:     { label: 'Admin',     cls: 'bg-purple-500/20 border-purple-500/30 text-purple-300',  icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  TESTER:    { label: 'Tester',    cls: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',  icon: <Zap          className="h-3.5 w-3.5" /> },
  DEVELOPER: { label: 'Developer', cls: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300', icon: <BarChart2   className="h-3.5 w-3.5" /> },
};

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${accent} shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Profile() {
  const { user: authUser, fetchMe } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats]     = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName]   = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([getMyProfile(), getMyStats()]);
        setProfile(p);
        setStats(s);
        setEditName(p.name);
        setEditEmail(p.email);
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startEditing = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditEmail(profile.email);
    setSaveError(null);
    setSaveSuccess(false);
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateMyProfile({ name: editName, email: editEmail });
      setProfile(updated);
      setEditing(false);
      setSaveSuccess(true);
      // Refresh the auth store so the sidebar name updates too
      await fetchMe();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSaveError(e?.response?.data?.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
          Loading profile…
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-lg">
        {error ?? 'Profile not found.'}
      </div>
    );
  }

  const roleCfg = ROLE_CFG[profile.role] ?? ROLE_CFG.TESTER;
  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  const inputCls = 'w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">Account</p>
        <h1 className="text-4xl font-bold text-white">Your Profile</h1>
      </div>

      {/* ── TOP: Identity card ── */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <span className="text-3xl font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${
              authUser ? 'bg-green-400' : 'bg-slate-500'
            }`} />
          </div>

          {/* Identity info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white truncate">{profile.name}</h2>
            <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {profile.email}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Role badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleCfg.cls}`}>
                {roleCfg.icon} {roleCfg.label}
              </span>

              {/* Joined date */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                <Calendar className="h-3.5 w-3.5" /> Joined {joinDate}
              </span>
            </div>
          </div>

          {/* Edit button */}
          {!editing && (
            <button
              onClick={startEditing}
              className="flex items-center gap-2 text-sm font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 px-4 py-2 rounded-xl transition-all shrink-0"
            >
              <Edit3 className="h-4 w-4" /> Edit Profile
            </button>
          )}
        </CardContent>
      </Card>

      {/* ── MIDDLE: Stat cards ── */}
      {stats && (
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Personal Impact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.role !== 'DEVELOPER' && (
              <StatCard
                icon={<Bug className="h-5 w-5 text-red-400" />}
                label="Bugs Reported"
                value={stats.bugsReported}
                accent="bg-red-500/10"
              />
            )}
            <StatCard
              icon={<FileText className="h-5 w-5 text-indigo-400" />}
              label="Test Cases Authored"
              value={stats.testCasesAuthored}
              accent="bg-indigo-500/10"
            />
            <StatCard
              icon={<Clock className="h-5 w-5 text-amber-400" />}
              label="Executions Run"
              value={stats.executionsRun}
              accent="bg-amber-500/10"
            />
            {profile.role === 'DEVELOPER' && (
              <>
                <StatCard
                  icon={<Bug className="h-5 w-5 text-orange-400" />}
                  label="Active Bugs Assigned"
                  value={stats.bugsAssigned}
                  accent="bg-orange-500/10"
                />
                <StatCard
                  icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
                  label="Bugs Fixed"
                  value={stats.bugsFixed}
                  accent="bg-green-500/10"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── BOTTOM: Account settings form ── */}
      <Card className="bg-slate-900/60 border-slate-800">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800">
          <User className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-200">Account Settings</h3>
        </div>
        <CardContent className="p-6">
          {saveSuccess && (
            <div className="mb-5 flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile updated successfully!
            </div>
          )}
          {saveError && (
            <div className="mb-5 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {saveError}
            </div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className={labelCls}>Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  disabled={!editing}
                  className={`${inputCls} ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>
              {/* Email */}
              <div>
                <label className={labelCls}>Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  disabled={!editing}
                  className={`${inputCls} ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Role <span className="text-slate-600 normal-case font-normal tracking-normal">(read-only)</span></label>
                <div className={`${inputCls} opacity-50 cursor-not-allowed flex items-center gap-2`}>
                  {roleCfg.icon}
                  <span>{roleCfg.label}</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>User ID <span className="text-slate-600 normal-case font-normal tracking-normal">(read-only)</span></label>
                <input
                  type="text"
                  value={profile.id}
                  disabled
                  className={`${inputCls} opacity-50 cursor-not-allowed font-mono text-xs`}
                />
              </div>
            </div>

            {/* Action buttons */}
            {editing && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 transition-all"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/30 transition-all text-sm disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
