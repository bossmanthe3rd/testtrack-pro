import {prisma} from "../../config/prisma";
import { Prisma, BugStatus } from "@prisma/client";

export const createBug = async (data: any, reportedById: string) => {
  // 1. Generate the custom Bug ID (Format: BUG-YYYY-XXXXX)
  const currentYear = new Date().getFullYear();
  
  // Count how many bugs exist to figure out the next number
  const totalBugs = await prisma.bug.count();
  const nextNumber = totalBugs + 1;
  
  // padStart adds leading zeros so "1" becomes "00001"
  const generatedBugId = `BUG-${currentYear}-${String(nextNumber).padStart(5, '0')}`;

  // 2. Save the bug to the database
  const newBug = await prisma.bug.create({
    data: {
      bugId: generatedBugId,
      title: data.title,
      description: data.description,
      stepsToReproduce: data.stepsToReproduce,
      expectedBehavior: data.expectedBehavior,
      actualBehavior: data.actualBehavior,
      severity: data.severity,
      priority: data.priority,
      environment: data.environment,
      affectedVersion: data.affectedVersion,
      assignedToId: data.assignedToId,
      linkedTestCaseId: data.linkedTestCaseId,
      executionStepId: data.executionStepId,
      reportedById: reportedById,
      status: "NEW", // All new bugs start as NEW per the requirements
      // 🟢 ADDED: Tell Prisma to actually save the attachments array!
      attachments: data.attachments || [],
    },
  });

  return newBug;
};

export const getBugs = async (filters: any) => {
  // 1. Extract pagination and filter values
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  
  // Calculate how many records to skip based on the page number
  const skip = (page - 1) * limit;

  // 2. Build a dynamic "WHERE" clause
  const whereClause: Prisma.BugWhereInput = {};

  // Only add filters if the user actually requested them
  if (filters.status) whereClause.status = filters.status;
  if (filters.priority) whereClause.priority = filters.priority;
  if (filters.severity) whereClause.severity = filters.severity;
  if (filters.assignedTo) whereClause.assignedToId = filters.assignedTo;
  
  // If they typed in a search box, check both title and description
  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // 3. Run two queries at the same time using Promise.all
  // One gets the actual data, the other counts the total for pagination
  const [bugs, totalCount] = await Promise.all([
    prisma.bug.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" }, // Newest bugs first
      include: {
        assignedTo: { select: { id: true, name: true } }, // Just get the dev's name, not their password!
        reportedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.bug.count({ where: whereClause }),
  ]);

  // 4. Return formatted response
  return {
    data: bugs,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
    },
  };
};
export const getBugById = async (id: string) => {
  return await prisma.bug.findUnique({
    where: { id },
    include: {
      reportedBy: { select: { name: true, id: true } },
      assignedTo: { select: { name: true, id: true } },
      linkedTestCase: true, // This allows the frontend to show the related test case info
    }
  });
};

// The State Machine Rules
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'DUPLICATE', 'WONT_FIX'],
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['FIXED'],
  FIXED: ['VERIFIED', 'REOPENED'],
  VERIFIED: ['CLOSED'],
  REOPENED: ['IN_PROGRESS'],
};

export const updateBugStatus = async (
  bugId: string, 
  developerId: string, 
  newStatus: BugStatus, 
  fixNotes?: string, 
  commitHash?: string
) => {
  // 1. Fetch the existing bug
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  
  if (!bug) throw new Error("Bug not found");
  
  // 2. Ensure only the assigned developer can modify it
  if (bug.assignedToId !== developerId) {
    throw new Error("Unauthorized: You can only update bugs assigned to you");
  }

  // 3. State Machine Validation
  const currentStatus = bug.status;
  const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
  
  if (!allowedNextStates.includes(newStatus)) {
    throw new Error(`Invalid transition: Cannot move bug from ${currentStatus} to ${newStatus}`);
  }

  // 4. Update the database
  return await prisma.bug.update({
    where: { id: bugId },
    data: {
      status: newStatus,
      fixNotes: fixNotes || bug.fixNotes,
      commitHash: commitHash || bug.commitHash,
    }
  });
};

export const getBugsAssignedToMe = async (developerId: string, filters: any) => {
  const { status, priority } = filters;
  
  const whereClause: any = {
    assignedToId: developerId,
  };

  if (status) whereClause.status = status;
  if (priority) whereClause.priority = priority;

  return await prisma.bug.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      linkedTestCase: {
        select: { testCaseId: true }
      }
    }
  });
};

export const requestRetest = async (bugId: string, developerId: string, fixNotes: string, commitHash?: string) => {
  // A re-test request is simply a strict transition to FIXED with mandatory notes
  return await updateBugStatus(bugId, developerId, 'FIXED', fixNotes, commitHash);
};

export const getDevelopersList = async () => {
  return await prisma.user.findMany({
    where: { role: 'DEVELOPER' },
    select: { id: true, name: true },
  });
};