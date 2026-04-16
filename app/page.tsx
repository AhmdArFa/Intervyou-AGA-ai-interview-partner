'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Briefcase, 
  ArrowRight, 
  MessageSquare, 
  Mic, 
  CheckCircle2, 
  Languages,
  Zap,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  const [selectedLang, setSelectedLang] = useState('English');

  const languages = [
    { name: 'English', code: 'en', flag: '🇺🇸' },
    { name: 'German', code: 'de', flag: '🇩🇪' },
    { name: 'Spanish', code: 'es', flag: 'es' },
    { name: 'French', code: 'fr', flag: '🇫🇷' },
  ];

  const features = [
    {
      icon: <Languages className="w-6 h-6 text-blue-600" />,
      title: "Multilingual Support",
      description: "Practice in English, German, Spanish, and more. The AI adapts its entire persona to your chosen language."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Real-time Evaluation",
      description: "Get instant feedback on your clarity, grammar, and relevance as you speak or type."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      title: "Adaptive Difficulty",
      description: "The AI interviewer adjusts the complexity of questions based on your performance and role seniority."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
          <div className="bg-black text-white p-1 rounded">
            <MessageSquare className="w-6 h-6" />
          </div>
          <span>Intervyou</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
          <a href="#features" className="hover:text-black transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-black transition-colors">How it works</a>
          <Link href="/interview" className="bg-black text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors">
            Start Practice
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 pt-20 pb-32 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Next-Gen Interview Prep
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[0.9] mb-6">
              Master your <span className="text-zinc-400">interviews</span> in any language.
            </h1>
            <p className="text-xl text-zinc-600 mb-8 max-w-lg">
              Realistic AI-powered simulations for international job roles. Practice, get feedback, and land your dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/interview" className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all neo-shadow">
                Start Free Session <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex -space-x-2 items-center px-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                    <Image 
                      src={`https://picsum.photos/seed/user${i}/100/100`} 
                      alt="User" 
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
                <span className="ml-4 text-sm font-medium text-zinc-500">Joined by 2,000+ candidates</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-3xl border-2 border-black p-8 neo-shadow relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Interviewer AI</div>
                    <div className="text-xs text-zinc-500">Active • Multilingual</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setSelectedLang(l.name)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${selectedLang === l.name ? 'bg-black text-white' : 'bg-zinc-100 hover:bg-zinc-200'}`}
                    >
                      {l.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-zinc-100 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                  <p className="text-sm">&quot;Welcome! I&apos;ll be your interviewer today. Which role are we practicing for?&quot;</p>
                </div>
                <div className="bg-black text-white p-4 rounded-2xl rounded-tr-none ml-auto max-w-[80%]">
                  <p className="text-sm">&quot;I&apos;m applying for a Senior Software Engineer position at a global tech firm.&quot;</p>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={selectedLang}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-zinc-100 p-4 rounded-2xl rounded-tl-none max-w-[80%]"
                  >
                    <p className="text-sm italic">
                      {selectedLang === 'English' && "Excellent. Let's start with your experience with distributed systems."}
                      {selectedLang === 'German' && "Hervorragend. Beginnen wir mit Ihrer Erfahrung mit verteilten Systemen."}
                      {selectedLang === 'Spanish' && "Excelente. Comencemos con su experiencia con sistemas distribuidos."}
                      {selectedLang === 'French' && "Excellent. Commençons par votre expérience avec les systèmes distribués."}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 bg-zinc-100 rounded-xl px-4 py-3 text-sm text-zinc-400">
                  Type your answer...
                </div>
                <button className="bg-black text-white p-3 rounded-xl">
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400 rounded-full -z-0 border-2 border-black"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-400 rounded-2xl -z-0 border-2 border-black rotate-12"></div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-24 bg-zinc-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="text-4xl font-bold mb-4">Why Intervyou?</h2>
              <p className="text-zinc-400 max-w-2xl">We combine advanced language models with interview psychology to provide the most realistic practice environment available.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} className="p-8 rounded-3xl bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-colors">
                  <div className="mb-6">{f.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-32 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-bold mb-8">Ready to land that job?</h2>
            <p className="text-xl text-zinc-600 mb-10">Join thousands of successful candidates who used Intervyou to gain confidence and fluency.</p>
            <Link href="/interview" className="inline-flex items-center justify-center gap-2 bg-black text-white px-10 py-5 rounded-2xl font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all neo-shadow">
              Start Your First Session
            </Link>
          </div>
        </section>
      </main>

      <footer className="p-12 border-t border-zinc-200 text-center text-zinc-500 text-sm">
        <p>© 2024 Intervyou AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
