import type { Variants, Transition, Easing } from "framer-motion";

/**
 * Global Easing: Apple iOS 26 Inspired
 */
export const appleEase: Easing = [0.22, 1, 0.36, 1];

/**
 * Global Durations (seconds)
 */
export const duration = {
  instant: 0.10,
  fast: 0.15,
  normal: 0.20,
  smooth: 0.25,
  medium: 0.30,
  slow: 0.40,
  page: 0.45,
  immersive: 0.50,
};

/**
 * Default Spring Config (Interactive elements)
 */
export const springConfig: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 1,
};

/**
 * Page Transitions
 */
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: appleEase } },
  exit: { opacity: 0, y: -12, transition: { duration: duration.smooth, ease: appleEase } }
};

/**
 * Stagger Container (Dashboards, Lists)
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemFadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: duration.slow, ease: appleEase }
  },
};

/**
 * Modals & Dialogs
 */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: duration.slow, ease: appleEase } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: duration.smooth, ease: appleEase } 
  }
};

/**
 * Notifications / Toasts
 */
export const toastVariants: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: duration.medium, ease: appleEase } 
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: { duration: duration.smooth, ease: appleEase } 
  }
};

/**
 * Chat / Messages
 */
export const chatMessageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: duration.smooth, ease: appleEase } 
  }
};

/**
 * Popovers & Dropdowns
 */
export const popoverVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -5 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: duration.smooth, ease: appleEase } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: -5, 
    transition: { duration: 0.18, ease: appleEase } 
  }
};
