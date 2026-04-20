import { motion } from 'framer-motion'

export function Card({ children, className = '', padded = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-xl border border-tf-border bg-tf-surface shadow-tf-md ${padded ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
