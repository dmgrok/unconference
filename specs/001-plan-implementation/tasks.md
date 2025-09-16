# Tasks: Plan Command Implementation

**Input**: Design documents from `/specs/001-plan-implementation/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, Node.js 18+, Nuxt 3, Vue 3, Vuetify, Prisma ORM, Zod, Winston
   → Structure: Web application (unified frontend/backend)
2. Load design documents:
   → data-model.md: 8 entities (PlanTemplate, PlanPhase, PlanArtifact, etc.)
   → contracts/: 7 API endpoints for plan execution and management
   → research.md: Nuxt 3 server routes + CLI wrapper architecture
   → quickstart.md: Test scenarios and integration requirements
3. Generate tasks by category: Setup → Tests → Core → Integration → Polish
4. Apply TDD: All tests before implementation
5. Mark [P] for parallel execution (different files, no dependencies)
6. SUCCESS: 52 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: Nuxt 3 unified structure at repository root
- `server/api/plan/` - API route handlers
- `lib/plan/` - Core plan logic
- `types/plan/` - TypeScript interfaces
- `tests/plan/` - Test files

## Phase 3.1: Setup
- [ ] T001 Create plan command directory structure (server/api/plan/, lib/plan/, types/plan/, tests/plan/)
- [ ] T002 Initialize TypeScript configuration for plan modules in types/plan/tsconfig.json
- [ ] T003 [P] Configure ESLint rules for plan modules in .eslintrc.plan.json
- [ ] T004 [P] Set up Vitest configuration for plan tests in vitest.config.plan.ts

## Phase 3.2: Type Definitions (TDD Foundation) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These types and schemas MUST be defined before ANY implementation**
- [ ] T005 [P] PlanTemplate interface and enums in types/plan/template.ts
- [ ] T006 [P] PlanExecution interface and enums in types/plan/execution.ts
- [ ] T007 [P] PlanPhase and PlanArtifact interfaces in types/plan/phase.ts
- [ ] T008 [P] ConstitutionalCheck and ValidationRule interfaces in types/plan/validation.ts
- [ ] T009 [P] PlanContext and TechnicalContext interfaces in types/plan/context.ts
- [ ] T010 [P] Zod schemas for PlanTemplate validation in lib/plan/schemas/template.ts
- [ ] T011 [P] Zod schemas for PlanExecution validation in lib/plan/schemas/execution.ts
- [ ] T012 [P] Zod schemas for API request/response validation in lib/plan/schemas/api.ts

## Phase 3.3: Contract Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.4
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T013 [P] Contract test POST /api/plan in tests/plan/contract/execute-plan.test.ts
- [ ] T014 [P] Contract test GET /api/plan/{executionId} in tests/plan/contract/get-execution.test.ts
- [ ] T015 [P] Contract test POST /api/plan/{executionId}/cancel in tests/plan/contract/cancel-execution.test.ts
- [ ] T016 [P] Contract test GET /api/plan/templates in tests/plan/contract/list-templates.test.ts
- [ ] T017 [P] Contract test POST /api/plan/templates in tests/plan/contract/create-template.test.ts
- [ ] T018 [P] Contract test GET /api/plan/templates/{templateId} in tests/plan/contract/get-template.test.ts
- [ ] T019 [P] Contract test PUT /api/plan/templates/{templateId} in tests/plan/contract/update-template.test.ts
- [ ] T020 [P] Contract test DELETE /api/plan/templates/{templateId} in tests/plan/contract/delete-template.test.ts
- [ ] T021 [P] Contract test POST /api/plan/constitutional-check in tests/plan/contract/constitutional-check.test.ts
- [ ] T022 [P] Contract test GET /api/plan/artifacts/{executionId}/{artifactType} in tests/plan/contract/download-artifact.test.ts

## Phase 3.4: Integration Tests (TDD) ⚠️ MUST COMPLETE BEFORE 3.5
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T023 [P] Integration test full plan execution workflow in tests/plan/integration/plan-execution.test.ts
- [ ] T024 [P] Integration test constitutional validation failure in tests/plan/integration/constitutional-validation.test.ts
- [ ] T025 [P] Integration test template management workflow in tests/plan/integration/template-management.test.ts
- [ ] T026 [P] Integration test artifact generation and download in tests/plan/integration/artifact-generation.test.ts
- [ ] T027 [P] Integration test plan execution cancellation in tests/plan/integration/execution-cancellation.test.ts
- [ ] T028 [P] Integration test CLI wrapper functionality in tests/plan/integration/cli-wrapper.test.ts

## Phase 3.5: Core Implementation (ONLY after tests are failing)
### Entity and Service Layer
- [ ] T029 [P] PlanTemplate entity with CRUD operations in lib/plan/entities/template.ts
- [ ] T030 [P] PlanExecution entity with state management in lib/plan/entities/execution.ts
- [ ] T031 [P] PlanPhase entity with dependency handling in lib/plan/entities/phase.ts
- [ ] T032 [P] ConstitutionalValidator service in lib/plan/services/constitutional-validator.ts
- [ ] T033 [P] TemplateProcessor service in lib/plan/services/template-processor.ts
- [ ] T034 [P] ArtifactGenerator service in lib/plan/services/artifact-generator.ts
- [ ] T035 PlanExecutor main orchestration service in lib/plan/services/plan-executor.ts
- [ ] T036 ExecutionManager service for state management in lib/plan/services/execution-manager.ts

### API Route Handlers
- [ ] T037 POST /api/plan route handler in server/api/plan/index.post.ts
- [ ] T038 GET /api/plan/[executionId] route handler in server/api/plan/[executionId].get.ts
- [ ] T039 POST /api/plan/[executionId]/cancel route handler in server/api/plan/[executionId]/cancel.post.ts
- [ ] T040 GET /api/plan/templates route handler in server/api/plan/templates/index.get.ts
- [ ] T041 POST /api/plan/templates route handler in server/api/plan/templates/index.post.ts
- [ ] T042 GET /api/plan/templates/[templateId] route handler in server/api/plan/templates/[templateId].get.ts
- [ ] T043 PUT /api/plan/templates/[templateId] route handler in server/api/plan/templates/[templateId].put.ts
- [ ] T044 DELETE /api/plan/templates/[templateId] route handler in server/api/plan/templates/[templateId].delete.ts
- [ ] T045 POST /api/plan/constitutional-check route handler in server/api/plan/constitutional-check.post.ts
- [ ] T046 GET /api/plan/artifacts/[executionId]/[artifactType] route handler in server/api/plan/artifacts/[executionId]/[artifactType].get.ts

## Phase 3.6: Integration
- [ ] T047 CLI wrapper script integration in scripts/plan-cli.js
- [ ] T048 Authentication middleware integration for plan routes in server/api/plan/middleware/auth.ts
- [ ] T049 Error handling and logging integration in lib/plan/utils/error-handler.ts
- [ ] T050 Constitutional compliance validation integration in lib/plan/utils/compliance-checker.ts

## Phase 3.7: Polish
- [ ] T051 [P] Unit tests for PlanExecutor service in tests/plan/unit/plan-executor.test.ts
- [ ] T052 [P] Unit tests for ConstitutionalValidator in tests/plan/unit/constitutional-validator.test.ts
- [ ] T053 [P] Performance tests for plan execution (<5s for typical plan) in tests/plan/performance/execution-performance.test.ts
- [ ] T054 [P] Update API documentation in docs/api/plan-api.md
- [ ] T055 Code review and refactoring pass for plan modules
- [ ] T056 End-to-end testing using quickstart.md scenarios

## Dependencies
- **Phase 3.1 (Setup)** before all other phases
- **Phase 3.2 (Types)** before phases 3.3-3.7
- **Phase 3.3 (Contract Tests)** before phase 3.5 implementation
- **Phase 3.4 (Integration Tests)** before phase 3.5 implementation
- **Phase 3.5 (Core Implementation)** before phase 3.6-3.7
- **T035 (PlanExecutor)** blocks T036, T037, T047 (core orchestration dependency)
- **T032 (ConstitutionalValidator)** blocks T037, T045, T050 (validation dependency)
- **T033 (TemplateProcessor)** blocks T034, T035 (template processing dependency)
- **T048 (Auth middleware)** blocks T037-T046 (security dependency)

## Parallel Execution Examples

### Setup Phase (T001-T004)
```bash
# These can run in parallel since they create different files
Task: "Create plan command directory structure"
Task: "Configure ESLint rules for plan modules in .eslintrc.plan.json"
Task: "Set up Vitest configuration for plan tests in vitest.config.plan.ts"
```

### Type Definitions (T005-T012)
```bash
# All type definitions can run in parallel - different files
Task: "PlanTemplate interface and enums in types/plan/template.ts"
Task: "PlanExecution interface and enums in types/plan/execution.ts"
Task: "PlanPhase and PlanArtifact interfaces in types/plan/phase.ts"
Task: "ConstitutionalCheck and ValidationRule interfaces in types/plan/validation.ts"
Task: "PlanContext and TechnicalContext interfaces in types/plan/context.ts"
Task: "Zod schemas for PlanTemplate validation in lib/plan/schemas/template.ts"
Task: "Zod schemas for PlanExecution validation in lib/plan/schemas/execution.ts"
Task: "Zod schemas for API request/response validation in lib/plan/schemas/api.ts"
```

### Contract Tests (T013-T022)
```bash
# All contract tests can run in parallel - different test files
Task: "Contract test POST /api/plan in tests/plan/contract/execute-plan.test.ts"
Task: "Contract test GET /api/plan/{executionId} in tests/plan/contract/get-execution.test.ts"
Task: "Contract test POST /api/plan/{executionId}/cancel in tests/plan/contract/cancel-execution.test.ts"
Task: "Contract test GET /api/plan/templates in tests/plan/contract/list-templates.test.ts"
Task: "Contract test POST /api/plan/templates in tests/plan/contract/create-template.test.ts"
# ... continue with remaining contract tests
```

### Entity Layer (T029-T034)
```bash
# Entity classes can run in parallel - different files
Task: "PlanTemplate entity with CRUD operations in lib/plan/entities/template.ts"
Task: "PlanExecution entity with state management in lib/plan/entities/execution.ts"
Task: "PlanPhase entity with dependency handling in lib/plan/entities/phase.ts"
Task: "ConstitutionalValidator service in lib/plan/services/constitutional-validator.ts"
Task: "TemplateProcessor service in lib/plan/services/template-processor.ts"
Task: "ArtifactGenerator service in lib/plan/services/artifact-generator.ts"
```

## Notes
- **[P] tasks** = different files, no dependencies
- **Verify tests fail** before implementing (TDD)
- **Commit after each task** for incremental progress
- **Constitutional compliance** must pass at each phase
- **File conflicts**: API routes modify same server structure, so T037-T046 are sequential
- **Service dependencies**: T035 (PlanExecutor) depends on T032-T034 services

## Task Generation Rules Applied

1. **From Contracts**:
   - 10 API endpoints → 10 contract test tasks [P] + 10 implementation tasks

2. **From Data Model**:
   - 8 entities → 8 interface definition tasks [P] + 6 service creation tasks [P]

3. **From Research Decisions**:
   - Nuxt 3 architecture → API route structure
   - CLI wrapper → Script integration task
   - Template-based generation → Template processor service

4. **From Quickstart Scenarios**:
   - Plan execution workflow → Integration test
   - Constitutional validation → Compliance integration
   - Error handling → Error handler utility

## Validation Checklist
*GATE: All items checked before task execution*

- [x] All contracts have corresponding tests (T013-T022)
- [x] All entities have model/interface tasks (T005-T012, T029-T034)
- [x] All tests come before implementation (Phase 3.3-3.4 before 3.5)
- [x] Parallel tasks truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD workflow enforced (tests must fail before implementation)
- [x] Constitutional compliance validation integrated
- [x] CLI integration included
- [x] Performance requirements addressed