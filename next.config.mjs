/** @type {import('next').NextConfig} */
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  ...(isGithubPagesBuild
    ? {
        assetPrefix: "/agent-driven-CMS",
        basePath: "/agent-driven-CMS",
        images: {
          unoptimized: true,
        },
        output: "export",
        trailingSlash: true,
      }
    : {}),
  reactStrictMode: true,
};

export default nextConfig;
