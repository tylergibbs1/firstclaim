export async function register() {
  // Agent SDK tries to mkdir ~/.claude/debug — Vercel's fs is read-only except /tmp
  if (!process.env.CLAUDE_CONFIG_DIR) {
    process.env.CLAUDE_CONFIG_DIR = "/tmp/.claude";
  }
}
