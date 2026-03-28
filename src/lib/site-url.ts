const withProtocol = (value: string) => {
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
};

const getVercelHost = () => {
  if (process.env.VERCEL_ENV === "production") {
    return process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  }

  return process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
};

export const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return withProtocol(process.env.NEXT_PUBLIC_SITE_URL);
  }

  const vercelHost = getVercelHost();

  if (vercelHost) {
    return withProtocol(vercelHost);
  }

  return "https://quranyy.vercel.app";
};

export const siteUrl = getSiteUrl();
