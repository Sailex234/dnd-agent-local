/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build standalone: imagen Docker liviana (server.js autocontenido, sin necesitar
  // node_modules completo en runtime). La app usa fetch dinamico (cache: "no-store"),
  // asi que corre como servidor Node, no como export estatico.
  output: "standalone",
};

export default nextConfig;
