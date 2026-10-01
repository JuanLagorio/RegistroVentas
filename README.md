# Registro de Ventas

App web para registrar ventas por reparto. Cada celular carga sus ventas del
día (cliente, uno o varios productos y precio final acordado por venta), ve
el total en vivo, y al terminar la jornada toca **Finalizar ventas**. El PDF
de cada jornada finalizada se genera y descarga desde el
[panel de administración](#panel-de-administración), no desde el celular del
reparto.

Las ventas se guardan en la nube (Firebase Firestore) apenas se cargan, así
que cerrar el navegador o el celular **no borra nada**.

## Configuración inicial (una sola vez)

### 1. Crear el proyecto de Firebase

1. Entrá a https://console.firebase.google.com y creá un proyecto nuevo (gratis, plan Spark).
2. En **Compilación > Firestore Database**, creá una base de datos (modo producción, la región más cercana).
3. En **Compilación > Authentication > Sign-in method**, habilitá el proveedor **Anónimo**.
4. En **Configuración del proyecto > Tus apps**, agregá una app web (ícono `</>`) y copiá el objeto `firebaseConfig`.
5. Pegá esos valores en [src/firebase.js](src/firebase.js), reemplazando los `TU_...`.
6. En **Firestore Database > Reglas**, pegá el contenido de [firestore.rules](firestore.rules) y publicá.

### 2. Cargar tus productos

Editá [src/config/productos.js](src/config/productos.js) con la lista real de productos.

### 3. PIN del panel de administración

En el mismo archivo, cambiá `ADMIN_PIN` por un PIN propio (no dejes `1234`). Es
el que vas a compartir con quien vea el panel (ver más abajo). No es una
seguridad fuerte (cualquiera que mire el código fuente lo puede ver), pero
evita que alguien entre por accidente al link.

### 4. Publicar en GitHub Pages

1. En GitHub, andá a **Settings > Pages** y elegí como *Source* la opción **GitHub Actions**.
2. Hacé `git push` a `main`. El workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) compila y publica solo.
3. Tu link va a quedar en `https://juanlagorio.github.io/RegistroVentas/`. Compartilo con los repartidores (pueden agregarlo a la pantalla de inicio del celular como si fuera una app).

## Desarrollo local

```bash
npm install
npm run dev
```

## Cómo funciona

- Al abrir la app, se crea (o retoma) una **jornada** del día en Firestore.
- Cada venta puede tener uno o varios productos para un mismo cliente; se
  guarda como un solo registro con el total combinado apenas se toca
  "Guardar venta". Eliminar una venta pide confirmación antes de borrar.
- **Finalizar ventas** cierra la jornada. El repartidor no genera ni
  descarga ningún PDF — solo ve un resumen y puede iniciar la próxima
  jornada.
- Al iniciar una nueva jornada se empieza de cero, sin perder el historial
  anterior (queda guardado en Firestore).

## Panel de administración

En `https://juanlagorio.github.io/RegistroVentas/?admin=1` hay un panel
que muestra, en vivo, todas las jornadas ya finalizadas de cualquier reparto
(fecha, nombre y total). Pide el PIN configurado en `ADMIN_PIN` la primera
vez y después lo recuerda en ese navegador. Desde ahí se puede:

- **Descargar el PDF** de cualquier jornada (se genera al momento a partir de
  los datos guardados, no hay que compartirlo desde el celular del reparto).
- **Eliminar una jornada** completa (pide confirmación, no se puede deshacer).

Está pensado para no depender de que el PDF llegue por WhatsApp: los datos ya
están guardados apenas se cargan, así que quien tenga el link + PIN puede
entrar cuando quiera y ver todo.
