# Runbook de despliegue

## 1. Validación local
```powershell
npm run quality:all
```

## 2. Subida a GitHub
```powershell
git init
git remote remove origin
git remote add origin https://github.com/jalemanbetanco-cyber/alohandote-rent-calendar.git
git branch -M main
git add .
git commit -m "Cierre tecnico y checklist produccion V132"
git push -u origin main --force
```

## 3. Reglas Firebase
```powershell
firebase deploy --only firestore:rules,storage --project alohandote-rent-calendar
```

## 4. Verificación post deploy
- Abrir Vercel.
- Login admin.
- Revisar Administración ERP.
- Revisar Monitor de salud.
- Crear registro de prueba.
- Descargar backup.
- Probar mobile.

## 5. Rollback
- Restaurar commit anterior.
- Re-desplegar reglas anteriores si fuera necesario.
- Restaurar datos con backup si hubo error operativo.
