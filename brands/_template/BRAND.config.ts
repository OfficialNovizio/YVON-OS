export const brand = {
  name: "[Brand Name]",
  repo: "github.com/[org]/[repo]",
  ports: {
    dev: 3000,
    preview: 3001,
  },
  branch: {
    live: "main",
    test: "dev",
  },
  memory: "C:\\Users\\Novy\\Desktop\\Projects\\Obsidian Projects\\YVON's Obsidian\\brands\\[brandname]",
  skills: ["brands/[brandname].md"],
  deploy: {
    provider: "vercel",
    hook: process.env.BRANDNAME_DEPLOY_HOOK,
  },
}
