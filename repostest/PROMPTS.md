# Prompts para Pruebas del MCP de ITok

Este archivo contiene prompts variados para probar el MCP de ITok en diferentes tipos de tareas: agregar funcionalidades, optimizar código, explicar código, refactorizar, y mejorar UX.

Cada prompt tiene dos versiones: **MCP_ITok** (usando herramientas del MCP) y **Baseline** (sin MCP).

---

## CATEGORÍA 1: Agregar Funcionalidades

### Prompt A1 – pyTodo: Argumento de línea de comandos (MCP_ITok)

**Tipo:** Agregar funcionalidad

```
Modo: MCP_ITok (MCP de ITok activado).

Quiero que trabajes usando únicamente el MCP de ITok y sus herramientas internas.

Contexto:
- Estoy trabajando con el repositorio pyTodo dentro de `repostest/pyTodo/`.
- El MCP de ITok proporciona herramientas para gestionar proyectos, planificar tareas, validar planes y leer/escribir archivos.

Tarea específica:

En `todolist/cli.py` línea 85, la función `run_curses()` tiene hardcodeado:
```python
todo.load("default.txt")
```

Hay un TODO explícito en línea 74: "Help bar, cmd argument for file, clear method".

Necesito:
1. Modificar `main()` en `main.py` para aceptar un argumento opcional de línea de comandos.
2. Pasar ese argumento a través de `todolist.cli.run()` hasta `run_curses()`.
3. Usar "default.txt" como valor por defecto.
4. Modificar `ListBackend.load()` en `todolist/ListBackend.py` línea 11 para manejar archivos inexistentes.

Instrucciones:
1. Activa el proyecto pyTodo y lee los archivos relevantes.
2. Usa `plan_task` para generar un plan jerárquico.
3. Usa `validate_plan` para optimizar el plan.
4. Ejecuta el plan modificando los archivos necesarios.
5. Proporciona un resumen y cómo probar (ej: `python main.py miarchivo.txt`).

IMPORTANTE: Al final escribe "Etiqueta de modo: MCP_ITok"
```

### Prompt A2 – pyTodo: Argumento de línea de comandos (Baseline)

**Tipo:** Agregar funcionalidad

```
Modo: Baseline sin MCP de ITok.

Ayúdame a extender pyTodo sin usar herramientas del MCP de ITok.

Problema: En `todolist/cli.py` línea 85 está hardcodeado `todo.load("default.txt")`. TODO en línea 74 menciona "cmd argument for file".

Tarea: Implementar argumento de línea de comandos opcional para el archivo, usando "default.txt" como defecto.

Restricciones: NO uses herramientas del MCP de ITok. Razonar "a mano".

Estructura:
1. Objetivo (2-3 frases)
2. Diseño de alto nivel (archivos a modificar: `main.py`, `todolist/cli.py`, `todolist/ListBackend.py`)
3. Cambios específicos por archivo
4. Ejemplos de código
5. Cómo probar

IMPORTANTE: Al final escribe "Etiqueta de modo: Baseline sin MCP de ITok"
```

### Prompt A3 – flask-todo: Endpoint de estadísticas (MCP_ITok)

**Tipo:** Agregar funcionalidad

```
Modo: MCP_ITok (MCP de ITok activado).

Quiero que trabajes usando únicamente el MCP de ITok y sus herramientas internas.

Contexto:
- Estoy trabajando con flask-todo dentro de `repostest/flask-todo/`.

Tarea específica:

Añadir un nuevo endpoint `/stats` que muestre estadísticas de las tareas:
- Total de tareas
- Tareas completadas
- Tareas pendientes
- Porcentaje de completadas

El endpoint debe:
1. Consultar la base de datos usando el modelo `Todo` en `app.py` línea 12.
2. Calcular las estadísticas.
3. Retornar JSON o mostrar en una plantilla HTML simple.

Instrucciones:
1. Activa el proyecto flask-todo y lee `app.py` y `templates/base.html`.
2. Usa `plan_task` para generar un plan.
3. Usa `validate_plan` para optimizar.
4. Implementa el endpoint y opcionalmente una plantilla.
5. Proporciona resumen y cómo probar (ej: `curl http://localhost:5000/stats`).

IMPORTANTE: Al final escribe "Etiqueta de modo: MCP_ITok"
```

---

## CATEGORÍA 2: Optimizar Código

### Prompt B1 – pyTodo: Optimizar función show_list (MCP_ITok)

**Tipo:** Optimizar código

```
Modo: MCP_ITok (MCP de ITok activado).

Quiero que trabajes usando únicamente el MCP de ITok y sus herramientas internas.

Contexto:
- Estoy trabajando con pyTodo dentro de `repostest/pyTodo/`.

Tarea específica:

La función `show_list()` en `todolist/cli.py` líneas 39-72 tiene ineficiencias:

1. Líneas 40-41: Llama a `scr.clear()` y `scr.refresh()` innecesariamente al inicio.
2. Líneas 55-64: El loop itera sobre `range(height)` pero podría usar `enumerate(todo.lst[:height])` para evitar indexación repetida.
3. Líneas 67-68: Llama a `win.refresh()` y `scr.refresh()` cuando solo una es necesaria.

Optimiza esta función para:
- Reducir llamadas redundantes a `refresh()`
- Mejorar la legibilidad del código
- Mantener la misma funcionalidad

Instrucciones:
1. Activa pyTodo y lee `todolist/cli.py`.
2. Usa `plan_task` para generar un plan de optimización.
3. Usa `validate_plan` para optimizar el plan.
4. Refactoriza la función manteniendo la funcionalidad.
5. Explica las optimizaciones realizadas.

IMPORTANTE: Al final escribe "Etiqueta de modo: MCP_ITok"
```

### Prompt B2 – flask-todo: Optimizar consulta de base de datos (MCP_ITok)

**Tipo:** Optimizar código

```
Modo: MCP_ITok (MCP de ITok activado).

Quiero que trabajes usando únicamente el MCP de ITok y sus herramientas internas.

Contexto:
- Estoy trabajando con flask-todo dentro de `repostest/flask-todo/`.

Tarea específica:

En `app.py` línea 20, la función `home()` hace:
```python
todo_list = Todo.query.all()
```

Esto carga TODAS las tareas en memoria. Si hay muchas tareas, esto es ineficiente.

Optimiza para:
1. Implementar paginación (mostrar solo 10-20 tareas por página).
2. Añadir parámetros de query string `?page=1` y `?per_page=10`.
3. Modificar `templates/base.html` para mostrar controles de paginación.
4. Mantener compatibilidad con el código existente.

Instrucciones:
1. Activa flask-todo y lee `app.py` y `templates/base.html`.
2. Usa `plan_task` para generar un plan de optimización.
3. Usa `validate_plan` para optimizar el plan.
4. Implementa la paginación.
5. Explica las mejoras de rendimiento.

IMPORTANTE: Al final escribe "Etiqueta de modo: MCP_ITok"
```

---

## CATEGORÍA 3: Explicar Código

### Prompt C1 – pyTodo: Documentar función show_list (MCP_ITok)

**Tipo:** Explicar código

```
Modo: MCP_ITok (MCP de ITok activado).

Quiero que trabajes usando únicamente el MCP de ITok y sus herramientas internas.

Contexto:
- Estoy trabajando con pyTodo dentro de `repostest/pyTodo/`.

Tarea específica:

La función `show_list()` en `todolist/cli.py` líneas 39-72 es compleja y no está documentada. Esta función:
- Maneja la visualización de la lista de tareas en curses
- Calcula dimensiones de ventanas dinámicamente
- Maneja el truncado de texto largo
- Gestiona la selección visual

Necesito:
1. Añadir docstring completo explicando qué hace la función.
2. Documentar cada parámetro y el valor de retorno.
3. Añadir comentarios inline explicando la lógica compleja (cálculo de dimensiones, truncado, etc.).
4. Explicar cómo interactúa con curses (ventanas, colores, refrescos).

Instrucciones:
1. Activa pyTodo y lee `todolist/cli.py`.
2. Usa `plan_task` para generar un plan de documentación.
3. Usa `validate_plan` para optimizar.
4. Añade documentación completa sin cambiar la funcionalidad.
5. Explica qué partes del código documentaste y por qué.

IMPORTANTE: Al final escribe "Etiqueta de modo: MCP_ITok"
```

### Prompt C2 – flask-todo: Explicar arquitectura de la aplicación (Baseline)

**Tipo:** Explicar código

```
Modo: Baseline sin MCP de ITok.

Ayúdame a entender la arquitectura de flask-todo sin usar herramientas del MCP.

Tarea:
Analiza y explica cómo funciona la aplicación flask-todo:

1. **Estructura del modelo**: Explica la clase `Todo` en `app.py` líneas 12-15. ¿Qué campos tiene? ¿Qué tipo de base de datos usa?

2. **Flujo de datos**: Explica cómo fluyen los datos desde:
   - El formulario en `templates/base.html` línea 17
   - Hasta la base de datos en `app.py` línea 28
   - Y de vuelta a la plantilla

3. **Rutas y sus responsabilidades**: Explica qué hace cada ruta:
   - `/` (línea 18)
   - `/add` (línea 24)
   - `/update/<id>` (línea 33)
   - `/delete/<id>` (línea 41)

4. **Ciclo de vida de una tarea**: Describe el ciclo completo desde creación hasta eliminación.

Restricciones: NO uses herramientas del MCP. Explica basándote en el código que veas.

Estructura:
1. Resumen de la arquitectura (3-4 párrafos)
2. Explicación del modelo de datos
3. Flujo de datos detallado
4. Explicación de cada ruta
5. Diagrama textual del ciclo de vida

IMPORTANTE: Al final escribe "Etiqueta de modo: Baseline sin MCP de ITok"
```

---

## CATEGORÍA 4: Refactorizar Código

### Prompt D1 – pyTodo: Refactorizar función run_curses (MCP_ITok)

**Tipo:** Refactorizar código

```
Modo: MCP_ITok (MCP de ITok activado).

Quiero que trabajes usando únicamente el MCP de ITok y sus herramientas internas.

Contexto:
- Estoy trabajando con pyTodo dentro de `repostest/pyTodo/`.

Tarea específica:

La función `run_curses()` en `todolist/cli.py` líneas 82-138 es muy larga (56 líneas) y tiene múltiples responsabilidades:
- Inicialización de curses (líneas 87-102)
- Lógica de navegación (líneas 129-138)
- Manejo de comandos (líneas 110-128)
- Gestión de estado (líneas 104-105)

Además, hay código duplicado:
- Líneas 118-121 y 123-128 tienen lógica similar para detectar cambios.

Refactoriza para:
1. Extraer la inicialización de curses a una función separada `init_curses()`.
2. Extraer el manejo de comandos a una función `handle_command(c, todo, selected, modified)`.
3. Eliminar la duplicación de código para detectar cambios.
4. Mantener la misma funcionalidad.

Instrucciones:
1. Activa pyTodo y lee `todolist/cli.py`.
2. Usa `plan_task` para generar un plan de refactorización.
3. Usa `validate_plan` para optimizar.
4. Refactoriza el código en funciones más pequeñas.
5. Explica los beneficios de la refactorización.

IMPORTANTE: Al final escribe "Etiqueta de modo: MCP_ITok"
```

### Prompt D2 – flask-todo: Separar rutas en blueprint (Baseline)

**Tipo:** Refactorizar código

```
Modo: Baseline sin MCP de ITok.

Ayúdame a refactorizar flask-todo sin usar herramientas del MCP.

Problema:
Todas las rutas están en `app.py` (líneas 18-46). Esto hace el archivo difícil de mantener si la aplicación crece.

Tarea:
Refactorizar para usar Flask Blueprints:
1. Crear un archivo `routes.py` o `views.py`.
2. Mover las rutas (`home`, `add`, `update`, `delete`) a un Blueprint.
3. Registrar el Blueprint en `app.py`.
4. Mantener la misma funcionalidad.

Restricciones: NO uses herramientas del MCP. Razonar "a mano".

Estructura:
1. Objetivo y beneficios de usar Blueprints
2. Diseño: qué archivos crear/modificar
3. Cambios específicos por archivo
4. Ejemplo de código para el Blueprint
5. Cómo verificar que funciona igual

IMPORTANTE: Al final escribe "Etiqueta de modo: Baseline sin MCP de ITok"
```

---

## CATEGORÍA 5: Mejorar UX/UI

### Prompt E1 – pyTodo: Añadir barra de ayuda (MCP_ITok)

**Tipo:** Mejorar UX/UI

```
Modo: MCP_ITok (MCP de ITok activado).

Quiero que trabajes usando únicamente el MCP de ITok y sus herramientas internas.

Contexto:
- Estoy trabajando con pyTodo dentro de `repostest/pyTodo/`.

Tarea específica:

Hay un TODO explícito en `todolist/cli.py` línea 74: "Help bar, cmd argument for file, clear method".

Actualmente, los usuarios no saben qué teclas usar. Necesito añadir una barra de ayuda que muestre:
- `+` - añadir item
- `-` - eliminar item seleccionado
- `↑↓` - navegar
- `s` - guardar
- `q` - salir

La barra debe:
1. Aparecer en la parte inferior de la pantalla.
2. Ser visible siempre (o al presionar `h` para mostrar/ocultar).
3. No interferir con la visualización de la lista.

Instrucciones:
1. Activa pyTodo y lee `todolist/cli.py`.
2. Usa `plan_task` para generar un plan.
3. Usa `validate_plan` para optimizar.
4. Implementa la barra de ayuda.
5. Explica cómo se integra con la interfaz existente.

IMPORTANTE: Al final escribe "Etiqueta de modo: MCP_ITok"
```

### Prompt E2 – flask-todo: Añadir confirmación antes de eliminar (Baseline)

**Tipo:** Mejorar UX/UI

```
Modo: Baseline sin MCP de ITok.

Ayúdame a mejorar la UX de flask-todo sin usar herramientas del MCP.

Problema:
En `templates/base.html` línea 38, el botón de eliminar redirige directamente a `/delete/<id>` sin confirmación. Esto puede causar eliminaciones accidentales.

Tarea:
Añadir confirmación antes de eliminar:
1. Modificar `templates/base.html` para usar JavaScript que muestre un `confirm()` antes de eliminar.
2. O cambiar el botón para que abra un modal de confirmación (usando Semantic UI que ya está incluido).
3. Mantener la funcionalidad de eliminación.

Restricciones: NO uses herramientas del MCP. Razonar "a mano".

Estructura:
1. Objetivo y beneficios
2. Diseño: qué opción elegir (JavaScript confirm vs modal)
3. Cambios específicos en `templates/base.html`
4. Ejemplo de código
5. Cómo probar la confirmación

IMPORTANTE: Al final escribe "Etiqueta de modo: Baseline sin MCP de ITok"
```

---

## CATEGORÍA 6: Arreglar Bugs

### Prompt F1 – flask-todo: Arreglar validación y errores (MCP_ITok)

**Tipo:** Arreglar bugs

```
Modo: MCP_ITok (MCP de ITok activado).

Quiero que trabajes usando únicamente el MCP de ITok y sus herramientas internas.

Contexto:
- Estoy trabajando con flask-todo dentro de `repostest/flask-todo/`.

Tarea específica:

Hay varios bugs en `app.py`:

1. **Línea 26**: `add()` no valida que `title` no esté vacío. Permite crear tareas con título `None` o string vacío.

2. **Línea 35**: `update()` no verifica si el todo existe. Si `todo` es `None`, `todo.complete = not todo.complete` causará `AttributeError`.

3. **Línea 43**: `delete()` tiene el mismo problema. Si `todo` es `None`, `db.session.delete(todo)` intentará eliminar `None`.

Arregla estos bugs:
1. Validar título en `add()` y rechazar vacíos con mensaje de error.
2. Verificar existencia en `update()` y `delete()`, retornar 404 si no existe.
3. Opcionalmente mejorar `templates/base.html` para mostrar mensajes de error.

Instrucciones:
1. Activa flask-todo y lee `app.py` y `templates/base.html`.
2. Usa `plan_task` para generar un plan de corrección de bugs.
3. Usa `validate_plan` para optimizar.
4. Arregla los bugs.
5. Explica qué bugs encontraste y cómo los arreglaste.

IMPORTANTE: Al final escribe "Etiqueta de modo: MCP_ITok"
```

---

## Resumen de Prompts

| ID | Proyecto | Tipo | Modo | Descripción |
|----|----------|------|------|-------------|
| A1 | pyTodo | Agregar funcionalidad | MCP_ITok | Argumento de línea de comandos |
| A2 | pyTodo | Agregar funcionalidad | Baseline | Argumento de línea de comandos |
| A3 | flask-todo | Agregar funcionalidad | MCP_ITok | Endpoint `/stats` |
| B1 | pyTodo | Optimizar código | MCP_ITok | Optimizar `show_list()` |
| B2 | flask-todo | Optimizar código | MCP_ITok | Paginación en `home()` |
| C1 | pyTodo | Explicar código | MCP_ITok | Documentar `show_list()` |
| C2 | flask-todo | Explicar código | Baseline | Explicar arquitectura |
| D1 | pyTodo | Refactorizar | MCP_ITok | Refactorizar `run_curses()` |
| D2 | flask-todo | Refactorizar | Baseline | Separar en Blueprints |
| E1 | pyTodo | Mejorar UX/UI | MCP_ITok | Barra de ayuda |
| E2 | flask-todo | Mejorar UX/UI | Baseline | Confirmación antes de eliminar |
| F1 | flask-todo | Arreglar bugs | MCP_ITok | Validación y manejo de errores |
