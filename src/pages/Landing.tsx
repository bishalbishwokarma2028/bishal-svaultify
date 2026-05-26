import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  FileText, 
  Scan, 
  BellRing, 
  Search, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight,
  Database
} from 'lucide-react';
import { Footer } from '../components/layout/Footer';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const features = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      desc: 'Your files are securely scrambled on your device before they are saved. Only you have the keys to view them.',
      glow: 'glow-blue'
    },
    {
      icon: Key,
      title: 'Password Manager',
      desc: 'Safely store your account passwords, cards, and secret notes. Use our tool to create strong, hard-to-guess passwords.',
      glow: 'glow-purple'
    },
    {
      icon: Scan,
      title: 'Document Scanner',
      desc: 'Use your phone camera to scan physical papers, IDs, or receipts and save them directly as secure PDF files.',
      glow: 'glow-emerald'
    },
    {
      icon: EyeOff,
      title: 'Secret Vault',
      desc: 'Hide your most private items behind a custom PIN code and a secret calculator screen that keeps outsiders away.',
      glow: 'glow-purple'
    },
    {
      icon: BellRing,
      title: 'Expiry Reminders',
      desc: 'Never let your passport, driver license, or subscriptions expire. Get helpful alerts before the final dates.',
      glow: 'glow-blue'
    },
    {
      icon: Search,
      title: 'Instant Search',
      desc: 'Find any file, folder, note, or password instantly. Simply type what you need and get immediate answers.',
      glow: 'glow-emerald'
    }
  ];

  const testimonials = [
    {
      quote: "Vaultify is the perfect place for my family documents. It is so easy to use, and I love that my private files are completely secure.",
      author: "Marcus Vance",
      role: "Small Business Owner",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    },
    {
      quote: "The built-in document scanner is amazing! I can scan my medical receipts directly into my private folders. Highly recommended!",
      author: "Elena Rostova",
      role: "Freelance Designer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    {
      quote: "I connected Vaultify directly to my own Supabase database in two minutes. Knowing I have absolute ownership over my data is incredible.",
      author: "David Chen",
      role: "Software Developer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    }
  ];

  const faqs = [
    {
      q: "How does the security actually work?",
      a: "When you add a file or password, Vaultify locks it on your device using your private login keys. Only the locked data is sent to your cloud database. This means nobody else—not even us—can read your stored files."
    },
    {
      q: "Can I store the data in my own Supabase database?",
      a: "Yes! You can easily connect your own Supabase project in the Settings page. We even provide the exact SQL code you need to set up your tables instantly."
    },
    {
      q: "Can I use Vaultify on my phone and computer?",
      a: "Absolutely! Vaultify works beautifully on all devices. You can save it directly to your mobile home screen or computer desktop for quick, full-screen access."
    },
    {
      q: "What types of files can I upload?",
      a: "You can safely save images, PDF documents, word files, and standard archives. You can organize them into simple color-coded folders."
    },
    {
      q: "What happens if I forget my password?",
      a: "Because your files are locked with your specific password, please make sure to save it safely! You can also set up Emergency Contacts to help recover access if needed."
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-6 lg:px-12 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg glow-blue">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold tracking-wider text-white text-lg">VAULTIFY</span>
            <span className="block text-[8px] font-extrabold tracking-widest text-blue-400 uppercase -mt-1">SECURE VAULT</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
          <a href="#preview" className="hover:text-white transition-colors">Preview</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/auth')} 
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/auth')} 
            className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-gray-100 transition-all shadow-lg hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants as any}
          className="space-y-6 max-w-4xl mx-auto"
        >
          {/* Tagline Badge */}
          <motion.div variants={itemVariants as any} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-gray-300 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Simple, Secure & Private Cloud Storage</span>
            <ChevronRight className="w-3 h-3 text-gray-500" />
          </motion.div>

          {/* Main Headline */}
          <motion.h1 variants={itemVariants as any} className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] font-display">
            The secure <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Digital Vault</span> for your important files.
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants as any} className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Safely store your personal IDs, passwords, medical records, and private notes. Easy for everyone to use, with absolute privacy guaranteed.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants as any} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all shadow-xl glow-blue flex items-center justify-center gap-2 group"
            >
              <span>Open Your Free Vault</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white font-semibold text-base border border-white/10 transition-all backdrop-blur-md"
            >
              Connect Your Supabase
            </button>
          </motion.div>

          {/* Trust points */}
          <motion.div variants={itemVariants as any} className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>100% Private & Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Connect Your Own Database</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Works on All Devices</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          id="preview"
          className="mt-16 relative rounded-2xl md:rounded-[32px] p-2 sm:p-4 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
          {/* Top Window Actions Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 rounded-t-xl md:rounded-t-[24px]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-gray-500 font-mono ml-2">vaultify.app/my-vault</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-semibold">
                Private & Secure
              </span>
            </div>
          </div>

          {/* Inner Preview */}
          <div className="bg-slate-950 rounded-b-xl md:rounded-b-[20px] overflow-hidden grid grid-cols-1 md:grid-cols-4 text-left border-t border-white/5">
            {/* Sidebar */}
            <div className="hidden md:block p-4 border-r border-white/10 space-y-4 bg-slate-900/40">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Database className="w-4 h-4 text-blue-400" />
                <span>MY FOLDERS</span>
              </div>
              <div className="space-y-1">
                {['Personal IDs', 'Family Records', 'Bank Statements', 'Medical Docs', 'Passwords', 'Private Notes'].map((cat, i) => (
                  <div key={i} className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${i === 0 ? 'bg-blue-600/20 text-blue-300 font-semibold' : 'text-gray-400'}`}>
                    <span>{cat}</span>
                    <span className="text-[10px] opacity-60">{i === 0 ? '3' : '1'}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/5">
                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                  <div className="w-1/4 bg-blue-500 h-full" />
                </div>
                <span className="text-[10px] text-gray-500 block mt-1">Ready for your files</span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="md:col-span-3 p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Welcome to your secure space</h3>
                  <p className="text-xs text-gray-400">Everything is organized and fully protected.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate('/auth')} 
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold glow-blue"
                  >
                    + Add New File
                  </button>
                </div>
              </div>

              {/* Grid of clean simple sample items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Passport_Scan.pdf', cat: 'Personal IDs', size: 'Secure PDF', exp: 'Active' },
                  { name: 'House_Deed.pdf', cat: 'Family Records', size: 'Secure PDF', exp: 'Active' },
                  { name: 'Main Email Password', cat: 'Passwords', size: '••••••••', exp: 'Strong' },
                  { name: 'Private Family Notes', cat: 'Notes', size: 'Locked Note', exp: 'Private' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start justify-between group hover:border-white/20 transition-all">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-white/5 text-blue-400">
                        {idx === 2 ? <Key className="w-4 h-4"/> : idx === 3 ? <FileText className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-200 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                          <span className="bg-white/5 px-1.5 py-0.5 rounded text-gray-300">{item.cat}</span>
                          <span>{item.size}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-medium whitespace-nowrap">{item.exp}</span>
                  </div>
                ))}
              </div>

              {/* Security box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-300">Your Vault is 100% Secure</p>
                    <p className="text-[10px] text-gray-400">Ready to save your personal documents safely.</p>
                  </div>
                </div>
                <button onClick={() => navigate('/auth')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                  <span>Start Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            BUILT FOR EVERYDAY PRIVACY
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Simple features that keep your life secure.
          </p>
          <p className="text-sm text-gray-400">
            Vaultify puts everything you need to protect your digital items into one easy application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feat.glow}`}>
                  <Icon className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-base font-bold text-white mb-2 tracking-tight">
                  {feat.title}
                </h3>
                
                <p className="text-xs text-gray-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Explained Simply */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">
              ABSOLUTE PRIVACY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Only you can open your files. Guaranteed.
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Most cloud drives can view your files. Vaultify is different. We lock your files directly on your device before saving them. This means your private items are completely safe from hackers and third parties.
            </p>

            <div className="space-y-4 pt-2">
              {[
                { title: 'Personal Password Lock', desc: 'Your specific login password acts as the only key that can unlock your saved data.' },
                { title: 'Emergency Access', desc: 'You can choose trusted family members to securely receive your files if you are ever unavailable.' },
                { title: 'Connect Your Supabase', desc: 'Store all files directly in your personal cloud database for ultimate ownership.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200">{item.title}</h4>
                    <p className="text-[11px] text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate('/auth')}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors flex items-center gap-2"
              >
                <span>Create Your Secure Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Simple Diagram */}
          <div className="p-6 sm:p-8 rounded-2xl glass-panel-premium border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
              How Your Files Stay Safe
            </h3>

            <div className="space-y-6 relative">
              {/* Step 1 */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="text-xs font-bold text-white">You Select a File</p>
                  <p className="text-[10px] text-gray-400">Choose any document or photo from your phone or computer.</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="w-0.5 h-4 bg-gradient-to-b from-blue-500 to-purple-500 mx-auto" />

              {/* Step 2 */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-300">Instant Device Lock</p>
                  <p className="text-[10px] text-gray-400">The file is immediately scrambled into a secure, unreadable format.</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="w-0.5 h-4 bg-gradient-to-b from-purple-500 to-emerald-500 mx-auto" />

              {/* Step 3 */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Saved to Your Cloud</p>
                  <p className="text-[10px] text-gray-400">The locked file is safely stored. Only your personal app can open it.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            LOVED BY USERS EVERYWHERE
          </h2>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            What people say about Vaultify
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
              <p className="text-xs text-gray-300 leading-relaxed italic">
                "{t.quote}"
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
                <img src={t.avatar} alt={t.author} className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="text-xs font-bold text-white">{t.author}</p>
                  <p className="text-[10px] text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            SIMPLE PRICING
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Start free, upgrade anytime.
          </p>
          
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-950 font-bold shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                billingCycle === 'yearly' ? 'bg-white text-slate-950 font-bold shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly <span className="text-[9px] text-blue-600 bg-blue-100 px-1 py-0.2 rounded font-extrabold">SAVE 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Starter Plan */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Basic Account</span>
              <h3 className="text-3xl font-extrabold text-white">$0</h3>
              <p className="text-xs text-gray-500 mt-1">Free forever for your essential items.</p>

              <div className="mt-8 space-y-3">
                {[
                  'Secure Cloud Storage',
                  'Unlimited Saved Passwords',
                  'Built-in Document Scanner',
                  'Simple Folders & Tags',
                  'Connect Your Supabase DB'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-gray-500" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
              >
                Start Free
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="p-8 rounded-3xl glass-panel-premium border-2 border-blue-500/50 flex flex-col justify-between relative shadow-2xl scale-105 z-10">
            <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-3 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider glow-blue">
              Most Popular
            </div>

            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-2">Premium Vault</span>
              <h3 className="text-4xl font-extrabold text-white">
                {billingCycle === 'yearly' ? '$12' : '$15'}
                <span className="text-xs font-normal text-gray-400"> / month</span>
              </h3>
              <p className="text-xs text-gray-300 mt-1">Billed annually. Full premium protection.</p>

              <div className="mt-8 space-y-3">
                {[
                  '15 GB Premium Cloud Space',
                  'Secret Vault with Custom PIN',
                  'Emergency Family Access',
                  'Unlimited PDF Scanning',
                  'Custom Folder Colors',
                  'Priority Faster Loading'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-white font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg glow-blue"
              >
                Get Premium
              </button>
            </div>
          </div>

          {/* Family Plan */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-2">Family Plan</span>
              <h3 className="text-3xl font-extrabold text-white">
                {billingCycle === 'yearly' ? '$29' : '$35'}
                <span className="text-xs font-normal text-gray-400"> / month</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">Share safely with up to 6 family members.</p>

              <div className="mt-8 space-y-3">
                {[
                  '100 GB Shared Storage',
                  '6 Separate Private Accounts',
                  'Easy Family File Sharing',
                  'Shared Expiry Reminders',
                  'Premium Help & Support'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
              >
                Start Family Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-white/10">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            COMMON QUESTIONS
          </h2>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            Have questions? We are here to help.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                  <span className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90 text-blue-400' : ''}`}>
                    ▶
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent rounded-3xl blur-2xl pointer-events-none" />
        
        <div className="relative glass-panel-premium rounded-3xl p-8 sm:p-12 border border-white/10 space-y-6 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to secure your important items?
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Join thousands of people who use Vaultify to keep their personal documents safe and private.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-gray-100 transition-all shadow-xl"
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg glow-blue"
            >
              Connect Your Supabase
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            No credit card required. Works beautifully on phones and computers.
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
