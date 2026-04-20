import { motion } from 'framer-motion'

/**
 * Primary call-to-action — restrained motion, navy emphasis.
 */
export function PrimaryButton({
  children,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tf-navy-900 disabled:pointer-events-none disabled:opacity-50'

  const styles =
    variant === 'primary'
      ? 'bg-tf-navy-900 text-white hover:bg-tf-navy-800 shadow-tf-md'
      : variant === 'warning'
        ? 'bg-tf-warning text-white hover:bg-amber-700 shadow-tf-sm'
        : 'border border-tf-border-strong bg-tf-surface text-tf-text hover:bg-tf-elevated shadow-tf-sm'

  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      transition={{ type: 'tween', duration: 0.12 }}
      className={`${base} ${styles} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
