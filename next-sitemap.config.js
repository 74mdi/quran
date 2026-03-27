/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://koko-quran.vercel.app",
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
