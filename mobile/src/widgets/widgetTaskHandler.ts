import React from 'react';
import { Linking } from 'react-native';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { CriticalCveWidget } from './CriticalCveWidget';
import { buildWidgetPayload, readWidgetPayload, writeWidgetPayload } from './data';

/**
 * Android headless task (registered in index.ts). Runs for every widget lifecycle event, including the
 * periodic `updatePeriodMillis` refresh while the app is closed.
 * Strategy: paint the cached payload immediately, then fetch, persist and repaint.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetAction, renderWidget, clickActionData } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const cached = await readWidgetPayload();
      renderWidget(React.createElement(CriticalCveWidget, { payload: cached }));
      try {
        const fresh = await buildWidgetPayload();
        await writeWidgetPayload(fresh);
        renderWidget(React.createElement(CriticalCveWidget, { payload: fresh }));
      } catch {
        // Offline / API down: leave the cached render in place.
      }
      break;
    }
    case 'WIDGET_CLICK': {
      // OPEN_URI / OPEN_APP are handled natively and never reach here; this covers custom click actions.
      const uri = clickActionData?.uri;
      if (typeof uri === 'string' && uri) await Linking.openURL(uri).catch(() => {});
      break;
    }
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
