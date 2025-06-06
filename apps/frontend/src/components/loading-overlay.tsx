type LoadingOverlayProps = {
  isVisible: boolean;
  title?: string;
  message?: string;
  className?: string;
};

export const LoadingOverlay = ({
  isVisible,
  title = 'Loading',
  message = 'Please wait...',
  className = '',
}: LoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50 ${className}`}
    >
      <div className="text-center space-y-6">
        {/* Animated Loading Icon */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <p className="text-gray-300 text-sm">{message}</p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
