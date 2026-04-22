// ── External Project Registry ─────────────────────────────────────────────────
// Defines Novizio and Hourbour project configs.
// localPath must be an absolute path on the server where the repo is mounted.
// Leave localPath as '' if the project is not yet mounted.

export interface ProjectConfig {
  id: string
  name: string
  description: string
  color: string
  localPath: string          // Absolute path to local git repo root
  githubRepo: string         // 'owner/repo' — used for display only
  mainBranch: string         // usually 'main' or 'master'
  techStack: string[]
  agents: string[]           // Which agents typically work on this project
}

export const PROJECTS: ProjectConfig[] = [
  {
    id: 'novizio',
    name: 'Novizio',
    description: 'E-commerce fashion brand — Next.js storefront + Shopify backend',
    color: '#50C090',
    localPath: process.env.NOVIZIO_PATH ?? '',
    githubRepo: 'stark-labs/novizio',
    mainBranch: 'main',
    techStack: ['Next.js', 'TypeScript', 'Shopify', 'Tailwind'],
    agents: ['dev-lead', 'raj-backend', 'mia-frontend', 'quinn-qa', 'leo-ui-designer'],
  },
  {
    id: 'hourbour',
    name: 'Hourbour',
    description: 'Personal finance SaaS — React Native app + Node.js API',
    color: '#60A0E0',
    localPath: process.env.HOURBOUR_PATH ?? '',
    githubRepo: 'stark-labs/hourbour',
    mainBranch: 'main',
    techStack: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL'],
    agents: ['dev-lead', 'raj-backend', 'mia-frontend', 'quinn-qa', 'priya-pm'],
  },
]

export function getProject(id: string): ProjectConfig | undefined {
  return PROJECTS.find(p => p.id === id)
}

export function isProjectMounted(project: ProjectConfig): boolean {
  return project.localPath.length > 0
}
