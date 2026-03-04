import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBug, type CreateBugPayload } from '../services/bugApi';

// 1. Strictly type the props so the parent component knows exactly what to pass in
export interface CreateBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCaseId: string; // The database UUID
  testCaseDisplayId: string; // The readable ID, like TC-2026-00001
  stepNumber: number;
  expectedBehavior: string;
  actualBehavior: string;
  stepsToReproduce: string;
}

// 2. Define the Zod schema for the FEW fields the user actually needs to fill out manually
const quickBugSchema = z.object({
  severity: z.enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  assignedToId: z.string().optional(), // Optional, in case they leave it unassigned
});

type QuickBugFormData = z.infer<typeof quickBugSchema>;

export default function CreateBugModal({
  isOpen,
  onClose,
  testCaseId,
  testCaseDisplayId,
  stepNumber,
  expectedBehavior,
  actualBehavior,
  stepsToReproduce,
}: CreateBugModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<QuickBugFormData>({
    resolver: zodResolver(quickBugSchema),
    defaultValues: {
      severity: "MAJOR",
      priority: "P2",
    }
  });

  if (!isOpen) return null; // Don't render anything if the modal is closed

  const onSubmit = async (data: QuickBugFormData) => {
    setIsSubmitting(true);
    try {
      // 3. We auto-construct the full payload required by the backend!
      const finalPayload: CreateBugPayload = {
        title: `Failure in ${testCaseDisplayId} Step ${stepNumber}`,
        description: `This bug was auto-generated from a failed execution of ${testCaseDisplayId}.`,
        stepsToReproduce: stepsToReproduce,
        expectedBehavior: expectedBehavior,
        actualBehavior: actualBehavior,
        severity: data.severity,
        priority: data.priority,
        environment: "Production", // Hardcoded for now, you can make this dynamic later
        affectedVersion: "v1.0.0", // Hardcoded for now
        linkedTestCaseId: testCaseId,
        // Only include assignedToId if the user actually typed something
        ...(data.assignedToId && { assignedToId: data.assignedToId }),
      };

      await createBug(finalPayload);
      alert("Bug created successfully and linked to this test step!");
      onClose(); // Close the modal on success
    } catch (error) {
      console.error("Failed to quick-create bug:", error);
      alert("Failed to create bug. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4">Quick Fail: Report Bug</h2>
        
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-gray-700">
          <p><strong>Auto-linking to:</strong> {testCaseDisplayId} (Step {stepNumber})</p>
          <p className="mt-1 truncate"><strong>Actual Behavior:</strong> {actualBehavior}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Severity</label>
              <select {...register('severity')} className="w-full border p-2 rounded mt-1">
                <option value="BLOCKER">Blocker</option>
                <option value="CRITICAL">Critical</option>
                <option value="MAJOR">Major</option>
                <option value="MINOR">Minor</option>
                <option value="TRIVIAL">Trivial</option>
              </select>
              {errors.severity && <p className="text-red-500 text-xs mt-1">{errors.severity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Priority</label>
              <select {...register('priority')} className="w-full border p-2 rounded mt-1">
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
                <option value="P4">P4</option>
              </select>
              {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Assign To (Developer UUID - Optional)</label>
            <input 
              {...register('assignedToId')} 
              placeholder="Enter developer UUID here..." 
              className="w-full border p-2 rounded mt-1 text-sm" 
            />
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}