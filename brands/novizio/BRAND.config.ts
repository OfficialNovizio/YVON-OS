export const novizio = {
  name: "Novizio",
  type: "fashion-ecommerce",
  repo: "github.com/novizio/novizio-web",
  ports: {
    dev: 3000,
    preview: 3001,
  },
  branch: {
    live: "main",
    test: "dev",
  },
  memory: "C:\\Users\\Novy\\Desktop\\Projects\\Obsidian Projects\\YVON's Obsidian\\brands\\novizio",
  skills: ["brands/novizio.md"],
  metrics: {
    primary: ["IG Engagement Rate", "IG Follower Growth", "Website Sessions", "AOV", "ROAS"],
    model: "E-commerce P&L",
    anomalyThreshold: { igER: "drop > 20% WoW = flag immediately" },
  },
  deploy: {
    provider: "vercel",
    hook: process.env.NOVIZIO_DEPLOY_HOOK,
  },
  env: {
    ig: "NOVIZIO_IG_HANDLE",
    yt: "NOVIZIO_YT_CHANNEL_ID",
    li: "NOVIZIO_LI_PROFILE_URL",
    ga4: "NOVIZIO_GA4_PROPERTY_ID",
  },
}
