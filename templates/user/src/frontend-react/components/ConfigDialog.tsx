import React from 'react';
import { X } from 'lucide-react';

interface ConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfigDialog({ isOpen, onOpenChange }: ConfigDialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialog.close();
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleClose = () => onOpenChange(false);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      handleClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-white rounded-xl shadow-2xl p-0 w-full max-w-lg m-auto open:animate-in open:fade-in open:zoom-in-95"
      onClick={handleBackdropClick}
      onCancel={handleClose}
    >
      <div className="flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Configuration</h2>
            <p className="text-sm text-slate-500">Manage application settings.</p>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
            <p>This is a placeholder for your application configuration. You can add form fields, toggles, or JSON editors here.</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </dialog>
  );
}
