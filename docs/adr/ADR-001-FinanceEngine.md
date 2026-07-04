# ADR-001 — Creación futura de FinanceEngine

## Estado
Aprobado para diseño. No implementado todavía.

## Contexto
La lógica financiera está repartida entre caja, reservas, abonos, dashboard y ERP.

## Decisión
Crear progresivamente un FinanceEngine como servicio central de cálculo financiero.

## Restricción
No se conectará a caja real hasta mapear y validar el flujo financiero actual.

## Beneficio
Menos regresiones, mayor trazabilidad y cálculos reutilizables.