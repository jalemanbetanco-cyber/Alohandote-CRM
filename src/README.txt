HOTFIX V223.5.9.1 - iCal horario optimizado

Reglas (hora America/Caracas):
- Propios 09:00-18:00: cada 1 hora.
- Propios 18:00-09:00: cada 3 horas.
- Aliados: cada 3 horas todo el día.

El scheduler revisa cada 5 minutos, pero no consulta feeds ni escribe Firestore si el alojamiento aún no está vencido.
Incluye bloqueo por pestaña/navegador para reducir ejecuciones duplicadas.

Reemplazar: src/App.jsx
Luego: npm run build
