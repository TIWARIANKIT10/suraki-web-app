import withPWAInit from "next-pwa";

const isDev = process.env.NODE_ENV ==="development";
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev,
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA(nextConfig as any);