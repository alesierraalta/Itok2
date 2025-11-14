# Protocolo de Benchmark: Validación de Reducción de Tokens

## Resumen

Este documento describe el protocolo para validar que el sistema de planificación MCP Itok reduce el uso de tokens en escenarios reales de Cursor. El benchmark compara ejecuciones Baseline (sin planner/TOON/Serena) vs Experimental (con planner/TOON/Serena).

## Objetivo

Validar que Itok reduce el uso de tokens en **≥30% en promedio** comparado con el uso baseline de Cursor, como se especifica en `Itok.md`.

## Metodología

### Comparación Controlada A/B

Para cada escenario, ejecutamos la misma tarea dos veces:
1. **Baseline**: Uso normal de Cursor (chat, acciones de código) sin MCP planner
2. **Experimental**: Usando herramientas MCP planner (plan_task, validate_plan, execute_step, get_chunks) con Serena

### Criterios de Éxito

- **Primario**: ≥30% reducción promedio en Total tokens (input + output)
- **Secundario**: Mantener o mejorar calidad de completitud de tarea
- **Terciario**: Tiempo de ejecución razonable (trade-off aceptable por reducción de tokens)

## Escenarios

Se definen tres escenarios de benchmark:

1. **Bugfix Pequeño** (`small-bugfix-001`)
   - Tarea: Corregir excepción de puntero nulo en función calculatePrice
   - Complejidad: Baja
   - Tiempo estimado: 8 minutos
   - Archivos: 1-2 archivos

2. **Feature Mediana** (`medium-feature-001`)
   - Tarea: Agregar autenticación de usuario con tokens JWT
   - Complejidad: Media
   - Tiempo estimado: 25 minutos
   - Archivos: 3-5 archivos

3. **Refactor Estructural** (`structural-refactor-001`)
   - Tarea: Refactorizar capa de base de datos para usar patrón Repository
   - Complejidad: Alta
   - Tiempo estimado: 50 minutos
   - Archivos: 5-10 archivos

## Metodología Baseline

### Configuración

1. **Deshabilitar MCP Planner**: Asegurar que el servidor MCP Itok esté deshabilitado en configuración de Cursor
2. **Preparar Workspace**: Asegurar que el codebase esté en estado limpio
3. **Registrar Hora de Inicio**: Anotar el timestamp cuando comiences la tarea

### Proceso de Ejecución

1. **Leer Escenario**: Revisar la definición del escenario desde `src/scenarios/`
2. **Completar Tarea**: Resolver la tarea usando características normales de Cursor:
   - Usar chat de Cursor para hacer preguntas y obtener sugerencias de código
   - Usar acciones de código (autocompletado, refactor, etc.)
   - Trabajar como lo harías normalmente sin el planner
3. **NO usar**:
   - `itok::plan_task`
   - `itok::validate_plan`
   - `itok::execute_step`
   - `itok::get_chunks`
   - Herramientas Serena MCP para navegación de código

### Medición

1. **Registrar Hora de Fin**: Anotar el timestamp cuando completes la tarea
2. **Obtener Métricas de Tokens**: 
   - Abrir Cursor Dashboard/Usage
   - Filtrar por el rango de tiempo de tu ejecución
   - Registrar:
     - Tokens de entrada
     - Tokens de salida
     - Total de tokens
3. **Registrar Metadatos**:
   - Operaciones clave realizadas (ej., "buscó calculatePrice", "editó pricing.ts")
   - Cualquier error o problema encontrado
   - Estado de completitud de tarea

### Usando la Herramienta

```typescript
import { smallBugfixScenario } from "./scenarios/index.js";
import { runBaselineScenario } from "./tools/run-baseline-scenario.js";

const execution = await runBaselineScenario(smallBugfixScenario, {
  interactive: true, // Solicitará métricas de tokens
  // O proporcionar métricas directamente:
  // tokenMetrics: {
  //   inputTokens: 15000,
  //   outputTokens: 8000,
  //   totalTokens: 23000,
  //   timestamp: new Date().toISOString(),
  // },
});
```

## Metodología Experimental

### Configuración

1. **Habilitar MCP Planner**: Asegurar que el servidor MCP Itok esté habilitado en configuración de Cursor
2. **Habilitar Serena**: Asegurar que Serena MCP esté habilitado para navegación de código
3. **Preparar Workspace**: Asegurar que el codebase esté en estado limpio
4. **Registrar Hora de Inicio**: Anotar el timestamp cuando comiences la tarea

### Proceso de Ejecución

1. **Leer Escenario**: Revisar la definición del escenario desde `src/scenarios/`

2. **Generar Plan**:
   ```typescript
   // Usar herramienta itok::plan_task
   const plan = await itok.plan_task({
     goal: scenario.goal,
     context: scenario.context,
     taskKind: scenario.taskKind,
   });
   ```

3. **Validar y Comprimir Plan**:
   ```typescript
   // Usar herramienta itok::validate_plan
   const validatedPlan = await itok.validate_plan({
     plan: plan,
     targetMaxPhases: 5,      // Ajustar según necesidad
     targetMaxSteps: 15,       // Ajustar según necesidad
     maxMicroStepsPerPhase: 2, // Ajustar según necesidad
   });
   ```

4. **Ejecutar Pasos**:
   - Para cada paso en el plan:
     - Usar `itok::get_chunks` para obtener chunks de código para el paso
     - Usar `itok::execute_step` para ejecutar el paso
     - Usar herramientas Serena para leer/editar código (minimizar tokens):
       - `serena::find_symbol` para localizar símbolos
       - `serena::read_symbol` para leer símbolos específicos
       - `serena::find_referencing_symbols` para encontrar referencias
     - Seguir el plan secuencialmente
     - Marcar pasos como done/blocked según necesidad

5. **Completar Tarea**:
   - Asegurar que todos los criterios de completitud se cumplan
   - Verificar que la tarea esté completamente completada

### Medición

1. **Registrar Hora de Fin**: Anotar el timestamp cuando completes la tarea
2. **Obtener Métricas de Tokens**: 
   - Abrir Cursor Dashboard/Usage
   - Filtrar por el rango de tiempo de tu ejecución
   - Registrar:
     - Tokens de entrada
     - Tokens de salida
     - Total de tokens
3. **Registrar Metadatos**:
   - Plan ID usado
   - Número de pasos ejecutados
   - Número de chunks usados
   - Operaciones clave realizadas
   - Estado de completitud de tarea

### Usando la Herramienta

```typescript
import { smallBugfixScenario } from "./scenarios/index.js";
import { runExperimentalScenario } from "./tools/run-experimental-scenario.js";

const execution = await runExperimentalScenario(smallBugfixScenario, {
  interactive: true, // Solicitará métricas de tokens
  plan: validatedPlan, // El plan usado
  stepsExecuted: 8,    // Número de pasos ejecutados
  chunksUsed: 12,      // Número de chunks usados
  // O proporcionar métricas directamente:
  // tokenMetrics: {
  //   inputTokens: 10000,
  //   outputTokens: 5000,
  //   totalTokens: 15000,
  //   timestamp: new Date().toISOString(),
  // },
});
```

## Comparación y Análisis

### Comparar Resultados

Después de ejecutar ambas ejecuciones (baseline y experimental):

```typescript
import { compareBenchmarkResults } from "./tools/compare-results.js";

const result = compareBenchmarkResults(
  scenario,
  baselineExecution,
  experimentalExecution,
  {
    validate: true,        // Validar resultados
    generateReport: true,   // Generar reporte de comparación
    reportFormat: "both",   // "text", "json", o "both"
  }
);
```

### Calcular Reducción

El porcentaje de reducción se calcula como:
```
Reducción % = (TotalBASE - TotalItok) / TotalBASE × 100
```

Donde:
- `TotalBASE` = Total tokens en ejecución baseline
- `TotalItok` = Total tokens en ejecución experimental

### Criterios de Éxito

- **Cumple Criterios**: Reducción ≥ 30%
- **Cercano**: Reducción 20-29% (puede necesitar ajuste de parámetros)
- **Por Debajo del Objetivo**: Reducción < 20% (necesita ajuste significativo)

## Ajuste de Parámetros

### Si No Reduce Tokens (< 20%)

1. **Reducir Tamaño del Plan**:
   - Disminuir `targetMaxSteps` (ej., de 15 a 10)
   - Disminuir `targetMaxPhases` (ej., de 5 a 3)
   - Disminuir `maxMicroStepsPerPhase` (ej., de 2 a 1)

2. **Reducir Límites de Chunks**:
   - Disminuir `maxChunksPerStep` en opciones de chunking
   - Usar dechunking más agresivo

3. **Revisar Estructura del Plan**:
   - Asegurar que los pasos estén correctamente chunkeados
   - Verificar que la compresión del plan esté funcionando

### Si Reduce Tokens Pero Cae la Calidad

1. **Aumentar Detalle del Plan**:
   - Aumentar `targetMaxSteps` en fases críticas
   - Permitir más pasos en fase de planificación

2. **Mejorar Sugerencias de Herramientas**:
   - Revisar `suggestedTools` en generación de planes
   - Asegurar que las herramientas estén correctamente mapeadas a tipos de pasos

3. **Ajustar Chunking**:
   - Aumentar límites de chunks si el contexto es muy limitado
   - Revisar límites de chunks para mejor contexto

## Múltiples Ejecuciones

Para validez estadística, repetir cada escenario **2-3 veces** y promediar los resultados:

```typescript
import { generateSummaryReport } from "./tools/compare-results.js";

const results = [result1, result2, result3];
const summary = generateSummaryReport(results);
console.log(summary);
```

## Exportar Resultados

Guardar resultados para análisis posterior:

```typescript
import { exportResults } from "./tools/compare-results.js";

await exportResults(results, "benchmark-results.json", "json");
// O
await exportResults(results, "benchmark-results.txt", "text");
```

## Ejemplo de Workflow

### Ejemplo Completo de Benchmark

```typescript
import { smallBugfixScenario } from "./scenarios/index.js";
import { runBaselineScenario } from "./tools/run-baseline-scenario.js";
import { runExperimentalScenario } from "./tools/run-experimental-scenario.js";
import { compareBenchmarkResults } from "./tools/compare-results.js";

// 1. Ejecutar Baseline
console.log("Ejecutando baseline...");
const baseline = await runBaselineScenario(smallBugfixScenario, {
  interactive: true,
});

// 2. Ejecutar Experimental
console.log("Ejecutando experimental...");
const experimental = await runExperimentalScenario(smallBugfixScenario, {
  interactive: true,
  plan: validatedPlan,
  stepsExecuted: 8,
  chunksUsed: 12,
});

// 3. Comparar
console.log("Comparando resultados...");
const result = compareBenchmarkResults(
  smallBugfixScenario,
  baseline,
  experimental,
  {
    validate: true,
    generateReport: true,
    reportFormat: "both",
  }
);

// 4. Verificar Éxito
if (result.meetsSuccessCriteria) {
  console.log("✓ Benchmark cumple criterios de éxito (≥30% reducción)");
} else {
  console.log("✗ Benchmark no cumple criterios de éxito");
  console.log("Recomendaciones:", result.analysis.recommendations);
}
```

## Solución de Problemas

### Métricas de Tokens No Disponibles

Si Cursor Dashboard no muestra métricas:
- Asegurar que estás filtrando por el rango de tiempo correcto
- Verificar que Cursor esté rastreando uso correctamente
- Verificar que tu cuenta de Cursor tenga rastreo de uso habilitado

### Ejecución Falla

Si la ejecución experimental falla:
- Verificar que los servidores MCP estén correctamente configurados
- Verificar que el plan sea válido y ejecutable
- Revisar mensajes de error en metadatos de ejecución

### Resultados Inconsistentes

Si los resultados varían significativamente entre ejecuciones:
- Asegurar mismo estado de codebase para ambas ejecuciones
- Usar mismo modelo/versión de Cursor
- Seguir protocolo consistentemente
- Ejecutar múltiples veces y promediar

## Documentación

Después de completar benchmarks, documentar resultados en `docs/BENCHMARK_RESULTS.md`:
- Tabla resumen de todos los resultados
- Análisis por tipo de tarea
- Conclusiones y recomendaciones
- Ajustes de parámetros realizados
