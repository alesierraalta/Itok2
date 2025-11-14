# Itok - Servidor MCP para Tokenización Inteligente

**Itok** es un servidor MCP (Model Context Protocol) diseñado para optimizar el uso de tokens en IDEs con LLMs. Implementa un sistema de planificación de tareas jerárquico inspirado en HRM (Hierarchical Reasoning Model) y chunking dinámico inspirado en H-Net, ayudando a los desarrolladores a reducir el consumo de tokens mientras mantienen la calidad del código.

## Resumen

Itok proporciona capacidades inteligentes de planificación de tareas y chunking de código que minimizan el uso de tokens en Cursor IDE. En lugar de leer archivos completos o grandes secciones de código, Itok:

- **Genera planes jerárquicos** que dividen tareas en pasos manejables
- **Valida y comprime planes** para reducir complejidad
- **Chunkea código semánticamente** para leer solo lo necesario
- **Ejecuta planes paso a paso** usando chunks de código optimizados

Este enfoque puede reducir el uso de tokens en **≥30%** comparado con métodos tradicionales, según validación a través de experimentos de benchmark.

## Arquitectura

Itok está construido sobre tres conceptos clave de investigación reciente:

### HRM (Hierarchical Reasoning Model)

HRM separa el razonamiento en dos niveles:
- **H (Alto Nivel)**: Planificación abstracta y estrategia
- **L (Bajo Nivel)**: Ejecución detallada e implementación

**En Itok:**
- **Nivel H**: La estructura `TaskPlan` con fases, scopes y pasos de alto nivel
- **Nivel L**: Ejecución de pasos individuales usando chunks semánticos de código

Esta separación permite al sistema planificar a alto nivel mientras ejecuta eficientemente a bajo nivel, minimizando la expansión innecesaria de contexto.

### H-Net (Dynamic Chunking)

H-Net proporciona segmentación dinámica de código:
- **Chunking**: Divide código en unidades semánticas (símbolos, funciones, clases)
- **Dechunking**: Fusiona chunks cuando se exceden límites, creando resúmenes

**En Itok:**
- El código se chunkea por símbolos (vía Serena LSP) o rangos de archivo
- Símbolos grandes se sub-chunkean por bloques lógicos
- Los chunks se fusionan (dechunkean) cuando se exceden límites
- Esto asegura que solo se lea código relevante, reduciendo tokens

### TOON (Token-Oriented Object Notation)

TOON es un formato compacto optimizado para consumo por LLMs:
- Representación tabular en lugar de JSON verboso
- Tokens mínimos preservando información
- Estructura legible por humanos

**En Itok:**
- Los planes se convierten a formato TOON para transmisión eficiente
- Reduce sobrecarga de tokens en comunicación de planes

### Cómo Trabajan Juntos

```
Objetivo del Usuario
    ↓
[HRM-H] Generar TaskPlan (fases abstractas)
    ↓
[HRM-H] Validar y Comprimir Plan (estilo H-Net)
    ↓
[HRM-L] Ejecutar Pasos (usando chunks H-Net)
    ↓
[TOON]  Representación eficiente en todo momento
```

**Referencias:**
- HRM: [Hierarchical Reasoning Model (arXiv:2506.21734)](https://arxiv.org/abs/2506.21734)
- H-Net: [Dynamic Chunking (arXiv:2507.07955)](https://arxiv.org/abs/2507.07955)
- TOON: [Token-Oriented Object Notation](https://github.com/toon-format/toon)

## Instalación

### Prerrequisitos

- **Node.js** 18 o superior
- **npm** o **yarn**
- **Cursor IDE** (para integración MCP)

### Configuración

1. **Clonar o navegar al directorio del proyecto:**
   ```bash
   cd itok
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Compilar el proyecto:**
   ```bash
   npm run build
   ```

4. **Verificar instalación:**
   ```bash
   npm start
   ```
   El servidor debería iniciar en el puerto 3000 (o el puerto especificado en la variable de entorno `PORT`).

## Configuración en Cursor IDE

### Paso 1: Localizar Configuración MCP de Cursor

El archivo de configuración MCP típicamente se encuentra en:
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`

O editar directamente: `C:\Users\<username>\.cursor\mcp.json`

### Paso 2: Elegir Método de Transporte

Itok soporta dos métodos de transporte:

#### Opción A: Transporte HTTP (Recomendado para Desarrollo)

```json
{
  "mcpServers": {
    "itok": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

**Ventajas:**
- Fácil depuración
- Puede inspeccionar peticiones HTTP
- No necesita reiniciar Cursor cuando el servidor se reinicia

**Configuración:**
1. Iniciar el servidor: `npm start` o `npm run dev`
2. Agregar la configuración anterior a la configuración MCP de Cursor
3. Reiniciar Cursor

#### Opción B: Transporte Stdio (Recomendado para Producción)

```json
{
  "mcpServers": {
    "itok": {
      "command": "node",
      "args": ["C:\\ruta\\a\\itok\\build\\server\\index.js"],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

**Ventajas:**
- Más eficiente
- No necesita mantener el servidor corriendo por separado
- Mejor para uso en producción

**Configuración:**
1. Compilar el proyecto: `npm run build`
2. Usar la ruta absoluta a `build/server/index.js` en la configuración
3. Reiniciar Cursor

### Paso 3: Verificar Conexión

1. **Abrir Cursor Composer Agent** (o interfaz de chat)
2. **Probar con herramienta ping:**
   ```
   Usa la herramienta itok::ping para verificar si el servidor está conectado.
   ```
3. **Deberías ver:**
   ```json
   {
     "pong": true,
     "timestamp": "2024-01-01T12:00:00.000Z"
   }
   ```

## Herramientas MCP Disponibles

Itok proporciona 7 herramientas MCP para planificación de tareas y chunking de código:

### 1. `ping`

Herramienta de health check para verificar conectividad del servidor.

**Entrada:** Ninguna (objeto vacío)

**Salida:**
```json
{
  "pong": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Ejemplo:**
```
Usa itok::ping para verificar el estado del servidor.
```

---

### 2. `echo`

Eco de vuelta un mensaje para probar comunicación.

**Entrada:**
```json
{
  "message": "Hola, Itok!"
}
```

**Salida:**
```json
{
  "echo": "Hola, Itok!"
}
```

**Ejemplo:**
```
Usa itok::echo con mensaje "Probando conexión".
```

---

### 3. `create_sample_plan`

Crea un TaskPlan de ejemplo para pruebas y demostración.

**Entrada:**
```json
{
  "goal": "Corregir excepción de puntero nulo",
  "taskKind": "bugfix"  // Opcional: "bugfix" | "feature" | "refactor" | "other"
}
```

**Salida:** Un TaskPlan JSON completo con fases, scopes y pasos.

**Ejemplo:**
```
Usa itok::create_sample_plan con goal "Agregar autenticación de usuario" y taskKind "feature".
```

---

### 4. `plan_task`

Genera un TaskPlan jerárquico basado en un objetivo. Usa planificación determinista basada en reglas inspirada en HRM.

**Entrada:**
```json
{
  "goal": "Corregir excepción de puntero nulo en función calculatePrice",
  "context": "El error ocurre cuando discount es null",  // Opcional
  "taskKind": "bugfix",  // Opcional: se infiere del goal si no se proporciona
  "maxPhases": 3,  // Opcional: por defecto 3
  "maxSteps": 10  // Opcional: por defecto ilimitado
}
```

**Salida:**
- TaskPlan completo con fases, scopes y pasos
- Representación TOON-friendly (formato compacto)
- Plan organizado por niveles HRM (Abstract, Planning, Execution)

**Ejemplo:**
```
Usa itok::plan_task con goal "Agregar autenticación JWT" y context "Necesito integrar con base de datos de usuarios existente".
```

**Inferencia de TaskKind:**
- **bugfix**: Contiene "bugfix", "fix", "bug", "error", "issue"
- **feature**: Contiene "add", "implement", "create", "feature", "new"
- **refactor**: Contiene "refactor", "restructure", "redesign", "improve"
- **other**: Por defecto si no hay palabras clave que coincidan

---

### 5. `validate_plan`

Valida y comprime un TaskPlan usando chunking dinámico estilo H-Net. Valida niveles HRM, corrige scopes, aplica compresión fusionando pasos, y aplica límites globales.

**Entrada:**
```json
{
  "plan": { /* Objeto TaskPlan */ },
  "targetMaxPhases": 5,  // Opcional: máximo de fases a mantener
  "targetMaxSteps": 15,  // Opcional: máximo de pasos por fase
  "maxMicroStepsPerPhase": 2  // Opcional: micro-pasos antes de chunking
}
```

**Salida:**
- TaskPlan optimizado
- Advertencias y cambios aplicados
- Estadísticas (fases/pasos antes/después, chunks creados, etc.)
- Representación TOON comprimida

**Ejemplo:**
```
Usa itok::validate_plan con el plan de plan_task, estableciendo targetMaxPhases a 3 y targetMaxSteps a 10.
```

---

### 6. `execute_step`

Ejecuta un paso de un TaskPlan. Encuentra el siguiente paso ejecutable (o usa el stepId proporcionado), lo marca como in_progress, resuelve el scope, obtiene acciones Serena, y actualiza el estado del plan.

**Entrada:**
```json
{
  "plan": { /* Objeto TaskPlan */ },
  "stepId": "step-123",  // Opcional: si no se proporciona, ejecuta el siguiente paso ejecutable
  "simulate": true  // Opcional: por defecto true (simula sin llamar a Serena)
}
```

**Salida:**
- Resultado de ejecución (éxito/fallo)
- TaskPlan actualizado con estado del paso
- Siguientes pasos a ejecutar
- Resolución de scope y acciones Serena

**Ejemplo:**
```
Usa itok::execute_step con el plan validado. Establece simulate a false para ejecutar realmente (requiere Serena MCP).
```

**Nota:** Por defecto, `simulate=true` por seguridad. Establece `simulate=false` solo cuando quieras llamar realmente a las herramientas Serena MCP.

---

### 7. `get_chunks`

Obtiene chunks de código para un scope o paso usando chunking semántico inspirado en H-Net. Divide archivos y símbolos en chunks optimizados para uso de tokens.

**Entrada:**
```json
{
  "scope": { /* Objeto PlanScope */ },  // Requerido si step no se proporciona
  "step": { /* Objeto PlanStep */ },  // Requerido si scope no se proporciona
  "plan": { /* Objeto TaskPlan */ },  // Requerido si se usa step
  "options": {  // Opciones opcionales de chunking
    "maxChunksPerStep": 5,
    "maxLinesPerChunk": 100,
    "maxTokensPerChunk": 2000,
    "includeContent": true,
    "applyDechunking": true
  }
}
```

**Salida:**
- Array de objetos CodeChunk
- Estadísticas (total de chunks, chunks fusionados, líneas totales, tokens estimados)
- Advertencias (si las hay)

**Ejemplo:**
```
Usa itok::get_chunks con un paso del plan para obtener chunks de código para ese paso.
```

**Tipos de Chunks:**
- **Symbol**: Símbolo completo (función, clase, método)
- **SubSymbol**: Sub-chunk dentro de un símbolo grande (bloque lógico)
- **FileRange**: Rango de líneas de un archivo
- **Summary**: Resumen de chunks fusionados (dechunking)

---

## Workflows Recomendados

### Workflow 1: Bugfix Simple

**Paso 1: Generar Plan**
```
Usa itok::plan_task con goal "Corregir excepción de puntero nulo en calculatePrice cuando discount es null".
```

**Paso 2: Validar Plan**
```
Usa itok::validate_plan con el plan generado, estableciendo targetMaxSteps a 8.
```

**Paso 3: Ejecutar Pasos**
```
Para cada paso en el plan:
1. Usa itok::get_chunks con el paso para obtener chunks de código
2. Usa itok::execute_step con simulate=false para ejecutar
3. Revisa el plan actualizado y continúa con el siguiente paso
```

**Paso 4: Completar**
```
Cuando todos los pasos estén hechos, el plan mostrará 100% de completitud.
```

---

### Workflow 2: Feature Mediana

**Paso 1: Generar Plan**
```
Usa itok::plan_task con goal "Agregar autenticación de usuario con tokens JWT" y context "Integrar con base de datos de usuarios existente".
```

**Paso 2: Validar y Comprimir**
```
Usa itok::validate_plan con targetMaxPhases=4 y targetMaxSteps=12 para mantener el plan manejable.
```

**Paso 3: Ejecutar con Chunking**
```
Para cada paso:
1. Obtener chunks: itok::get_chunks con el paso
2. Revisar chunks para entender qué código está involucrado
3. Ejecutar: itok::execute_step con simulate=false
4. Usar herramientas Serena MCP (vía Cursor) para leer/editar código basado en chunks
```

**Paso 4: Iterar**
```
Si el plan necesita ajustes, regenerar o actualizar manualmente el plan y continuar.
```

---

### Workflow 3: Refactor Estructural

**Paso 1: Generar Plan Comprehensivo**
```
Usa itok::plan_task con goal "Refactorizar capa de base de datos para usar patrón Repository" y taskKind "refactor".
```

**Paso 2: Validar Agresivamente**
```
Usa itok::validate_plan con targetMaxPhases=3 y targetMaxSteps=10 para mantener el plan enfocado.
```

**Paso 3: Ejecutar con Chunking Cuidadoso**
```
Para cada paso:
1. Obtener chunks con límites conservadores (maxChunksPerStep=3)
2. Revisar chunks para entender el alcance
3. Ejecutar paso a paso, asegurando que los tests pasen después de cada paso
```

**Paso 4: Validar Continuamente**
```
Después de pasos mayores, re-validar el plan para asegurar que sigue en curso.
```

---

## Guías Detalladas

Para información más profunda, consulta:

- **[Guía de Orquestación](docs/ORCHESTRATION_GUIDE.md)**: Guía completa sobre ejecución de TaskPlans paso a paso
- **[Guía de Chunking](docs/CHUNKING_GUIDE.md)**: Explicación detallada de chunking de código inspirado en H-Net
- **[Protocolo de Benchmark](docs/BENCHMARK_PROTOCOL.md)**: Cómo validar reducción de tokens mediante benchmarks
- **[Notas Técnicas](docs/TECHNICAL_NOTES.md)**: Limitaciones actuales y roadmap futuro

## Estructura del Proyecto

```
itok/
├── src/
│   ├── config/
│   │   └── constants.ts          # Constantes del servidor
│   ├── server/
│   │   ├── index.ts              # Punto de entrada principal
│   │   └── mcp-server.ts         # Configuración del servidor MCP
│   ├── tools/
│   │   ├── ping.ts               # Herramienta ping
│   │   ├── echo.ts               # Herramienta echo
│   │   ├── create-sample-plan.ts # Creador de plan de ejemplo
│   │   ├── plan-task.ts          # Generación de planes
│   │   ├── validate-plan.ts      # Validación y compresión de planes
│   │   ├── execute-step.ts       # Ejecución de pasos
│   │   ├── get-chunks.ts         # Chunking de código
│   │   └── ...                   # Módulos helper
│   ├── types/
│   │   ├── index.ts              # Definiciones de tipos
│   │   └── schemas.ts            # Schemas de validación Zod
│   ├── scenarios/                # Escenarios de benchmark
│   └── test-*.ts                 # Scripts de prueba
├── docs/
│   ├── ORCHESTRATION_GUIDE.md    # Guía de ejecución
│   ├── CHUNKING_GUIDE.md         # Guía de chunking
│   ├── BENCHMARK_PROTOCOL.md     # Protocolo de benchmark
│   ├── BENCHMARK_RESULTS.md      # Template de resultados de benchmark
│   └── TECHNICAL_NOTES.md        # Notas técnicas
├── build/                        # JavaScript compilado
├── package.json
├── tsconfig.json
└── README.md
```

## Desarrollo

### Ejecutar el Servidor

**Modo desarrollo** (con auto-reload):
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

**Puerto personalizado:**
```bash
PORT=8080 npm start
```

### Scripts Disponibles

- `npm run build` - Compilar TypeScript a JavaScript
- `npm start` - Ejecutar el servidor compilado
- `npm run dev` - Ejecutar en modo desarrollo con watch
- `npm run clean` - Eliminar el directorio `build/`

### Testing

Ejecutar scripts de prueba para verificar funcionalidad:

```bash
npm run build
node build/test-types-schemas.js    # Probar tipos y schemas
node build/test-plan-task.js        # Probar generación de planes
node build/test-validate-plan.js   # Probar validación de planes
node build/test-plan-execution.js   # Probar ejecución de planes
node build/test-code-chunking.js    # Probar chunking de código
node build/test-benchmark.js        # Probar herramientas de benchmark
```

## Solución de Problemas

### El servidor no inicia

- **Verificar puerto**: Asegurar que el puerto 3000 (o tu puerto configurado) no esté en uso
- **Verificar dependencias**: Ejecutar `npm install` para asegurar que todas las dependencias estén instaladas
- **Verificar build**: Ejecutar `npm run build` y verificar que no haya errores de compilación
- **Revisar logs**: Revisar logs del servidor para mensajes de error

### Cursor no puede conectar al servidor

- **Servidor corriendo**: Asegurar que el servidor esté corriendo (`npm start` o `npm run dev`)
- **Configuración coincide**: Verificar que la URL/comando en la configuración MCP de Cursor coincida con tu setup
- **Transporte HTTP**: Para HTTP, probar el endpoint: `curl http://localhost:3000/health`
- **Transporte Stdio**: Para stdio, verificar que la ruta a `build/server/index.js` sea correcta
- **Reiniciar Cursor**: Reiniciar Cursor después de agregar/cambiar configuración MCP

### Las herramientas no aparecen en Cursor

- **Reiniciar Cursor**: Reiniciar Cursor después de agregar la configuración MCP
- **Probar conexión**: Usar herramienta `itok::ping` para verificar que el servidor responda
- **Verificar registro**: Verificar que el servidor MCP esté correctamente registrado en la configuración de Cursor
- **Revisar logs**: Revisar logs de Cursor para errores de conexión MCP

### Problemas de generación de planes

- **Goal muy vago**: Proporcionar objetivos más específicos con contexto
- **TaskKind no inferido**: Proporcionar explícitamente el parámetro `taskKind`
- **Plan muy grande**: Usar `maxPhases` y `maxSteps` para limitar el tamaño del plan
- **Errores de validación**: Verificar que la estructura del plan coincida con el formato esperado

### Problemas de chunking

- **No se retornan chunks**: Verificar que el scope/paso tenga rutas de archivo válidas
- **Chunks muy grandes**: Ajustar opciones `maxLinesPerChunk` o `maxTokensPerChunk`
- **Demasiados chunks**: Usar `maxChunksPerStep` para limitar, o habilitar `applyDechunking`

### Problemas de ejecución

- **Paso no ejecutable**: Verificar que las dependencias del paso estén completadas
- **Modo simulación**: Recordar que `execute_step` por defecto usa `simulate=true`
- **Integración Serena**: La ejecución real requiere que Serena MCP esté configurado
- **Resolución de scope**: Verificar que los selectores de scope sean válidos

## Limitaciones y Trabajo Futuro

Ver [Notas Técnicas](docs/TECHNICAL_NOTES.md) para información detallada sobre:
- Limitaciones actuales (simulación Serena, TOON básico, chunking heurístico)
- Roadmap futuro (integración modelo H-Net, más MCPs, feedback de calidad)

## Licencia

MIT

## Contribuir

Este es un proyecto de investigación. Para preguntas o contribuciones, por favor consulta la documentación del proyecto o abre un issue.

## Referencias

- **Paper HRM**: [Hierarchical Reasoning Model (arXiv:2506.21734)](https://arxiv.org/abs/2506.21734)
- **Paper H-Net**: [Dynamic Chunking (arXiv:2507.07955)](https://arxiv.org/abs/2507.07955)
- **Formato TOON**: [Token-Oriented Object Notation](https://github.com/toon-format/toon)
- **Serena MCP**: [Serena Coding Agent Toolkit](https://github.com/oraios/serena)
- **Especificación MCP**: [Model Context Protocol](https://modelcontextprotocol.io)
