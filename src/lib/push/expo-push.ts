import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

export interface SendResult {
  sent: number;
  invalidTokens: string[];
}

const expo = new Expo();

/** Sends messages in chunks; returns tokens Expo reports as unregistered so the caller can prune them. */
export async function sendPush(messages: ExpoPushMessage[]): Promise<SendResult> {
  const valid = messages.filter((m) => typeof m.to === 'string' && Expo.isExpoPushToken(m.to));
  const invalidTokens: string[] = [];
  let sent = 0;
  for (const chunk of expo.chunkPushNotifications(valid)) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((t, i) => {
        if (t.status === 'ok') sent += 1;
        else if (t.details?.error === 'DeviceNotRegistered') invalidTokens.push(chunk[i].to as string);
      });
    } catch (err) {
      console.error('[push] chunk failed', err);
    }
  }
  return { sent, invalidTokens };
}
