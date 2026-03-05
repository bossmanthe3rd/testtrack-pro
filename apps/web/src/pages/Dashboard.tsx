import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { getDashboardSummary, getExecutionReport, getTesterMetrics } from '../services/reportsApi';
import type { DashboardSummary, ExecutionReport, TesterPerformance } from '../services/reportsApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FlaskConical, Bug, CheckCircle2, Activity, Clock, Target, TestTube2, ArrowRight } from 'lucide-react';

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [executionStats, setExecutionStats] = useState<ExecutionReport | null>(null);
  const [testerStats, setTesterStats] = useState<TesterPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [summaryData, executionData, testerData] = await Promise.all([
          getDashboardSummary(),
          getExecutionReport(),
          user?.role === 'TESTER' ? getTesterMetrics() : Promise.resolve(null)
        ]);

        setSummary(summaryData);
        setExecutionStats(executionData);
        if (testerData) setTesterStats(testerData);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const detailedExecutionData = executionStats ? [
    { name: 'Passed', count: executionStats.passed, fill: '#22c55e' },
    { name: 'Failed', count: executionStats.failed, fill: '#ef4444' },
    { name: 'Blocked', count: executionStats.blocked, fill: '#f97316' },
    { name: 'Skipped', count: executionStats.skipped, fill: '#9ca3af' }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-8">

        {/* ── PAGE HEADER ── */}
        <div className="mb-10">
          <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-4xl font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-slate-400 mt-2">Here's what's happening with your project today.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
              Loading your analytics...
            </div>
          </div>
        ) : summary && executionStats ? (
          <>
            {/* ── BENTO GRID — TOP STATS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

              <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total System Tests</CardTitle>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FlaskConical className="h-4 w-4 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{summary.totalTestCases}</p>
                  <p className="text-xs text-slate-500 mt-1">Across all suites</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Executions</CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Activity className="h-4 w-4 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{summary.totalExecutions}</p>
                  <p className="text-xs text-slate-500 mt-1">Recorded runs</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Open Bugs</CardTitle>
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Bug className="h-4 w-4 text-red-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-400">{summary.openBugs}</p>
                  <p className="text-xs text-slate-500 mt-1">Require attention</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Global Pass Rate</CardTitle>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-400">{summary.passRate}%</p>
                  <p className="text-xs text-slate-500 mt-1">Of all executions</p>
                </CardContent>
              </Card>
            </div>

            {/* ── BENTO GRID — CHARTS ROW ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Bar Chart */}
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-200">Test Execution Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={detailedExecutionData}>
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                          cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {detailedExecutionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* My Performance */}
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-200">My Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {testerStats ? (
                    <div className="grid grid-cols-2 gap-4 h-64 content-center">
                      <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <TestTube2 className="h-4 w-4 text-blue-400" />
                          <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">My Executions</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{testerStats.testCasesExecuted}</p>
                      </div>
                      <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-purple-400" />
                          <p className="text-xs text-purple-400 font-medium uppercase tracking-wider">Avg Time / Test</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{testerStats.executionEfficiencySeconds}s</p>
                      </div>
                      <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Bug className="h-4 w-4 text-red-400" />
                          <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Bug Detection</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{testerStats.bugDetectionRate}%</p>
                      </div>
                      <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-green-400" />
                          <p className="text-xs text-green-400 font-medium uppercase tracking-wider">Coverage</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{testerStats.coverageMetrics}%</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
                      Tester metrics are only available for Tester accounts.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

        {/* ── QUICK ACTIONS ── */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-white mb-1">Ready to continue testing?</h2>
              <p className="text-slate-400 text-sm">Jump back in from where you left off.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => navigate('/test-cases')}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 hover:border-blue-400/50 transition-all"
                variant="outline"
              >
                Test Cases <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/test-suites')}
                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 hover:border-purple-400/50 transition-all"
                variant="outline"
              >
                Test Suites <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/bugs')}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 hover:border-red-400/50 transition-all"
                variant="outline"
              >
                Bug Tracker <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {user?.role === 'DEVELOPER' && (
                <Button
                  onClick={() => navigate('/developer/dashboard')}
                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:border-indigo-400/50 transition-all"
                  variant="outline"
                >
                  Dev Workspace <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;