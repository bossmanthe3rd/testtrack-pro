import {prisma} from "../../config/prisma";
import { Prisma } from "@prisma/client";

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