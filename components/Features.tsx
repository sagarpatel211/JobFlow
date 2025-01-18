'use client'
import { motion } from 'framer-motion'
import { IconBriefcase, IconRobot, IconChartBar, IconBell } from '@tabler/icons-react'

const features = [
  { icon: IconBriefcase, title: 'Job Tracking', description: 'Keep all your applications organized in one place.' },
  { icon: IconRobot, title: 'Automated Applications', description: 'Apply to multiple jobs with a single click.' },
  { icon: IconChartBar, title: 'Analytics', description: 'Gain insights into your job search progress.' },
  { icon: IconBell, title: 'Smart Alerts', description: 'Get notified about new relevant job openings.' },
]

export default function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-5xl font-bold text-center mb-12 text-blue-300 shimmer-text">Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl p-6 hover:bg-opacity-70 transition-all"
            >
              <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-2 text-blue-200 shimmer-text">{feature.title}</h3>
              <p className="text-gray-300 text-lg">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

