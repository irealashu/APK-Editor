import React from 'react';
import { Upload } from 'lucide-react';

interface HeaderProps {
  onUploadClick: () => void;
  loading?: boolean;
}

// Authentic Android Bugdroid SVG Logo
export const AndroidLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Android Logo"
  >
    {/* Left Antenna */}
    <line x1="6.5" y1="4" x2="8.8" y2="7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Right Antenna */}
    <line x1="17.5" y1="4" x2="15.2" y2="7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Head Dome */}
    <path
      d="M4.5 15C4.5 10.3 8 7 12 7C16 7 19.5 10.3 19.5 15H4.5Z"
      fill="currentColor"
    />
    {/* Left Eye */}
    <circle cx="9" cy="11.8" r="1.1" fill="#020617" />
    {/* Right Eye */}
    <circle cx="15" cy="11.8" r="1.1" fill="#020617" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  onUploadClick,
  loading = false
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Site Name & Android SVG Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3DDC84]/20 via-[#3DDC84]/10 to-transparent border border-[#3DDC84]/30 flex items-center justify-center text-[#3DDC84] shadow-sm shadow-emerald-950/50 hover:border-[#3DDC84]/50 transition">
              <AndroidLogo className="w-6 h-6 text-[#3DDC84]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                APK Editor
              </span>
            </div>
          </div>

          {/* Action Buttons: Open APK and Author */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onUploadClick}
              disabled={loading}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50"
              title="Open APK file from computer"
            >
              <Upload className="w-4 h-4 text-[#3DDC84]" />
              <span>Open APK</span>
            </button>

            <a
              href="https://github.com/irealashu"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-sm hover:shadow active:scale-[0.98]"
              title="View Author on GitHub (@irealashu)"
            >
              <svg className="w-4 h-4 fill-current text-slate-300" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>Author</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
