declare module "next-pwa" {
  type PwaOptions = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    [key: string]: unknown;
  };

  type NextConfigLike = Record<string, unknown>;
  type WithPwa = (nextConfig: NextConfigLike) => NextConfigLike;

  const withPWAInit: (options?: PwaOptions) => WithPwa;
  export default withPWAInit;
}