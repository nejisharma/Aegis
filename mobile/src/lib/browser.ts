import * as WebBrowser from 'expo-web-browser';
import { colors } from '../theme/colors';
import type { Palette } from '../theme/palettes';

/** Open an in-app browser. Pass the active palette from `useColors()` so the toolbar matches the theme; defaults to dark. */
export function openUrl(url: string, c: Palette = colors) {
  return WebBrowser.openBrowserAsync(url, {
    toolbarColor: c.surface,
    controlsColor: c.accent,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  }).catch(() => {});
}
