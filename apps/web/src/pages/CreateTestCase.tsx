import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../features/auth/api';
import { getProjectDropdownList, type ProjectListItem } from '../services/projectApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';

// ── Zod Schema (UNCHANGED) ─────────────────────────────────────────────────────
const testStepSchema = z.object({
    action: z.string().min(1, "Action is required"),
    testData: z.string().optional(),
    expectedResult: z.string().min(1, "Expected result is required"),
});

const createTestCaseSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(200),
    description: z.string().min(10, "Description must be at least 10 characters"),
    module: z.string().min(1, "Module is required"),
    priority: z.enum(['P1', 'P2', 'P3', 'P4']),
    severity: z.enum(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL']),
    type: z.enum(['FUNCTIONAL', 'REGRESSION', 'SMOKE', 'INTEGRATION', 'UAT', 'PERFORMANCE', 'SECURITY', 'USABILITY']),
    status: z.enum(['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'DEPRECATED', 'ARCHIVED']),
    projectId: z.string().uuid("Invalid Project ID"),
    preConditions: z.string().optional(),
    testDataRequirements: z.string().optional(),
    environmentRequirements: z.string().optional(),
    estimatedDuration: z.string().optional(),
    steps: z.array(testStepSchema).min(1, "At least one step is required"),
});

type FormData = z.infer<typeof createTestCaseSchema>;

// ── Shared style tokens ────────────────────────────────────────────────────────
const inputCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const selectCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";
const errorCls = "text-red-400 text-xs mt-1";

// ── Component ──────────────────────────────────────────────────────────────────
export default function CreateTestCase() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<ProjectListItem[]>([]);

    useEffect(() => {
      const loadProjects = async () => {
        try {
          const data = await getProjectDropdownList();
          setProjects(data);
        } catch {
          console.error('Failed to load projects');
        }
      };
      loadProjects();
    }, []);

    // ── useForm ────────────────────────────────────────────────────
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(createTestCaseSchema),
        defaultValues: {
            status: 'DRAFT',
            priority: 'P3',
            severity: 'MINOR',
            type: 'FUNCTIONAL',
            projectId: '',
            steps: [{ action: '', testData: '', expectedResult: '' }],
        },
    });

    // ── useFieldArray (UNCHANGED) ──────────────────────────────────────────────
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'steps',
    });

    // ── Submit Handler (UNCHANGED) ─────────────────────────────────────────────
    const onSubmit = async (data: FormData) => {
        try {
            await api.post('/api/test-cases', data);
            navigate('/test-cases');
        } catch (error: unknown) {
            console.error('Failed to create test case:', error);
            const e = error as { response?: { data?: { error?: string } } };
            alert(e.response?.data?.error || 'Failed to create test case. Please try again.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">

            {/* ── Page Header ── */}
            <div className="mb-8">
                <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">Test Cases</p>
                <h1 className="text-4xl font-bold text-white">Create New Test Case</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* ── CARD 1: Basic Information ── */}
                <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-slate-200">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="col-span-2">
                            <label className={labelCls}>Title *</label>
                            <input {...register('title')} className={inputCls} placeholder="e.g., Verify user login with valid credentials" />
                            {errors.title && <p className={errorCls}>{errors.title.message}</p>}
                        </div>

                        <div>
                            <label className={labelCls}>Description *</label>
                            <textarea {...register('description')} rows={3} className={inputCls + ' resize-none'} placeholder="Detailed description of what is being tested" />
                            {errors.description && <p className={errorCls}>{errors.description.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelCls}>Module *</label>
                                <input {...register('module')} className={inputCls} placeholder="e.g., Authentication" />
                                {errors.module && <p className={errorCls}>{errors.module.message}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Project *</label>
                                <select {...register('projectId')} className={selectCls} defaultValue="">
                                  <option value="" disabled>— Choose a project —</option>
                                  {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                                {errors.projectId && <p className={errorCls}>{errors.projectId.message}</p>}
                            </div>

                            <div>
                                <label className={labelCls}>Status</label>
                                <select {...register('status')} className={selectCls}>
                                    <option value="DRAFT">Draft</option>
                                    <option value="READY_FOR_REVIEW">Ready for Review</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="DEPRECATED">Deprecated</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Type</label>
                                <select {...register('type')} className={selectCls}>
                                    <option value="FUNCTIONAL">Functional</option>
                                    <option value="REGRESSION">Regression</option>
                                    <option value="SMOKE">Smoke</option>
                                    <option value="INTEGRATION">Integration</option>
                                    <option value="UAT">UAT</option>
                                    <option value="PERFORMANCE">Performance</option>
                                    <option value="SECURITY">Security</option>
                                    <option value="USABILITY">Usability</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelCls}>Priority</label>
                                <select {...register('priority')} className={selectCls}>
                                    <option value="P1">P1 — Urgent</option>
                                    <option value="P2">P2 — High</option>
                                    <option value="P3">P3 — Medium</option>
                                    <option value="P4">P4 — Low</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Severity</label>
                                <select {...register('severity')} className={selectCls}>
                                    <option value="BLOCKER">Blocker</option>
                                    <option value="CRITICAL">Critical</option>
                                    <option value="MAJOR">Major</option>
                                    <option value="MINOR">Minor</option>
                                    <option value="TRIVIAL">Trivial</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── CARD 2: Requirements & Conditions ── */}
                <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-slate-200">Requirements &amp; Conditions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <label className={labelCls}>Pre-conditions</label>
                            <textarea {...register('preConditions')} rows={2} className={inputCls + ' resize-none'} placeholder="Conditions that must be true before execution" />
                        </div>
                        <div>
                            <label className={labelCls}>Test Data Requirements</label>
                            <textarea {...register('testDataRequirements')} rows={2} className={inputCls + ' resize-none'} placeholder="Specific data needed for this test" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelCls}>Environment Requirements</label>
                                <input {...register('environmentRequirements')} className={inputCls} placeholder="e.g., Browser: Chrome 120+, OS: Windows 11" />
                            </div>
                            <div>
                                <label className={labelCls}>Estimated Duration</label>
                                <input {...register('estimatedDuration')} className={inputCls} placeholder="e.g., 5 minutes" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── CARD 3: Test Steps ── */}
                <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base font-semibold text-slate-200">Test Steps *</CardTitle>
                        <button
                            type="button"
                            onClick={() => append({ action: '', testData: '', expectedResult: '' })}
                            className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                            <PlusCircle className="h-3.5 w-3.5" /> Add Step
                        </button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {errors.steps?.root && <p className={errorCls}>{errors.steps.root.message}</p>}

                        {fields.map((field, index) => (
                            <div key={field.id} className="bg-slate-900 border border-slate-700/60 rounded-xl p-4 relative">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Step {index + 1}</span>
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Remove
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelCls}>Action *</label>
                                        <input
                                            {...register(`steps.${index}.action` as const)}
                                            placeholder="Navigate to login page"
                                            className={inputCls}
                                        />
                                        {errors.steps?.[index]?.action && (
                                            <p className={errorCls}>{errors.steps[index]?.action?.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Test Data</label>
                                        <input
                                            {...register(`steps.${index}.testData` as const)}
                                            placeholder="Email: test@example.com"
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Expected Result *</label>
                                        <input
                                            {...register(`steps.${index}.expectedResult` as const)}
                                            placeholder="Login page loads"
                                            className={inputCls}
                                        />
                                        {errors.steps?.[index]?.expectedResult && (
                                            <p className={errorCls}>{errors.steps[index]?.expectedResult?.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* ── Submit ── */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg ${
                        isSubmitting
                            ? 'bg-indigo-800 cursor-not-allowed opacity-70'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-900/30'
                    }`}
                >
                    {isSubmitting ? 'Saving Test Case...' : 'Create Test Case'}
                </button>
            </form>
        </div>
    );
}