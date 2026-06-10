'use client';

// Operations tab — the engine room: what agents are doing, what just shipped,
// and OS health (graph / tokens / sessions). Each panel is feature-flagged.

import type { CommandPanelId } from '@/lib/command-panels';
import { AgentKanban } from './_situation';
import { ActivityLog, SourceReportsPanel } from './_done';
import { ProjectGraphPanel, WorkloadCalendarPanel, SessionSyncPanel } from './_system-strip';
import { TokenUsagePanel } from './_token-usage-panel';
import EmptyTab from './_empty-tab';

interface OperationsTabProps {
  isOn: (id: CommandPanelId) => boolean;
}

export default function OperationsTab({ isOn }: OperationsTabProps) {
  const anyOn =
    isOn('agentStatus') || isOn('activityLog') || isOn('sourceReports') ||
    isOn('systemTokens') || isOn('systemGraph') ||
    isOn('systemSessions') || isOn('workloadCalendar');

  if (!anyOn) return <EmptyTab />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isOn('agentStatus')   && <AgentKanban />}
      {isOn('systemTokens')  && <TokenUsagePanel />}
      {isOn('activityLog')   && <ActivityLog />}
      {isOn('sourceReports') && <SourceReportsPanel />}

      {/* System panels — directly visible, no accordion */}
      <div className="ceo-system-4col">
        {isOn('systemGraph')    && <ProjectGraphPanel />}
        {isOn('systemSessions') && <SessionSyncPanel />}
        {isOn('workloadCalendar') && <WorkloadCalendarPanel />}
      </div>
    </div>
  );
}
