'use client';

// Briefing tab — the CEO's first read: where we stand, what needs a decision,
// and the signals behind it. Every panel is gated by a feature flag so it can be
// shown/hidden from Settings → Dashboard Panels.

import type { CommandPanelId } from '@/lib/command-panels';
import { CeoReadout, StrategicBriefing, PulseAndChannel } from './_context';
import { DecisionsLive, Priorities } from './_act';
import { IntelligenceFeedPanel, KeyNumbers } from './_situation';
import EmptyTab from './_empty-tab';

interface BriefingTabProps {
  isOn: (id: CommandPanelId) => boolean;
}

export default function BriefingTab({ isOn }: BriefingTabProps) {
  const anyOn =
    isOn('ceoReadout') || isOn('decisions') || isOn('intelligenceFeed') ||
    isOn('strategicBriefing') || isOn('keyNumbers') ||
    isOn('pulseChannel') || isOn('priorities');

  if (!anyOn) return <EmptyTab />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isOn('ceoReadout')        && <CeoReadout />}
      {isOn('decisions')         && <DecisionsLive />}
      {isOn('intelligenceFeed')  && <IntelligenceFeedPanel />}
      {isOn('strategicBriefing') && <StrategicBriefing />}
      {isOn('keyNumbers')        && <KeyNumbers />}
      {isOn('pulseChannel')      && <PulseAndChannel />}
      {isOn('priorities')        && <Priorities />}
    </div>
  );
}
