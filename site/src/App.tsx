import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Features } from './components/Features'
import { Trust } from './components/Trust'
import { Waitlist } from './components/Waitlist'
import { Footer } from './components/Footer'

export function App() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <div className="gold-line max-w-4xl mx-auto" />
      <HowItWorks />
      <div className="gold-line max-w-4xl mx-auto" />
      <Features />
      <div className="gold-line max-w-4xl mx-auto" />
      <Trust />
      <div className="gold-line max-w-4xl mx-auto" />
      <Waitlist />
      <Footer />
    </main>
  )
}
