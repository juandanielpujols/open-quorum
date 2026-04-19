# CLAUDE.md

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: document the lesson in the commit message
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review JOURNAL.html S21 (Lecciones Aprendidas) at session start

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Type-check (`tsc --noEmit --skipLibCheck`) before every commit
- Docker build + deploy before telling the user "listo"
- Ask yourself: "Would a staff engineer approve this?"

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Use plan mode for complex tasks
2. **Track Progress**: Commit frequently with descriptive messages
3. **Explain Changes**: High-level summary at each step
4. **Document in Journal**: Major changes go to JOURNAL.html
5. **Capture Lessons**: Lessons go in commit messages + JOURNAL.html S21

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Project-Specific Rules

### Data & Classification
- **Hardware (H*: HP, HC, HA) = EOL tracking only**. Never assign SO to hardware. Never create vulnerabilities for hardware.
- **Software (S*: SA, SO, SP, SS) = Vulnerabilities + EOL**. Only software gets NVD sync.
- **"Desarrollo Interno" is NOT a third-party provider**. Display entity name instead. Exclude from RTI risk score.
- **SCORE_CAP and thresholds must be calibrated with real data**, not arbitrary values.

### Filters & Counts
- **Relationship counts MUST use global data**. When filtering by bank/type, "compartido con", "entidades que lo usan", "proveedores por cantidad de entidades" → use unfiltered dataset. The filter only determines which ROWS to display, not the reference dataset.
- **Always build TWO maps**: one global (all data) for relationship counts, one filtered for display list.
- **Proactively propose this pattern** when implementing any new filter feature.

### Naming & Consistency
- **When renaming a concept, search ALL files** in the module. Include: labels, placeholders, confirms, error messages, comments visible to users.
- **Tab labels, titles, subtitles, modals, and confirm dialogs** must all use the same term.

### Security & DevOps
- **HSTS only in production NGINX**, never in next.config.ts. Causes browser cache → 502 on localhost.
- **Never intercept /api/auth/* with custom middleware**. Breaks NextAuth PKCE flow.
- **Docker compose reads .env for interpolation**, app reads .env.local via env_file. Both needed.
- **Every code change requires**: `docker build` → `docker compose up --force-recreate` → verify in browser.
- **Security changes must be tested with full login flow** before committing.

### Charts & UI
- **Bar charts must be VERTICAL** (default Recharts layout, never `layout="vertical"`). Use shadcn `ChartContainer` + Recharts `BarChart`.
- **Recharts** is allowed for dashboards (Estado General, Cumplimiento, Vulnerabilidades). SVG inline for simpler visualizations.
- **Brand colors (SB palette)**: azul #0d3048, gris #5c7f91, verde #12C69F, terracota #D6490F, rojo #C13410, petróleo #47738C, claro #5A97B3, grisFondo #e1e7eb, fondoClaro #f0f3f5.
- **Sparklines**: 200px wide, gap-1, right side of metrics. Iterate with user on sizing.
- **Never use `window.confirm/alert/prompt`** — always use `<ConfirmDialog>` (built on @base-ui/react/alert-dialog).
- **Dialog/modals** use `@base-ui/react/dialog` via `src/components/ui/dialog.tsx`.
- **displayName(user)** from `lib/utils.ts` for showing user names — never raw iniciales.

### Design System & Impeccable
- **Use Impeccable skills** for UI work:
  - `/bolder` — for cards or sections that need visual impact (e.g., Hoja Operativa card in Estado General)
  - `/normalize` — to realign components with the SB design system
  - `/polish` — final pass on spacing, transitions, hover states, focus states
  - `/clarify` — to improve labels, placeholders, error messages, empty states
  - `/optimize` — conservative performance pass (only real issues, no invented problems)
- **Card patterns**:
  - Standard: `bg-white rounded-xl border border-gray-100 shadow-sm`
  - Headers: `text-base font-semibold` color `#0d3048`, descriptions `text-sm` color `#5c7f91`
  - Inputs: `border border-gray-200 rounded-lg focus:ring-[#0d3048]/30`
  - Badges: `rounded-full text-xs font-medium`
- **Module cards in Estado General** have subtitles (`text-[10px]` color `SB.gris`).
- **Hoja Operativa** uses a differentiated layout (light bg `#e1e7eb`, 3-column grid). Dark variant (`#0d3048`) saved for future dark mode.
- **COBIT maturity** uses N0–N5 scale with color-coded badges (rojo→terracota→verde→petróleo→púrpura).
- **Comparison features** use Dialog modal for selection, terracota overlay on radar charts.
- **Hover states**: all interactive rows use `hover:bg-[#f0f3f5]`, buttons use `onMouseEnter/Leave` for dynamic styles.
- **Transitions**: `transition-all duration-300 ease-out` for cards, `duration-500 ease-out` for chart animations.

## Tech Stack
- **Framework**: Next.js 16 (App Router, standalone output)
- **Database**: PostgreSQL 16 (Docker, Prisma v7 with @prisma/adapter-pg)
- **Auth**: NextAuth v5 (Azure AD / Microsoft Entra ID)
- **Migrations**: `docker exec -i stsi-postgres psql` — never `prisma migrate dev`
- **Prisma client**: `@/generated/prisma/client` — run `npx prisma generate` after schema changes
- **Styling**: Tailwind CSS 4, lucide-react icons
- **Docker**: multi-stage build, non-root user (nextjs:1001)
- **Git remote**: SSH via port 443 (`ssh://git@ssh.github.com:443/...`)
