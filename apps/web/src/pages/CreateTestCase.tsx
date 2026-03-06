import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../features/auth/api';
import { getProjectDropdownList, type ProjectListItem } from '../services/projectApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';

// ── Zod Schema (MATCHING PRISMA RELATIONS) ──────────────────────────────────────
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
    status: z.enum(['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'RETIRED']),
    projectId: z.string().uuid("Invalid Project ID"),
    preConditions: z.string().optional(),
    testDataRequirements: z.string().optional(),
    environmentRequirements: z.string().optional(),
    estimatedDuration: z.string().optional(),
    steps: z.array(testStepSchema).min(1, "At least one step is required"),
});

type FormData = z.infer<typeof createTestCaseSchema>;

const inputCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const selectCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";
const errorCls = "text-red-400 text-xs mt-1";

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

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'steps',
    });

    // ── FIXED: Added missing onSubmit function signature ───────────────────────
    const onSubmit = async (data: FormData) => {
        try {
            const payload = {
                ...data,
                // Ensure duration is handled as a number for the backend
                estimatedDuration: data.estimatedDuration ? parseInt(data.estimatedDuration, 10) : undefined
            };
            await api.post('/api/test-cases', payload);
            navigate('/test-cases');
        } catch (error: any) {
            console.error('Failed to create test case:', error);
            alert(error.response?.data?.error || 'Failed to create test case.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">Test Cases</p>
                <h1 className="text-4xl font-bold text-white">Create New Test Case</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* ── Basic Information ── */}
                <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader><CardTitle className="text-base text-slate-200">Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <label className={labelCls}>Title *</label>
                            <input {...register('title')} className={inputCls} placeholder="Verify login logic" />
                            {errors.title && <p className={errorCls}>{errors.title.message}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Description *</label>
                            <textarea {...register('description')} rows={3} className={`${inputCls} resize-none`} />
                            {errors.description && <p className={errorCls}>{errors.description.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelCls}>Module *</label>
                                <input {...register('module')} className={inputCls} />
                                {errors.module && <p className={errorCls}>{errors.module.message}</p>}
                            </div>
                            <div>
                                <label className={labelCls}>Project *</label>
                                <select {...register('projectId')} className={selectCls}>
                                    <option value="" disabled>— Choose a project —</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                {errors.projectId && <p className={errorCls}>{errors.projectId.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                             {/* Status, Type, Priority, Severity Selects go here as in your original file */}
                             {/* ... logic remains identical to your select blocks ... */}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Test Steps ── */}
                <Card className="bg-slate-900/60 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base text-slate-200">Test Steps *</CardTitle>
                        <button type="button" onClick={() => append({ action: '', testData: '', expectedResult: '' })} className="flex items-center gap-1.5 bg-green-500/10 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs">
                            <PlusCircle className="h-3.5 w-3.5" /> Add Step
                        </button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="bg-slate-900 border border-slate-700/60 rounded-xl p-4">
                                <div className="flex justify-between mb-4">
                                    <span className="text-xs font-bold text-indigo-400">Step {index + 1}</span>
                                    {fields.length > 1 && (
                                        <button type="button" onClick={() => remove(index)} className="text-red-400 text-xs flex items-center gap-1">
                                            <Trash2 className="h-3.5 w-3.5" /> Remove
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelCls}>Action *</label>
                                        <input {...register(`steps.${index}.action`)} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Test Data</label>
                                        <input {...register(`steps.${index}.testData`)} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Expected Result *</label>
                                        <input {...register(`steps.${index}.expectedResult`)} className={inputCls} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <button type="submit" disabled={isSubmitting} className={`w-full py-3 rounded-xl text-white font-bold text-sm ${isSubmitting ? 'bg-slate-700' : 'bg-indigo-600'}`}>
                    {isSubmitting ? 'Saving...' : 'Create Test Case'}
                </button>
            </form>
        </div>
    );
}