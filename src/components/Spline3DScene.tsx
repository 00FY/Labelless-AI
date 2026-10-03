import React, { Suspense, lazy, useState, Component, ReactNode } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

const Spline = lazy(() =>
  import('@splinetool/react-spline').catch((err) => {
    console.warn('Spline 3D import failed, using fallback:', err);
    return { default: () => null };
  })
);

export const SPLINE_SCENES = {
  triageSphere: 'https://prod.spline.design/6Wq1Q7YGyM-mab6X/scene.splinecode',
  techCore: 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode',
  neuralMesh: 'https://prod.spline.design/4c0N6S6R1d07S8L8/scene.splinecode',
};

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SplineErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Spline 3D Scene Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface Spline3DSceneProps {
  sceneUrl?: string;
  preset?: keyof typeof SPLINE_SCENES;
  className?: string;
  height?: string;
  fallbackText?: string;
}

export const Spline3DScene: React.FC<Spline3DSceneProps> = ({
  sceneUrl,
  preset = 'triageSphere',
  className = 'w-full h-full rounded-2xl overflow-hidden',
  height = 'h-96 sm:h-[450px]',
  fallbackText = 'Interactive 3D Active Learning Model',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const activeSceneUrl = sceneUrl || SPLINE_SCENES[preset] || SPLINE_SCENES.triageSphere;

  const fallbackUI = (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center z-10 space-y-2">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
        <Sparkles className="w-6 h-6 text-emerald-600" />
      </div>
      <p className="text-sm font-semibold text-gray-900">{fallbackText}</p>
      <p className="text-xs text-gray-500 max-w-xs">Interactive 3D Active Learning Canvas</p>
    </div>
  );

  return (
    <div className={`relative bg-gray-50 border border-gray-200 shadow-sm ${height} ${className} flex items-center justify-center overflow-hidden`}>
      {/* Loading Spinner */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 space-y-3 p-6 text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Loading Interactive 3D Scene...</span>
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {hasError ? (
        fallbackUI
      ) : (
        <SplineErrorBoundary fallback={fallbackUI}>
          <Suspense fallback={null}>
            <Spline
              scene={activeSceneUrl}
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
              className="w-full h-full"
            />
          </Suspense>
        </SplineErrorBoundary>
      )}
    </div>
  );
};
