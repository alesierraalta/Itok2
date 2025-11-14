# Guía de Orquestación para Ejecución de TaskPlans

## Introducción

Esta guía explica cómo usar los TaskPlans generados por `plan_task` para ejecutar tareas step-by-step usando Serena MCP y otras herramientas. El objetivo es que el agente de Cursor pueda ejecutar planes de manera eficiente, minimizando el uso de tokens mediante el uso de chunks semánticos en lugar de archivos completos.

## Conceptos Clave

### HRM-L (Hierarchical Reasoning Model - Low Level)

En el contexto de ejecución de planes:
- **HRM-H (High Level)**: El TaskPlan completo, que guía la ejecución general
- **HRM-L (Low Level)**: La ejecución de cada step individual, que opera sobre chunks específicos

### H-Net Chunking

Cada step se ejecuta sobre "chunks" (fragmentos semánticos) en lugar de archivos completos:
- Minimiza tokens al leer solo lo necesario
- Usa herramientas semánticas (Serena) para localizar entidades
- Solicita chunks específicos en lugar de archivos enteros

## Protocolo de Ejecución

### Paso 1: Leer el Plan y Decidir qué Step Ejecutar

```typescript
import { getNextExecutableStep } from "./tools/execute-plan-helpers.js";

const nextStep = getNextExecutableStep(plan);
if (!nextStep) {
  // No hay steps ejecutables (todos completados o bloqueados)
  console.log("Plan completado o bloqueado");
}
```

**Criterios para step ejecutable:**
- Estado es `todo` o `undefined`
- Todas sus dependencias tienen estado `done`
- No está `blocked`

**Orden de ejecución:**
1. Por phase.order (fases anteriores primero)
2. Por step.order dentro de la fase (orden menor primero)

### Paso 2: Traducir el Scope Selector

```typescript
import { translateScopeSelector, getStepScope } from "./tools/scope-resolver.js";

const scope = getStepScope(nextStep, plan);
if (scope) {
  const resolution = translateScopeSelector(scope);
  console.log(resolution.instructions);
}
```

**Tipos de selectors soportados:**
- `"workspace root"` → Scope global
- `"module related to: {description}"` → Búsqueda semántica de módulo
- `"use serena.find_symbol('SymbolName')"` → Acción Serena específica
- `"files in src/server/"` → Patrón de archivos
- Nombres de símbolos → Búsqueda de símbolo

### Paso 3: Localizar Entidades con Serena

Usar herramientas semánticas de Serena para encontrar código relevante:

```typescript
import { getSerenaActionsForStep } from "./tools/serena-mapper.js";

const actions = getSerenaActionsForStep(nextStep, scope, plan);
// actions contiene las llamadas a Serena a realizar
```

**Herramientas Serena por StepKind:**

- **clarify_goal**: `serena.find_symbol`, `filesystem.read_file`
- **gather_context**: `serena.get_symbols_overview`, `serena.find_referencing_symbols`
- **scan_code**: `serena.search_for_pattern`, `serena.find_symbol`
- **design_solution**: `serena.get_symbols_overview`
- **edit_code**: `serena.find_symbol`, `serena.get_symbols_overview` (luego `serena.replace_symbol_body`, etc.)
- **run_tests**: `execute_shell_command` (npm test)
- **refine**: `serena.find_symbol`, `serena.find_referencing_symbols`

### Paso 4: Solicitar Chunks (No Archivos Completos)

**Principio H-Net**: Siempre pedir chunks específicos, no archivos enteros.

```typescript
// ❌ MAL: Leer archivo completo
const file = await readFile("src/server/mcp-server.ts");

// ✅ BIEN: Leer símbolo específico
const symbol = await serena.find_symbol({ name: "createMcpServer" });

// ✅ BIEN: Leer rango de líneas específico
const chunk = await serena.read_file({ 
  path: "src/server/mcp-server.ts",
  startLine: 10,
  endLine: 50
});
```

**Estrategias de chunking:**
- Un chunk ≈ un símbolo (función, clase, método) via Serena LSP
- Para símbolos grandes: sub-chunks por bloques lógicos
- Usar comentarios como boundaries naturales

### Paso 5: Ejecutar la Acción

Ejecutar las herramientas sugeridas según el StepKind:

```typescript
// Marcar step como in_progress
let updatedPlan = markStepInProgress(plan, nextStep.id);

// Ejecutar acciones Serena
for (const action of actions) {
  // Llamar a Serena MCP tool
  const result = await callSerenaTool(action.tool, action.args);
  // Procesar resultado...
}

// Marcar como done o blocked según resultado
if (success) {
  updatedPlan = markStepDone(updatedPlan, nextStep.id);
} else {
  updatedPlan = markStepBlocked(updatedPlan, nextStep.id, errorMessage);
}
```

### Paso 6: Actualizar Estado y Continuar

```typescript
import { getPlanProgress } from "./tools/execute-plan-helpers.js";

const progress = getPlanProgress(updatedPlan);
console.log(`Progress: ${progress.done}/${progress.total} (${progress.percentage}%)`);

// Continuar con siguiente step
const nextStep = getNextExecutableStep(updatedPlan);
```

## Ejemplos de Uso

### Ejemplo 1: Ejecutar un Step de Clarificación

```typescript
import { 
  getNextExecutableStep, 
  markStepInProgress, 
  markStepDone 
} from "./tools/execute-plan-helpers.js";
import { getSerenaActionsForStep, getStepScope } from "./tools/serena-mapper.js";
import { getStepScope as getScope } from "./tools/scope-resolver.js";

// 1. Obtener siguiente step
const step = getNextExecutableStep(plan);
if (!step) return;

// 2. Marcar como in_progress
let currentPlan = markStepInProgress(plan, step.id);

// 3. Obtener scope y acciones
const scope = getScope(step, currentPlan);
const actions = getSerenaActionsForStep(step, scope, currentPlan);

// 4. Ejecutar acciones (simulado)
console.log(`Executing step: ${step.title}`);
for (const action of actions) {
  console.log(`  → ${action.tool}(${JSON.stringify(action.args)})`);
}

// 5. Marcar como done
currentPlan = markStepDone(currentPlan, step.id);
```

### Ejemplo 2: Ejecutar un Step de Edición

```typescript
// Para edit_code steps:
// 1. Localizar símbolo a editar
const symbol = await serena.find_symbol({ 
  name: scopeResolution.parsedInfo.symbolName 
});

// 2. Leer solo el símbolo (chunk), no el archivo completo
const symbolCode = await serena.find_symbol({ 
  name: symbolName,
  include_body: true 
});

// 3. Realizar edición
await serena.replace_symbol_body({
  name_path: symbolName,
  new_body: modifiedCode
});

// 4. Verificar referencias
await serena.find_referencing_symbols({ name: symbolName });
```

### Ejemplo 3: Manejo de Steps Bloqueados

```typescript
import { markStepBlocked, getExecutableSteps } from "./tools/execute-plan-helpers.js";

try {
  // Intentar ejecutar step
  await executeStep(step);
  currentPlan = markStepDone(currentPlan, step.id);
} catch (error) {
  // Marcar como bloqueado
  currentPlan = markStepBlocked(
    currentPlan, 
    step.id, 
    `Error: ${error.message}`
  );
  
  // Verificar si hay otros steps ejecutables
  const executable = getExecutableSteps(currentPlan);
  if (executable.length === 0) {
    // Re-planificar: volver a validate_plan
    const revalidated = await validatePlan(currentPlan);
    currentPlan = revalidated.plan;
  }
}
```

## Mapeo StepKind → Acciones Serena

### clarify_goal
- **Acción 1**: `serena.find_symbol({ name: firstWordOfGoal })`
- **Acción 2**: `filesystem.read_file({ path: "README.md" })`
- **Propósito**: Entender el contexto y objetivo

### gather_context
- **Acción 1**: `serena.get_symbols_overview({ relative_path: scope })`
- **Acción 2**: `serena.find_referencing_symbols({ name: symbolName })`
- **Propósito**: Recopilar información sobre el estado actual

### scan_code
- **Acción 1**: `serena.find_symbol({ name: symbolName })`
- **Acción 2**: `serena.search_for_pattern({ pattern: summary })`
- **Propósito**: Escanear código para entender estructura

### design_solution
- **Acción 1**: `serena.get_symbols_overview({ relative_path: scope })`
- **Propósito**: Obtener visión general para diseñar solución

### edit_code
- **Acción 1**: `serena.find_symbol({ name: symbolName })` (localizar)
- **Acción 2**: `serena.get_symbols_overview({ relative_path: scope })` (contexto)
- **Acción 3**: `serena.replace_symbol_body({ ... })` (editar)
- **Acción 4**: `serena.insert_after_symbol({ ... })` (agregar)
- **Acción 5**: `serena.rename_symbol({ ... })` (renombrar)
- **Propósito**: Modificar código de manera precisa

### run_tests
- **Acción 1**: `execute_shell_command({ command: "npm test" })`
- **Propósito**: Validar que los cambios funcionan

### refine
- **Acción 1**: `serena.find_symbol({ name: symbolName })`
- **Acción 2**: `serena.find_referencing_symbols({ name: symbolName })`
- **Propósito**: Refinar y ajustar código existente

## Mejores Prácticas

### 1. Siempre Usar Chunks

❌ **Evitar:**
```typescript
const entireFile = await readFile("src/server/mcp-server.ts");
```

✅ **Preferir:**
```typescript
const symbol = await serena.find_symbol({ 
  name: "createMcpServer",
  include_body: true 
});
```

### 2. Respetar Dependencias

Siempre verificar que las dependencias estén completadas antes de ejecutar un step:

```typescript
if (!isStepExecutable(step, plan)) {
  console.log(`Step ${step.id} cannot execute yet`);
  return;
}
```

### 3. Actualizar Estado Inmediatamente

Marcar step como `in_progress` antes de ejecutar, y `done` o `blocked` después:

```typescript
plan = markStepInProgress(plan, stepId);
try {
  await executeStep(step);
  plan = markStepDone(plan, stepId);
} catch (error) {
  plan = markStepBlocked(plan, stepId, error.message);
}
```

### 4. Usar Herramientas Semánticas

Preferir herramientas semánticas (Serena) sobre búsquedas de texto plano:

❌ **Evitar:**
```typescript
const results = grep("function createMcpServer");
```

✅ **Preferir:**
```typescript
const symbol = await serena.find_symbol({ name: "createMcpServer" });
```

### 5. Re-planificar si es Necesario

Si un step se bloquea y no hay más steps ejecutables, re-validar el plan:

```typescript
const executable = getExecutableSteps(plan);
if (executable.length === 0 && hasBlockedSteps(plan)) {
  const revalidated = await validatePlan(plan, {
    // Opciones de re-validación
  });
  plan = revalidated.plan;
}
```

## Flujo Completo de Ejecución

```typescript
async function executePlan(plan: TaskPlan): Promise<TaskPlan> {
  let currentPlan = plan;
  
  while (true) {
    // 1. Obtener siguiente step ejecutable
    const step = getNextExecutableStep(currentPlan);
    if (!step) {
      console.log("Plan completado");
      break;
    }
    
    // 2. Marcar como in_progress
    currentPlan = markStepInProgress(currentPlan, step.id);
    
    // 3. Resolver scope
    const scope = getStepScope(step, currentPlan);
    const scopeResolution = scope ? translateScopeSelector(scope) : null;
    
    // 4. Obtener acciones Serena
    const actions = getSerenaActionsForStep(step, scope, currentPlan);
    
    // 5. Ejecutar acciones
    try {
      for (const action of actions) {
        await executeSerenaAction(action);
      }
      
      // 6. Marcar como done
      currentPlan = markStepDone(currentPlan, step.id);
    } catch (error) {
      // 7. Marcar como blocked si falla
      currentPlan = markStepBlocked(
        currentPlan, 
        step.id, 
        error.message
      );
      
      // Re-planificar si es necesario
      const executable = getExecutableSteps(currentPlan);
      if (executable.length === 0) {
        const revalidated = await validatePlan(currentPlan);
        currentPlan = revalidated.plan;
      }
    }
  }
  
  return currentPlan;
}
```

## Utilidades Disponibles

### execute-plan-helpers.ts
- `getNextExecutableStep(plan)` - Obtiene siguiente step a ejecutar
- `getExecutableSteps(plan)` - Lista todos los steps ejecutables
- `isStepExecutable(step, plan)` - Verifica si un step puede ejecutarse
- `updateStepStatus(plan, stepId, status)` - Actualiza estado de step
- `markStepInProgress(plan, stepId)` - Marca step como in_progress
- `markStepDone(plan, stepId)` - Marca step como done
- `markStepBlocked(plan, stepId, reason?)` - Marca step como blocked
- `getPlanProgress(plan)` - Obtiene estadísticas de progreso

### scope-resolver.ts
- `translateScopeSelector(scope)` - Traduce selector a información estructurada
- `resolveScope(scope, plan)` - Resuelve scope (preparado para Serena)
- `getStepScope(step, plan)` - Obtiene scope de un step

### serena-mapper.ts
- `getSerenaActionsForStep(step, scope, plan)` - Obtiene acciones Serena para un step
- `executeStepWithSerena(step, scope, plan)` - Documenta protocolo de ejecución

## Notas de Implementación

- Las funciones de ejecución son **deterministas**: mismo plan → misma decisión
- El estado se actualiza de forma **inmutable**: siempre se crea un nuevo plan
- La resolución de scopes es **preparada para integración futura** con Serena MCP
- El mapeo StepKind→Serena es **completo y extensible**

## Próximos Pasos

1. **Integración real con Serena MCP**: Implementar `resolveScope` para llamar realmente a Serena
2. **Chunking semántico**: Implementar módulo de chunking (Fase 6)
3. **Tool execute_step**: Implementar tool MCP opcional para ejecutar steps
4. **Re-planificación automática**: Lógica para re-validar planes cuando se bloquean

