import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * AnimatedButton - A reusable button component with left-to-right animation line effect
 * 
 * @param {string} href - Optional link URL (if provided, wraps button in Link)
 * @param {function} onClick - Optional click handler
 * @param {string} variant - Button style variant: 'primary' (default), 'secondary', 'outline'
 * @param {string} size - Button size: 'sm', 'md' (default), 'lg'
 * @param {boolean} fullWidth - Whether button should take full width
 * @param {React.ReactNode} children - Button content
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} type - Button type: 'button', 'submit', 'reset'
 */
const AnimatedButton = ({
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => {
  // Variant styles
  const variantStyles = {
    primary: 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow focus:ring-2 focus:ring-orange-300',
    secondary: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow focus:ring-2 focus:ring-blue-300',
    outline: 'bg-transparent border-2 border-orange-600 text-orange-600 hover:bg-orange-50 focus:ring-2 focus:ring-orange-300',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow focus:ring-2 focus:ring-red-300',
    success: 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white shadow focus:ring-2 focus:ring-green-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-300',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  const baseClasses = `relative overflow-hidden group font-medium flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none ${
    fullWidth ? 'w-full' : ''
  } ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${
    disabled && !className.includes('bg-gray') ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  const buttonContent = (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={baseClasses}
      {...props}
    >
      {/* Animated line effect - only show on hover when not disabled */}
      {!disabled && (
        <div className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-700"></div>
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );

  // If href is provided, wrap in Link
  if (href) {
    return (
      <Link href={href} passHref>
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
};

export default AnimatedButton;

