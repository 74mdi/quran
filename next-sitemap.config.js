const withProtocol = (value) => {
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
};

const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return withProtocol(process.env.NEXT_PUBLIC_SITE_URL);
  }

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  if (vercelHost) {
    return withProtocol(vercelHost);
  }

  return "http://localhost:3000";
};

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: getSiteUrl(),
  generateRobotsTxt: true,
  changefreq: "monthly",
  priority: 0.8,
  sitemapSize: 200,
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: "/api/" },
    ],
  },
  exclude: ["/api/*"],
};
