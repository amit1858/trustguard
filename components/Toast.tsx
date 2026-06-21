"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface ToastEntry {
  id: string;
  message: string;
  variant: "info" | "success" | "warn";
}

interface ToastContextValue {
  show: (message: string, variant?: ToastEntry["variant"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag for portal SSR-safety
  useEffect(() => setMounted(true), []);

  const show = useCallback<ToastContextValue["show"]>((message, variant = "success") => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {mounted &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              pointerEvents: "none",
            }}
          >
            {toasts.map((t) => {
              const color =
                t.variant === "warn"
                  ? "#D97448"
                  : t.variant === "info"
                    ? "#C9A36B"
                    : "#6FB089";
              return (
                <div
                  key={t.id}
                  style={{
                    background: "rgba(29, 26, 22, 0.96)",
                    color: "#F4EFE7",
                    border: `1px solid ${color}55`,
                    boxShadow: `0 12px 28px rgba(0,0,0,0.45), 0 0 0 1px ${color}22`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                    minWidth: 240,
                    maxWidth: 360,
                    pointerEvents: "auto",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span style={{ color, marginRight: 8 }}>●</span>
                  {t.message}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
