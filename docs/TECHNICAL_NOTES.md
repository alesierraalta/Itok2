# Notas Técnicas: Servidor MCP Itok

Este documento describe las limitaciones actuales, decisiones de diseño, trade-offs y roadmap futuro para el servidor MCP Itok.

## Limitaciones Actuales

### 1. Integración Serena MCP (Simulada)

**Estado:** Implementación placeholder

**Estado Actual:**
- La herramienta `execute_step` simula acciones Serena pero no llama realmente a Serena MCP
- `chunkBySymbol` usa datos placeholder en lugar de información real de símbolos de Serena LSP
- `scope-resolver` no resuelve realmente scopes usando herramientas Serena
- `serena-mapper` genera descripciones de acciones pero no las ejecuta

**Impacto:**
- Los planes pueden generarse y validarse, pero la ejecución real de código requiere intervención manual
- El chunking por símbolo está limitado a escenarios simulados
- La navegación semántica real de código no está disponible

**Solución Alternativa:**
- Usar `simulate=true` en `execute_step` para ver qué se ejecutaría
- Usar manualmente herramientas Serena MCP (vía Cursor) basándose en las acciones sugeridas
- Usar chunking basado en archivos (`chunkByFileRange`) en lugar de chunking basado en símbolos

**Ubicaciones de Código:**
- `src/tools/execute-step.ts` (líneas 115-126)
- `src/tools/code-chunking.ts` (líneas 136-152)
- `src/tools/scope-resolver.ts` (líneas 113-129)
- `src/tools/serena-mapper.ts` (líneas 201-206)

---

### 2. Formato TOON (Implementación Básica)

**Estado:** Implementación personalizada, no usa librería oficial

**Estado Actual:**
- `toToonFriendly()` crea una representación tabular manualmente
- No usa la librería oficial `@toon-format/toon`
- El formato está simplificado y puede no coincidir exactamente con la especificación oficial TOON

**Impacto:**
- La representación TOON es funcional pero puede no estar completamente optimizada
- Puede necesitar actualizaciones si la especificación oficial TOON cambia
- No es compatible con otras herramientas/librerías TOON

**Solución Alternativa:**
- La implementación actual es suficiente para reducción de tokens
- Puede reemplazarse con la librería oficial cuando esté disponible

**Ubicaciones de Código:**
- `src/tools/plan-task.ts` (líneas 427-480)

**Futuro:**
- Integrar librería `@toon-format/toon` cuando esté disponible
- Asegurar compatibilidad con la especificación oficial TOON

---

### 3. Chunking H-Net (Basado en Heurísticas)

**Estado:** Implementación heurística, no usa modelo H-Net real

**Estado Actual:**
- El chunking usa heurísticas basadas en reglas (límites de símbolos, bloques lógicos, rangos de líneas)
- No usa un modelo H-Net entrenado para sugerir límites de chunks
- El dechunking está basado en reglas (fusiona cuando se exceden límites)

**Impacto:**
- Los límites de chunks pueden no ser óptimos para todos los codebases
- Puede no adaptarse tan bien a diferentes estilos de codificación
- Menos inteligente que un modelo aprendido

**Solución Alternativa:**
- Las heurísticas funcionan bien para la mayoría de casos comunes
- Se pueden ajustar manualmente las opciones de chunking
- El chunking basado en archivos proporciona fallback

**Ubicaciones de Código:**
- `src/tools/code-chunking.ts` (archivo completo)
- `src/tools/chunking-helpers.ts` (detección de bloques, estimación de tokens)

**Futuro:**
- Integrar servidor de modelo H-Net para límites de chunks aprendidos
- Usar modelo para sugerir tamaños y límites óptimos de chunks
- Chunking adaptativo basado en estructura de código

---

### 4. Ejecución de Pasos (Modo Simulación por Defecto)

**Estado:** Ejecución real no implementada

**Estado Actual:**
- `execute_step` por defecto usa `simulate=true`
- El modo de ejecución real (`simulate=false`) es un placeholder
- No llama realmente a herramientas Serena MCP

**Impacto:**
- Los planes deben ejecutarse manualmente
- No se puede automatizar completamente la ejecución de tareas
- Requiere que el usuario interprete las acciones sugeridas

**Solución Alternativa:**
- Usar modo simulación para entender qué se ejecutaría
- Ejecutar manualmente acciones usando herramientas Cursor/Serena
- Revisar acciones sugeridas antes de implementar

**Ubicaciones de Código:**
- `src/tools/execute-step.ts` (líneas 105-132)

---

### 5. Chunking de Código (Basado en Heurísticas, Sin AST Completo)

**Estado:** Detección de bloques basada en regex, no parsing AST completo

**Estado Actual:**
- `detectLogicalBlocks()` usa patrones regex para encontrar bloques if/for/while/switch
- No usa un parser AST completo (ej., TypeScript compiler API)
- La estimación de tokens es aproximada (~4 caracteres por token)

**Impacto:**
- La detección de bloques puede perder casos límite
- La estimación de tokens puede ser inexacta para algún código
- Puede no manejar correctamente todas las construcciones del lenguaje

**Solución Alternativa:**
- Las heurísticas cubren la mayoría de casos comunes
- Se pueden especificar manualmente límites de chunks
- La estimación de tokens es "suficientemente buena" para la mayoría de propósitos

**Ubicaciones de Código:**
- `src/tools/chunking-helpers.ts` (líneas 8-85)
- `src/tools/chunking-helpers.ts` (líneas 122-127 para estimación de tokens)

**Futuro:**
- Usar TypeScript compiler API para parsing AST preciso
- Conteo de tokens más preciso (ej., usando tiktoken o similar)
- Mejor manejo de construcciones complejas del lenguaje

---

### 6. Generación de Planes (Reglas Deterministas)

**Estado:** Basado en reglas, no aprendido

**Estado Actual:**
- `plan_task` usa reglas deterministas para generar planes
- La inferencia de TaskKind usa coincidencia de palabras clave
- La generación de fases y pasos sigue patrones fijos

**Impacto:**
- Los planes pueden no ser óptimos para todos los escenarios
- No puede aprender de planes exitosos pasados
- Puede generar planes que no coincidan con las expectativas del usuario

**Solución Alternativa:**
- Las reglas funcionan bien para tipos de tareas comunes
- Se pueden ajustar manualmente planes después de la generación
- Se puede proporcionar explícitamente `taskKind` para guiar la generación

**Ubicaciones de Código:**
- `src/tools/plan-task.ts` (archivo completo)
- `src/tools/plan-task-helpers.ts` (reglas y mapeos)

**Futuro:**
- Aprender de planes exitosos
- Generación de planes adaptativa basada en patrones del codebase
- Integración de feedback del usuario

---

## Decisiones de Diseño

### ¿Por Qué Modo Simulación por Defecto?

**Decisión:** `execute_step` por defecto usa `simulate=true`

**Razonamiento:**
- Seguridad: Previene modificaciones accidentales de código
- Transparencia: Muestra qué se ejecutaría antes de hacerlo
- Aprendizaje: Ayuda a los usuarios a entender el sistema antes de usar ejecución real

**Trade-off:**
- Requiere ejecución manual, pero proporciona seguridad y control

---

### ¿Por Qué Chunking Heurístico en Lugar de Modelo?

**Decisión:** Usar chunking basado en reglas en lugar de modelo H-Net

**Razonamiento:**
- Sin dependencia de servidor de modelo externo
- Funciona inmediatamente sin datos de entrenamiento
- Determinista y predecible
- Suficientemente bueno para la mayoría de casos de uso

**Trade-off:**
- Menos óptimo que modelo aprendido, pero más práctico y confiable

---

### ¿Por Qué TOON Personalizado en Lugar de Librería?

**Decisión:** Implementar formato TOON manualmente en lugar de usar `@toon-format/toon`

**Razonamiento:**
- La librería no estaba disponible en el momento de implementación
- La implementación personalizada es suficiente para necesidades actuales
- Puede reemplazarse con librería oficial más tarde

**Trade-off:**
- Puede no coincidir exactamente con la especificación oficial, pero funciona para optimización de tokens

---

### ¿Por Qué Herramientas Separadas en Lugar de Monolítico?

**Decisión:** Herramientas MCP separadas (`plan_task`, `validate_plan`, `execute_step`, `get_chunks`)

**Razonamiento:**
- Modularidad: Cada herramienta tiene una sola responsabilidad
- Flexibilidad: Se pueden usar herramientas independientemente
- Testabilidad: Más fácil probar componentes individuales
- Composabilidad: Se pueden construir workflows personalizados

**Trade-off:**
- Más llamadas a herramientas, pero mejor separación de responsabilidades

---

## Roadmap Futuro

### Prioridad Alta

#### 1. Integración Real Serena MCP

**Objetivo:** Llamar realmente a herramientas Serena MCP en lugar de simular

**Implementación:**
- Integrar con servidor Serena MCP
- Llamar `serena.get_symbols_overview`, `serena.find_symbol`, etc.
- Ejecutar acciones retornadas por `serena-mapper`
- Manejar errores y reintentos

**Beneficios:**
- Ejecución de planes completamente automatizada
- Navegación semántica real de código
- Chunking basado en símbolos preciso

**Esfuerzo Estimado:** Medio (2-3 semanas)

---

#### 2. Integración Modelo H-Net

**Objetivo:** Usar modelo H-Net entrenado para sugerencias de límites de chunks

**Implementación:**
- Configurar servidor de modelo H-Net (o usar servicio existente)
- Integrar API de modelo para predicción de límites de chunks
- Fallback a heurísticas si modelo no disponible
- Cachear predicciones del modelo

**Beneficios:**
- Límites de chunks óptimos
- Adaptativo a diferentes codebases
- Mejor optimización de tokens

**Esfuerzo Estimado:** Alto (1-2 meses, depende de disponibilidad del modelo)

---

#### 3. Chunking Basado en AST

**Objetivo:** Usar TypeScript compiler API para análisis preciso de código

**Implementación:**
- Integrar TypeScript compiler API
- Parsear código a AST
- Usar AST para detección de bloques y extracción de símbolos
- Conteo de tokens más preciso

**Beneficios:**
- Detección de bloques precisa
- Mejor manejo de construcciones complejas
- Estimación de tokens más precisa

**Esfuerzo Estimado:** Medio (2-3 semanas)

---

### Prioridad Media

#### 4. Integración Librería TOON Oficial

**Objetivo:** Usar librería `@toon-format/toon` cuando esté disponible

**Implementación:**
- Monitorear disponibilidad de librería
- Reemplazar `toToonFriendly()` personalizado con librería
- Asegurar compatibilidad con código existente
- Actualizar tests

**Beneficios:**
- Cumplimiento con formato oficial
- Mejor optimización
- Compatibilidad con otras herramientas TOON

**Esfuerzo Estimado:** Bajo (1 semana)

---

#### 5. Caché de Chunks

**Objetivo:** Cachear resultados de chunking para evitar re-chunkeo de mismos scopes

**Implementación:**
- Cachear chunks por hash de scope
- Invalidar caché en cambios de archivo
- Tamaño de caché y TTL configurables
- Almacenamiento eficiente en memoria

**Beneficios:**
- Recuperación de chunks más rápida
- Computación reducida
- Mejor rendimiento

**Esfuerzo Estimado:** Bajo-Medio (1-2 semanas)

---

#### 6. Más Integraciones MCP

**Objetivo:** Integrar con MCPs adicionales (Supabase, Magic UI, etc.)

**Implementación:**
- Agregar soporte de cliente MCP para múltiples servidores
- Integrar Supabase para operaciones de base de datos
- Integrar Magic UI para tareas de frontend
- Interfaz unificada para herramientas MCP

**Beneficios:**
- Funcionalidad más amplia
- Soporte para más tipos de tareas
- Mejor ecosistema de herramientas

**Esfuerzo Estimado:** Medio (2-3 semanas por MCP)

---

### Prioridad Baja

#### 7. Feedback Automático de Calidad

**Objetivo:** Sistema que evalúa calidad de planes y sugiere mejoras

**Implementación:**
- Métricas para calidad de planes (completitud, eficiencia, etc.)
- Bucle de feedback de resultados de ejecución
- Sugerencias para mejora de planes
- Aprendizaje de planes exitosos

**Beneficios:**
- Mejores planes con el tiempo
- Ajuste manual reducido
- Experiencia de usuario mejorada

**Esfuerzo Estimado:** Alto (2-3 meses)

---

#### 8. Automatización de Benchmarks

**Objetivo:** Automatizar ejecución de benchmarks y recolección de resultados

**Implementación:**
- Ejecución automatizada de escenarios
- Recolección de métricas de tokens de Cursor API (si está disponible)
- Análisis estadístico
- Generación de reportes

**Beneficios:**
- Validación más fácil
- Benchmarking continuo
- Optimización basada en datos

**Esfuerzo Estimado:** Medio (2-3 semanas)

---

#### 9. Aprendizaje de Planes

**Objetivo:** Aprender de planes exitosos para mejorar generación

**Implementación:**
- Almacenar planes exitosos
- Analizar patrones
- Adaptar reglas de generación
- Integración de feedback del usuario

**Beneficios:**
- Mejores planes con el tiempo
- Adaptación al codebase
- Precisión mejorada

**Esfuerzo Estimado:** Alto (2-3 meses)

---

## Resumen de Trade-offs

| Aspecto | Enfoque Actual | Trade-off |
|--------|----------------|-----------|
| **Integración Serena** | Simulada | Seguridad vs Automatización |
| **Chunking** | Heurístico | Simplicidad vs Optimalidad |
| **TOON** | Personalizado | Independencia vs Estandarización |
| **Ejecución** | Simulación por defecto | Seguridad vs Conveniencia |
| **Arquitectura** | Herramientas modulares | Flexibilidad vs Complejidad |
| **Estimación de Tokens** | Aproximada | Velocidad vs Precisión |

## Contribuir

Al contribuir, por favor considera:
- Limitaciones actuales y soluciones alternativas
- Decisiones de diseño y su razonamiento
- Prioridades del roadmap futuro
- Compatibilidad hacia atrás

Para preguntas o sugerencias, por favor consulta el README principal o abre un issue.
