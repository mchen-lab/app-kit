
import React from 'react';

interface VersionBannerProps {
  version?: string;
  commit?: string;
  appName?: string;
}

export const VersionBanner: React.FC<VersionBannerProps> = ({ version, commit, appName }) => {
  return (
    <div className="flex flex-col items-start gap-1 p-2 text-[10px] text-muted-foreground opacity-70 hover:opacity-100 transition-opacity">
      {appName && <div className="font-semibold uppercase tracking-wider">{appName}</div>}
      <div className="flex items-center gap-2">
        <span>v{version || '0.0.0'}</span>
        {commit && (
          <>
            <span className="w-1 h-1 rounded-full bg-border" />
            <code className="bg-muted px-1 rounded">{commit.substring(0, 7)}</code>
          </>
        )}
      </div>
    </div>
  );
};

interface AboutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
  version?: string;
  commit?: string;
  repoUrl?: string;
  description?: string;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({
  isOpen,
  onOpenChange,
  appName,
  version,
  commit,
  repoUrl,
  description
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
          <h2 className="text-lg font-semibold text-foreground">About {appName}</h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Description</p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {description || `A professional application powered by @mchen-lab/app-kit, designed for high performance and reliability.`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Version</p>
              <p className="text-sm font-mono bg-muted px-2 py-0.5 rounded inline-block">v{version || '0.1.0'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Commit</p>
              <p className="text-sm font-mono bg-muted px-2 py-0.5 rounded inline-block">{commit?.substring(0, 7) || 'unknown'}</p>
            </div>
          </div>

          {repoUrl && (
            <div className="pt-2 border-t border-dashed mt-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Repository</p>
              <a 
                href={repoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                {repoUrl.replace(/^https?:\/\//, '')}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t flex justify-end">
          <button 
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


