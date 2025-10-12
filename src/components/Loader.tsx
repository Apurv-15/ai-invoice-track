import { useEffect, useState } from "react";

export default function Loader({ onLoadComplete }: { onLoadComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = 100 / steps;
    const interval = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= 100) {
        setProgress(100);
        clearInterval(timer);
        setTimeout(onLoadComplete, 300);
      } else {
        setProgress(current);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onLoadComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="space-y-6 text-center">
        <div className="relative">
          <div className="w-20 h-20 mx-auto border-4 border-primary/20 rounded-full"></div>
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            InvoSmart AI
          </h2>
          <div className="w-64 h-2 mx-auto bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full gradient-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}
