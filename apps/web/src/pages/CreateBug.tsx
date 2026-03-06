import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createBug, uploadAttachment } from '../services/bugApi';
import { getProjectDropdownList, type ProjectListItem } from '../services/projectApi';
import { api } from '../features/auth/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Upload, CheckCircle2, FileText } from 'lucide-react';

// ── Zod Schema (UNCHANGED) ─────────────────────────────────────────────────────
const bugSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  stepsToReproduce: z.string().min(1, 'Steps are required'),
  expectedBehavior: z.string().min(1, 'Expected behavior is required'),
  actualBehavior: z.string().min(1, 'Actual behavior is required'),
  severity: z.enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  environment: z.string().min(1, 'Environment is required'),
  affectedVersion: z.string().min(1, 'Version is required'),
  assignedToId: z.string().optional(),
  linkedTestCaseId: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
});

type BugFormData = z.infer<typeof bugSchema>;

// ── Shared style tokens ────────────────────────────────────────────────────────
const inputCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const selectCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";
const errorCls = "text-red-400 text-xs mt-1";

// ── Component ──────────────────────────────────────────────────────────────────
export default function CreateBug() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🟢 CHANGED: State now holds an array of URLs instead of a single string
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // ── Dropdown data states (UNCHANGED) ──────────────────────────────────────
  const [developers, setDevelopers] = useState<{id: string, name: string}[]>([]);
  const [testCases, setTestCases] = useState<{id: string, testCaseId: string, title: string}[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ── useForm (UNCHANGED) ────────────────────────────────────────────────────
  const { register, handleSubmit, formState: { errors } } = useForm<BugFormData>({
    resolver: zodResolver(bugSchema),
  });

  // ── Data Fetch (UNCHANGED) ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setIsLoadingData(true);
        const devResponse = await api.get('/api/bugs/developers/list');
        setDevelopers(devResponse.data.data);

        const tcResponse = await api.get('/api/test-cases');
        const tcData = Array.isArray(tcResponse.data.data)
          ? tcResponse.data.data
          : tcResponse.data.data?.data || [];
        setTestCases(tcData);

        const projectData = await getProjectDropdownList();
        setProjects(projectData);
      } catch (err) {
        console.error("Failed to load dropdown data", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchDropdownData();
  }, []);

  // ── File Upload Handler ───────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      try {
        // 🟢 CHANGED: Loop through all selected files and upload them one by one
        const newUrls: string[] = [];
        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          const url = await uploadAttachment(file);
          newUrls.push(url);
        }
        
        // Append the new URLs to any existing ones
        setAttachmentUrls(prev => [...prev, ...newUrls]);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload file(s).");
      } finally {
        setUploading(false);
        // Reset the file input so the user can upload more files if they want
        e.target.value = '';
      }
    }
  };

  // ── Submit Handler ─────────────────────────────────────────────
  const onSubmit = async (data: BugFormData) => {
    setIsSubmitting(true);
    try {
      const finalPayload = {
        ...data,
        assignedToId: data.assignedToId === "" ? undefined : data.assignedToId,
        linkedTestCaseId: data.linkedTestCaseId === "" ? undefined : data.linkedTestCaseId,
        // 🟢 CHANGED: Send the array of URLs directly to the backend
        attachments: attachmentUrls,
      };
      await createBug(finalPayload);
      navigate('/bugs');
    } catch (error) {
      console.error(error);
      alert("Failed to create bug.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
        Loading form data...
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-12">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <p className="text-sm font-medium text-red-400 uppercase tracking-widest mb-1">Bug Tracker</p>
        <h1 className="text-4xl font-bold text-white">Report a New Bug</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── CARD 0: Project ── */}
        <Card className="bg-indigo-500/5 border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-indigo-300">Project *</CardTitle>
          </CardHeader>
          <CardContent>
            <label className={labelCls}>Select Project</label>
            <select {...register('projectId')} className={selectCls} defaultValue="">
              <option value="" disabled>— Choose a project —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.projectId && <p className={errorCls}>{errors.projectId.message}</p>}
          </CardContent>
        </Card>

        {/* ── CARD 1: Assignment & Linking ── */}
        <Card className="bg-indigo-500/5 border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-indigo-300">Assignment &amp; Linking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Assign to Developer</label>
                <select {...register('assignedToId')} className={selectCls}>
                  <option value="">— Leave Unassigned —</option>
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Link to Test Case</label>
                <select {...register('linkedTestCaseId')} className={selectCls}>
                  <option value="">— Standalone Bug —</option>
                  {testCases.map(tc => (
                    <option key={tc.id} value={tc.id}>{tc.testCaseId} — {tc.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── CARD 2: Basic Details ── */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-200">Bug Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className={labelCls}>Title *</label>
              <input {...register('title')} className={inputCls} placeholder="Brief, descriptive bug title" />
              {errors.title && <p className={errorCls}>{errors.title.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Description *</label>
              <textarea {...register('description')} className={inputCls + ' resize-none'} rows={3} placeholder="Detailed explanation of the bug" />
              {errors.description && <p className={errorCls}>{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Severity *</label>
                <select {...register('severity')} className={selectCls}>
                  <option value="BLOCKER">Blocker</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="MAJOR">Major</option>
                  <option value="MINOR">Minor</option>
                  <option value="TRIVIAL">Trivial</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Priority *</label>
                <select {...register('priority')} className={selectCls}>
                  <option value="P1">P1 — Urgent</option>
                  <option value="P2">P2 — High</option>
                  <option value="P3">P3 — Medium</option>
                  <option value="P4">P4 — Low</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Affected Version *</label>
                <input {...register('affectedVersion')} className={inputCls} placeholder="e.g., v1.2.3" />
                {errors.affectedVersion && <p className={errorCls}>{errors.affectedVersion.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Environment *</label>
                <input {...register('environment')} className={inputCls} placeholder="e.g., Chrome 120, Win 11" />
                {errors.environment && <p className={errorCls}>{errors.environment.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── CARD 3: Reproduction & Behavior ── */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-200">Reproduction &amp; Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className={labelCls}>Steps to Reproduce *</label>
              <textarea {...register('stepsToReproduce')} className={inputCls + ' resize-none'} rows={4} placeholder="1. Go to...\n2. Click on...\n3. Observe that..." />
              {errors.stepsToReproduce && <p className={errorCls}>{errors.stepsToReproduce.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-green-400 uppercase tracking-wider mb-1.5">Expected Behavior *</label>
                <textarea {...register('expectedBehavior')} className="w-full bg-green-500/5 border border-green-500/30 text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" rows={3} />
                {errors.expectedBehavior && <p className={errorCls}>{errors.expectedBehavior.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">Actual Behavior *</label>
                <textarea {...register('actualBehavior')} className="w-full bg-red-500/5 border border-red-500/30 text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" rows={3} />
                {errors.actualBehavior && <p className={errorCls}>{errors.actualBehavior.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── CARD 4: Attachment ── */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-200">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <label className={labelCls}>Upload Evidence (Screenshots/Logs)</label>
            <div className="flex items-center gap-4 flex-wrap mt-2">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Upload className="h-4 w-4" />
                Select Files
                {/* 🟢 CHANGED: Added 'multiple' attribute so users can select multiple files at once */}
                <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={uploading} />
              </label>
              
              {uploading && <span className="text-indigo-400 text-sm animate-pulse">Uploading to cloud...</span>}
              
              {/* 🟢 CHANGED: Display a count of how many files have been uploaded */}
              {attachmentUrls.length > 0 && !uploading && (
                <span className="flex items-center gap-1.5 text-green-400 text-sm bg-green-500/10 px-3 py-1.5 rounded-md border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4" /> {attachmentUrls.length} file(s) attached
                </span>
              )}
            </div>

            {/* Visual list of attachments */}
            {attachmentUrls.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {attachmentUrls.map((url, idx) => (
                  <div key={idx} className="h-16 w-24 rounded bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden opacity-80">
                    {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                       <img src={url} alt="upload thumbnail" className="h-full w-full object-cover" />
                    ) : (
                       <FileText className="text-slate-500 h-6 w-6" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg ${
            isSubmitting || uploading
              ? 'bg-red-900 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-900/30'
          }`}
        >
          {isSubmitting ? 'Submitting Bug Report...' : 'Create Bug Report'}
        </button>
      </form>
    </div>
  );
}