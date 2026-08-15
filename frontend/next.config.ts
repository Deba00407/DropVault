import { NextConfig } from "next/dist/server/config-shared";

const nextConfig: NextConfig = {
  async rewrites() {
      return [
        {
          "source" : "/api/:path+",
          "destination": `${process.env.BACKEND_BASE_URL}/api/:path+`
        }
      ]
  },
};

export default nextConfig;
