import { weekStartOf } from "@/lib/week";
import { create } from "zustand";

interface WeekStore {
  /** Fecha ISO del viernes que inicia la semana activa. */
  weekStart: string;
  /** Día del ciclo seleccionado dentro de la semana (ISO). */
  activeDay: string;
  setWeekStart: (weekStart: string) => void;
  setActiveDay: (activeDay: string) => void;
}

/**
 * Semana activa compartida entre Formato 1, Formato 2, Panel y Reportes.
 * Es estado de UI local (no datos del backend).
 */
export const useWeekStore = create<WeekStore>((set) => ({
  weekStart: weekStartOf(new Date()),
  activeDay: "",
  setWeekStart: (weekStart) => set({ weekStart }),
  setActiveDay: (activeDay) => set({ activeDay }),
}));
