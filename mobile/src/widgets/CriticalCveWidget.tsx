import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { updatedLabel, type WidgetCve, type WidgetPayload } from './data';

const BG = '#0b1220';
const TITLE = '#22d3ee';
const MUTED = '#94a3b8';
const TEXT = '#e2e8f0';
const RED = '#ef4444';
const ROW_BG = '#111a2e';

export const cveDeepLink = (id: string) => `aegis://cve/${id}`;

function CveRow({ cve }: { cve: WidgetCve }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: cveDeepLink(cve.id) }}
      style={{ width: 'match_parent', flexDirection: 'column', backgroundColor: ROW_BG, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}
    >
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextWidget text={cve.id} style={{ color: TITLE, fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' }} />
        <TextWidget
          text={cve.score === null ? 'N/A' : cve.score.toFixed(1)}
          style={{ color: '#ffffff', backgroundColor: RED, fontSize: 10, fontWeight: 'bold', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}
        />
      </FlexWidget>
      <TextWidget text={cve.summary || 'No description'} maxLines={1} truncate="END" style={{ color: TEXT, fontSize: 11, marginTop: 2 }} />
    </FlexWidget>
  );
}

export interface CriticalCveWidgetProps {
  payload: WidgetPayload | null;
  now?: number;
}

/** Android home-screen widget: 3 newest critical CVEs + watchlist hit count. Tapping a row deep-links to that CVE. */
export function CriticalCveWidget({ payload, now }: CriticalCveWidgetProps) {
  const rows = payload?.critical ?? [];
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{ width: 'match_parent', height: 'match_parent', flexDirection: 'column', backgroundColor: BG, borderRadius: 16, padding: 10, flexGap: 5 }}
    >
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextWidget text="AEGIS · Critical CVEs" style={{ color: TITLE, fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }} />
        <TextWidget text={payload ? updatedLabel(payload.updatedAt, now) : 'loading…'} style={{ color: MUTED, fontSize: 10 }} />
      </FlexWidget>
      {rows.length ? (
        rows.map((cve) => <CveRow key={cve.id} cve={cve} />)
      ) : (
        <TextWidget
          text={payload ? 'No critical CVEs this week' : 'Fetching the latest critical CVEs…'}
          style={{ color: MUTED, fontSize: 12, paddingVertical: 8 }}
        />
      )}
      <TextWidget
        text={`Watchlist: ${payload?.watchlistHits ?? 0} new`}
        style={{ color: payload?.watchlistHits ? TITLE : MUTED, fontSize: 11, fontWeight: 'bold' }}
      />
    </FlexWidget>
  );
}
