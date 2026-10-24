"use client";

import React from "react";
import { X, CheckCircle2, Clock, FileCheck, ArrowUpRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { ActivityItem } from "@/types";

interface ActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityItem[];
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  isOpen,
  onClose,
  activities,
}) => {
  if (!isOpen) return null;

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "TX_CONFIRMED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "TX_SUBMITTED":
        return <Clock className="w-4 h-4 text-apple-blue" />;
      case "PREVIEW_CREATED":
        return <FileCheck className="w-4 h-4 text-apple-blue" />;
      case "COLLECTION_RESOLVED":
        return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      case "TX_FAILED":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-apple-secondary" />;
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-apple-surface dark:bg-apple-darkSurface border-l border-apple-border dark:border-apple-darkBorder shadow-apple-floating flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-apple-border/50 dark:border-apple-darkBorder/50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-apple-text dark:text-apple-darkText">
                Activity & History
              </h3>
              <p className="text-xs text-apple-secondary dark:text-apple-darkSecondary">
                Live audit trail of session events
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-apple-secondary hover:text-apple-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Close activity drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Activities list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-apple-secondary dark:text-apple-darkSecondary text-xs">
                No recent activity in this session yet.
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-apple-sm bg-apple-subtle dark:bg-apple-darkSubtle border border-apple-border/30 dark:border-apple-darkBorder/30 space-y-1.5 text-xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium text-apple-text dark:text-apple-darkText">
                      {getActivityIcon(act.type)}
                      <span>{act.title}</span>
                    </div>
                    <span className="text-[10px] text-apple-secondary dark:text-apple-darkSecondary font-mono">
                      {formatTime(act.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-apple-secondary dark:text-apple-darkSecondary leading-relaxed">
                    {act.description}
                  </p>
                  {act.explorerUrl && (
                    <a
                      href={act.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-apple-blue hover:underline pt-0.5"
                    >
                      <span>View on BscScan</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
