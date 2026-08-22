import type { Metadata } from 'next';
import { H2, LegalPage } from '../legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms & Conditions | AEGIS',
  description: 'Terms of use for the AEGIS website and mobile app.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="August 21, 2026">
      <p>
        By using the AEGIS website (aegis.neeraj.ca) or the Aegis Intel mobile app (together, &ldquo;the service&rdquo;), you agree to these
        terms. If you do not agree, please do not use the service.
      </p>

      <H2>1. What AEGIS is</H2>
      <p>
        AEGIS is a free, educational security-intelligence dashboard. It aggregates publicly available data about vulnerabilities,
        threat actors, malware, phishing and indicators of compromise from third-party sources, and presents it in one place. The
        &ldquo;live threat map&rdquo; is a <strong>simulated visualisation</strong> and does not depict real attacks in progress.
      </p>

      <H2>2. Acceptable use</H2>
      <ul className="list-disc space-y-2 pl-6">
        <li>Use the service only for lawful purposes: research, education, defence and awareness.</li>
        <li>Do not use the service to plan, support or carry out unauthorised access to any system, network or account.</li>
        <li>
          Do not visit, download from or interact with any URL, domain, IP address or file hash listed as malicious. These are
          shown for identification only. The phishing feed contains live phishing pages.
        </li>
        <li>
          Do not scrape, bulk-query, automate against or otherwise abuse the service or the upstream providers&rsquo; rate limits.
        </li>
        <li>Do not attempt to disrupt, reverse-engineer the backend of, or gain unauthorised access to the service.</li>
      </ul>

      <H2>3. Third-party data and accuracy</H2>
      <p>
        All intelligence is sourced from third parties (NIST NVD, MITRE ATT&amp;CK, abuse.ch, AbuseIPDB, Shodan, VirusTotal,
        Ransomware.live, OpenPhish, PhishTank, GitHub, public RSS feeds and others). Their data may be incomplete, delayed or wrong,
        and their terms of use apply to it. AEGIS does not verify this data and makes no claims about its accuracy. Do not rely on
        the service as the sole basis for security, legal, financial or operational decisions.
      </p>

      <H2>4. No warranty</H2>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind, express or implied,
        including fitness for a particular purpose, availability, or non-infringement. Features, data sources and availability may
        change or be withdrawn at any time without notice.
      </p>

      <H2>5. Limitation of liability</H2>
      <p>
        To the fullest extent permitted by law, Neeraj Sharma and any contributors are not liable for any direct, indirect,
        incidental, consequential or special damages arising from your use of, or inability to use, the service or any data in it.
      </p>

      <H2>6. Push notifications</H2>
      <p>
        Notifications are optional and best-effort. Delivery depends on Apple, Google and Expo infrastructure and on the upstream
        data sources; alerts may be delayed or missed. You can disable them at any time in the app&rsquo;s Settings.
      </p>

      <H2>7. The &ldquo;Phish or Not?&rdquo; game</H2>
      <p>
        The game uses fictional messages written for security-awareness training. Brand names appear only as they commonly do in
        real-world lures; no affiliation with or endorsement by those brands is implied, and no card links to a live site.
      </p>

      <H2>8. Intellectual property</H2>
      <p>
        The AEGIS source code is released under the MIT License. Third-party data remains the property of its respective owners.
        Trademarks and brand names belong to their owners.
      </p>

      <H2>9. Termination</H2>
      <p>We may block or restrict access to anyone who violates these terms or abuses the service or its data providers.</p>

      <H2>10. Governing law</H2>
      <p>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein.</p>

      <H2>11. Contact</H2>
      <p>
        Questions about these terms or the privacy policy can be sent through{' '}
        <a href="https://neeraj.ca" className="text-cyan-300 underline">neeraj.ca</a>.
      </p>
    </LegalPage>
  );
}
