import type { Metadata } from 'next';
import { H2, LegalPage } from '../legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | AEGIS',
  description: 'How the AEGIS website and mobile app handle your data.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 21, 2026">
      <p>
        AEGIS (&ldquo;we&rdquo;, &ldquo;the service&rdquo;) is a security-intelligence dashboard available at aegis.neeraj.ca and as the Aegis Intel
        mobile app for iOS and Android. It is built and operated by Neeraj Sharma. This policy explains what information the service
        handles and why. The short version: <strong>we do not want your personal data, and we go out of our way not to collect it.</strong>
      </p>

      <H2>1. No accounts, no cookies, no tracking</H2>
      <p>
        AEGIS has no user accounts and no sign-in. The website sets no cookies and loads no analytics, advertising or tracking scripts.
        We do not build profiles, fingerprint devices, or sell or share data with advertisers.
      </p>

      <H2>2. What the website processes</H2>
      <p>
        When you search for a CVE, look up an IP address, domain, URL or file hash, or open a panel, your query is sent to our server
        and forwarded to the relevant public data provider (listed in section 5). Queries are processed in memory to answer your
        request and are not stored in a database. Standard, short-lived hosting logs (IP address, request path, timestamp) may be
        retained by our hosting provider, Vercel, for security and abuse prevention.
      </p>

      <H2>3. What the mobile app processes</H2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Cached data.</strong> The app stores the last data it fetched (news, CVEs, intel feeds) on your device so screens load
          instantly and work offline. This cache never leaves your device and is removed when you uninstall the app.
        </li>
        <li>
          <strong>Game progress.</strong> Your &ldquo;Phish or Not?&rdquo; personal best and recently seen cards are stored only on your device.
        </li>
        <li>
          <strong>Push notifications (optional).</strong> If you enable notifications, the app registers an anonymous push token with our
          server together with your notification preferences (critical CVEs, news digest) and platform (iOS/Android). The token is a
          random identifier issued by Apple/Google via Expo; it is not linked to your name, email, phone number or any other identity,
          and it is used only to deliver the alerts you asked for. Turning notifications off in Settings deletes the token from our
          server, and tokens that stop working are removed automatically.
        </li>
        <li>
          <strong>Connectivity check.</strong> When a request fails, the app may contact a public connectivity endpoint
          (gstatic.com) to tell you whether the problem is your network or our servers. No data about you is sent.
        </li>
      </ul>
      <p>The app does not access your contacts, location, photos, microphone or camera.</p>

      <H2>4. Where data is stored</H2>
      <p>
        The website and API run on Vercel. Push tokens and notification preferences are stored in Upstash Redis. Both are reputable
        cloud providers with their own security practices; no other third party receives the push token.
      </p>

      <H2>5. Third-party data sources</H2>
      <p>
        AEGIS aggregates public threat-intelligence feeds. When you run a query, it may be forwarded to one or more of: NIST NVD,
        MITRE ATT&amp;CK, abuse.ch (ThreatFox, URLhaus, MalwareBazaar), AbuseIPDB, Shodan InternetDB, ip-api.com, VirusTotal,
        urlscan.io, GitHub Advisory Database, Ransomware.live, OpenPhish, PhishTank, and the RSS feeds of BleepingComputer, Krebs on
        Security, The Hacker News and SecurityWeek. Map tiles are served by CARTO / OpenStreetMap. Each provider processes the query
        under its own privacy policy. Do not submit information you are not comfortable sending to these providers.
      </p>

      <H2>6. Children</H2>
      <p>AEGIS is not directed at children under 13 and we do not knowingly collect information from them.</p>

      <H2>7. Your rights</H2>
      <p>
        Because we hold no personal data about you, there is usually nothing to access, correct or delete. To remove a push token,
        disable notifications in the app or uninstall it. For any other request, contact us through{' '}
        <a href="https://neeraj.ca" className="text-cyan-300 underline">neeraj.ca</a>.
      </p>

      <H2>8. Changes</H2>
      <p>
        We may update this policy as the service evolves. Material changes will be reflected by the date at the top of this page.
      </p>
    </LegalPage>
  );
}
