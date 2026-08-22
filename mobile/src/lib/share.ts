import { Platform, Share } from 'react-native';
import { SITE_URL } from './constants';

/**
 * iOS honours `url` (rendered as a link preview) and `message` separately.
 * Android only sends `message`, so there it must be a short line with the link — no summary text.
 */
async function share(title: string, url: string, iosMessage?: string) {
  try {
    if (Platform.OS === 'ios') {
      await Share.share({ url, message: iosMessage ?? title, title });
    } else {
      await Share.share({ message: `${title} — ${url}`, title }, { dialogTitle: title });
    }
  } catch {
    // user dismissed the sheet
  }
}

export function shareCve(id: string, summary?: string) {
  const url = `${SITE_URL}/cve/${id}`;
  return share(id, url, summary ? `${id}: ${summary}` : id);
}

export function shareLink(title: string, url: string) {
  return share(title, url);
}
