// Presupuesto de PX por personaje, por nivel del grupo y dificultad deseada.
// Fuente: corpus/guia-dm/04-crear-aventuras.md, "Dificultad de los encuentros
// de combate" (tabla "Presupuesto de PX por personaje").
export const PRESUPUESTO_PX: Record<number, { baja: number; moderada: number; alta: number }> = {
  1: { baja: 50, moderada: 75, alta: 100 },
  2: { baja: 100, moderada: 150, alta: 200 },
  3: { baja: 150, moderada: 225, alta: 400 },
  4: { baja: 250, moderada: 375, alta: 500 },
  5: { baja: 500, moderada: 750, alta: 1100 },
  6: { baja: 600, moderada: 1000, alta: 1400 },
  7: { baja: 750, moderada: 1300, alta: 1700 },
  8: { baja: 1000, moderada: 1700, alta: 2100 },
  9: { baja: 1300, moderada: 2000, alta: 2600 },
  10: { baja: 1600, moderada: 2300, alta: 3100 },
  11: { baja: 1900, moderada: 2900, alta: 4100 },
  12: { baja: 2200, moderada: 3700, alta: 4700 },
  13: { baja: 2600, moderada: 4200, alta: 5400 },
  14: { baja: 2900, moderada: 4900, alta: 6200 },
  15: { baja: 3300, moderada: 5400, alta: 7800 },
  16: { baja: 3800, moderada: 6100, alta: 9800 },
  17: { baja: 4500, moderada: 7200, alta: 11700 },
  18: { baja: 5000, moderada: 8700, alta: 14200 },
  19: { baja: 5500, moderada: 10700, alta: 17200 },
  20: { baja: 6400, moderada: 13200, alta: 22000 },
};
