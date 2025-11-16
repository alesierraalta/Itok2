# Guía de pruebas del MCP de ITok (carpeta `repostest`)

Este documento es una guía para probar manualmente **el MCP de ITok** durante el desarrollo, usando repositorios de prueba clonados dentro de `repostest/`:

- `pyTodo/` – TODO list en consola (Python).
- `flask-todo/` – TODO app en Flask.

El objetivo es comparar:

- **Modo A – MCP_ITok**  
  Usando únicamente las herramientas del propio MCP de ITok:
  - gestión de proyectos (descubrir/listar/activar),
  - planificación jerárquica,
  - validación/compresión de planes,
  - lectura/edición de archivos.

vs.

- **Modo B – Baseline sin MCP de ITok**  
  Sólo razonamiento directo del modelo, sin usar herramientas del MCP de ITok.

Para cada ejecución mediremos las métricas que ofrece Cursor:

- **Input**
- **Output**
- **Cache Read**
- **Cache Write**
- **Total**
- **Cost**

---

## 1. Estructura esperada en este repo

Dentro del repositorio de ITok debe existir la carpeta `repostest` con esta estructura:

```text
itok/
  repostest/
    pyTodo/        # repositorio clonado de https://github.com/mike42/pyTodo
    flask-todo/    # repositorio clonado de https://github.com/patrickloeber/flask-todo
    MCP_TESTING_GUIDE.md   # este documento (guía de pruebas)
    PROMPTS.md     # prompts específicos para cada modo de prueba
```

Cada subcarpeta (pyTodo, flask-todo) contiene el código completo del repositorio de prueba y se usará como "campo de pruebas" del MCP de ITok.

## 2. Tarea estándar para las pruebas

La tarea de referencia es siempre del mismo tipo, adaptada a cada proyecto:

Añadir una pequeña funcionalidad de análisis/estadísticas, que obligue a:

- Entender la estructura del proyecto.
- Localizar módulos/funciones relevantes.
- Diseñar un plan (en el modo MCP_ITok).
- Proponer o aplicar cambios en varios archivos.
- Explicar el resultado.

### Ejemplos de tareas variadas:

Los prompts cubren diferentes tipos de tareas para evaluar el MCP en diversos escenarios:

**Agregar funcionalidades:**
- pyTodo: Argumento de línea de comandos (A1/A2)
- flask-todo: Endpoint de estadísticas (A3)

**Optimizar código:**
- pyTodo: Optimizar `show_list()` reduciendo llamadas redundantes (B1)
- flask-todo: Implementar paginación para evitar cargar todas las tareas (B2)

**Explicar código:**
- pyTodo: Documentar función compleja `show_list()` (C1)
- flask-todo: Explicar arquitectura completa de la aplicación (C2)

**Refactorizar:**
- pyTodo: Dividir función larga `run_curses()` en funciones más pequeñas (D1)
- flask-todo: Separar rutas en Blueprints (D2)

**Mejorar UX/UI:**
- pyTodo: Añadir barra de ayuda con atajos de teclado (E1)
- flask-todo: Confirmación antes de eliminar tareas (E2)

**Arreglar bugs:**
- flask-todo: Validación y manejo de errores 404 (F1)

## 3. Métricas que debes registrar desde Cursor

Para cada prueba (una ejecución de un prompt), anota:

**Proyecto:**
- pyTodo,
- flask-todo.

**Modo:**
- MCP_ITok (Prompt A),
- Baseline (Prompt B).

**Métricas de tokens y coste (copiadas de Cursor):**
- Input
- Output
- Cache Read
- Cache Write
- Total
- Cost

**Calidad subjetiva:**
- ¿El plan que propuso el modelo fue razonable?
- ¿Los archivos elegidos tienen sentido para la tarea?
- ¿La funcionalidad propuesta encaja en el código?
- ¿Hubo pasos redundantes, bucles o cosas raras?

### Ejemplo de tabla (puedes mantenerla en otro archivo .md o en una hoja de cálculo):

| Proyecto   | Modo       | Input | Output | Cache Read | Cache Write | Total | Coste   | Notas |
|------------|------------|-------|--------|------------|-------------|-------|---------|-------|
| pyTodo     | MCP_ITok   |       |        |            |             |       |         |       |
| pyTodo     | Baseline   |       |        |            |             |       |         |       |
| flask-todo | MCP_ITok   |       |        |            |             |       |         |       |
| flask-todo | Baseline   |       |        |            |             |       |         |       |

Cuando termines una ejecución, abre el panel de tokens de Cursor y copia los valores exactos.

## 4. Prompts para las pruebas

Los prompts específicos están disponibles en el archivo **[PROMPTS.md](PROMPTS.md)**.

Ese archivo contiene **prompts variados** organizados por categorías:

### Categorías de prompts:

1. **Agregar Funcionalidades** (A1-A3)
   - Argumento de línea de comandos en pyTodo
   - Endpoint de estadísticas en flask-todo

2. **Optimizar Código** (B1-B2)
   - Optimizar función `show_list()` en pyTodo
   - Paginación en flask-todo

3. **Explicar Código** (C1-C2)
   - Documentar funciones complejas
   - Explicar arquitectura de la aplicación

4. **Refactorizar Código** (D1-D2)
   - Dividir funciones largas
   - Separar en módulos/blueprints

5. **Mejorar UX/UI** (E1-E2)
   - Añadir barras de ayuda
   - Confirmaciones antes de acciones destructivas

6. **Arreglar Bugs** (F1)
   - Validación y manejo de errores

Cada prompt tiene dos versiones: **MCP_ITok** (usando herramientas del MCP) y **Baseline** (sin MCP). Todos mencionan archivos específicos, líneas de código y funciones concretas basándose en problemas reales encontrados en el código.

## 6. Cómo usar esta guía (resumen rápido paso a paso)

1. Asegúrate de tener esta estructura en tu repo:
   ```
   itok/repostest/pyTodo/
   itok/repostest/flask-todo/
   itok/repostest/MCP_TESTING_GUIDE.md
   itok/repostest/PROMPTS.md
   ```

2. Configura el MCP de ITok para descubrir proyectos en `repostest/`.

3. Abre Cursor, ejecuta una prueba:
   - Elige proyecto (pyTodo o flask-todo).
   - Elige tipo de tarea (agregar funcionalidad, optimizar, explicar, refactorizar, mejorar UX, arreglar bugs).
   - Abre el archivo [PROMPTS.md](PROMPTS.md) y copia el prompt correspondiente según la categoría y modo (MCP_ITok o Baseline).
   - Cada prompt es específico y no necesita adaptación.

4. Cuando termine la respuesta:
   - Abre el panel de métricas de Cursor.
   - Copia: Input, Output, Cache Read, Cache Write, Total, Cost.
   - Pégalos en tu tabla de métricas junto con notas sobre la calidad.

5. Repite el mismo procedimiento tras cambios en el MCP de ITok para ver si:
   - Bajan los tokens de Input / Total.
   - Se mantiene o mejora la calidad del plan y de la solución.
   - Cambia el coste efectivo.

