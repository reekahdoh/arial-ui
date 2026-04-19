You are helping me build a new frontend for a risk assessment system.

Tech stack:
- React
- TypeScript
- Material UI
- React Router
- Firebase
- Firestore 

I want the design to be minimalist, very clean, very simple, and professional. This is a serious risk/compliance-style product, so the UI should feel calm, precise, structured, and low-noise rather than flashy.

Design direction:
- Use a compact web-app typography scale
- Neutral surfaces
- One restrained primary accent color
- Subtle borders
- Minimal shadows
- Clear information hierarchy
- Good whitespace and alignment
- No gradient-heavy or “AI SaaS template” styling
- No oversized headings inside the app UI
- Prefer labels over icon-only controls

Data Storage

Will be document form (rather than relational)

Architecture requirements:
- Follow DRY principles strictly
- Centralize all colors, spacing, typography, radius, shadows, and component style decisions in a single theme system
- No hardcoded colors in components
- Strong separation of concerns between:
  - app shell
  - theme
  - shared UI components
  - feature modules
  - API/data access
  - domain models
  - forms
- Build reusable wrappers around MUI components for repeated UI patterns

Project structure:
- app/
- components/ui/
- components/layout/
- features/<feature>/{api,components,hooks,pages,types,utils}
- domain/
- services/
- utils/
- constants/

Please:
1. Propose the folder structure
2. Create the MUI theme architecture
3. Create the core reusable components
4. Create a clean app shell with sidebar + top bar + content area
5. Scaffold the following pages:
   - Dashboard / Overview
   - Assessments list
   - Assessment detail
   - Risk form
6. Add mock data and typed models
7. Keep all code modular and production-oriented
8. Explain any key architectural choices briefly as you go

Important rules:
- TypeScript strict mode
- No any unless necessary
- No business logic in simple presentational components
- No duplicated status chip logic
- No duplicated table styling
- Reuse form field wrappers
- Use semantic color tokens like background.default, text.primary, border.subtle, status.high
- Keep risk severity/status mappings centralized
- Make components easy to extend safely

Please start by generating:
- the recommended folder structure
- the theme/token files
- the AppShell
- Sidebar
- TopBar
- PageHeader
- AppCard
- StatusChip
- a sample Assessments list page

Then pause for review before generating the next batch.