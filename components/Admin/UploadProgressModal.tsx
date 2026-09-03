'use client';

import React from 'react';

export interface UploadProgressInfo {
  isOpen: boolean;
  overallPercent: number; // 0 to 100
  currentFileName: string;
  currentIndex: number;   // 1-based index (e.g. 2)
  totalFiles: number;     // e.g. 5
  loadedBytes: number;
  totalBytes: number;
  estimatedSecondsRemaining?: number | null; // in seconds
  uploadSpeedBytesPerSec?: number | null;     // bytes per second
  stage?: 'uploading' | 'processing' | 'saving' | 'complete';
  statusMessage?: string;
}

interface UploadProgressModalProps {
  info: UploadProgressInfo;
}

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatTimeRemaining = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || !isFinite(seconds) || seconds <= 0) {
    return '';
  }
  const s = Math.max(1, Math.round(seconds));
  if (s < 60) {
    return `~${s}s remaining`;
  }
  const mins = Math.floor(s / 60);
  const remainingSecs = s % 60;
  return `~${mins}m ${remainingSecs}s remaining`;
};

export const formatSpeed = (bytesPerSec: number | null | undefined): string => {
  if (!bytesPerSec || bytesPerSec <= 0 || !isFinite(bytesPerSec)) return '';
  return `${formatBytes(bytesPerSec)}/s`;
};

export default function UploadProgressModal({ info }: UploadProgressModalProps) {
  if (!info.isOpen) return null;

  const displayPercent = Math.min(100, Math.max(0, Math.round(info.overallPercent)));
  const isComplete = info.stage === 'complete' || displayPercent >= 100;
  const isSaving = info.stage === 'saving';
  const isProcessing = info.stage === 'processing';
  const countdownText = formatTimeRemaining(info.estimatedSecondsRemaining);
  const speedText = formatSpeed(info.uploadSpeedBytesPerSec);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border border-[#8B6914]/30 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center relative overflow-hidden font-['Jost'] transition-all">
        
        {/* Animated Header Icon */}
        <div className="relative mx-auto mb-4 w-16 h-16 flex items-center justify-center">
          {isComplete ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-600 flex items-center justify-center text-emerald-600 animate-in zoom-in-75 duration-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : isSaving ? (
            <div className="w-16 h-16 rounded-full bg-[#8B6914]/10 border-2 border-[#8B6914] flex items-center justify-center text-[#8B6914]">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
          ) : isProcessing ? (
            <div className="w-16 h-16 rounded-full bg-[#8B6914]/10 border-2 border-[#8B6914] flex items-center justify-center text-[#8B6914]">
              <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#8B6914]/10 border-2 border-[#8B6914] flex items-center justify-center text-[#8B6914]">
              <svg className="w-8 h-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          )}
        </div>

        {/* Dynamic Title */}
        <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#1a1209] mb-1">
          {isComplete 
            ? 'Saved Successfully' 
            : isSaving 
            ? 'Saving to Database' 
            : isProcessing 
            ? 'Optimizing Cloud Assets' 
            : 'Uploading Product Media'}
        </h3>

        {/* Dynamic Subtitle / File Name */}
        <p className="text-xs text-[#1a1209]/60 mb-5 truncate px-2 min-h-[1.25rem]">
          {info.statusMessage ? (
            <span className="font-medium text-[#1a1209]">{info.statusMessage}</span>
          ) : info.totalFiles > 0 ? (
            <>
              File <span className="font-semibold text-[#8B6914]">{info.currentIndex || 1}</span> of <span className="font-semibold text-[#1a1209]">{info.totalFiles || 1}</span>:{' '}
              <span className="font-medium text-[#1a1209]">{info.currentFileName || 'Processing...'}</span>
            </>
          ) : (
            'Preparing files...'
          )}
        </p>

        {/* Percentage + Countdown Badge */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className={`text-4xl font-bold font-mono tracking-tight transition-colors duration-300 ${
            isComplete ? 'text-emerald-600' : 'text-[#8B6914]'
          }`}>
            {displayPercent}%
          </span>

          {countdownText && !isComplete && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#8B6914]/10 text-[#8B6914] text-xs font-semibold rounded-full animate-pulse">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {countdownText}
            </span>
          )}
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-3 bg-[#faf7f0] border border-[#1a1209]/10 rounded-full overflow-hidden mb-3 relative">
          <div 
            className={`h-full transition-all duration-300 ease-out rounded-full shadow-sm ${
              isComplete
                ? 'bg-emerald-600'
                : 'bg-gradient-to-r from-[#8B6914] via-[#a07d1a] to-[#d9b878]'
            }`}
            style={{ width: `${displayPercent}%` }}
          />
        </div>

        {/* Stats Row: Uploaded Bytes & Transfer Speed */}
        <div className="flex justify-between items-center text-xs text-[#1a1209]/60 font-medium px-0.5">
          <span>{formatBytes(info.loadedBytes)} uploaded</span>
          <div className="flex items-center gap-2">
            {speedText && !isComplete && (
              <span className="text-[#8B6914] font-semibold">{speedText}</span>
            )}
            <span>Total: {formatBytes(info.totalBytes)}</span>
          </div>
        </div>

        {/* Footer Guidance */}
        <p className="text-[11px] text-[#8B6914] mt-6 pt-4 border-t border-[#1a1209]/10 flex items-center justify-center gap-2 font-medium">
          {!isComplete && (
            <span className="inline-block w-2 h-2 rounded-full bg-[#8B6914] animate-ping" />
          )}
          {isComplete 
            ? 'Redirecting to products list...' 
            : isSaving 
            ? 'Finalizing product listing, please wait...' 
            : 'Please do not close or refresh this tab while uploading'}
        </p>
      </div>
    </div>
  );
}
