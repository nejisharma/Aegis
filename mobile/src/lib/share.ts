import { Share } from 'react-native';
import { SITE_URL } from './constants';

export async function shareCve(id: string, summary?: string) {
  const url = `${SITE_URL}/cve/${id}`;
  const message = summary ? `${id}: ${summary}\n${url}` : `${id}\n${url}`;
  try {
    await Share.share({ message, url, title: id });
  } catch {
    // user dismissed the sheet
  }
}

export async function shareLink(title: string, url: string) {
  try {
    await Share.share({ message: `${title}\n${url}`, url, title });
  } catch {
    // user dismissed the sheet
  }
}
