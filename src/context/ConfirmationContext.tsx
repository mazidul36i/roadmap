import React, { createContext, useContext, useState, ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: "danger" | "warning" | "info";
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);

  const confirm = (opt: ConfirmationOptions) => {
    setOptions(opt);
  };

  const handleClose = () => {
    if (options?.onCancel) options.onCancel();
    setOptions(null);
  };

  const handleConfirm = () => {
    options?.onConfirm();
    setOptions(null);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header" style={{ borderBottom: 'none', marginBottom: 8 }}>
              <div className="flex items-center gap-12">
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  background: options.type === 'danger' ? 'var(--danger-dim)' : 'var(--warning-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: options.type === 'danger' ? 'var(--danger)' : 'var(--warning)'
                }}>
                  <AlertTriangle size={20} />
                </div>
                <h2 className="modal-title">{options.title || "Confirm Action"}</h2>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={handleClose}><X size={16} /></button>
            </div>
            
            <div style={{ padding: '0 0 24px 52px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{options.message}</p>
            </div>

            <div className="flex gap-12" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={handleClose}>
                {options.cancelText || "Cancel"}
              </button>
              <button 
                className={`btn ${options.type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
                onClick={handleConfirm}
                style={options.type === 'danger' ? { background: 'var(--danger)', color: '#fff' } : {}}
              >
                {options.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmationContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmationProvider");
  return context;
}
