import { prisma } from '../../config/prisma';

// 1. Dashboard Summary: High-level overview of the whole system
export const getDashboardSummaryStats = async () => {
  // Count total test cases (ignoring soft-deleted ones)
  const totalTestCases = await prisma.testCase.count({
    where: { deletedAt: null }
  });

  // Count total test executions
  const totalExecutions = await prisma.execution.count();

  // Count how many executions passed
  const passedExecutions = await prisma.execution.count({
    where: { overallStatus: 'PASS' }
  });

  // Calculate the pass rate percentage safely
  const passRate = totalExecutions === 0 ? 0 : (passedExecutions / totalExecutions) * 100;

  // Count how many bugs are not closed
  const openBugs = await prisma.bug.count({
    where: { status: { notIn: ['CLOSED', 'WONT_FIX', 'DUPLICATE'] } }
  });

  // Group bugs by severity to see how many CRITICAL, MAJOR, etc. we have
  const bugsBySeverityRaw = await prisma.bug.groupBy({
    by: ['severity'],
    _count: {
      severity: true,
    },
  });

  // Format the grouped data into a nice object for the frontend
  const bugsBySeverity = bugsBySeverityRaw.reduce((acc, curr) => {
    acc[curr.severity] = curr._count.severity;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTestCases,
    totalExecutions,
    passRate: parseFloat(passRate.toFixed(2)), // Keep to 2 decimal places
    failedTests: totalExecutions - passedExecutions, // Simplified failed count
    openBugs,
    bugsBySeverity
  };
};

// 2. Test Execution Report: Detailed breakdown of test runs
export const getExecutionReportStats = async () => {
  // Group executions by their overall status
  const executionStatusRaw = await prisma.execution.groupBy({
    by: ['overallStatus'],
    _count: {
      overallStatus: true,
    },
  });

  const stats = {
    totalExecuted: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    skipped: 0
  };

  // Map the raw DB results to our stats object
  executionStatusRaw.forEach((item) => {
    const status = item.overallStatus?.toLowerCase() || 'unknown';
    stats.totalExecuted += item._count.overallStatus;
    if (status in stats) {
      stats[status as keyof typeof stats] = item._count.overallStatus;
    }
  });

  return stats;
};

// 3. Bug Report: Detailed breakdown of defects
export const getBugReportStats = async () => {
  const totalBugs = await prisma.bug.count();
  
  // Group bugs by their current status
  const bugsByStatusRaw = await prisma.bug.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
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
// --- NEW: FR-RPT-004 Tester Performance Metrics ---
export const getTesterPerformanceMetrics = async (userId: string) => {
  // 1. Test Cases Executed by this specific tester
  const executedCount = await prisma.execution.count({
    where: { executedById: userId }
  });

  // 2. Bugs Reported by this specific tester
  const bugsReportedCount = await prisma.bug.count({
    where: { reportedById: userId }
  });

  // Bug Detection Rate: Percentage of tests they run that result in a bug
  let bugDetectionRate = 0;
  if (executedCount > 0) {
    bugDetectionRate = (bugsReportedCount / executedCount) * 100;
  }

  // 3. Execution Efficiency (Average duration per test)
  // We fetch all their executions that have a duration recorded
  const executions = await prisma.execution.findMany({
    where: { executedById: userId, duration: { not: null } },
    select: { duration: true }
  });

  let avgDurationMs = 0;
  if (executions.length > 0) {
    const totalDuration = executions.reduce((sum, ex) => sum + (ex.duration || 0), 0);
    avgDurationMs = totalDuration / executions.length;
  }
  // Convert milliseconds to a readable seconds format
  const avgDurationSeconds = (avgDurationMs / 1000).toFixed(1);

  // 4. Coverage Metrics (Simple MVP: How many of the total test cases have they personally run)
  const totalSystemTestCases = await prisma.testCase.count({ where: { deletedAt: null } });
  let personalCoverage = 0;
  if (totalSystemTestCases > 0) {
    // Count unique test cases this user has executed
    const uniqueTestsRun = await prisma.execution.groupBy({
      by: ['testCaseId'],
      where: { executedById: userId }
    });
    personalCoverage = (uniqueTestsRun.length / totalSystemTestCases) * 100;
  }

  return {
    testCasesExecuted: executedCount,
    bugsReported: bugsReportedCount,
    bugDetectionRate: parseFloat(bugDetectionRate.toFixed(1)),
    executionEfficiencySeconds: parseFloat(avgDurationSeconds),
    coverageMetrics: parseFloat(personalCoverage.toFixed(1))
  };
};

// --- NEW: FR-RPT-003 Developer Performance Metrics ---
export const getDeveloperPerformanceMetrics = async (userId: string) => {
  // 1. Bugs Assigned vs Resolved
  const totalAssigned = await prisma.bug.count({
    where: { assignedToId: userId }
  });

  const resolvedBugs = await prisma.bug.count({
    where: { 
      assignedToId: userId,
      status: { in: ['FIXED', 'VERIFIED', 'CLOSED'] } 
    }
  });

  // 2. Bugs Reopened Rate
  // How many bugs assigned to them went back to REOPENED status
  const reopenedBugs = await prisma.bug.count({
    where: { 
      assignedToId: userId,
      status: 'REOPENED' 
    }
  });

  let reopenRate = 0;
  if (totalAssigned > 0) {
    reopenRate = (reopenedBugs / totalAssigned) * 100;
  }

  // 3. Average Resolution Time (MVP logic: Time between createdAt and updatedAt for FIXED bugs)
  const fixedBugsData = await prisma.bug.findMany({
    where: { 
      assignedToId: userId,
      status: { in: ['FIXED', 'VERIFIED', 'CLOSED'] }
    },
    select: { createdAt: true, updatedAt: true }
  });

  let avgResolutionHours = 0;
  if (fixedBugsData.length > 0) {
    const totalTimeMs = fixedBugsData.reduce((sum, bug) => {
      return sum + (bug.updatedAt.getTime() - bug.createdAt.getTime());
    }, 0);
    // Convert ms to hours
    avgResolutionHours = totalTimeMs / fixedBugsData.length / (1000 * 60 * 60);
  }

  // 4. Fix Quality Metric (Inverse of reopen rate - higher is better)
  const fixQuality = 100 - reopenRate;

  return {
    bugsAssigned: totalAssigned,
    bugsResolved: resolvedBugs,
    reopenRate: parseFloat(reopenRate.toFixed(1)),
    averageResolutionHours: parseFloat(avgResolutionHours.toFixed(1)),
    fixQualityScore: parseFloat(fixQuality.toFixed(1))
  };
};