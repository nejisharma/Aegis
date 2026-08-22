import React from 'react';
import { Platform } from 'react-native';
import { ANDROID_WIDGET_NAME, buildWidgetPayload, IOS_WIDGET_KIND, readWidgetPayload, writeWidgetPayload } from './data';

/**
 * Called from app/_layout.tsx on launch: rebuild the widget payload and push it to every placed widget.
 * Android: re-renders via requestWidgetUpdate (no-op if no widget is on the home screen).
 * iOS: the payload was mirrored to the App Group by writeWidgetPayload; ask WidgetKit to reload the timeline.
 */
export async function refreshWidgets(): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  let payload = await readWidgetPayload();
  try {
    payload = await buildWidgetPayload();
    await writeWidgetPayload(payload);
  } catch {
    // keep whatever was cached
  }

  if (Platform.OS === 'android') {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { CriticalCveWidget } = await import('./CriticalCveWidget');
    await requestWidgetUpdate({
      widgetName: ANDROID_WIDGET_NAME,
      renderWidget: () => React.createElement(CriticalCveWidget, { payload }),
    });
    return;
  }

  // iOS: @bacons/apple-targets exposes WidgetCenter.shared.reloadTimelines(ofKind:) through ExtensionStorage.
  try {
    const { ExtensionStorage } = await import('@bacons/apple-targets');
    ExtensionStorage.reloadWidget(IOS_WIDGET_KIND);
  } catch {
    // Module not linked (e.g. Expo Go) — nothing to reload.
  }
}
