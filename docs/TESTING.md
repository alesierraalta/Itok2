# Guía de Testing

Esta guía explica cómo ejecutar los tests de validación para asegurar que el proyecto está listo para ejecutar benchmarks.

## Tests Disponibles

### 1. Test de Tipos de Proyecto (`test:project-types`)

Valida que todos los tipos TypeScript y schemas Zod para la gestión de proyectos funcionan correctamente.

**Ejecutar**:
```bash
npm run test:project-types
```

**Qué valida**:
- ✅ Enums `ProjectStatus` y `FileKind`
- ✅ Schemas Zod para `Project`, `ProjectRegistry`, `ProjectMetadata`, `FileIndexEntry`, `FileIndex`
- ✅ Validación de UUIDs, timestamps ISO 8601, y rutas absolutas
- ✅ Campos opcionales funcionan correctamente
- ✅ Rechazo de datos inválidos

**Cuándo ejecutar**: Después de cambios en `src/types/project.ts` o `src/types/project-schemas.ts`

### 2. Test de Repositorios y Escenarios (`test:repos`)

Valida que los repositorios necesarios existen y que los escenarios están correctamente configurados.

**Ejecutar**:
```bash
npm run test:repos
```

**Qué valida**:
- ✅ Directorio `repos/` existe
- ✅ Repositorio `ecommerce-app` existe y tiene estructura correcta
- ✅ Repositorio `api-starter` existe (o muestra advertencia si falta)
- ✅ Todos los escenarios están definidos (mínimo 3)
- ✅ IDs de escenarios son únicos
- ✅ Todos los escenarios tienen prompts (baseline y experimental)
- ✅ Prompts contienen la línea `REPOSITORIO:`
- ✅ Función `getScenarioById` funciona correctamente
- ✅ Todos los tipos de tarea están representados (bugfix, feature, refactor)
- ✅ Todos los escenarios tienen criterios de completitud

**Cuándo ejecutar**:
- Antes de ejecutar benchmarks
- Después de agregar nuevos escenarios
- Después de clonar nuevos repositorios
- Para verificar que todo está listo

## Ejecutar Todos los Tests

Para ejecutar todos los tests en secuencia:

```bash
npm run test:project-types && npm run test:repos
```

## Interpretación de Resultados

### Todos los Tests Pasan (✓)

```
✓ All tests passed!
```

Significa que:
- Los tipos y schemas están correctamente definidos
- Los repositorios necesarios existen
- Los escenarios están listos para usar
- Puedes proceder con los benchmarks

### Algunos Tests Fallan (✗)

```
✗ Some tests failed
```

Revisa los mensajes de error para identificar qué falta:

- **Repositorio faltante**: Clona el repositorio necesario (ver `repos/SETUP_API_STARTER.md`)
- **Escenario mal definido**: Revisa que el escenario tenga todos los campos requeridos
- **Prompt faltante**: Asegúrate de que `baselinePrompt` y `experimentalPrompt` estén definidos

### Advertencias (⚠)

Algunos tests pueden mostrar advertencias sin fallar:

- **api-starter no encontrado**: No es crítico si solo vas a ejecutar el escenario 1 (bugfix)
- **Estructura de repositorio incompleta**: El repositorio existe pero puede faltar `package.json` o `src/`

## Troubleshooting

### Error: "Cannot find module"

```bash
npm run build
```

Asegúrate de compilar el proyecto antes de ejecutar los tests.

### Error: "Repositorio no encontrado"

1. Verifica que el repositorio esté en `repos/[nombre-repo]/`
2. Verifica que el directorio tenga la estructura esperada (`src/`, `package.json`)
3. Consulta `repos/README.md` para instrucciones de clonado

### Error: "Escenario no encontrado"

1. Verifica que el escenario esté exportado en `src/scenarios/index.ts`
2. Verifica que el ID del escenario sea correcto
3. Ejecuta `npm run build` para recompilar

## Integración con CI/CD

Estos tests pueden integrarse en pipelines de CI/CD:

```yaml
# Ejemplo para GitHub Actions
- name: Run tests
  run: |
    npm install
    npm run test:project-types
    npm run test:repos
```

## Próximos Pasos

Después de que todos los tests pasen:

1. **Obtener prompts**: `npm run get-prompts [scenario-id] [baseline|experimental]`
2. **Ejecutar benchmark**: Copiar el prompt en Cursor y trabajar en el repositorio indicado
3. **Documentar resultados**: Registrar métricas en `docs/BENCHMARK_RESULTS.md`


