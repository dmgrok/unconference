# Data Model: Plan Command Implementation

## Core Entities

### PlanTemplate
Represents a plan template with configuration and structure definitions.

```typescript
interface PlanTemplate {
  id: string
  name: string
  version: string
  description: string
  phases: PlanPhase[]
  constitutionalChecks: ConstitutionalCheck[]
  createdAt: Date
  updatedAt: Date
}
```

**Fields**:
- `id`: Unique identifier for the template
- `name`: Human-readable template name
- `version`: Template version for compatibility tracking
- `description`: Template purpose and usage description
- `phases`: Array of phases to execute
- `constitutionalChecks`: Validation rules to apply
- `createdAt`, `updatedAt`: Audit timestamps

**Validation Rules**:
- `name` must be 3-100 characters
- `version` must follow semantic versioning (x.y.z)
- `phases` must contain at least one phase
- `constitutionalChecks` must be valid rule definitions

### PlanPhase
Defines a specific phase of plan execution with dependencies and outputs.

```typescript
interface PlanPhase {
  id: string
  name: string
  order: number
  dependencies: string[]
  outputs: PlanArtifact[]
  validation: ValidationRule[]
  timeoutMinutes: number
  required: boolean
}
```

**Fields**:
- `id`: Unique phase identifier
- `name`: Phase display name
- `order`: Execution order (0-based)
- `dependencies`: Array of phase IDs that must complete first
- `outputs`: Expected artifacts from this phase
- `validation`: Rules to validate phase completion
- `timeoutMinutes`: Maximum execution time
- `required`: Whether phase failure should stop execution

**Validation Rules**:
- `order` must be non-negative and unique within template
- `dependencies` must reference valid phase IDs
- `timeoutMinutes` must be 1-60
- `outputs` must contain at least one artifact for non-terminal phases

### PlanArtifact
Represents a generated artifact from plan execution.

```typescript
interface PlanArtifact {
  id: string
  name: string
  path: string
  type: ArtifactType
  template: string
  validation: ValidationRule[]
  metadata: Record<string, unknown>
}

enum ArtifactType {
  RESEARCH = 'research',
  DATA_MODEL = 'data-model',
  CONTRACTS = 'contracts',
  QUICKSTART = 'quickstart',
  TASKS = 'tasks',
  CUSTOM = 'custom'
}
```

**Fields**:
- `id`: Unique artifact identifier
- `name`: Artifact display name
- `path`: Relative file path for output
- `type`: Artifact type from predefined enum
- `template`: Template content or template reference
- `validation`: Rules to validate generated content
- `metadata`: Additional artifact configuration

**Validation Rules**:
- `path` must be valid relative file path
- `type` must be valid ArtifactType enum value
- `template` must be non-empty string
- `name` must be 3-100 characters

### ConstitutionalCheck
Defines a constitutional principle validation rule.

```typescript
interface ConstitutionalCheck {
  id: string
  principle: string
  description: string
  validation: ValidationRule
  severity: CheckSeverity
  autoFix: boolean
}

enum CheckSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}
```

**Fields**:
- `id`: Unique check identifier
- `principle`: Constitutional principle being validated
- `description`: Human-readable check description
- `validation`: Rule implementation
- `severity`: Impact level of violations
- `autoFix`: Whether violations can be automatically corrected

**Validation Rules**:
- `principle` must be 3-200 characters
- `description` must be 10-500 characters
- `severity` must be valid CheckSeverity enum value
- `validation` must be valid ValidationRule

### ValidationRule
Generic validation rule definition for flexible validation logic.

```typescript
interface ValidationRule {
  id: string
  type: ValidationType
  config: Record<string, unknown>
  errorMessage: string
}

enum ValidationType {
  SCHEMA = 'schema',
  REGEX = 'regex',
  FUNCTION = 'function',
  FILE_EXISTS = 'file-exists',
  CONTENT_MATCH = 'content-match'
}
```

**Fields**:
- `id`: Unique rule identifier
- `type`: Validation type from predefined enum
- `config`: Rule-specific configuration
- `errorMessage`: Message to show on validation failure

**Validation Rules**:
- `type` must be valid ValidationType enum value
- `config` must be valid JSON object
- `errorMessage` must be 10-200 characters
- `id` must be unique within validation context

### PlanExecution
Tracks a specific plan execution instance with progress and results.

```typescript
interface PlanExecution {
  id: string
  templateId: string
  status: ExecutionStatus
  currentPhase: string | null
  startedAt: Date
  completedAt: Date | null
  phaseResults: PhaseResult[]
  artifacts: GeneratedArtifact[]
  errors: ExecutionError[]
  context: PlanContext
}

enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

**Fields**:
- `id`: Unique execution identifier
- `templateId`: Reference to PlanTemplate used
- `status`: Current execution status
- `currentPhase`: Phase currently being executed
- `startedAt`: Execution start timestamp
- `completedAt`: Execution completion timestamp
- `phaseResults`: Results from each executed phase
- `artifacts`: Generated artifacts with metadata
- `errors`: Any errors encountered during execution
- `context`: Execution context and configuration

### PhaseResult
Results and metadata from a completed phase execution.

```typescript
interface PhaseResult {
  phaseId: string
  status: PhaseStatus
  startedAt: Date
  completedAt: Date | null
  artifacts: string[]
  validationResults: ValidationResult[]
  executionLog: string[]
  duration: number
}

enum PhaseStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}
```

**Fields**:
- `phaseId`: Reference to executed phase
- `status`: Phase execution status
- `startedAt`: Phase start timestamp
- `completedAt`: Phase completion timestamp
- `artifacts`: Array of generated artifact IDs
- `validationResults`: Validation check results
- `executionLog`: Log entries from phase execution
- `duration`: Execution time in milliseconds

### PlanContext
Execution context and configuration for plan generation.

```typescript
interface PlanContext {
  specificationPath: string
  outputDirectory: string
  branchName: string
  technicalContext: TechnicalContext
  constitutionalCompliance: boolean
  dryRun: boolean
  overwriteExisting: boolean
  variables: Record<string, unknown>
}

interface TechnicalContext {
  language: string
  version: string
  dependencies: string[]
  storage: string
  testing: string
  targetPlatform: string
  projectType: ProjectType
  performanceGoals: string
  constraints: string
  scope: string
}

enum ProjectType {
  SINGLE = 'single',
  WEB = 'web',
  MOBILE = 'mobile'
}
```

**Fields**:
- `specificationPath`: Path to feature specification file
- `outputDirectory`: Base directory for generated artifacts
- `branchName`: Git branch for this plan execution
- `technicalContext`: Technical environment details
- `constitutionalCompliance`: Whether to enforce constitutional checks
- `dryRun`: Whether to simulate execution without file writes
- `overwriteExisting`: Whether to overwrite existing artifacts
- `variables`: Template variables for substitution

## Entity Relationships

### Template to Execution (1:N)
- One PlanTemplate can have multiple PlanExecutions
- Each PlanExecution references exactly one PlanTemplate
- Deletion of PlanTemplate should cascade to related executions

### Phase to Artifact (1:N)
- One PlanPhase can generate multiple PlanArtifacts
- Each PlanArtifact belongs to exactly one PlanPhase
- Phase completion requires all artifacts to be generated successfully

### Execution to Results (1:N)
- One PlanExecution has multiple PhaseResults
- Each PhaseResult belongs to exactly one PlanExecution
- Phase results provide audit trail and debugging information

### Validation Composition
- ConstitutionalChecks contain ValidationRules
- PlanPhases contain ValidationRules
- PlanArtifacts contain ValidationRules
- ValidationRules are reusable across different entities

## State Transitions

### Plan Execution Lifecycle
```
PENDING → RUNNING → COMPLETED
              ↓
           FAILED ← CANCELLED
```

**Transition Rules**:
- PENDING → RUNNING: When execution starts
- RUNNING → COMPLETED: When all phases complete successfully
- RUNNING → FAILED: When a required phase fails
- RUNNING → CANCELLED: When execution is manually stopped
- No transitions allowed from terminal states (COMPLETED, FAILED, CANCELLED)

### Phase Execution Lifecycle
```
PENDING → RUNNING → COMPLETED
              ↓
         FAILED/SKIPPED
```

**Transition Rules**:
- PENDING → RUNNING: When phase execution begins
- RUNNING → COMPLETED: When phase completes successfully
- RUNNING → FAILED: When phase encounters unrecoverable error
- RUNNING → SKIPPED: When phase is skipped due to conditions
- PENDING → SKIPPED: When dependencies fail and phase is optional

## Data Validation

### Input Validation
All entities use Zod schemas for runtime validation:
- Type safety at compile time
- Runtime validation for external inputs
- Clear error messages for validation failures
- Composable validation rules

### Business Rules
1. **Phase Dependencies**: Phases must complete in dependency order
2. **Constitutional Compliance**: Errors must be resolved before proceeding
3. **Artifact Integrity**: Generated artifacts must pass validation
4. **Template Versioning**: Template changes require version increment
5. **Execution Atomicity**: Failed executions should not leave partial artifacts

### Data Integrity
1. **Referential Integrity**: All foreign keys must reference valid entities
2. **Temporal Consistency**: Completion timestamps must be after start timestamps
3. **Status Consistency**: Entity status must be consistent with related entities
4. **Path Validation**: All file paths must be within allowed directories

## Performance Considerations

### Indexing Strategy
- Primary keys on all entity IDs
- Foreign key indexes for relationship queries
- Composite indexes on common query patterns
- Text indexes for search functionality

### Data Access Patterns
- Read-heavy during plan execution
- Batch inserts for phase results and artifacts
- Filtering by execution status and dates
- Searching by template names and types

### Storage Optimization
- JSON fields for flexible metadata storage
- Efficient encoding for large text fields
- Compression for artifact content
- Archive strategy for completed executions

## Future Extensions

### Planned Enhancements
1. **Template Library**: Centralized template repository
2. **Parallel Execution**: Support for independent phase parallelization
3. **Incremental Updates**: Smart artifact regeneration
4. **Collaboration**: Multi-user plan development
5. **Analytics**: Execution metrics and optimization insights

### Extensibility Points
1. **Custom Validation**: Plugin system for domain-specific rules
2. **Artifact Types**: Support for additional artifact formats
3. **Integration**: Hooks for external tool integration
4. **Templates**: Support for advanced templating engines
5. **Storage**: Alternative storage backends beyond file system