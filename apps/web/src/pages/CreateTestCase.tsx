import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../features/auth/api';

// 1. Zod Validation Schema
// This acts as our "frontend bouncer" to ensure all required fields are filled before sending to the backend.
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

// Extract the TypeScript type from the Zod schema
type FormData = z.infer<typeof createTestCaseSchema>;

export default function CreateTestCase() {
    const navigate = useNavigate();

    // 2. Initialize React Hook Form
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

    // 3. Initialize dynamic field array for the Test Steps
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'steps',
    });
    // 4. Submit Handler (UPDATED)
    const onSubmit = async (data: FormData) => {
        try {
            // Create a new payload that includes the project ID
            const payload = {
                ...data,
                // REPLACE THIS STRING WITH the ID you copied from Prisma Studio!
                projectId: "4bb5bff1-8d0d-44b5-a519-2251b3c17c21",
            };

            // Send the payload to the backend API
            await api.post('/api/test-cases', payload);
            alert('Test Case created successfully!');
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Failed to create test case:', error);
            alert(error.response?.data?.error || 'Failed to create test case. Please try again.');
        }
    };

    // 5. Render the UI
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Create New Test Case</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* SECTION 1: Basic Info */}
                <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                                {...register('title')}
                                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Verify user login with valid credentials"
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Detailed description of what is being tested"
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Module *</label>
                            <input
                                {...register('module')}
                                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Authentication"
                            />
                            {errors.module && <p className="text-red-500 text-sm mt-1">{errors.module.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project ID *</label>
                            <input
                                {...register('projectId')}
                                className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
                            />
                            {errors.projectId && <p className="text-red-500 text-sm mt-1">{errors.projectId.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select {...register('status')} className="w-full border border-gray-300 rounded p-2 bg-white">
                                <option value="DRAFT">Draft</option>
                                <option value="READY_FOR_REVIEW">Ready for Review</option>
                                <option value="APPROVED">Approved</option>
                                <option value="DEPRECATED">Deprecated</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select {...register('type')} className="w-full border border-gray-300 rounded p-2 bg-white">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select {...register('priority')} className="w-full border border-gray-300 rounded p-2 bg-white">
                                <option value="P1">P1 - Urgent</option>
                                <option value="P2">P2 - High</option>
                                <option value="P3">P3 - Medium</option>
                                <option value="P4">P4 - Low</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                            <select {...register('severity')} className="w-full border border-gray-300 rounded p-2 bg-white">
                                <option value="BLOCKER">Blocker</option>
                                <option value="CRITICAL">Critical</option>
                                <option value="MAJOR">Major</option>
                                <option value="MINOR">Minor</option>
                                <option value="TRIVIAL">Trivial</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Requirements */}
                <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Requirements & Conditions</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pre-conditions</label>
                            <textarea
                                {...register('preConditions')}
                                rows={2}
                                className="w-full border border-gray-300 rounded p-2"
                                placeholder="Conditions that must be true before execution"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Data Requirements</label>
                            <textarea
                                {...register('testDataRequirements')}
                                rows={2}
                                className="w-full border border-gray-300 rounded p-2"
                                placeholder="Specific data needed for this test"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Environment Requirements</label>
                            <input
                                {...register('environmentRequirements')}
                                className="w-full border border-gray-300 rounded p-2"
                                placeholder="e.g., Browser: Chrome 120+, OS: Windows 11"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration</label>
                            <input
                                {...register('estimatedDuration')}
                                className="w-full border border-gray-300 rounded p-2"
                                placeholder="e.g., 5 minutes"
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: Dynamic Test Steps */}
                <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-700">Test Steps *</h2>
                        <button
                            type="button"
                            onClick={() => append({ action: '', testData: '', expectedResult: '' })}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                            + Add Step
                        </button>
                    </div>

                    {errors.steps?.root && <p className="text-red-500 text-sm mb-4">{errors.steps.root.message}</p>}

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="bg-white p-4 border border-gray-300 rounded shadow-sm relative">
                                <div className="absolute top-2 right-2">
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            ✕ Remove
                                        </button>
                                    )}
                                </div>

                                <h3 className="font-bold text-gray-700 mb-3">Step {index + 1}</h3>

                                <div className="space-y-3">
                                    <div>
                                        <input
                                            {...register(`steps.${index}.action` as const)}
                                            placeholder="Action (e.g., Navigate to login page)"
                                            className="w-full border border-gray-300 rounded p-2"
                                        />
                                        {errors.steps?.[index]?.action && (
                                            <p className="text-red-500 text-xs mt-1">{errors.steps[index]?.action?.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            {...register(`steps.${index}.testData` as const)}
                                            placeholder="Test Data (e.g., Email: test@example.com)"
                                            className="w-full border border-gray-300 rounded p-2"
                                        />
                                    </div>

                                    <div>
                                        <input
                                            {...register(`steps.${index}.expectedResult` as const)}
                                            placeholder="Expected Result (e.g., Login page loads)"
                                            className="w-full border border-gray-300 rounded p-2"
                                        />
                                        {errors.steps?.[index]?.expectedResult && (
                                            <p className="text-red-500 text-xs mt-1">{errors.steps[index]?.expectedResult?.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3 rounded-md text-white font-bold text-lg transition-colors ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isSubmitting ? 'Saving Test Case...' : 'Create Test Case'}
                    </button>
                </div>
            </form>
        </div>
    );
}