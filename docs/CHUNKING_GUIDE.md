# Guía de Chunking Semántico de Código (H-Net-inspired)

## Introducción

El módulo de chunking semántico divide archivos y símbolos en chunks optimizados para minimizar el uso de tokens mientras mantiene la coherencia semántica. Está inspirado en H-Net (Dynamic Chunking) y usa información semántica de Serena LSP para crear chunks inteligentes.

## Conceptos Clave

### H-Net Dynamic Chunking

H-Net propone segmentación dinámica que:
- Aprende boundaries semánticos (no reglas fijas)
- Controla ratio de compresión (chunks vs tokens)
- Tiene dechunking suave (fusiona chunks cuando es necesario)

**Traducción a código:**
- Chunk ≈ símbolo (función, clase, método) via Serena LSP
- Sub-chunks para símbolos grandes (por bloques lógicos)
- Dechunking cuando excede límites (fusiona y genera resúmenes)

### Tipos de Chunks

1. **Symbol** - Chunk basado en símbolo completo (función, clase, método)
2. **SubSymbol** - Sub-chunk dentro de un símbolo grande (bloque lógico)
3. **FileRange** - Rango de líneas de un archivo
4. **Summary** - Resumen de chunks fusionados (dechunking)

## Uso Básico

### Chunking por Scope

```typescript
import { chunkScope } from "./tools/code-chunking.js";

const result = await chunkScope(scope, plan, {
  maxChunksPerStep: 5,
  maxLinesPerChunk: 100,
});

console.log(`Chunks: ${result.chunks.length}`);
console.log(`Total lines: ${result.stats.totalLines}`);
console.log(`Estimated tokens: ${result.stats.estimatedTokens}`);
```

### Chunking para Step Execution

```typescript
import { getChunksForStep } from "./tools/code-chunking.js";

const result = await getChunksForStep(step, plan, {
  maxChunksPerStep: 5,
  maxLinesPerChunk: 100,
});

// Usar chunks en ejecución
for (const chunk of result.chunks) {
  console.log(`Chunk: ${chunk.metadata.summary}`);
  if (chunk.content) {
    // Procesar código del chunk
  }
}
```

### Usando la Tool MCP

```typescript
// Via MCP tool
const result = await callMcpTool("get_chunks", {
  step: step,
  plan: plan,
  options: {
    maxChunksPerStep: 5,
    maxLinesPerChunk: 100,
  },
});
```

## Estrategias de Chunking

### 1. Chunking por Símbolo (Heurística Principal)

**Algoritmo:**
1. Resolver scope a símbolos usando Serena LSP
2. Para cada símbolo:
   - Si tamaño ≤ maxLinesPerChunk: chunk único
   - Si tamaño > maxLinesPerChunk: sub-chunking
3. Aplicar límite maxChunksPerStep
4. Si excede límite: aplicar dechunking

**Ejemplo:**
```typescript
const scopeResolution = translateScopeSelector(scope);
// scopeResolution.resolutionType === "symbol"
// scopeResolution.parsedInfo.symbolName === "createMcpServer"

const result = await chunkBySymbol(scopeResolution, {
  maxLinesPerChunk: 100,
});
// Crea chunk para símbolo "createMcpServer"
```

### 2. Sub-chunking para Símbolos Grandes

**Algoritmo:**
1. Analizar código del símbolo
2. Detectar boundaries:
   - Bloques lógicos (if/for/switch/while/try-catch)
   - Comentarios (//, /* */)
   - Líneas en blanco significativas
3. Crear sub-chunks respetando maxLinesPerChunk
4. Mantener metadata del símbolo padre

**Ejemplo:**
```typescript
// Símbolo grande (200 líneas) se divide en sub-chunks
const subChunks = chunkLargeSymbol(
  "src/server/mcp-server.ts",
  "createMcpServer",
  "function",
  10,  // startLine
  210, // endLine
  codeContent,
  { maxLinesPerChunk: 100 }
);
// Resultado: 2-3 sub-chunks basados en bloques lógicos
```

### 3. Chunking por Rango de Líneas

**Útil cuando:**
- No hay información de símbolos disponible
- Se necesita chunking de archivo completo
- Se trabaja con código no estructurado

**Ejemplo:**
```typescript
const chunks = chunkByFileRange(
  "src/utils/helpers.ts",
  1,   // startLine
  500, // endLine
  { maxLinesPerChunk: 100 }
);
// Resultado: 5 chunks de ~100 líneas cada uno
```

### 4. Dechunking (Fusión de Chunks)

**Cuándo se aplica:**
- Número de chunks > maxChunksPerStep
- Se necesita reducir tokens manteniendo información

**Qué hace:**
- Fusiona chunks vecinos del mismo archivo
- Genera resumen en lugar de código completo
- Mantiene referencia a chunks originales

**Ejemplo:**
```typescript
const chunks = [/* 10 chunks */];
const dechunked = applyDechunking(chunks, {
  maxChunksPerStep: 5,
});

// Resultado: 5 chunks (algunos son summaries de chunks fusionados)
// Chunks fusionados tienen type: ChunkType.Summary
// y metadata.mergedFrom con IDs de chunks originales
```

## Opciones de Chunking

### ChunkingOptions

```typescript
interface ChunkingOptions {
  /** Maximum number of chunks per step (default: 5) */
  maxChunksPerStep?: number;
  /** Maximum lines per chunk (default: 100) */
  maxLinesPerChunk?: number;
  /** Maximum tokens per chunk (optional, estimated) */
  maxTokensPerChunk?: number;
  /** Whether to include code content in chunks (default: true) */
  includeContent?: boolean;
  /** Whether to apply dechunking if limits exceeded (default: true) */
  applyDechunking?: boolean;
}
```

### Valores Recomendados

- **maxChunksPerStep: 5** - Balance entre contexto y tokens
- **maxLinesPerChunk: 100** - Tamaño manejable para LLMs
- **maxTokensPerChunk: undefined** - Se estima automáticamente
- **includeContent: true** - Incluir código (false para solo metadata)
- **applyDechunking: true** - Fusionar si excede límites

## Estructura de Chunks

### CodeChunk

```typescript
interface CodeChunk {
  id: string;                    // Unique identifier
  filePath: string;              // File containing chunk
  startLine: number;             // Starting line (1-based)
  endLine: number;               // Ending line (1-based, inclusive)
  type: ChunkType;               // Type of chunk
  metadata: ChunkMetadata;       // Metadata (size, summary, etc.)
  content?: string;              // Code content (optional)
  blocks?: BlockInfo[];          // Logical blocks (for sub-chunks)
}
```

### ChunkMetadata

```typescript
interface ChunkMetadata {
  type: ChunkType;
  lineCount: number;
  estimatedTokens?: number;
  summary?: string;
  symbolName?: string;           // If chunk is based on symbol
  symbolKind?: string;          // function, class, method, etc.
  parentSymbolName?: string;    // If this is a sub-chunk
  mergedFrom?: string[];        // IDs of merged chunks
}
```

## Integración con Ejecución de Steps

### Flujo Completo

```typescript
import { getChunksForStep } from "./tools/code-chunking.js";
import { getNextExecutableStep } from "./tools/execute-plan-helpers.js";

// 1. Obtener siguiente step
const step = getNextExecutableStep(plan);

// 2. Obtener chunks para el step
const chunkResult = await getChunksForStep(step, plan, {
  maxChunksPerStep: 5,
  maxLinesPerChunk: 100,
});

// 3. Usar chunks en lugar de archivos completos
for (const chunk of chunkResult.chunks) {
  if (chunk.type === ChunkType.Summary) {
    // Chunk fusionado: usar summary
    console.log(chunk.metadata.summary);
  } else {
    // Chunk normal: usar código
    if (chunk.content) {
      // Procesar código del chunk
    }
  }
}
```

## Mejores Prácticas

### 1. Siempre Usar Chunks, No Archivos Completos

❌ **Evitar:**
```typescript
const entireFile = await readFile("src/server/mcp-server.ts");
```

✅ **Preferir:**
```typescript
const chunks = await getChunksForStep(step, plan);
// Usar solo los chunks relevantes
```

### 2. Respetar Límites

Configurar límites apropiados según el contexto:

```typescript
// Para steps de clarificación: menos chunks, más resúmenes
const clarifyChunks = await getChunksForStep(step, plan, {
  maxChunksPerStep: 3,
  maxLinesPerChunk: 50,
});

// Para steps de edición: más chunks, código completo
const editChunks = await getChunksForStep(step, plan, {
  maxChunksPerStep: 5,
  maxLinesPerChunk: 100,
  includeContent: true,
});
```

### 3. Manejar Chunks Fusionados

Cuando un chunk tiene `type: ChunkType.Summary`, usar el summary en lugar de código:

```typescript
for (const chunk of chunks) {
  if (chunk.type === ChunkType.Summary) {
    // Chunk fusionado: usar summary
    console.log(`Summary: ${chunk.metadata.summary}`);
    // Si se necesita código, obtener chunks originales de metadata.mergedFrom
  } else {
    // Chunk normal: usar código
    if (chunk.content) {
      processCode(chunk.content);
    }
  }
}
```

### 4. Usar Información Semántica

Preferir chunking por símbolo sobre chunking por líneas:

```typescript
// ✅ Mejor: chunking por símbolo (semántico)
const symbolChunks = await chunkBySymbol(scopeResolution);

// ⚠️ Menos ideal: chunking por líneas (no semántico)
const lineChunks = chunkByFileRange(filePath, 1, 500);
```

### 5. Ajustar Límites Según Necesidad

```typescript
// Código pequeño: límites más altos
const smallCodeChunks = await getChunksForStep(step, plan, {
  maxChunksPerStep: 10,
  maxLinesPerChunk: 200,
});

// Código grande: límites más bajos, más dechunking
const largeCodeChunks = await getChunksForStep(step, plan, {
  maxChunksPerStep: 3,
  maxLinesPerChunk: 50,
  applyDechunking: true,
});
```

## Ejemplos de Uso

### Ejemplo 1: Chunking Básico

```typescript
import { chunkScope } from "./tools/code-chunking.js";
import { translateScopeSelector } from "./tools/scope-resolver.js";

const scope = plan.scopes[0];
const result = await chunkScope(scope, plan);

console.log(`Generated ${result.chunks.length} chunks`);
result.chunks.forEach((chunk, i) => {
  console.log(`Chunk ${i + 1}: ${chunk.metadata.summary}`);
  console.log(`  Lines: ${chunk.startLine}-${chunk.endLine}`);
  console.log(`  Type: ${chunk.type}`);
});
```

### Ejemplo 2: Chunking con Límites Personalizados

```typescript
const result = await getChunksForStep(step, plan, {
  maxChunksPerStep: 3,
  maxLinesPerChunk: 50,
  applyDechunking: true,
});

if (result.warnings.length > 0) {
  console.log("Warnings:", result.warnings);
}

console.log(`Stats:`, result.stats);
```

### Ejemplo 3: Procesar Chunks

```typescript
const result = await getChunksForStep(step, plan);

for (const chunk of result.chunks) {
  switch (chunk.type) {
    case ChunkType.Symbol:
      // Procesar símbolo completo
      processSymbol(chunk);
      break;
    case ChunkType.SubSymbol:
      // Procesar sub-chunk
      processSubChunk(chunk);
      break;
    case ChunkType.Summary:
      // Usar summary, no código
      useSummary(chunk.metadata.summary);
      break;
    case ChunkType.FileRange:
      // Procesar rango de líneas
      processFileRange(chunk);
      break;
  }
}
```

## Estadísticas y Warnings

### ChunkingResult.stats

```typescript
{
  totalChunks: number;        // Total chunks creados
  chunksMerged: number;       // Chunks fusionados (dechunking)
  totalLines: number;         // Total líneas chunked
  estimatedTokens: number;    // Tokens estimados
}
```

### Warnings

El sistema genera warnings cuando:
- No hay información de símbolos disponible
- Chunks exceden límites y se fusionan
- Scope no se puede resolver completamente

```typescript
if (result.warnings.length > 0) {
  console.warn("Chunking warnings:", result.warnings);
}
```

## Integración Futura con Serena

Actualmente, el chunking usa placeholders para integración con Serena MCP. La integración futura incluirá:

1. **Obtener símbolos reales** via `serena.get_symbols_overview`
2. **Información LSP precisa** (startLine, endLine, kind)
3. **Lectura de código** via `serena.find_symbol` con `include_body: true`
4. **Búsqueda semántica** para scopes de tipo "module"

## Notas de Implementación

- El chunking es **determinista**: mismo scope → mismos chunks
- Los límites se **respetan estrictamente**
- El dechunking **preserva información importante** en summaries
- Los sub-chunks **respetan boundaries lógicos** (if/for/switch)
- La estimación de tokens es **aproximada** (~4 chars por token)

## Próximos Pasos

1. **Integración real con Serena**: Obtener símbolos reales via MCP
2. **Mejora de detección de bloques**: Usar AST parsing en lugar de regex
3. **Modelo H-Net opcional**: Servidor que sugiere boundaries de chunk
4. **Caché de chunks**: Evitar re-chunking del mismo scope

