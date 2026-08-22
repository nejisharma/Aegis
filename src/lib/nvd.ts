/**
 * Headers for every NVD request. With NVD_API_KEY set, NVD raises the rate limit from
 * 5 requests / 30 s to 50 / 30 s (free key: https://nvd.nist.gov/developers/request-an-api-key).
 */
export function nvdHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'User-Agent': 'AEGIS-Dashboard/1.0' };
  const key = process.env.NVD_API_KEY;
  if (key) headers.apiKey = key;
  return headers;
}
