import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  glass = false 
}) => {
  const baseClasses = "rounded-xl transition-all duration-300";
  const glassClasses = glass 
    ? "bg-white/10 dark:bg-gray-900/10 backdrop-blur-md border border-white/20 dark:border-gray-700/20" 
    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg";
  const hoverClasses = hover ? "hover:shadow-xl hover:-translate-y-1" : "";
  
  const classes = `${baseClasses} ${glassClasses} ${hoverClasses} ${className}`;

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={classes}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={classes}>{children}</div>;
};