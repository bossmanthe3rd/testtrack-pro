import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as testCaseApi from "../services/testCaseApi";
import ExecutionHistory from "../components/ExecutionHistory";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";

// ── Zod Schema (UNCHANGED) ─────────────────────────────────────────────────────
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

// ── Shared style tokens ────────────────────────────────────────────────────────
const inputCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const selectCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";
const errorCls = "text-red-400 text-xs mt-1";

// ── Component ──────────────────────────────────────────────────────────────────
export default function EditTestCase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testCaseInfo, setTestCaseInfo] = useState<TestCaseDetail | null>(null);

  // ── useForm (UNCHANGED) ────────────────────────────────────────────────────
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
  });

  // ── useFieldArray (UNCHANGED) ──────────────────────────────────────────────
  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  // ── Data Fetch (UNCHANGED) ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchTestCase = async () => {
      try {
        if (!id) return;
        const data = await testCaseApi.getTestCaseById(id);
        setTestCaseInfo(data);
        reset({
          title: data.title,
          description: data.description || "",
          module: data.module,
          priority: data.priority,
          severity: data.severity,
          type: data.type || "Functional",
          status: data.status,
          changeSummary: "",
          steps: (data.steps || []).map((step: TestCaseDetail["steps"][0]) => ({
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

  // ── Submit Handler (UNCHANGED) ─────────────────────────────────────────────
  const onSubmit = async (formData: EditFormValues) => {
    try {
      await testCaseApi.updateTestCase(id as string, formData);
      alert("Test case updated successfully! Version incremented.");
      navigate("/test-cases");
    } catch (error: unknown) {
      console.error("Update failed", error);
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Failed to update test case.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
        Loading test case...
      </div>
    </div>
  );

  if (!testCaseInfo) return (
    <div className="p-8 text-center text-red-400">Test case not found.</div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-1">Test Cases</p>
        <h1 className="text-4xl font-bold text-white">
          Edit: <span className="text-indigo-400 font-mono">{testCaseInfo.testCaseId}</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Current Version: v{testCaseInfo.version}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errs) => console.log('Form errors:', errs))} className="space-y-6">

        {/* ── CARD 1: Change Summary ── */}
        <Card className="bg-indigo-500/5 border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-indigo-300">Change Summary *</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              {...register("changeSummary")}
              className={inputCls}
              placeholder="Why are you editing this? e.g., 'Updated login steps for new UI'"
            />
            {errors.changeSummary && <p className={errorCls}>{errors.changeSummary.message}</p>}
          </CardContent>
        </Card>

        {/* ── CARD 2: Basic Info ── */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-200">Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Title *</label>
                <input {...register("title")} className={inputCls} />
                {errors.title && <p className={errorCls}>{errors.title.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Module *</label>
                <input {...register("module")} className={inputCls} />
                {errors.module && <p className={errorCls}>{errors.module.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Priority</label>
                <select {...register("priority")} className={selectCls}>
                  <option value="P1">P1 — Critical</option>
                  <option value="P2">P2 — High</option>
                  <option value="P3">P3 — Medium</option>
                  <option value="P4">P4 — Low</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Severity</label>
                <select {...register("severity")} className={selectCls}>
                  <option value="BLOCKER">Blocker</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="MAJOR">Major</option>
                  <option value="MINOR">Minor</option>
                  <option value="TRIVIAL">Trivial</option>
                </select>
                {errors.severity && <p className={errorCls}>{errors.severity.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Type *</label>
                <input {...register("type")} className={inputCls} placeholder="e.g., Functional, UI, Security" />
                {errors.type && <p className={errorCls}>{errors.type.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select {...register("status")} className={selectCls}>
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Description</label>
                <textarea {...register("description")} className={inputCls + ' resize-none'} rows={3} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── CARD 3: Test Steps ── */}
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold text-slate-200">Test Steps</CardTitle>
            <button
              type="button"
              onClick={() => append({ action: "", testData: "", expectedResult: "" })}
              className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Add Step
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="bg-slate-900 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Step {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Action *</label>
                    <textarea {...register(`steps.${index}.action`)} className={inputCls + ' resize-none'} rows={2} />
                    {errors.steps?.[index]?.action && <p className={errorCls}>{errors.steps[index]?.action?.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Test Data</label>
                    <textarea {...register(`steps.${index}.testData`)} className={inputCls + ' resize-none'} rows={2} />
                  </div>
                  <div>
                    <label className={labelCls}>Expected Result *</label>
                    <textarea {...register(`steps.${index}.expectedResult`)} className={inputCls + ' resize-none'} rows={2} />
                    {errors.steps?.[index]?.expectedResult && <p className={errorCls}>{errors.steps[index]?.expectedResult?.message}</p>}
                  </div>
                </div>
              </div>
            ))}
            {errors.steps?.root && <p className={errorCls}>{errors.steps.root.message}</p>}
          </CardContent>
        </Card>

        {/* ── Action Buttons ── */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/test-cases")}
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-all shadow-lg shadow-indigo-900/30"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* ── Execution History (UNCHANGED logic) ── */}
      {id && <ExecutionHistory testCaseId={id} />}
    </div>
  );
}