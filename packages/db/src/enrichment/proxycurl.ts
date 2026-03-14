export interface ProxycurlProfile {
  full_name: string | null;
  headline: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  experiences: Array<{
    company: string;
    title: string;
    starts_at: { year: number } | null;
    ends_at: { year: number } | null;
    description: string | null;
  }>;
  skills: string[];
}

export async function fetchLinkedInProfile(
  linkedinUrl: string
): Promise<ProxycurlProfile | null> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) {
    console.warn("PROXYCURL_API_KEY not set — skipping LinkedIn fetch");
    return null;
  }

  const params = new URLSearchParams({
    url: linkedinUrl,
    use_cache: "if-present",
  });

  const res = await fetch(
    `https://nubela.co/proxycurl/api/v2/linkedin?${params}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(
      `Proxycurl API error ${res.status}: ${await res.text()}`
    );
  }

  const data = await res.json();
  console.log(`Fetched LinkedIn profile for ${linkedinUrl}`);
  return data as ProxycurlProfile;
}
