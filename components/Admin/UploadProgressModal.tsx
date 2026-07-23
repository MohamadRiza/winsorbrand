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

export default function UploadProgressModal({ info }: UploadProgressModalProps) {
  if (!info.isOpen) return null;

  const displayPercent = Math.min(100, Math.max(0, Math.round(info.overallPercent)));

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[99999] p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border border-[#8B6914]/30 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center relative overflow-hidden font-['Jost']">
        
        {/* Animated Gold Ring Accent */}
        <div className="w-16 h-16 rounded-full bg-[#8B6914]/10 border-2 border-[#8B6914] flex items-center justify-center mx-auto mb-4 relative">
          <svg className="w-8 h-8 text-[#8B6914] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#1a1209] mb-1">
          Uploading Product Media
        </h3>
        <p className="text-xs text-[#1a1209]/60 mb-6 truncate px-2">
          File {info.currentIndex || 1} of {info.totalFiles || 1}: <span className="font-medium text-[#1a1209]">{info.currentFileName || 'Processing...'}</span>
        </p>

        {/* Big Percentage Number */}
        <div className="text-4xl font-bold text-[#8B6914] mb-3 font-mono tracking-tight">
          {displayPercent}%
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-3 bg-[#faf7f0] border border-[#1a1209]/10 rounded-full overflow-hidden mb-3 relative">
          <div 
            className="h-full bg-gradient-to-r from-[#8B6914] via-[#a07d1a] to-[#d9b878] transition-all duration-200 ease-out rounded-full shadow-[0_0_10px_rgba(139,105,20,0.4)]"
            style={{ width: `${displayPercent}%` }}
          />
        </div>

        {/* Byte Stats */}
        <div className="flex justify-between text-xs text-[#1a1209]/60 font-medium">
          <span>{formatBytes(info.loadedBytes)} uploaded</span>
          <span>Total: {formatBytes(info.totalBytes)}</span>
        </div>

        <p className="text-[11px] text-[#8B6914] mt-6 pt-4 border-t border-[#1a1209]/10 flex items-center justify-center gap-2 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-[#8B6914] animate-ping" />
          Please do not close this window while files upload
        </p>
      </div>
    </div>
  );
}
