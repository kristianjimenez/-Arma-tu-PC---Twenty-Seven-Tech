# Publicar el proyecto en GitHub y en internet

Esta guía asume Windows y la terminal de VS Code (PowerShell).

## 0. Antes de empezar

1. Ten una cuenta en [github.com](https://github.com).
2. Instala [Git para Windows](https://git-scm.com/download/win) si aún no lo tienes. Comprueba con `git --version`.
3. Configura tu nombre y correo, una sola vez (usa el mismo correo de tu cuenta de GitHub):

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu@correo.com"
```

4. Corre `npm install` y `npm run build` en la carpeta del proyecto. Si el build termina sin errores, está listo para subir.

## 1. Crear el repositorio vacío en GitHub

1. Entra a <https://github.com/new>.
2. Nombre sugerido: `arma-tu-pc`.
3. Elige **Public** (necesario para GitHub Pages gratis) o Private.
4. **No marques** "Add a README", ".gitignore" ni licencia: el proyecto ya los trae.
5. Pulsa **Create repository**.

## 2. Subir el código

En la terminal de VS Code, dentro de la carpeta del proyecto (cambia `TU-USUARIO`):

```powershell
git init
git add .
git commit -m "Primera versión: configurador de PC Twenty Seven Tech"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/arma-tu-pc.git
git push -u origin main
```

La primera vez, GitHub te pedirá iniciar sesión en el navegador. El archivo `.gitignore` ya evita subir `node_modules` y `dist`.

## 3. Publicar el sitio (GitHub Pages)

1. En el repositorio: **Settings → Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions**.
3. Ve a la pestaña **Actions**: verás "Publicar en GitHub Pages" ejecutándose (tarda 1 a 2 minutos).
4. Al terminar, el sitio queda en `https://TU-USUARIO.github.io/arma-tu-pc/`.

Cada vez que subas cambios a `main`, el sitio se actualiza solo.

## 4. Subir cambios después

```powershell
git add .
git commit -m "Describe aquí qué cambiaste"
git push
```

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `git` no se reconoce | Cierra y abre VS Code después de instalar Git. |
| Falla el paso "npm install" en Actions | Corre `npm install` en tu PC y sube también el archivo `package-lock.json` que se genera. |
| El sitio sale en blanco | Verifica que en `vite.config.ts` siga `base: './'` y que Pages esté en "GitHub Actions". |
| `push` rechazado | Si creaste el repo con README, usa `git pull origin main --allow-unrelated-histories` y vuelve a hacer `push`. |
| Las imágenes no cargan en el sitio publicado | Confirma que la carpeta `public/img/components` se subió (`git status`). |

## Recomendaciones

- Antes de presentar, abre la URL publicada desde el celular para comprobar que se ve bien.
- Agrega la URL publicada al README y a tu presentación.
- Si el repositorio es público, no subas datos personales ni claves.
