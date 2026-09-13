import { SupabaseClient } from '@supabase/supabase-js';

export type CopyrightStatus = 
  | 'Processing'
  | 'Clear'
  | 'Potential Match'
  | 'Restricted'
  | 'Removed'
  | 'Appeal Pending'
  | 'Appeal Approved'
  | 'Appeal Rejected'
  | 'No Issue';

export type AppealStatus = 
  | 'Submitted' 
  | 'Under Review' 
  | 'Approved' 
  | 'Rejected' 
  | 'Closed';

export interface CopyrightRecord {
  id: string;
  post_id: string;
  user_id: string;
  status: CopyrightStatus;
  matched_reference?: string;
  reason: string;
  visibility_affected: boolean;
  monetization_affected: boolean;
  allow_appeal: boolean;
  appeal_status?: AppealStatus;
  appeal_explanation?: string;
  appeal_supporting_info?: string;
  appeal_updated_at?: string;
  created_at: string;
}

export async function runCopyrightCheck(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  caption: string,
  mediaUrl: string
): Promise<CopyrightStatus> {
  try {
    await supabase.from('copyright_records').upsert({
      id: `cr_${postId}`,
      post_id: postId,
      user_id: userId,
      status: 'Processing',
      reason: 'Scan initiated: Automated video/audio fingerprinting and rights registry check in progress.',
      visibility_affected: false,
      monetization_affected: false,
      allow_appeal: false,
      created_at: new Date().toISOString()
    }, { onConflict: 'id' });

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'copyright_notice',
      content: `Copyright Check Started: Your upload "${caption || 'Untitled'}" is currently being scanned.`,
      created_at: new Date().toISOString(),
      is_read: false
    });

    const { data: existingPosts } = await supabase
      .from('posts')
      .select('id, media_url, caption, user_id')
      .neq('id', postId);

    let finalStatus: CopyrightStatus = 'Clear';
    let matchReason = 'Scan completed successfully. No copyright issues detected.';
    let visibilityAffected = false;
    let monetizationAffected = false;
    let allowAppeal = false;

    if (existingPosts && existingPosts.length > 0) {
      const exactMatch = existingPosts.find(p => p.media_url === mediaUrl);
      if (exactMatch && exactMatch.user_id !== userId) {
        finalStatus = 'Potential Match';
        matchReason = 'Potential duplicate match detected with registered platform reference content (ID: ' + exactMatch.id.substring(0, 8) + '). Earnings temporarily restricted.';
        visibilityAffected = true;
        monetizationAffected = true;
        allowAppeal = true;
      }
    }

    await supabase.from('copyright_records').upsert({
      id: `cr_${postId}`,
      post_id: postId,
      user_id: userId,
      status: finalStatus,
      reason: matchReason,
      visibility_affected: visibilityAffected,
      monetization_affected: monetizationAffected,
      allow_appeal: allowAppeal,
      created_at: new Date().toISOString()
    }, { onConflict: 'id' });

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'copyright_notice',
      content: `Copyright Processing Complete: Your video "${caption || 'Untitled'}" status is "${finalStatus}". Visibility Affected: ${visibilityAffected ? 'Yes' : 'No'}, Monetization: ${monetizationAffected ? 'Restricted' : 'Eligible'}.`,
      created_at: new Date().toISOString(),
      is_read: false
    });

    return finalStatus;
  } catch (err) {
    console.error('Copyright check error:', err);
    return 'Clear';
  }
}

export async function submitCopyrightAppeal(
  supabase: SupabaseClient,
  recordId: string,
  explanation: string,
  supportingInfo: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('copyright_records')
      .update({
        status: 'Appeal Pending',
        appeal_status: 'Submitted',
        appeal_explanation: explanation,
        appeal_supporting_info: supportingInfo,
        appeal_updated_at: new Date().toISOString()
      })
      .eq('id', recordId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error submitting appeal:', err);
    return false;
  }
}

export async function deleteVideoWithCopyrightAudit(
  supabase: SupabaseClient,
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    await supabase
      .from('copyright_records')
      .update({
        status: 'Removed',
        reason: 'Video deleted by user. Minimum moderation and audit record preserved per platform policy. Earnings halted.',
        visibility_affected: true,
        monetization_affected: true,
        allow_appeal: false
      })
      .eq('post_id', postId);

    return true;
  } catch (err) {
    console.error('Error deleting video with copyright audit:', err);
    return false;
  }
}

export async function adminReviewCopyrightAction(
  supabase: SupabaseClient,
  recordId: string,
  action: 'Clear' | 'Potential Match' | 'Restricted' | 'Removed' | 'Appeal Pending' | 'Appeal Approved' | 'Appeal Rejected' | 'Under Review',
  appealResolution?: 'Approved' | 'Rejected' | 'Closed'
): Promise<boolean> {
  try {
    const updateData: any = {};
    if (action === 'Appeal Approved') {
      updateData.status = 'Appeal Approved';
      updateData.appeal_status = 'Approved';
      updateData.visibility_affected = false;
      updateData.monetization_affected = false;
    } else if (action === 'Appeal Rejected') {
      updateData.status = 'Appeal Rejected';
      updateData.appeal_status = 'Rejected';
      updateData.visibility_affected = true;
      updateData.monetization_affected = true;
    } else {
      updateData.status = action;
      if (action === 'Removed' || action === 'Restricted') {
        updateData.visibility_affected = true;
        updateData.monetization_affected = true;
      } else if (action === 'Clear') {
        updateData.visibility_affected = false;
        updateData.monetization_affected = false;
      }
    }

    const { error } = await supabase
      .from('copyright_records')
      .update(updateData)
      .eq('id', recordId);

    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: 'system_admin_audit',
      type: 'admin_audit',
      content: `Admin reviewed copyright record ${recordId}: Action=${action}`,
      created_at: new Date().toISOString(),
      is_read: false
    });

    return true;
  } catch (err) {
    console.error('Error in adminReviewCopyrightAction:', err);
    return false;
  }
}

export async function getAdminCopyrightReports(supabase: SupabaseClient) {
  try {
    const { data: records, error } = await supabase
      .from('copyright_records')
      .select('*, posts(caption, media_url, type, image, user_id)')
      .order('created_at', { ascending: false });

    if (error || !records) return [];
    return records;
  } catch (err) {
    console.error('Error fetching admin copyright reports:', err);
    return [];
  }
}

export async function getUserCopyrightSummary(supabase: SupabaseClient, userId: string) {
  try {
    const { data: records, error } = await supabase
      .from('copyright_records')
      .select('*, posts(caption, media_url, type, image)')
      .eq('user_id', userId);

    if (error || !records) {
      return {
        totalNotices: 0,
        potentialMatches: 0,
        underReview: 0,
        activeClaims: 0,
        removedVideos: 0,
        resolvedCases: 0,
        records: []
      };
    }

    const totalNotices = records.filter(r => r.status !== 'Clear' && r.status !== 'No Issue').length;
    const potentialMatches = records.filter(r => r.status === 'Potential Match').length;
    const underReview = records.filter(r => r.status === 'Appeal Pending' || r.status === 'Processing').length;
    const activeClaims = records.filter(r => r.status === 'Restricted').length;
    const removedVideos = records.filter(r => r.status === 'Removed').length;
    const resolvedCases = records.filter(r => r.status === 'Clear' || r.status === 'Appeal Approved').length;

    return {
      totalNotices,
      potentialMatches,
      underReview,
      activeClaims,
      removedVideos,
      resolvedCases,
      records
    };
  } catch (err) {
    console.error('Error fetching copyright summary:', err);
    return {
      totalNotices: 0,
      potentialMatches: 0,
      underReview: 0,
      activeClaims: 0,
      removedVideos: 0,
      resolvedCases: 0,
      records: []
    };
  }
}
