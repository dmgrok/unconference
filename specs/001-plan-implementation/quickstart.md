# Quickstart Guide: Plan Command Implementation

## Overview
This guide walks through the essential steps to implement and use the plan command system within the unconference application.

## Prerequisites

### System Requirements
- Node.js 18+ and npm
- Git repository initialized
- Nuxt 3 development environment
- Constitutional principles document

### Development Environment
- VS Code or preferred IDE
- Terminal/command line access
- Git CLI tools
- Database access (SQLite via Prisma)

## Quick Start

### Step 1: Set Up Plan Command Infrastructure

```bash
# Navigate to your unconference project
cd /path/to/unconference

# Create the plan command structure
mkdir -p server/api/plan
mkdir -p lib/plan
mkdir -p types/plan
mkdir -p tests/plan

# Install any additional dependencies (if needed)
npm install
```

### Step 2: Implement Core Plan Models

Create the base types and models:

```typescript
// types/plan/index.ts
export interface PlanTemplate {
  id: string
  name: string
  version: string
  description: string
  phases: PlanPhase[]
  constitutionalChecks: ConstitutionalCheck[]
  createdAt: Date
  updatedAt: Date
}

export interface PlanExecution {
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

// Additional interfaces from data-model.md...
```

### Step 3: Create Plan API Endpoints

Implement the REST API endpoints:

```typescript
// server/api/plan/index.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate input using Zod
  const planRequest = PlanRequestSchema.parse(body)

  // Execute plan
  const execution = await executePlan(planRequest)

  return {
    executionId: execution.id,
    status: execution.status,
    startedAt: execution.startedAt
  }
})
```

### Step 4: Implement Plan Execution Engine

Create the core execution logic:

```typescript
// lib/plan/executor.ts
export class PlanExecutor {
  async executePlan(request: ExecutePlanRequest): Promise<PlanExecution> {
    // 1. Load feature specification
    const spec = await loadFeatureSpec(request.specificationPath)

    // 2. Validate constitutional compliance
    await validateConstitutionalCompliance(spec, request.technicalContext)

    // 3. Execute phases sequentially
    const phases = await loadPlanTemplate(request.templateId)
    const execution = await executePhases(phases, request)

    return execution
  }
}
```

### Step 5: Add Constitutional Validation

Implement the validation system:

```typescript
// lib/plan/constitutional-validator.ts
export class ConstitutionalValidator {
  async validate(spec: FeatureSpec, context: TechnicalContext): Promise<ValidationResult[]> {
    const checks = await loadConstitutionalChecks()
    const results = []

    for (const check of checks) {
      const result = await executeCheck(check, spec, context)
      results.push(result)
    }

    return results
  }
}
```

## Development Workflow

### Creating a New Feature Plan

1. **Create Feature Specification**
   ```bash
   # Create feature branch
   git checkout -b 001-new-feature

   # Create specification file
   mkdir -p specs/001-new-feature
   touch specs/001-new-feature/spec.md
   ```

2. **Execute Plan Command**
   ```bash
   # Using API endpoint
   curl -X POST http://localhost:3001/api/plan \
     -H "Content-Type: application/json" \
     -d '{
       "specificationPath": "/specs/001-new-feature/spec.md",
       "outputDirectory": "/specs/001-new-feature",
       "branchName": "001-new-feature"
     }'

   # Or using CLI wrapper (to be implemented)
   npm run plan:execute specs/001-new-feature/spec.md
   ```

3. **Review Generated Artifacts**
   ```bash
   # Check generated files
   ls specs/001-new-feature/
   # Expected: plan.md, research.md, data-model.md, contracts/, quickstart.md

   # Review constitutional compliance
   cat specs/001-new-feature/plan.md | grep "Constitution Check"
   ```

### Monitoring Plan Execution

1. **Check Execution Status**
   ```bash
   # Get execution details
   curl http://localhost:3001/api/plan/{executionId}
   ```

2. **Download Generated Artifacts**
   ```bash
   # Download research artifact
   curl http://localhost:3001/api/plan/artifacts/{executionId}/research > research.md

   # Download contracts
   curl http://localhost:3001/api/plan/artifacts/{executionId}/contracts > contracts.json
   ```

### Handling Validation Failures

1. **Constitutional Violations**
   ```bash
   # Check specific constitutional issues
   curl -X POST http://localhost:3001/api/plan/constitutional-check \
     -H "Content-Type: application/json" \
     -d '{
       "specificationPath": "/specs/001-new-feature/spec.md",
       "technicalContext": {...}
     }'
   ```

2. **Phase Execution Errors**
   ```typescript
   // Review execution logs
   const execution = await getPlanExecution(executionId)
   execution.errors.forEach(error => {
     console.log(`Phase ${error.phase}: ${error.message}`)
   })
   ```

## Testing Strategy

### Unit Tests

```typescript
// tests/plan/executor.test.ts
import { describe, it, expect } from 'vitest'
import { PlanExecutor } from '~/lib/plan/executor'

describe('PlanExecutor', () => {
  it('should execute plan successfully', async () => {
    const executor = new PlanExecutor()
    const request = createMockPlanRequest()

    const result = await executor.executePlan(request)

    expect(result.status).toBe('completed')
    expect(result.artifacts).toHaveLength(4) // research, data-model, contracts, quickstart
  })

  it('should fail on constitutional violations', async () => {
    const executor = new PlanExecutor()
    const request = createInvalidPlanRequest()

    await expect(executor.executePlan(request))
      .rejects.toThrow('Constitutional validation failed')
  })
})
```

### Integration Tests

```typescript
// tests/plan/api.test.ts
import { describe, it, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils'

describe('/api/plan', () => {
  it('should create plan execution', async () => {
    const response = await $fetch('/api/plan', {
      method: 'POST',
      body: {
        specificationPath: '/test/spec.md',
        outputDirectory: '/test/output',
        branchName: 'test-branch'
      }
    })

    expect(response.executionId).toBeDefined()
    expect(response.status).toBe('pending')
  })
})
```

### Contract Tests

```typescript
// tests/plan/contracts.test.ts
import { describe, it, expect } from 'vitest'
import { validateOpenAPISpec } from '@/tests/utils/openapi'

describe('Plan API Contracts', () => {
  it('should match OpenAPI specification', async () => {
    const spec = await loadOpenAPISpec('/contracts/plan-api.yaml')
    const isValid = await validateOpenAPISpec(spec)

    expect(isValid).toBe(true)
  })
})
```

## Configuration

### Environment Variables

```bash
# .env
PLAN_TEMPLATES_DIR=/path/to/templates
PLAN_OUTPUT_DIR=/path/to/output
CONSTITUTIONAL_CHECKS_ENABLED=true
PLAN_EXECUTION_TIMEOUT=3600000
```

### Plan Template Configuration

```yaml
# config/plan-templates/default.yaml
name: "Default Feature Plan"
version: "1.0.0"
description: "Standard feature development plan"
phases:
  - id: "research"
    name: "Research & Analysis"
    order: 0
    dependencies: []
    outputs:
      - type: "research"
        path: "research.md"
    timeoutMinutes: 15
    required: true
```

## Troubleshooting

### Common Issues

1. **Constitutional Validation Failures**
   - Review constitutional principles document
   - Check technical context completeness
   - Verify feature specification format

2. **Phase Execution Timeouts**
   - Increase timeout limits in configuration
   - Check system resources
   - Review phase dependencies

3. **Artifact Generation Errors**
   - Verify output directory permissions
   - Check template syntax
   - Review file path conflicts

### Debug Mode

```bash
# Enable debug logging
DEBUG=plan:* npm run dev

# Dry run mode
curl -X POST http://localhost:3001/api/plan \
  -d '{"dryRun": true, ...}'
```

### Log Analysis

```bash
# Check plan execution logs
tail -f combined.log | grep "plan:"

# Filter constitutional validation logs
grep "constitutional:" combined.log
```

## Next Steps

After completing this quickstart:

1. **Implement Advanced Features**
   - Custom plan templates
   - Parallel phase execution
   - Artifact versioning

2. **Enhance Integration**
   - Git hook integration
   - CI/CD pipeline integration
   - IDE plugin development

3. **Add Monitoring**
   - Execution metrics
   - Performance monitoring
   - Error alerting

4. **Extend Templates**
   - Domain-specific templates
   - Team-specific workflows
   - Project type variations

## Support

- **Documentation**: See generated artifacts in `/specs/001-plan-implementation/`
- **API Reference**: `/contracts/plan-api.yaml`
- **Examples**: Review test cases in `/tests/plan/`
- **Issues**: Report problems through the standard issue tracking system

## Validation Checklist

Before considering implementation complete:

- [ ] All API endpoints respond correctly
- [ ] Constitutional validation works as expected
- [ ] All test cases pass
- [ ] Generated artifacts are valid and useful
- [ ] Error handling covers edge cases
- [ ] Performance meets requirements
- [ ] Documentation is complete and accurate
- [ ] Integration with existing system is seamless