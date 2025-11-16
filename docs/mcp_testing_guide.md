# Guía de pruebas del MCP con ITok

Este documento es una **guía práctica** para probar el MCP de planificación/proyectos que estás construyendo, usando:

- El repositorio **ITok** como proyecto principal.
- Otros repositorios de ejemplo alojados en `./repos/` (por ejemplo `pyTodo`, `flaskToDo`, `django-htmx-todo-list`).
- Dos prompts estandarizados:
  * Uno específico para ITok (usa el MCP de proyectos y el planner jerárquico).
  * Uno base genérico (sin asumir MCP ni proyecto concreto).

La idea es que, con **la misma tarea de alto nivel**, puedas medir:

1. **Uso de tokens** (entrada + salida + tool calls).
2. **Calidad de la respuesta**, tanto del plan como de la ejecución.

y comparar:

- Con MCP de proyectos + planner jerárquico + TOON + dynamic chunking.
- Sin MCP (o con MVP mínimo).
- Distintos repositorios.

---

## 1. Contexto y requisitos

Antes de usar esta guía deberías tener:

1. Una carpeta raíz de pruebas, por ejemplo:

   ```text
   /repos/
     ITok/                       # este repo
     pyTodo/                     # https://github.com/mike42/pyTodo
     flaskToDo/                  # https://github.com/DogukanUrker/flaskToDo
     django-htmx-todo-list/      # https://github.com/jacklinke/django-htmx-todo-list
   ```

2. Tu MCP de proyectos configurado para usar `/repos` como raíz de descubrimiento:

   - `/repos` añadido a `discoveryRoots` de tu configuración global.
   - Cada proyecto con su carpeta `.mcp_proj/` y un `project.yml` básico.
   - Índices generados (`.mcp_proj/index/...`) para acelerar búsquedas de archivos.

3. Tu planner V1 funcionando:

   - Tool `plan_task` que produce un plan jerárquico + encoding TOON.
   - Tool `validate_plan` que aplica dynamic chunking / optimización del plan.

4. Acceso al panel de tokens del cliente (por ejemplo Cursor, Claude Desktop, etc.) para registrar:

   - Tokens solicitados.
   - Tokens de respuesta.
   - Número de tool calls.

## 2. Tarea estándar para las pruebas

La tarea de referencia (el "benchmark mental") será:

Extender un proyecto de código existente con una nueva funcionalidad pequeña pero realista, que implique:

- Leer la estructura del repo.
- Localizar funciones/módulos relevantes.
- Diseñar un plan con pasos jerárquicos.
- Editar/crear 2–4 archivos de forma coherente.
- Dejar instrucciones o diffs claros.

**En ITok, esa tarea se concretará como:**

Añadir un comando CLI `analyze-tokens` a ITok que reciba como parámetro la ruta de un archivo de texto, y:

- Cuente el número de tokens según la lógica de ITok.
- Muestre un pequeño resumen (total de tokens, longitud media de las frases, etc.).
- Exponga la funcionalidad como un subcomando CLI (por ejemplo `itok analyze-tokens path/to/file.txt`), integrado con el resto de la aplicación.

En otros repos (pyTodo, flaskToDo, django-htmx-todo-list), podrás reutilizar la misma idea de "añadir funcionalidad pequeña pero completa", adaptando el texto del prompt base.

## 3. Métricas que deberías registrar

Para cada ejecución de prueba, apunta como mínimo:

**Configuración:**

- Proyecto (ITok, pyTodo, etc.).
- Modo:
  * MCP+planner (con tus tools activos).
  * Baseline (sin MCP o con minimal tools).

**Tokens:**

- Tokens de entrada (prompt inicial).
- Tokens de salida (respuesta total).
- Tokens usados por tool calls (si tu cliente los da desglosados).

**Tool calls:**

- Número de llamadas a:
  * `plan_task`.
  * `validate_plan`.
  * Tools de proyectos (`list_projects`, `activate_project`, `search_files`, etc.).
  * Tools de edición de código (Serena u otros).

**Calidad subjetiva:**

- ¿El plan era claro y jerárquico?
- ¿Se editaron los archivos correctos?
- ¿La funcionalidad final funciona?
- ¿Hubo errores o pasos redundantes?

Te recomendamos usar una pequeña tabla (en un spreadsheet o en otro `.md`) con columnas:

| Proyecto | Modo | Tokens in | Tokens out | Tool calls | ¿Plan correcto? | ¿Funciona? | Notas |

## 4. Prompt A – Prueba completa con ITok + MCP

Este prompt está pensado para ejecutarse cuando:

- Tu MCP de proyectos está registrado y operativo.
- El proyecto ITok está dentro de `/repos`.
- El servidor MCP está anunciado en tu cliente (Cursor/Claude) y puede usar tools `plan_task`, `validate_plan` y los tools de proyectos.

### 4.1. Prompt (copiar/pegar)

```
Quiero que uses el MCP de proyectos y el planner jerárquico para trabajar SOBRE EL REPOSITORIO ITok y que registres toda la información necesaria para comparar consumo de tokens y calidad.

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

## 5. Prompt B – Prompt base genérico (sin MCP / sin proyecto fijo)

Este prompt sirve como baseline. Puedes usarlo:

- En el mismo proyecto (ITok) pero:
  * Sin activar tools MCP avanzados.
  * O limitando el uso de tools a lo mínimo.
- En otros repositorios (pyTodo, flaskToDo, django-htmx-todo-list), adaptando el texto entre corchetes.

### 5.1. Prompt (copiar/pegar y adaptar)

```
Quiero que me ayudes a extender un proyecto de código con una pequeña funcionalidad nueva.

Tarea:

Diseña y describe los cambios necesarios para añadir una funcionalidad equivalente a un comando "analyze-tokens" o "analyze-tasks" en este proyecto:
- Debe leer un archivo de entrada (o una entidad equivalente en este proyecto, como tareas en una BD).
- Debe calcular un conteo básico (p.ej. número de líneas, elementos, registros, etc.).
- Debe producir un pequeño resumen textual del contenido.

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

[Opcional: si sabes el nombre del proyecto concreto, indícalo aquí de forma descriptiva, por ejemplo:
- "Proyecto: ITok (contar tokens en archivos de texto)"
- "Proyecto: pyTodo (analizar elementos de la lista de tareas)"
- "Proyecto: flaskToDo (analizar tareas en la base de datos)"
- "Proyecto: django-htmx-todo-list (analizar listas de tareas)"]
```

## 6. Cómo usar esta guía en otros repos de `/repos`

Aunque este `.md` vive dentro de ITok, puedes usar la misma estructura de pruebas en los otros repos de `/repos`:

### pyTodo (`/repos/pyTodo`)

Adapta la tarea para que el comando analice:

- número de tareas en la lista
- tiempo que llevan creadas, etc.

### flaskToDo (`/repos/flaskToDo`)

Adapta la tarea para añadir un endpoint o una vista que:

- recorra las tareas en la BD
- devuelva un pequeño análisis en JSON o HTML.

### django-htmx-todo-list (`/repos/django-htmx-todo-list`)

Adapta la tarea para añadir una vista + template HTMX que:

- analice una lista de tareas concreta.
- muestre estadísticas simples en la UI.

En cada caso, puedes lanzar:

- Una ejecución tipo Prompt A (si usas el MCP de proyectos + planner en ese repo).
- Una ejecución tipo Prompt B (baseline sin MCP).

y registrar métricas en la misma tabla.

## 7. Checklist rápido antes de cada experimento

Antes de lanzar una nueva prueba, verifica:

- [ ] El proyecto correcto está activo (si usas tools de proyectos).
- [ ] Estás usando el prompt adecuado:
  * Prompt A → modo MCP+planner.
  * Prompt B → modo baseline.
- [ ] El panel de tokens está visible en tu cliente.
- [ ] Has anotado:
  * Proyecto.
  * Modo.
  * Tokens in/out.
  * Número de tool calls.
  * Resultado (¿funciona? ¿estás satisfecho?).

