import * as WebBrowser from 'expo-web-browser';
import { colors } from '../theme/colors';

export function openUrl(url: string) {
  return WebBrowser.openBrowserAsync(url, {
    toolbarColor: colors.surface,
    controlsColor: colors.accent,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  }).catch(() => {});
}
