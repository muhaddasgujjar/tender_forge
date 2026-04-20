import { motion } from 'framer-motion'

export function MainContainer({ children, className = '' }) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className={`mx-auto w-full max-w-6xl flex-1 px-4 sm:px-5 md:px-6 ${className}`}
    >
      {children}
    </motion.main>
  )
}
