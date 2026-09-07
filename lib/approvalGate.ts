import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admin from '@/lib/models/Admin';
import PendingApproval, { ApprovalActionType } from '@/lib/models/PendingApproval';
import { VerifyAuthResult } from '@/lib/authHelper';

/**
 * Checks whether a staff action should be intercepted and queued for admin approval.
 *
 * - Admins are NEVER gated (requiresApproval is false for them).
 * - Staff with requiresApproval=true: action is saved as PendingApproval; returns intercepted=true.
 * - Staff without the flag: returns intercepted=false; action proceeds normally.
 *
 * @param auth       Result from verifyPermissions()
 * @param actionType Type of action being performed
 * @param payload    Full request body that would have been executed
 * @param targetId   For updates: the target document ID (product _id, etc.)
 */
export async function checkApprovalGate(
  auth: VerifyAuthResult,
  actionType: ApprovalActionType,
  payload: Record<string, any>,
  targetId?: string
): Promise<{ intercepted: boolean; response?: NextResponse }> {
  // Admins are never gated
  if (!auth.requiresApproval) {
    return { intercepted: false };
  }

  // Staff with requiresApproval=true — intercept and queue
  try {
    await connectDB();

    // Look up the staff record to get the username for display
    const staffUser = await Admin.findById(auth.payload?.adminId).select('username');
    const staffUsername = staffUser?.username ?? 'Unknown Staff';

    await PendingApproval.create({
      staffId: auth.payload?.adminId,
      staffUsername,
      actionType,
      targetId: targetId ?? null,
      payload,
      status: 'pending',
    });

    return {
      intercepted: true,
      response: NextResponse.json(
        {
          success: true,
          pending: true,
          message:
            'Your submission has been sent to the admin for approval. It will go live once approved.',
        },
        { status: 202 }
      ),
    };
  } catch (error: any) {
    console.error('Approval gate error:', error);
    return {
      intercepted: true,
      response: NextResponse.json(
        { success: false, error: 'Failed to queue submission for approval.' },
        { status: 500 }
      ),
    };
  }
}
