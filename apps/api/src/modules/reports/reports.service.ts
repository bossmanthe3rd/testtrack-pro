// apps/api/src/modules/reports/reports.service.ts
import { prisma } from '../../config/prisma';
import { ExecutionStatus, BugStatus } from '@prisma/client';

// 1. Dashboard Summary: High-level overview of the whole system
export const getDashboardSummaryStats = async () => {
  const totalTestCases = await prisma.testCase.count({
    where: { deletedAt: null }
  });

  const totalExecutions = await prisma.execution.count();

  const passedExecutions = await prisma.execution.count({
    where: { overallStatus: ExecutionStatus.PASS }
  });

  // FIX 1: Explicitly count only failures
  const failedExecutions = await prisma.execution.count({
    where: { overallStatus: ExecutionStatus.FAIL }
  });

  const passRate = totalExecutions === 0 ? 0 : (passedExecutions / totalExecutions) * 100;

  const openBugs = await prisma.bug.count({
    where: { status: { notIn: [BugStatus.CLOSED, BugStatus.WONT_FIX, BugStatus.DUPLICATE, BugStatus.VERIFIED] } }
  });

  const bugsBySeverityRaw = await prisma.bug.groupBy({
    by: ['severity'],
    _count: { severity: true },
  });

  const bugsBySeverity = bugsBySeverityRaw.reduce((acc, curr) => {
    acc[curr.severity] = curr._count.severity;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTestCases,
    totalExecutions,
    passRate: parseFloat(passRate.toFixed(1)), 
    failedTests: failedExecutions, // Uses the exact count now
    openBugs,
    bugsBySeverity
  };
};

// 2. Test Execution Report: Detailed breakdown of test runs
export const getExecutionReportStats = async () => {
  const executionStatusRaw = await prisma.execution.groupBy({
    by: ['overallStatus'],
    _count: { overallStatus: true },
  });

  const stats = {
    totalExecuted: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0
  };

  // 🟢 FIX 2: Explicitly map the Prisma Enums to the exact keys React expects
  executionStatusRaw.forEach((item) => {
    stats.totalExecuted += item._count.overallStatus;

    if (item.overallStatus === ExecutionStatus.PASS)    stats.passed  += item._count.overallStatus;
    if (item.overallStatus === ExecutionStatus.FAIL)    stats.failed  += item._count.overallStatus;
    if (item.overallStatus === ExecutionStatus.BLOCKED) stats.blocked += item._count.overallStatus;
    if (item.overallStatus === ExecutionStatus.SKIPPED) stats.skipped += item._count.overallStatus;
  });

  return stats;
};

// 3. Bug Report: Detailed breakdown of defects
export const getBugReportStats = async () => {
  const totalBugs = await prisma.bug.count();
  
  const bugsByStatusRaw = await prisma.bug.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const statusStats = bugsByStatusRaw.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalBugs,
    open: statusStats['OPEN'] || 0,
    inProgress: statusStats['IN_PROGRESS'] || 0,
    fixed: statusStats['FIXED'] || 0,
    closed: statusStats['CLOSED'] || 0,
    rawStatusData: statusStats
  };
};

// 4. FR-RPT-004 Tester Performance Metrics
// 4. FR-RPT-004 Tester Performance Metrics
export const getTesterPerformanceMetrics = async (userId: string) => {
  const executedCount = await prisma.execution.count({
    where: { executedById: userId }
  });

  const bugsReportedCount = await prisma.bug.count({
    where: { reportedById: userId }
  });

  let bugDetectionRate = 0;
  if (executedCount > 0) {
    bugDetectionRate = (bugsReportedCount / executedCount) * 100;
  }

  const executions = await prisma.execution.findMany({
    where: { executedById: userId, duration: { not: null } },
    select: { duration: true }
  });

  let avgDurationMs = 0;
  if (executions.length > 0) {
    const totalDuration = executions.reduce((sum, ex) => sum + (ex.duration || 0), 0);
    avgDurationMs = totalDuration / executions.length;
  }
  const avgDurationSeconds = (avgDurationMs / 1000).toFixed(1);

  // 🟢 FIX: Only calculate coverage against APPROVED, executable test cases
  const totalExecutableTestCases = await prisma.testCase.count({ 
    where: { deletedAt: null, status: 'APPROVED' } 
  });
  
  let personalCoverage = 0;
  if (totalExecutableTestCases > 0) {
    const uniqueTestsRun = await prisma.execution.groupBy({
      by: ['testCaseId'],
      where: { executedById: userId }
    });
    personalCoverage = (uniqueTestsRun.length / totalExecutableTestCases) * 100;
  }

  return {
    testCasesExecuted: executedCount,
    bugsReported: bugsReportedCount,
    bugDetectionRate: parseFloat(bugDetectionRate.toFixed(1)),
    executionEfficiencySeconds: parseFloat(avgDurationSeconds),
    coverageMetrics: parseFloat(personalCoverage.toFixed(1))
  };
};
// 5. FR-RPT-003 Developer Performance Metrics
export const getDeveloperPerformanceMetrics = async (userId: string) => {
  const totalAssigned = await prisma.bug.count({
    where: { assignedToId: userId }
  });

  const resolvedBugs = await prisma.bug.count({
    where: { 
      assignedToId: userId,
      status: { in: ['FIXED', 'VERIFIED', 'CLOSED'] } 
    }
  });

  const currentlyReopenedBugs = await prisma.bug.count({
    where: { 
      assignedToId: userId,
      status: 'REOPENED' 
    }
  });

  let reopenRate = 0;
  if (totalAssigned > 0) {
    reopenRate = (currentlyReopenedBugs / totalAssigned) * 100;
  }

  // 🟢 FIX: Only measure time for bugs currently in 'FIXED' to avoid tester-delay penalties
  const fixedBugsData = await prisma.bug.findMany({
    where: { 
      assignedToId: userId,
      status: 'FIXED' 
    },
    select: { createdAt: true, updatedAt: true }
  });

  let avgResolutionHours = 0;
  if (fixedBugsData.length > 0) {
    const totalTimeMs = fixedBugsData.reduce((sum, bug) => {
      return sum + (bug.updatedAt.getTime() - bug.createdAt.getTime());
    }, 0);
    avgResolutionHours = totalTimeMs / fixedBugsData.length / (1000 * 60 * 60);
  }

  const fixQuality = 100 - reopenRate;

  return {
    bugsAssigned: totalAssigned,
    bugsResolved: resolvedBugs,
    reopenRate: parseFloat(reopenRate.toFixed(1)),
    averageResolutionHours: parseFloat(avgResolutionHours.toFixed(1)),
    fixQualityScore: parseFloat(fixQuality.toFixed(1))
  };
};