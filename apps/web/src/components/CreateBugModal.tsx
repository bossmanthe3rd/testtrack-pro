import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBug, getDevelopersList, type CreateBugPayload, type UserRef } from '../services/bugApi';
import { Bug, X, CheckCircle2 } from 'lucide-react';

export interface CreateBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCaseId: string;
  testCaseDisplayId: string;
  stepNumber: number;
  expectedBehavior: string;
  actualBehavior: string;
  stepsToReproduce: string;
  executionStepId?: string;
}

const quickBugSchema = z.object({
  severity:     z.enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]),
  priority:     z.enum(["P1", "P2", "P3", "P4"]),
  assignedToId: z.string().optional(),
});

type QuickBugFormData = z.infer<typeof quickBugSchema>;

const selectCls = "w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls  = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

export default function CreateBugModal({
  isOpen, onClose,
  testCaseId, testCaseDisplayId,
  stepNumber, expectedBehavior, actualBehavior, stepsToReproduce,
  executionStepId,
}: CreateBugModalProps) {
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [developers,   setDevelopers]     = useState<UserRef[]>([]);

  // Fetch developer list when modal opens
  useEffect(() => {
    if (!isOpen) return;
    getDevelopersList()
      .then(setDevelopers)
      .catch(err => console.error('Failed to load developers', err));
  }, [isOpen]);

  const { register, handleSubmit, formState: { errors } } = useForm<QuickBugFormData>({
    resolver: zodResolver(quickBugSchema),
    defaultValues: { severity: "MAJOR", priority: "P2" },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: QuickBugFormData) => {
    setIsSubmitting(true);
    try {
      const finalPayload: CreateBugPayload = {
        title:            `Failure in ${testCaseDisplayId} Step ${stepNumber}`,
        description:      `Auto-generated from a failed execution of ${testCaseDisplayId}.`,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        severity:         data.severity,
        priority:         data.priority,
        environment:      "Production",
        affectedVersion:  "v1.0.0",
        linkedTestCaseId: testCaseId,
        executionStepId:  executionStepId,
        ...(data.assignedToId && { assignedToId: data.assignedToId }),
      };
      await createBug(finalPayload);
      onClose();
    } catch (error) {
      console.error("Failed to quick-create bug:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-black/40">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Bug className="h-4 w-4 text-red-400" />
            </div>
            <h2 className="text-base font-bold text-white">Quick Bug Report</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Context banner */}
        <div className="mb-5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs text-slate-400 space-y-1">
          <p><span className="text-slate-300 font-semibold">Linking to:</span> {testCaseDisplayId} — Step {stepNumber}</p>
          <p className="truncate"><span className="text-slate-300 font-semibold">Actual:</span> {actualBehavior}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Severity */}
            <div>
              <label className={labelCls}>Severity</label>
              <select {...register('severity')} className={selectCls}>
                <option value="BLOCKER">Blocker</option>
                <option value="CRITICAL">Critical</option>
                <option value="MAJOR">Major</option>
                <option value="MINOR">Minor</option>
                <option value="TRIVIAL">Trivial</option>
              </select>
              {errors.severity && <p className="text-red-400 text-xs mt-1">{errors.severity.message}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className={labelCls}>Priority</label>
              <select {...register('priority')} className={selectCls}>
                <option value="P1">P1 — Urgent</option>
                <option value="P2">P2 — High</option>
                <option value="P3">P3 — Medium</option>
                <option value="P4">P4 — Low</option>
              </select>
              {errors.priority && <p className="text-red-400 text-xs mt-1">{errors.priority.message}</p>}
            </div>
          </div>

          {/* Assign to developer — proper dropdown */}
          <div>
            <label className={labelCls}>
              Assign To <span className="normal-case text-slate-600 font-normal tracking-normal">(optional)</span>
            </label>
            <select {...register('assignedToId')} className={selectCls}>
              <option value="">— Unassigned —</option>
              {developers.map(dev => (
                <option key={dev.id} value={dev.id}>{dev.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-900/30 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? 'Creating…' : 'Create Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}