import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function TopLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress while the component is mounted
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Asymptotically approach 90%
        const diff = 90 - prev;
        return prev + diff * 0.1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="h-1 bg-primary/20 w-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.2 }}
        />
      </div>
      {/* Optional soft glow underneath the progress bar */}
      <motion.div
        className="absolute top-0 left-0 h-1 bg-primary blur-[2px] opacity-50"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: "easeOut", duration: 0.2 }}
      />
    </div>
  );
}
