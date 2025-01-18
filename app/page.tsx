import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import CTA from '@/components/CTA'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 to-black animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
      </div>
      <div className="relative z-10">
        <Header />
        <Hero />
        <Features />
        <CTA />
      </div>
    </main>
  )
}
