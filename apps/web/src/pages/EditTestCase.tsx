import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as testCaseApi from "../services/testCaseApi";

// 1. Define what the form data should look like (Matches your backend Zod schema!)
const editFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  module: z.string().min(1, "Module is required"),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  severity: z.enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]),
  type: z.string().min(1, "Type is required"),
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "ARCHIVED"]),
  changeSummary: z.string().min(5, "Please explain what you changed (min 5 chars)"),
  steps: z.array(
    z.object({
      action: z.string().min(1, "Action is required"),
      testData: z.string().optional(),
      expectedResult: z.string().min(1, "Expected result is required"),
    })
  ).min(1, "At least one step is required"),
});

type EditFormValues = z.infer<typeof editFormSchema>;

interface TestCaseDetail {
  testCaseId: string;
  version: number;
  title: string;
  description?: string;
  module: string;
  priority: string;
  severity: string;
  type?: string;
  status: string;
  steps: Array<{ action: string; testData?: string; expectedResult: string; }>;
}

export default function EditTestCase() {
  const { id } = useParams(); // Get the ID from the URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testCaseInfo, setTestCaseInfo] = useState<TestCaseDetail | null>(null);

  // 2. Setup React Hook Form
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
  });

  // Setup dynamic steps
  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  // 3. Fetch data when the page loads
  useEffect(() => {
    const fetchTestCase = async () => {
      try {
        if (!id) return;
        const data = await testCaseApi.getTestCaseById(id);
        setTestCaseInfo(data);
        
        // This is the magic! It pre-fills the form with the database data
        reset({
          title: data.title,
          description: data.description || "",
          module: data.module,
          priority: data.priority,
          severity: data.severity,
          type: data.type || "Functional",
          status: data.status,
          changeSummary: "", // Leave blank for the user to type
          steps: data.steps.map((step: TestCaseDetail["steps"][0]) => ({
            action: step.action,
            testData: step.testData || "",
            expectedResult: step.expectedResult,
          }))
        });
      } catch (error) {
        console.error("Failed to fetch test case", error);
        alert("Failed to load test case data.");
      } finally {
        setLoading(false);
      }
    };
    fetchTestCase();
  }, [id, reset]);

  // 4. Handle the actual submission
  const onSubmit = async (formData: EditFormValues) => {
    try {
      await testCaseApi.updateTestCase(id as string, formData);
      alert("Test case updated successfully! Version incremented.");
      navigate("/test-cases"); // Go back to the list
    } catch (error: unknown) {
      console.error("Update failed", error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Failed to update test case.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading test case...</div>;
  if (!testCaseInfo) return <div className="p-8 text-center text-red-500">Test case not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg mt-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Test Case: {testCaseInfo.testCaseId}</h1>
      <p className="text-sm text-gray-500 mb-6">Current Version: v{testCaseInfo.version}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* === SECTION 1: CHANGE SUMMARY (Required for edits) === */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <label className="block text-sm font-bold text-blue-900 mb-1">Change Summary *</label>
          <input 
            {...register("changeSummary")} 
            className="w-full border border-gray-300 p-2 rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder="Why are you editing this? e.g., 'Updated login steps for new UI'"
          />
          {errors.changeSummary && <p className="text-red-500 text-xs mt-1">{errors.changeSummary.message}</p>}
        </div>

        {/* === SECTION 2: BASIC INFO === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input {...register("title")} className="w-full border border-gray-300 p-2 rounded mt-1" />
            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Module *</label>
            <input {...register("module")} className="w-full border border-gray-300 p-2 rounded mt-1" />
            {errors.module && <p className="text-red-500 text-xs">{errors.module.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <select {...register("priority")} className="w-full border border-gray-300 p-2 rounded mt-1">
              <option value="P1">P1 (Critical)</option>
              <option value="P2">P2 (High)</option>
              <option value="P3">P3 (Medium)</option>
              <option value="P4">P4 (Low)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select {...register("status")} className="w-full border border-gray-300 p-2 rounded mt-1">
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* === SECTION 3: STEPS === */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Test Steps</h2>
            <button 
              type="button" 
              onClick={() => append({ action: "", testData: "", expectedResult: "" })}
              className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              + Add Step
            </button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 p-4 rounded-md mb-4 bg-gray-50 relative">
              <div className="absolute top-2 right-2">
                <button 
                  type="button" 
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
              <h4 className="font-bold text-gray-700 mb-2">Step {index + 1}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Action *</label>
                  <textarea {...register(`steps.${index}.action`)} className="w-full border p-2 rounded mt-1 text-sm" rows={2}></textarea>
                  {errors.steps?.[index]?.action && <p className="text-red-500 text-xs">{errors.steps[index]?.action?.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Test Data</label>
                  <textarea {...register(`steps.${index}.testData`)} className="w-full border p-2 rounded mt-1 text-sm" rows={2}></textarea>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Expected Result *</label>
                  <textarea {...register(`steps.${index}.expectedResult`)} className="w-full border p-2 rounded mt-1 text-sm" rows={2}></textarea>
                  {errors.steps?.[index]?.expectedResult && <p className="text-red-500 text-xs">{errors.steps[index]?.expectedResult?.message}</p>}
                </div>
              </div>
            </div>
          ))}
          {errors.steps?.root && <p className="text-red-500 text-sm">{errors.steps.root.message}</p>}
        </div>

        <div className="flex justify-end gap-4 mt-8 border-t pt-4">
          <button 
            type="button" 
            onClick={() => navigate("/test-cases")}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}