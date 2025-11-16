# Prompts para Escenarios de Benchmark Multi-Repositorio

Este documento contiene los prompts específicos para cada escenario de benchmark, tanto en modo **experimental (con ITok + MCP)** como en modo **baseline (sin MCP)**.

## Estructura

Cada escenario incluye:
- **Prompt Experimental**: Usa ITok MCP + planner jerárquico + TOON + dynamic chunking
- **Prompt Baseline**: Sin MCP, solo razonamiento directo

---

## 1. ITok - Analyze Tokens CLI Command

**Escenario ID:** `analyze-tokens-itok-001`  
**Repositorio:** ITok  
**Tarea:** Añadir comando CLI `analyze-tokens` que cuenta tokens en archivos de texto

### 1.1. Prompt Experimental (con ITok + MCP)

```
Quiero que uses el MCP de proyectos y el planner jerárquico para trabajar SOBRE EL REPOSITORIO ITok y que registres toda la información necesaria para comparar consumo de tokens y calidad.

REPOSITORIO: ITok

Contexto:

- El repositorio ITok está en /repos/ITok (o en la ruta que tu MCP haya descubierto como proyecto "ITok").
- Tienes acceso a tools MCP de:
  - Gestión de proyectos (list_projects, activate_project, search_files, resolve_file, etc.).
  - Planificación jerárquica (plan_task).
  - Validación / optimización de planes (validate_plan).
  - Lectura / edición de archivos de código.

Tarea principal:

1. Activa el proyecto ITok usando el MCP de proyectos.
2. Usa plan_task para generar un plan jerárquico de alto nivel para añadir un nuevo subcomando CLI llamado "analyze-tokens" a ITok.
   - Este subcomando debe:
     - Recibir la ruta a un archivo de texto.
     - Usar la lógica de tokenización de ITok (o la parte más cercana a ella) para contar tokens.
     - Imprimir:
       - Número total de tokens.
       - Número de líneas.
       - Un resumen muy breve del contenido (2–3 frases máximo).
3. Pasa el plan por validate_plan para:
   - Fusionar pasos redundantes.
   - Limitar el número de pasos demasiado finos.
   - Mantener una estructura jerárquica coherente (fases → subpasos).
4. Ejecuta el plan:
   - Usa tools de proyectos para localizar los módulos donde vive la lógica de tokenización.
   - Si es necesario, busca los puntos donde se define la CLI actual de ITok (por ejemplo un entrypoint, un CLI principal o scripts).
   - Propón cambios concretos en los archivos necesarios (puedes usar herramientas de edición si están disponibles, o bien describir los diffs con claridad).
5. Al final, produce:
   - Un resumen muy breve (5–10 líneas) de lo que hiciste.
   - Una lista de archivos tocados.
   - Una explicación de cómo se invocaría el nuevo subcomando.
   - NOTA: no necesito que ejecutes tests, pero si existen, indica cuáles serían relevantes.

IMPORTANTE:

- Usa tus tools MCP de forma explícita (plan_task, validate_plan, tools de proyectos, herramientas de código).
- No omitas los pasos de planificación: quiero poder comparar este flujo "rico en tools" con un flujo baseline sin MCP.
- Si encuentras ambigüedad en la estructura de ITok, elige la solución más razonable y explícala al final.

Al terminar, no olvides indicar claramente que esta ejecución corresponde al modo:
"MCP+planner sobre ITok", de forma que pueda etiquetar las métricas.
```

### 1.2. Prompt Baseline (sin MCP)

```
Quiero que me ayudes a extender un proyecto de código con una pequeña funcionalidad nueva.

REPOSITORIO: ITok (contar tokens en archivos de texto)

Tarea:

Diseña y describe los cambios necesarios para añadir un comando CLI "analyze-tokens" en ITok:
- Debe recibir la ruta a un archivo de texto.
- Debe usar la lógica de tokenización de ITok para contar tokens.
- Debe calcular el número de líneas.
- Debe producir un pequeño resumen textual del contenido (2-3 frases).

Restricciones:

- NO asumas que tienes acceso a herramientas de planificación jerárquica ni a un MCP especializado en proyectos.
- Trabaja solamente con tu contexto actual y tu capacidad de razonamiento; si tienes alguna herramienta genérica de lectura de archivos, puedes usarla, pero no quiero que hagas planificación multi-paso con herramientas dedicadas.
- Concéntrate en producir:
  - Una propuesta de diseño clara.
  - Una lista de archivos a modificar/crear.
  - Ejemplos de código (o pseudocódigo) necesarios para implementar la funcionalidad.

Estructura de la respuesta:

1. Descripción muy breve del objetivo.
2. Diseño de alto nivel (componentes o módulos que habría que tocar/crear).
3. Lista de archivos a modificar/crear, con una descripción breve por archivo.
4. Ejemplos de cambios (a nivel de funciones, clases o endpoints) sin necesidad de ser 100% exactos respecto al proyecto real.

IMPORTANTE:

- En este modo baseline NO quiero que intentes optimizar consumo de tokens usando herramientas de planificación ni estructuras jerárquicas sofisticadas. Haz una respuesta buena, pero directa.
- Al final, indica explícitamente que esta ejecución corresponde al modo "Baseline sin MCP especializado", para poder etiquetar las métricas.
```

---

## 2. pyTodo - Analyze Tasks Functionality

**Escenario ID:** `analyze-tasks-pytodo-001`  
**Repositorio:** pyTodo  
**Tarea:** Añadir funcionalidad de análisis de tareas (contar tareas, mostrar tiempos de creación, etc.)

### 2.1. Prompt Experimental (con ITok + MCP)

```
Quiero que uses el MCP de proyectos y el planner jerárquico para trabajar SOBRE EL REPOSITORIO pyTodo y que registres toda la información necesaria para comparar consumo de tokens y calidad.

REPOSITORIO: pyTodo

Contexto:

- El repositorio pyTodo está en /repos/pyTodo (o en la ruta que tu MCP haya descubierto como proyecto "pyTodo").
- pyTodo es una aplicación Python de consola para gestión de tareas TODO, usando curses.
- Tiene una estructura simple con main.py y el módulo todolist/.
- Tienes acceso a tools MCP de:
  - Gestión de proyectos (list_projects, activate_project, search_files, resolve_file, etc.).
  - Planificación jerárquica (plan_task).
  - Validación / optimización de planes (validate_plan).
  - Lectura / edición de archivos de código.

Tarea principal:

1. Activa el proyecto pyTodo usando el MCP de proyectos.
2. Usa plan_task para generar un plan jerárquico de alto nivel para añadir funcionalidad de análisis de tareas a pyTodo.
   - Esta funcionalidad debe:
     - Contar el número total de tareas en la lista.
     - Mostrar información sobre los tiempos de creación de las tareas.
     - Proporcionar un resumen breve del estado de las tareas (completadas, pendientes, etc.).
     - Integrarse con la interfaz CLI existente de pyTodo.
3. Pasa el plan por validate_plan para:
   - Fusionar pasos redundantes.
   - Limitar el número de pasos demasiado finos.
   - Mantener una estructura jerárquica coherente (fases → subpasos).
4. Ejecuta el plan:
   - Usa tools de proyectos para localizar los módulos relevantes (main.py, todolist/cli.py, todolist/ListBackend.py).
   - Busca los puntos donde se maneja la lista de tareas y la interfaz CLI.
   - Propón cambios concretos en los archivos necesarios (puedes usar herramientas de edición si están disponibles, o bien describir los diffs con claridad).
5. Al final, produce:
   - Un resumen muy breve (5–10 líneas) de lo que hiciste.
   - Una lista de archivos tocados.
   - Una explicación de cómo se invocaría la nueva funcionalidad de análisis.
   - NOTA: no necesito que ejecutes tests, pero si existen, indica cuáles serían relevantes.

IMPORTANTE:

- Usa tus tools MCP de forma explícita (plan_task, validate_plan, tools de proyectos, herramientas de código).
- No omitas los pasos de planificación: quiero poder comparar este flujo "rico en tools" con un flujo baseline sin MCP.
- Si encuentras ambigüedad en la estructura de pyTodo, elige la solución más razonable y explícala al final.

Al terminar, no olvides indicar claramente que esta ejecución corresponde al modo:
"MCP+planner sobre pyTodo", de forma que pueda etiquetar las métricas.
```

### 2.2. Prompt Baseline (sin MCP)

```
Quiero que me ayudes a extender un proyecto de código con una pequeña funcionalidad nueva.

REPOSITORIO: pyTodo (analizar elementos de la lista de tareas)

Tarea:

Diseña y describe los cambios necesarios para añadir funcionalidad de análisis de tareas en pyTodo:
- Debe contar el número total de tareas en la lista.
- Debe mostrar información sobre los tiempos de creación de las tareas.
- Debe proporcionar un resumen breve del estado de las tareas (completadas, pendientes, etc.).
- Debe integrarse con la interfaz CLI existente de pyTodo.

Restricciones:

- NO asumas que tienes acceso a herramientas de planificación jerárquica ni a un MCP especializado en proyectos.
- Trabaja solamente con tu contexto actual y tu capacidad de razonamiento; si tienes alguna herramienta genérica de lectura de archivos, puedes usarla, pero no quiero que hagas planificación multi-paso con herramientas dedicadas.
- Concéntrate en producir:
  - Una propuesta de diseño clara.
  - Una lista de archivos a modificar/crear.
  - Ejemplos de código (o pseudocódigo) necesarios para implementar la funcionalidad.

Estructura de la respuesta:

1. Descripción muy breve del objetivo.
2. Diseño de alto nivel (componentes o módulos que habría que tocar/crear).
3. Lista de archivos a modificar/crear, con una descripción breve por archivo.
4. Ejemplos de cambios (a nivel de funciones, clases o endpoints) sin necesidad de ser 100% exactos respecto al proyecto real.

IMPORTANTE:

- En este modo baseline NO quiero que intentes optimizar consumo de tokens usando herramientas de planificación ni estructuras jerárquicas sofisticadas. Haz una respuesta buena, pero directa.
- Al final, indica explícitamente que esta ejecución corresponde al modo "Baseline sin MCP especializado", para poder etiquetar las métricas.
```

---

## 3. flaskToDo - Analyze Todos Endpoint

**Escenario ID:** `analyze-todos-flasktodo-001`  
**Repositorio:** flaskToDo  
**Tarea:** Añadir endpoint/vista que analiza todos en la base de datos y devuelve análisis en JSON o HTML

### 3.1. Prompt Experimental (con ITok + MCP)

```
Quiero que uses el MCP de proyectos y el planner jerárquico para trabajar SOBRE EL REPOSITORIO flaskToDo y que registres toda la información necesaria para comparar consumo de tokens y calidad.

REPOSITORIO: flaskToDo

Contexto:

- El repositorio flaskToDo está en /repos/flaskToDo (o en la ruta que tu MCP haya descubierto como proyecto "flaskToDo").
- flaskToDo es una aplicación web Flask con base de datos SQLite (todos.db).
- Tiene estructura típica de Flask: app.py, templates/, static/.
- Tienes acceso a tools MCP de:
  - Gestión de proyectos (list_projects, activate_project, search_files, resolve_file, etc.).
  - Planificación jerárquica (plan_task).
  - Validación / optimización de planes (validate_plan).
  - Lectura / edición de archivos de código.

Tarea principal:

1. Activa el proyecto flaskToDo usando el MCP de proyectos.
2. Usa plan_task para generar un plan jerárquico de alto nivel para añadir un endpoint o vista que analice los todos en la base de datos.
   - Este endpoint/vista debe:
     - Recorrer las tareas en la base de datos SQLite (todos.db).
     - Contar el total de todos y proporcionar estadísticas.
     - Devolver un pequeño análisis en formato JSON o HTML.
     - Integrarse con las rutas Flask existentes.
3. Pasa el plan por validate_plan para:
   - Fusionar pasos redundantes.
   - Limitar el número de pasos demasiado finos.
   - Mantener una estructura jerárquica coherente (fases → subpasos).
4. Ejecuta el plan:
   - Usa tools de proyectos para localizar los módulos relevantes (app.py, templates/).
   - Busca los puntos donde se definen las rutas Flask y se accede a la base de datos.
   - Propón cambios concretos en los archivos necesarios (puedes usar herramientas de edición si están disponibles, o bien describir los diffs con claridad).
5. Al final, produce:
   - Un resumen muy breve (5–10 líneas) de lo que hiciste.
   - Una lista de archivos tocados.
   - Una explicación de cómo se accedería al nuevo endpoint/vista.
   - NOTA: no necesito que ejecutes tests, pero si existen, indica cuáles serían relevantes.

IMPORTANTE:

- Usa tus tools MCP de forma explícita (plan_task, validate_plan, tools de proyectos, herramientas de código).
- No omitas los pasos de planificación: quiero poder comparar este flujo "rico en tools" con un flujo baseline sin MCP.
- Si encuentras ambigüedad en la estructura de flaskToDo, elige la solución más razonable y explícala al final.

Al terminar, no olvides indicar claramente que esta ejecución corresponde al modo:
"MCP+planner sobre flaskToDo", de forma que pueda etiquetar las métricas.
```

### 3.2. Prompt Baseline (sin MCP)

```
Quiero que me ayudes a extender un proyecto de código con una pequeña funcionalidad nueva.

REPOSITORIO: flaskToDo (analizar tareas en la base de datos)

Tarea:

Diseña y describe los cambios necesarios para añadir un endpoint o vista en flaskToDo que:
- Recorra las tareas en la base de datos SQLite (todos.db).
- Cuente el total de todos y proporcione estadísticas.
- Devuelva un pequeño análisis en formato JSON o HTML.
- Se integre con las rutas Flask existentes.

Restricciones:

- NO asumas que tienes acceso a herramientas de planificación jerárquica ni a un MCP especializado en proyectos.
- Trabaja solamente con tu contexto actual y tu capacidad de razonamiento; si tienes alguna herramienta genérica de lectura de archivos, puedes usarla, pero no quiero que hagas planificación multi-paso con herramientas dedicadas.
- Concéntrate en producir:
  - Una propuesta de diseño clara.
  - Una lista de archivos a modificar/crear.
  - Ejemplos de código (o pseudocódigo) necesarios para implementar la funcionalidad.

Estructura de la respuesta:

1. Descripción muy breve del objetivo.
2. Diseño de alto nivel (componentes o módulos que habría que tocar/crear).
3. Lista de archivos a modificar/crear, con una descripción breve por archivo.
4. Ejemplos de cambios (a nivel de funciones, clases o endpoints) sin necesidad de ser 100% exactos respecto al proyecto real.

IMPORTANTE:

- En este modo baseline NO quiero que intentes optimizar consumo de tokens usando herramientas de planificación ni estructuras jerárquicas sofisticadas. Haz una respuesta buena, pero directa.
- Al final, indica explícitamente que esta ejecución corresponde al modo "Baseline sin MCP especializado", para poder etiquetar las métricas.
```

---

## 4. django-htmx-todo-list - Analyze Task Lists HTMX View

**Escenario ID:** `analyze-tasklists-django-htmx-001`  
**Repositorio:** django-htmx-todo-list  
**Tarea:** Añadir vista Django + template HTMX que analiza una lista de tareas y muestra estadísticas en la UI

### 4.1. Prompt Experimental (con ITok + MCP)

```
Quiero que uses el MCP de proyectos y el planner jerárquico para trabajar SOBRE EL REPOSITORIO django-htmx-todo-list y que registres toda la información necesaria para comparar consumo de tokens y calidad.

REPOSITORIO: django-htmx-todo-list

Contexto:

- El repositorio django-htmx-todo-list está en /repos/django-htmx-todo-list (o en la ruta que tu MCP haya descubierto como proyecto "django-htmx-todo-list").
- Es una aplicación Django con integración HTMX.
- Tiene estructura con apps tasker/ y tasker2/, cada una con models, views, templates y endpoints HTMX.
- Tienes acceso a tools MCP de:
  - Gestión de proyectos (list_projects, activate_project, search_files, resolve_file, etc.).
  - Planificación jerárquica (plan_task).
  - Validación / optimización de planes (validate_plan).
  - Lectura / edición de archivos de código.

Tarea principal:

1. Activa el proyecto django-htmx-todo-list usando el MCP de proyectos.
2. Usa plan_task para generar un plan jerárquico de alto nivel para añadir una vista Django con template HTMX que analice una lista de tareas específica.
   - Esta vista debe:
     - Analizar una lista de tareas concreta.
     - Calcular estadísticas (total de tareas, estado de completitud, etc.).
     - Mostrar las estadísticas en la UI usando HTMX.
     - Integrarse con los patrones HTMX existentes en el proyecto.
3. Pasa el plan por validate_plan para:
   - Fusionar pasos redundantes.
   - Limitar el número de pasos demasiado finos.
   - Mantener una estructura jerárquica coherente (fases → subpasos).
4. Ejecuta el plan:
   - Usa tools de proyectos para localizar los módulos relevantes (tasker/tasker/tasks/models.py, tasker/tasker/tasks/views.py, templates).
   - Busca los puntos donde se definen las vistas Django y los templates HTMX.
   - Propón cambios concretos en los archivos necesarios (puedes usar herramientas de edición si están disponibles, o bien describir los diffs con claridad).
5. Al final, produce:
   - Un resumen muy breve (5–10 líneas) de lo que hiciste.
   - Una lista de archivos tocados.
   - Una explicación de cómo se accedería a la nueva vista y cómo se mostrarían las estadísticas.
   - NOTA: no necesito que ejecutes tests, pero si existen, indica cuáles serían relevantes.

IMPORTANTE:

- Usa tus tools MCP de forma explícita (plan_task, validate_plan, tools de proyectos, herramientas de código).
- No omitas los pasos de planificación: quiero poder comparar este flujo "rico en tools" con un flujo baseline sin MCP.
- Si encuentras ambigüedad en la estructura de django-htmx-todo-list, elige la solución más razonable y explícala al final.

Al terminar, no olvides indicar claramente que esta ejecución corresponde al modo:
"MCP+planner sobre django-htmx-todo-list", de forma que pueda etiquetar las métricas.
```

### 4.2. Prompt Baseline (sin MCP)

```
Quiero que me ayudes a extender un proyecto de código con una pequeña funcionalidad nueva.

REPOSITORIO: django-htmx-todo-list (analizar listas de tareas)

Tarea:

Diseña y describe los cambios necesarios para añadir una vista Django con template HTMX que:
- Analice una lista de tareas concreta.
- Calcule estadísticas (total de tareas, estado de completitud, etc.).
- Muestre las estadísticas en la UI usando HTMX.
- Se integre con los patrones HTMX existentes en el proyecto.

Restricciones:

- NO asumas que tienes acceso a herramientas de planificación jerárquica ni a un MCP especializado en proyectos.
- Trabaja solamente con tu contexto actual y tu capacidad de razonamiento; si tienes alguna herramienta genérica de lectura de archivos, puedes usarla, pero no quiero que hagas planificación multi-paso con herramientas dedicadas.
- Concéntrate en producir:
  - Una propuesta de diseño clara.
  - Una lista de archivos a modificar/crear.
  - Ejemplos de código (o pseudocódigo) necesarios para implementar la funcionalidad.

Estructura de la respuesta:

1. Descripción muy breve del objetivo.
2. Diseño de alto nivel (componentes o módulos que habría que tocar/crear).
3. Lista de archivos a modificar/crear, con una descripción breve por archivo.
4. Ejemplos de cambios (a nivel de funciones, clases o endpoints) sin necesidad de ser 100% exactos respecto al proyecto real.

IMPORTANTE:

- En este modo baseline NO quiero que intentes optimizar consumo de tokens usando herramientas de planificación ni estructuras jerárquicas sofisticadas. Haz una respuesta buena, pero directa.
- Al final, indica explícitamente que esta ejecución corresponde al modo "Baseline sin MCP especializado", para poder etiquetar las métricas.
```

---

## Notas de Uso

### Para Ejecutar un Escenario Experimental:

1. Asegúrate de que el MCP de proyectos esté activo y el repositorio esté descubierto.
2. Copia el prompt experimental correspondiente al escenario.
3. Ejecuta el prompt en Cursor/Claude con el MCP habilitado.
4. Registra las métricas de tokens desde el panel de uso.

### Para Ejecutar un Escenario Baseline:

1. Asegúrate de que el MCP de proyectos esté **desactivado** o limitado.
2. Copia el prompt baseline correspondiente al escenario.
3. Ejecuta el prompt en Cursor/Claude sin usar herramientas MCP avanzadas.
4. Registra las métricas de tokens desde el panel de uso.

### Registro de Métricas:

Para cada ejecución, registra:
- **Proyecto**: Nombre del repositorio
- **Modo**: "Experimental" o "Baseline"
- **Tokens de entrada**: Del panel de uso
- **Tokens de salida**: Del panel de uso
- **Total de tokens**: Suma de entrada + salida
- **Tool calls**: Número de llamadas a herramientas
- **Duración**: Tiempo total de ejecución
- **Éxito**: ¿Se completó la tarea correctamente?

### Comparación:

Usa las herramientas en `src/tools/compare-multi-repo-results.ts` para:
- Generar tablas de comparación
- Analizar reducción de tokens
- Exportar resultados en JSON o Markdown

