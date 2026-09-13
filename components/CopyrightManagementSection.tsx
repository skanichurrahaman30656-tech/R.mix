'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, FileText, CheckCircle2, XCircle, Clock, RefreshCw, Send, Trash2, HelpCircle } from 'lucide-react';
import { getUserCopyrightSummary, submitCopyrightAppeal, deleteVideoWithCopyrightAudit, CopyrightRecord } from '@/lib/copyright';
import Image from 'next/image';

interface CopyrightManagementSectionProps {
  supabase: any;
  user: any;
}

export function CopyrightManagementSection({ supabase, user }: CopyrightManagementSectionProps) {
  const [summary, setSummary] = useState<any>({
    totalNotices: 0,
    potentialMatches: 0,
    underReview: 0,
    activeClaims: 0,
    removedVideos: 0,
    resolvedCases: 0,
    records: []
  });
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'appeal' | 'delete' | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CopyrightRecord | null>(null);
  const [appealExplanation, setAppealExplanation] = useState('');
  const [appealSupporting, setAppealSupporting] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await getUserCopyrightSummary(supabase, user.id);
    setSummary(data);
    setLoading(false);
  }, [supabase, user?.id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleOpenAppeal = (record: CopyrightRecord) => {
    setSelectedRecord(record);
    setAppealExplanation(record.appeal_explanation || '');
    setAppealSupporting(record.appeal_supporting_info || '');
    setActiveModal('appeal');
  };

  const handleOpenDelete = (record: CopyrightRecord) => {
    setSelectedRecord(record);
    setActiveModal('delete');
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmittingAppeal(true);
    const success = await submitCopyrightAppeal(supabase, selectedRecord.id, appealExplanation, appealSupporting);
    setSubmittingAppeal(false);
    if (success) {
      setActiveModal(null);
      fetchSummary();
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedRecord) return;
    setDeletingPost(true);
    const success = await deleteVideoWithCopyrightAudit(supabase, selectedRecord.post_id, user.id);
    setDeletingPost(false);
    if (success) {
      setActiveModal(null);
      fetchSummary();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'No Issue':
        return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> No Issue</span>;
      case 'Potential Match':
        return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Potential Match</span>;
      case 'Under Review':
        return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Under Review</span>;
      case 'Copyright Claimed':
        return <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-bold flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Copyright Claimed</span>;
      case 'Restricted':
        return <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-[10px] font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Restricted</span>;
      case 'Removed':
        return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Removed</span>;
      case 'Resolved':
        return <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resolved</span>;
      default:
        return <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full text-[10px] font-bold">{status}</span>;
    }
  };

  const getAppealBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'Submitted':
      case 'Under Review':
        return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold flex items-center gap-1">Appeal: {status}</span>;
      case 'Approved':
        return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold flex items-center gap-1">Appeal Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold flex items-center gap-1">Appeal Rejected</span>;
      case 'Closed':
        return <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full text-[10px] font-bold">Appeal Closed</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs">
        Loading copyright management & status records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <span>Copyright Management & Status Center</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automated video/audio fingerprinting, rights registry matching, appeals system, and video removal options.
          </p>
        </div>
        <button
          onClick={fetchSummary}
          className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-300 border border-zinc-800 flex items-center gap-1.5 text-xs font-semibold transition-colors"
          title="Refresh Copyright Status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-zinc-400">Total Notices</span>
          <span className="text-xl font-black text-white mt-2">{summary.totalNotices}</span>
        </div>
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-400">Potential Matches</span>
          <span className="text-xl font-black text-amber-400 mt-2">{summary.potentialMatches}</span>
        </div>
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-400">Under Review</span>
          <span className="text-xl font-black text-blue-400 mt-2">{summary.underReview}</span>
        </div>
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-purple-400">Active Claims</span>
          <span className="text-xl font-black text-purple-400 mt-2">{summary.activeClaims}</span>
        </div>
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-red-400">Removed</span>
          <span className="text-xl font-black text-red-400 mt-2">{summary.removedVideos}</span>
        </div>
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-bold text-green-400">Resolved</span>
          <span className="text-xl font-black text-green-400 mt-2">{summary.resolvedCases}</span>
        </div>
      </div>

      {/* Copyright Records List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Protected Media & Dispute Management</h4>
        {summary.records.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl text-zinc-500 text-xs">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            No copyright notices or claims found. All your uploads are verified and in good standing.
          </div>
        ) : (
          <div className="space-y-3">
            {summary.records.map((record: CopyrightRecord & { posts?: any }) => {
              const post = record.posts;
              const mediaSrc = post?.media_url || post?.image;
              return (
                <div key={record.id} className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden relative shrink-0 border border-zinc-700">
                      {mediaSrc ? (
                        <Image width={100} height={100} referrerPolicy="no-referrer" src={mediaSrc} alt="Media" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[10px]">MEDIA</div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{post?.caption || 'Untitled Video / Post'}</span>
                        {getStatusBadge(record.status)}
                        {getAppealBadge(record.appeal_status)}
                      </div>
                      <p className="text-xs text-zinc-300 max-w-xl">{record.reason}</p>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
                        <span className="flex items-center gap-1">
                          <span className="text-zinc-500">Visibility Affected:</span>
                          <span className={record.visibility_affected ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {record.visibility_affected ? 'Yes (Hidden from public feed)' : 'No'}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-zinc-500">Monetization:</span>
                          <span className={record.monetization_affected ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {record.monetization_affected ? 'Restricted' : 'Active'}
                          </span>
                        </span>
                        <span className="text-zinc-500">Date: {new Date(record.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    {record.allow_appeal && record.status !== 'Removed' && (
                      <button
                        onClick={() => handleOpenAppeal(record)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{record.appeal_status ? 'View/Edit Appeal' : 'Appeal / Dispute'}</span>
                      </button>
                    )}
                    {record.status !== 'Removed' && (
                      <button
                        onClick={() => handleOpenDelete(record)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Delete Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Video</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Appeal Modal */}
      {activeModal === 'appeal' && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span>Copyright Dispute & Appeal Form</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold px-2.5 py-1 bg-zinc-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSendAppeal} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Reason for Claim / Restriction</label>
                <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-xl border border-zinc-800">{selectedRecord.reason}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Explanation for Appeal *</label>
                <textarea
                  required
                  rows={3}
                  value={appealExplanation}
                  onChange={(e) => setAppealExplanation(e.target.value)}
                  placeholder="Explain why you have the rights or license to use this content, or why this is an incorrect match..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Supporting Information / License ID / Link</label>
                <input
                  type="text"
                  value={appealSupporting}
                  onChange={(e) => setAppealSupporting(e.target.value)}
                  placeholder="e.g. Creator License #94821 or authorization link"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAppeal}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {submittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Video Confirmation Modal */}
      {activeModal === 'delete' && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2 text-red-400">
                <Trash2 className="w-5 h-5" />
                <span>Delete Video & Remove Content</span>
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold px-2.5 py-1 bg-zinc-800 rounded-lg"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete this video? This action will immediately:
            </p>
            <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
              <li>Remove it from public feed visibility</li>
              <li>Remove it from reels and user profile media</li>
              <li>Stop future algorithmic recommendations</li>
              <li>Preserve only the minimum moderation audit record required by platform policy</li>
            </ul>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingPost}
                onClick={handleDeleteConfirmed}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {deletingPost ? 'Deleting...' : 'Confirm & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
