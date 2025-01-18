'use client'
import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <section className="py-20 bg-gray-900 bg-opacity-70 backdrop-blur-lg">
      <div className="container mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-bold mb-6 text-blue-300 shimmer-text"
        >
          Ready to Supercharge Your Job Search?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl text-gray-300 mb-8"
        >
          Join thousands of job seekers who have streamlined their job hunt with JobFlow.
        </motion.p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn bg-black text-white hover:bg-gray-800"
        >
          Start Free Trial
        </motion.button>
      </div>
    </section>
  )
}

