import { defineConfig } from "vite";

/**
 * Set `BASE_PATH` at build time, e.g. `/pickle-ball/` for GitHub project pages.
 * Root sites (Vercel/Netlify custom domain) leave it unset → `/`.
 */
const base = process.env.BASE_PATH?.replace(/\/?$/, "/").replace(/^(?!\/)/, "/") ?? "/";

export default defineConfig({ base });
