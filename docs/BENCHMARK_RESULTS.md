# Resultados de Benchmark: Análisis de Reducción de Tokens

## Resumen

Este documento contiene los resultados de experimentos de benchmark comparando ejecuciones Baseline (sin planner/TOON/Serena) vs Experimental (con planner/TOON/Serena).

**Fecha**: [Fecha de ejecución del benchmark]  
**Versión de Cursor**: [Versión usada]  
**Modelo**: [Modelo LLM usado]  
**Versión de Itok**: [Versión del servidor MCP Itok]

## Resumen

| Métrica | Valor |
|--------|-------|
| Total de Benchmarks | [Número] |
| Reducción Promedio de Tokens | [Porcentaje]% |
| Reducción Mínima de Tokens | [Porcentaje]% |
| Reducción Máxima de Tokens | [Porcentaje]% |
| Benchmarks Cumpliendo Criterios (≥30%) | [Conteo]/[Total] ([Porcentaje]%) |

## Resultados por Tipo de Tarea

### Tareas Bugfix

| Escenario | Tokens Baseline | Tokens Experimental | Reducción % | Cumple Criterios |
|----------|-----------------|---------------------|-------------|------------------|
| [Nombre del Escenario] | [Número] | [Número] | [Porcentaje]% | ✓/✗ |

**Reducción Promedio**: [Porcentaje]%  
**Observaciones**: [Observaciones clave sobre tareas bugfix]

### Tareas Feature

| Escenario | Tokens Baseline | Tokens Experimental | Reducción % | Cumple Criterios |
|----------|-----------------|---------------------|-------------|------------------|
| [Nombre del Escenario] | [Número] | [Número] | [Porcentaje]% | ✓/✗ |

**Reducción Promedio**: [Porcentaje]%  
**Observaciones**: [Observaciones clave sobre tareas feature]

### Tareas Refactor

| Escenario | Tokens Baseline | Tokens Experimental | Reducción % | Cumple Criterios |
|----------|-----------------|---------------------|-------------|------------------|
| [Nombre del Escenario] | [Número] | [Número] | [Porcentaje]% | ✓/✗ |

**Reducción Promedio**: [Porcentaje]%  
**Observaciones**: [Observaciones clave sobre tareas refactor]

## Resultados Detallados

### Escenario 1: [Nombre del Escenario]

**ID del Escenario**: [ID]  
**Tipo de Tarea**: [bugfix/feature/refactor]  
**Complejidad**: [baja/media/alta]

#### Ejecución Baseline

- **Hora de Inicio**: [Timestamp]
- **Hora de Fin**: [Timestamp]
- **Duración**: [Minutos] minutos
- **Tokens de Entrada**: [Número]
- **Tokens de Salida**: [Número]
- **Total de Tokens**: [Número]
- **Operaciones Clave**: [Lista de operaciones clave]

#### Ejecución Experimental

- **Hora de Inicio**: [Timestamp]
- **Hora de Fin**: [Timestamp]
- **Duración**: [Minutos] minutos
- **Tokens de Entrada**: [Número]
- **Tokens de Salida**: [Número]
- **Total de Tokens**: [Número]
- **Plan ID**: [ID]
- **Pasos Ejecutados**: [Número]
- **Chunks Usados**: [Número]
- **Operaciones Clave**: [Lista de operaciones clave]

#### Comparación

- **Reducción de Tokens**: [Porcentaje]% ([Absoluto] tokens)
- **Diferencia de Tiempo**: [Minutos] minutos
- **Cumple Criterios de Éxito (≥30%)**: ✓/✗

#### Análisis

**Observaciones**:
- [Observación 1]
- [Observación 2]
- [Observación 3]

**Recomendaciones**:
- [Recomendación 1]
- [Recomendación 2]
- [Recomendación 3]

---

### Escenario 2: [Nombre del Escenario]

[Repetir estructura para cada escenario]

---

## Análisis Estadístico

### Estadísticas Generales

- **Reducción Media**: [Porcentaje]% ± [Desviación Estándar]%
- **Reducción Mediana**: [Porcentaje]%
- **Rango**: [Mín]% a [Máx]%

### Por Tipo de Tarea

| Tipo de Tarea | Reducción Media | Reducción Mediana | Tamaño de Muestra |
|---------------|----------------|-------------------|-------------------|
| Bugfix | [Porcentaje]% | [Porcentaje]% | [Número] |
| Feature | [Porcentaje]% | [Porcentaje]% | [Número] |
| Refactor | [Porcentaje]% | [Porcentaje]% | [Número] |

### Tasa de Éxito

- **General**: [Porcentaje]% de benchmarks cumplen criterios de reducción ≥30%
- **Por Tipo de Tarea**:
  - Bugfix: [Porcentaje]%
  - Feature: [Porcentaje]%
  - Refactor: [Porcentaje]%

## Ajustes de Parámetros

### Configuración Inicial

- `targetMaxPhases`: [Número]
- `targetMaxSteps`: [Número]
- `maxMicroStepsPerPhase`: [Número]
- `maxChunksPerStep`: [Número]

### Ajustes Realizados

| Iteración | Cambios | Resultado |
|-----------|---------|-----------|
| 1 | [Descripción] | [Resultado] |
| 2 | [Descripción] | [Resultado] |

### Configuración Final

- `targetMaxPhases`: [Número]
- `targetMaxSteps`: [Número]
- `maxMicroStepsPerPhase`: [Número]
- `maxChunksPerStep`: [Número]

## Conclusiones

### Hallazgos Primarios

1. **[Hallazgo 1]**: [Descripción]
2. **[Hallazgo 2]**: [Descripción]
3. **[Hallazgo 3]**: [Descripción]

### Evaluación de Criterios de Éxito

- **Objetivo Primario (≥30% reducción promedio)**: [Logrado/No Logrado]
  - Actual: [Porcentaje]%
  - Brecha: [Porcentaje]% (si no se logró)

- **Objetivo Secundario (mantener calidad)**: [Logrado/No Logrado]
  - Evaluación: [Descripción]

- **Objetivo Terciario (tiempo razonable)**: [Logrado/No Logrado]
  - Evaluación: [Descripción]

### Recomendaciones

1. **[Recomendación 1]**: [Descripción]
2. **[Recomendación 2]**: [Descripción]
3. **[Recomendación 3]**: [Descripción]

### Trabajo Futuro

- [Item de trabajo futuro 1]
- [Item de trabajo futuro 2]
- [Item de trabajo futuro 3]

## Apéndice

### Datos Crudos

[Enlace a exportación JSON o datos embebidos]

### Logs de Ejecución

[Enlaces a logs detallados de ejecución si están disponibles]

### Archivos de Configuración

[Enlaces a archivos de configuración usados]
