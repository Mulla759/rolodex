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

function getApiKey(): string | null {
  const key = process.env.PROXYCURL_API_KEY;
  if (!key) {
    console.warn("PROXYCURL_API_KEY not set — skipping LinkedIn fetch");
    return null;
  }
  return key;
}

export async function fetchLinkedInProfile(
  linkedinUrl: string
): Promise<ProxycurlProfile | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

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

export async function searchByEmail(
  email: string
): Promise<ProxycurlProfile | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const params = new URLSearchParams({
    email,
    similarity_checks: "skip",
  });

  const res = await fetch(
    `https://nubela.co/proxycurl/api/linkedin/profile/resolve/email?${params}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(
      `Proxycurl email search error ${res.status}: ${await res.text()}`
    );
  }

  const data = await res.json();
  if (!data || (!data.full_name && !data.headline)) {
    return null;
  }

  console.log(`Resolved LinkedIn profile via email for ${email}`);
  return data as ProxycurlProfile;
}
