# Validación V213

En este entorno se validó correctamente:

```bash
npm run production:check
```

El build debe ejecutarse en VS Code/Vercel después de instalar dependencias:

```bash
npm install --legacy-peer-deps
npm run build
```

Nota: el ZIP no incluye `node_modules`, por eso `vite build` requiere instalación local.
