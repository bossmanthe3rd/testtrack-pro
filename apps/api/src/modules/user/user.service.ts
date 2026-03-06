import { prisma } from '../../config/prisma';

// Full profile for the current user
export const getUserProfile = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
};

// Update name and/or email only — role is never touched here
export const updateUserProfile = async (
  userId: string,
  data: { name?: string; email?: string }
) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name  ? { name: data.name.trim() }   : {}),
      ...(data.email ? { email: data.email.trim() } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
};

// Contribution stats for the profile page
export const getUserStats = async (userId: string) => {
  const [
    bugsReported,
    testCasesAuthored,
    bugsAssigned,
    bugsFixed,
    executionsRun,
  ] = await Promise.all([
    // Bugs this user filed
    prisma.bug.count({ where: { reportedById: userId } }),

    // Test cases this user created
    prisma.testCase.count({ where: { createdById: userId, deletedAt: null } }),

    // Active bugs currently assigned to this user (open work)
    prisma.bug.count({
      where: {
        assignedToId: userId,
        status: { notIn: ['CLOSED', 'WONT_FIX', 'DUPLICATE', 'VERIFIED'] },
      },
    }),

    // Bugs this user has fixed/resolved
    prisma.bug.count({
      where: {
        assignedToId: userId,
        status: { in: ['FIXED', 'VERIFIED', 'CLOSED'] },
      },
    }),

    // Total executions run by this user
    prisma.execution.count({ where: { executedById: userId } }),
  ]);

  return {
    bugsReported,
    testCasesAuthored,
    bugsAssigned,       // current active workload
    bugsFixed,
    executionsRun,
  };
};
