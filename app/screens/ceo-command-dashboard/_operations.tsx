'use client';

// Operations tab — the engine room: what agents are doing, what just shipped,
// and OS health (graph / tokens / sessions). Each panel is feature-flagged.

import type { CommandPanelId } from '@/lib/command-panels';
import { AgentKanban } from './_situation';
import { ActivityLog, SourceReportsPanel } from './_done';
import SystemStrip from './_system-strip';
import EmptyTab from './_empty-tab';

interface OperationsTabProps {
  isOn: (id: CommandPanelId) => boolean;
}

export default function OperationsTab({ isOn }: OperationsTabProps) {
  const anySystem =
    isOn('systemGraph') || isOn('systemTokens') ||
    isOn('systemSessions') || isOn('workloadCalendar');

  const anyOn =
    isOn('agentStatus') || isOn('activityLog') || isOn('sourceReports') || anySystem;

  if (!anyOn) return <EmptyTab />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isOn('agentStatus')   && <AgentKanban />}
      {isOn('activityLog')   && <ActivityLog />}
      {isOn('sourceReports') && <SourceReportsPanel />}
      {anySystem && (
        <SystemStrip
          show={{
            graph:    isOn('systemGraph'),
            tokens:   isOn('systemTokens'),
            workload: isOn('workloadCalendar'),
            sessions: isOn('systemSessions'),
          }}
        />
      )}
    </div>
  );
}
