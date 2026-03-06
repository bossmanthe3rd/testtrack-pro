import { prisma } from '../../config/prisma';

// Lightweight list — only id + name, used for dropdowns
export const getProjectList = async () => {
  return await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
};

// Full list with metadata for the ProjectList page
export const getAllProjects = async () => {
  return await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { testCases: true, bugs: true, testSuites: true },
      },
    },
  });
};

// Single project detail (with counts)
export const getProjectById = async (id: string) => {
  return await prisma.project.findUnique({
    where: { id },
    include: {
      _count: {
        select: { testCases: true, bugs: true, testSuites: true },
      },
    },
  });
};

// All test cases + bugs belonging to a project, for the detail page
export const getProjectContent = async (id: string) => {
  const [testCases, bugs] = await Promise.all([
    prisma.testCase.findMany({
      where: { projectId: id, deletedAt: null },
      select: {
        id: true,
        testCaseId: true,
        title: true,
        status: true,
        priority: true,
        severity: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.bug.findMany({
      where: { projectId: id },
      select: {
        id: true,
        bugId: true,
        title: true,
        status: true,
        priority: true,
        severity: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);
  return { testCases, bugs };
};


// Create a new project
export const createProject = async (data: { name: string; description?: string }) => {
  return await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
};

// Update project name / description
export const updateProject = async (id: string, data: { name?: string; description?: string }) => {
  return await prisma.project.update({
    where: { id },
    data,
  });
};
