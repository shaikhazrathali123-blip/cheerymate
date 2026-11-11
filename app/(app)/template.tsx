"use client";
import { motion } from "framer-motion";

/** Native-feeling slide-in for every tab/page change. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.7 }}
    >
      {children}
    </motion.div>
  );
}
