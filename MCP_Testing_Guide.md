# Guía de Pruebas del MCP con ITok

## 1. Objetivo

### Lo que quieres conseguir

Tener una carpeta central `./repos/` con repositorios de prueba bien elegidos para:

- Navegación de código.
- Edición multi-archivo.
- Planificación de tareas de desarrollo.

Usar esos repos como "banco de benchmarks" para comparar:

- Uso de tokens.
- Calidad de respuesta.
- Con y sin tu MCP (planner jerárquico + TOON + dynamic chunking).

Dentro de ITok, tener un único `.md` de ejemplo que:

- Explique cómo testear el MCP.
- Incluya:
  * Un prompt específico para ITok.
  * Un prompt base genérico (sin proyecto concreto) para reutilizar en otros repos.
- Permita repetir la misma tarea en distintos escenarios y medir tokens / calidad.

## 2. Repositorios externos recomendados para `/repos`

Te propongo tres repos que cubren distintos niveles de complejidad y estilos, todos con buen encaje para pruebas de herramientas MCP.

### 2.1. mike42/pyTodo – TODO list en consola (Python simple)

**Qué es:**

Un TODO list en Python, basado en curses, con una estructura muy pequeña (unos pocos archivos).

**Por qué es bueno para pruebas:**

- Tamaño pequeño → ideal para tests rápidos de planificación y lectura de archivos sin ruido.
- Todo el código está en unas pocas piezas (`main.py`, etc.), con una lógica clara de operaciones CRUD sobre la lista de tareas.

**Perfecto para:**

- pruebas de "lectura global del repo"
- pequeñas refactorizaciones
- cambios en flujos de control o atajos de teclado.

**Licencia:** MIT (apta para clonar y experimentar).

### 2.2. DogukanUrker/flaskToDo – TODO web con Flask

**Qué es:**

Aplicación TODO simple construida con Flask, con plantillas HTML, estáticos, etc.

**Por qué es buena:**

Web app clásica con:

- `app.py`, `templates/`, `static/`, `requirements.txt`, etc.

**Ideal para:**

- pruebas de edición coordinada: tocar backend + templates.
- añadir endpoints nuevos, modificar vistas, etc.

Tiene demo, documentación y estructura clara de proyecto.

**Licencia:** MIT (explícito en el repo).

### 2.3. jacklinke/django-htmx-todo-list – TODO con Django + HTMX

**Qué es:**

Proyecto de ejemplo de lista de tareas usando Django y HTMX, con dos variantes (tasker y tasker2).

**Por qué es bueno:**

Código Django realista, con:

- vistas, templates, URLs.
- integración HTMX para UI reactiva.

Documentado como "quick example of a todo list application using Django and HTMX", con foco en conceptos modernos de Django + HTMX.

**Muy útil para:**

- pruebas de planificación jerárquica (scope: proyecto → app → vista → template).
- refactors que tocan varias capas.

(Para cada repo, revisa tú mismo el archivo LICENSE antes de usarlos en algo más que experimentos locales, pero todos son ejemplos pensados para demo/aprendizaje.)

## 3. Plan paso a paso para `/repos` + integración con tu MCP

### 3.1. Estructura base y principios

Crear una carpeta raíz para los repos de prueba:

En tu máquina de desarrollo:

`/<lo_que_uses>/repos/`

Ejemplo pensado para tu arquitectura:

`C:\Users\<tu_usuario>\repos\`

Dentro clonaremos:

```
/repos/
  pyTodo/
  flaskToDo/
  django-htmx-todo-list/
  ITok/           # tu repo local principal
```

En tu config global del MCP de proyectos (el equivalente a `~/.serena/serena_config.yml` pero tuyo) vas a añadir `/repos` como uno de los `discoveryRoots`, para que el servicio de descubrimiento pueda detectar y registrar proyectos automáticamente.

### 3.2. Fase 1 – Clonado y organización de repos

**Objetivo:** tener `/repos` poblado con proyectos listos para que tus tools los descubran.

**Clonar los repos de ejemplo dentro de `/repos`:**

```bash
git clone https://github.com/mike42/pyTodo.git
git clone https://github.com/DogukanUrker/flaskToDo.git
git clone https://github.com/jacklinke/django-htmx-todo-list.git
```

Asegurarte de que tu propio repo ITok está también dentro de `/repos` (o que tu MCP lo detecta por otra ruta), por ejemplo:

`C:\Users\...\repos\ITok\` (movido o clonado ahí).

**Opcional:** si tu MCP soporta un comando tipo `discover_projects`, ejecútalo apuntando a `/repos`:

Internamente: escaneará subdirectorios, detectará proyectos (por `.git`, `requirements.txt`, etc.) y los registrará en tu ProjectRegistry.

### 3.3. Fase 2 – Integrar `/repos` con el MCP de proyectos

**Objetivo:** que tus tools MCP (los de "proyectos") entiendan que `/repos` es el "playground oficial".

**En la configuración global de tu MCP de proyectos:**

- Añade `/repos` a la lista `discoveryRoots`.
- Define política:
  * Profundidad máxima (p.ej. 2 niveles).
  * Patrones de detección de proyecto (presencia de `.git`, etc.).

**Ejecutar (o diseñar) el tool `discover_projects`:**

Registra:

- `pyTodo` como proyecto.
- `flaskToDo` como proyecto.
- `django-htmx-todo-list` como proyecto.
- `ITok` como proyecto.

Para cada uno:

- Auto-crear tu carpeta `.mcp_proj/` (o como la hayas llamado), análogo a `.serena/`, con `project.yml` por defecto.

**Configurar indexado:**

- Para los cuatro proyectos (incluyendo ITok), ejecutar tu tool de indexado de archivos.
- Guardar índices en `.mcp_proj/index/` de cada repo.

### 3.4. Fase 3 – Circuito de pruebas con los modelos

**Objetivo:** poder lanzar la misma tarea en varios contextos y comparar:

- MCP desactivado vs MCP activado.
- Planner jerárquico vs prompting directo.
- Distintos repos (ITok, pyTodo, Flask, Django+HTMX).

**Flujo sugerido:**

1. Seleccionar una tarea base (descrita en el `.md` que vas a poner en ITok, ver sección 4).
2. Ejecutar en ITok:
   * Prompt ITok+MCP → registrar tokens y calidad.
   * Prompt base genérico → registrar tokens y calidad.
3. Repetir la misma tarea base, cambiando el proyecto (pyTodo, flaskToDo, django-htmx-todo-list) y midiendo igualmente.

El `.md` dentro de ITok va a servir como guía única de benchmarking manual.

## 4. Contenido completo del `.md` de ejemplo dentro de ITok

Te doy ahora el documento completo que puedes guardar, por ejemplo, como:

En ITok:

`ITok/docs/mcp_testing_guide.md`

(o `ITok/MCP_TESTING_GUIDE.md`, como prefieras).

---

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

### 2. Tarea estándar para las pruebas

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

### 3. Métricas que deberías registrar

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

