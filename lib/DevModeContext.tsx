"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/lib/AuthContext";

const ADMIN_EMAIL = "mur.noe.celony@gmail.com";

interface DevModeContextType {
  isAdmin: boolean;
  devMode: boolean;
  simulatedPlan: string;
  toggleDevMode: () => void;
  setSimulatedPlan: (plan: string) => void;
  getEffectivePlan: (realPlan: string) => string;
}

const DevModeContext = createContext<DevModeContextType>({
  isAdmin: false,
  devMode: true,
  simulatedPlan: "free",
  toggleDevMode: () => {},
  setSimulatedPlan: () => {},
  getEffectivePlan: (p) => p,
});

export function DevModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [devMode, setDevMode] = useState(true);
  const [simulatedPlan, setSimulatedPlan] = useState("free");

  const toggleDevMode = () => setDevMode((prev) => !prev);

  const getEffectivePlan = (realPlan: string) => {
    if (!isAdmin) return realPlan;
    if (devMode) return "enterprise";
    return simulatedPlan;
  };

  return (
    <DevModeContext.Provider value={{ isAdmin, devMode, simulatedPlan, toggleDevMode, setSimulatedPlan, getEffectivePlan }}>
      {children}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);
