import React from 'react';
import {
  X,
  Cpu,
  ShieldCheck,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AIProviderStatus } from '../../types/index.js';
import { exportAllDataAsJSON, clearAllLocalData } from '../../lib/db.js';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiStatus?: AIProviderStatus;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  aiStatus,
}) => {
  if (!isOpen) return null;

  const handleExport = async () => {
    const jsonStr = await exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fieldquest-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWipe = async () => {
    if (window.confirm('Permanently wipe all locally saved data?')) {
      await clearAllLocalData();
      alert('All local data has been cleared.');
      onClose();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-forest-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper-white rounded-3xl border border-border-subtle p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-text-muted hover:text-forest-deep transition-colors cursor-pointer"
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6">
          <h2 className="font-editorial text-2xl font-bold text-forest-deep">
            AI Settings & Privacy
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Diagnostics, local inference status, and offline storage controls
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm">
          {/* AI Inference Status Box */}
          <div className="p-4 rounded-2xl border border-border-subtle bg-parchment-warm/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-forest-deep flex items-center gap-2">
                <Cpu className="w-4 h-4 text-moss-green" />
                <span>Inference Engine</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  aiStatus?.status === 'available'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {aiStatus?.status === 'available' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3" /> Demo Engine
                  </>
                )}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-forest-deep/90">
              <div className="flex justify-between py-1 border-b border-border-subtle/50">
                <span className="text-text-muted">Active Provider:</span>
                <span className="font-semibold uppercase">{aiStatus?.provider || 'demo'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle/50">
                <span className="text-text-muted">Configured Model:</span>
                <span className="font-mono text-[11px]">{aiStatus?.model || 'qwen3:4b'}</span>
              </div>
              <div className="pt-1 text-[11px] text-text-muted">
                {aiStatus?.message}
              </div>
            </div>
          </div>

          {/* Privacy & Zero-Tracking Guarantee */}
          <div className="p-4 rounded-2xl border border-border-subtle bg-paper-white space-y-2">
            <div className="font-bold text-forest-deep flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Zero-Tracking Privacy Guarantee</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              FieldQuest does not track your location, require accounts, or upload your observations to the cloud. All notes and images remain completely on this device.
            </p>
          </div>

          {/* Local Storage Controls */}
          <div className="p-4 rounded-2xl border border-border-subtle bg-paper-white space-y-3">
            <div className="font-bold text-forest-deep flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-moss-green" />
              <span>Local Data Management</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 py-2.5 px-3 rounded-xl border border-border-subtle bg-parchment-warm hover:bg-paper-white text-xs font-semibold text-forest-deep flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-moss-green" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={handleWipe}
                className="py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Wipe Storage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border-subtle text-center">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
