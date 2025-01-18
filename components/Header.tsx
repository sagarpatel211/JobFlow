'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 100, delay: 5 }}
      className="fixed w-full z-50 bg-gray-900 bg-opacity-80 backdrop-blur-md"
    >
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-400">JobFlow</Link>
        <div className="space-x-6">
          <Link href="#features" className="text-gray-300 hover:text-blue-400 transition-colors">Features</Link>
          <Link href="#" className="text-gray-300 hover:text-blue-400 transition-colors">Pricing</Link>
          <Link href="#" className="btn bg-blue-900 text-white hover:bg-blue-800">Sign Up</Link>
        </div>
      </nav>
    </motion.header>
  )
}

