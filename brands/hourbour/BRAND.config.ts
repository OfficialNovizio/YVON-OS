export const hourbour = {
  name: "Hourbour",
  type: "fintech-saas",
  repo: "github.com/novizio/hourbour-web",
  ports: {
    dev: 3002,
    preview: 3003,
  },
  branch: {
    live: "main",
    test: "dev",
  },
  memory: "C:\\Users\\Novy\\Desktop\\Projects\\Obsidian Projects\\YVON's Obsidian\\brands\\hourbour",
  skills: ["brands/hourbour.md"],
  metrics: {
    primary: ["MRR", "ARR", "Churn Rate", "LTV:CAC", "NRR"],
    model: "SaaS P&L",
  },
  deploy: {
    provider: "vercel",
    hook: process.env.HOURBOUR_DEPLOY_HOOK,
  },
  env: {
    ig: "HOURBOUR_IG_HANDLE",
    yt: "HOURBOUR_YT_CHANNEL_ID",
    li: "HOURBOUR_LI_PROFILE_URL",
    ga4: "HOURBOUR_GA4_PROPERTY_ID",
  },
}
