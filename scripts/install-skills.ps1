$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
$npx = 'C:\Program Files\nodejs\npx.cmd'

$repos = @(
  'obra/superpowers',
  'coreyhaines31/marketingskills',
  'vercel-labs/agent-skills',
  'supabase/agent-skills',
  'deanpeters/Product-Manager-Skills',
  'pbakaus/impeccable'
)

foreach ($repo in $repos) {
  Write-Host "--- Installing $repo globally ---"
  & $npx skills add $repo --global -y 2>&1
  Write-Host ""
}

Write-Host "All skills installed globally (~/.agents/skills/)."
