import { Request, Response } from 'express';
import * as projectService from './project.service';

// GET /api/projects/list — lightweight {id, name} for dropdowns
export const getProjectList = async (req: Request, res: Response) => {
  try {
    const projects = await projectService.getProjectList();
    res.status(200).json({ success: true, data: projects });
  } catch (error: unknown) {
    const e = error as Error;
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/projects
export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await projectService.getAllProjects();
    res.status(200).json({ success: true, data: projects });
  } catch (error: unknown) {
    const e = error as Error;
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/projects/:id
export const getProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id as string);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: project });
  } catch (error: unknown) {
    const e = error as Error;
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/projects/:id/content — test cases + bugs for the detail page
export const getProjectContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await projectService.getProjectContent(id as string);
    res.status(200).json({ success: true, data: content });
  } catch (error: unknown) {
    const e = error as Error;
    res.status(500).json({ success: false, message: e.message });
  }
};


// POST /api/projects — TESTER / ADMIN only
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Project name is required' });
    }
    const project = await projectService.createProject({ name: name.trim(), description });
    res.status(201).json({ success: true, data: project });
  } catch (error: unknown) {
    const e = error as Error;
    res.status(500).json({ success: false, message: e.message });
  }
};

// PATCH /api/projects/:id — TESTER / ADMIN only
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await projectService.updateProject(id as string, { name, description });
    res.status(200).json({ success: true, data: updated });
  } catch (error: unknown) {
    const e = error as Error;
    res.status(500).json({ success: false, message: e.message });
  }
};
