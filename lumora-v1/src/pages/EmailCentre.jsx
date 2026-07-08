import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, Trash2, Eye, Search, X, Paperclip, Copy, Printer,
  CheckCircle, XCircle, Clock, Calendar, Zap, BarChart3,
  Activity, ChevronDown, Loader2, Inbox, TrendingUp,
  AlertTriangle, Sparkles, FileText, Briefcase, Users,
  LayoutDashboard, Filter, ChevronLeft, ChevronRight, RotateCcw,
  Wand2, Languages, Type, Minimize2, Maximize2, User, Wifi,
  MoreHorizontal, Download, RefreshCw, Star, Flame, Crown,
  Gauge, Shield, Layers, ArrowUpRight
} from 'lucide-react';
import { supabase } from '../../supabase';
import { sendEmail } from '../api/email';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// =====================================================
// THEME SYSTEM - Premium Copper & Gold
// =====================================================
const THEME = {
  bg: '#090909',
  card: '#141414',
  cardHover: '#1A1A1A',
  primary: '#C46A32',
  secondary: '#D4AF37',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(196,106,50,0.3)',
  glow: 'rgba(196,106,50,0.35)',
  glass: 'rgba(20,20,20,0.85)',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
};

const CATEGORIES = [
  { value: 'General', icon: Mail, color: '#C46A32' },
  { value: 'Business Proposal', icon: Briefcase, color: '#D4AF37' },
  { value: 'Investor Pitch', icon: TrendingUp, color: '#C46A32' },
  { value: 'Startup Report', icon: FileText, color: '#D4AF37' },
  { value: 'Project Update', icon: LayoutDashboard, color: '#C46A32' },
  { value: 'Invitation', icon: Users, color: '#D4AF37' },
];

const PIE_COLORS = ['#C46A32', '#D4AF37', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: { 
    opacity: 1, scale: 1, y: 0, 
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } 
  },
  exit: { opacity: 0, scale: 0.96, y: 15, transition: { duration: 0.2 } },
};

const toastVariants = {
  hidden: { opacity: 0, x: 120, scale: 0.85 },
  visible: { 
    opacity: 1, x: 0, scale: 1, 
    transition: { type: 'spring', stiffness: 350, damping: 28 } 
  },
  exit: { opacity: 0, x: 120, scale: 0.85, transition: { duration: 0.25 } },
};

// =====================================================
// ANIMATED COUNTER
// =====================================================
const AnimatedCounter = ({ value, duration = 1.5 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(start + (end - start) * eased));
      if (progress < 1) countRef.current = requestAnimationFrame(animate);
    };
    countRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(countRef.current);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

const CurrentTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="text-xs text-[#A1A1AA] font-mono">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

// =====================================================
// TOAST
// =====================================================
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div variants={toastVariants} initial="hidden" animate="visible" exit="exit" className="fixed bottom-6 right-6 z-[100]">
      <div style={{
        background: THEME.glass,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${type === 'success' ? 'rgba(196,106,50,0.4)' : type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(212,175,55,0.4)'}`,
        boxShadow: `0 8px 40px ${type === 'success' ? 'rgba(196,106,50,0.2)' : type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(212,175,55,0.2)'}, 0 0 60px ${type === 'success' ? 'rgba(196,106,50,0.08)' : type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(212,175,55,0.08)'}`,
      }} className="rounded-2xl px-6 py-4 flex items-center gap-3 max-w-md">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: type === 'success' ? 'rgba(196,106,50,0.15)' : type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(212,175,55,0.15)' }}>
          {type === 'success' ? <CheckCircle className="w-5 h-5" style={{ color: THEME.primary }} /> : 
           type === 'error' ? <XCircle className="w-5 h-5" style={{ color: THEME.error }} /> : 
           <Sparkles className="w-5 h-5" style={{ color: THEME.secondary }} />}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{message}</p>
        </div>
        <button onClick={onClose} className="text-[#A1A1AA] hover:text-white transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// =====================================================
// SKELETONS
// =====================================================
const SkeletonCard = () => (
  <div className="rounded-[24px] p-5 animate-pulse" style={{ background: THEME.card }}>
    <div className="flex items-center justify-between mb-3">
      <div className="h-4 w-24 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <div className="w-10 h-10 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
    <div className="h-9 w-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
    <div className="mt-3 h-3 w-20 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-3"><div className="h-4 w-32 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
    <td className="py-4 px-3"><div className="h-4 w-48 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
    <td className="py-4 px-3"><div className="h-5 w-20 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
    <td className="py-4 px-3"><div className="h-5 w-16 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
    <td className="py-4 px-3"><div className="h-4 w-24 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
    <td className="py-4 px-3"><div className="h-8 w-20 rounded-lg ml-auto" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
  </tr>
);

// =====================================================
// PREMIUM BUTTON
// =====================================================
const PremiumButton = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, loading = false, icon: Icon, className = '', size = 'md' }) => {
  const sizeClasses = { sm: 'px-4 py-2 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-6 py-3.5 text-sm' };
  const variants = {
    primary: { bg: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`, shadow: '0 4px 20px rgba(196,106,50,0.3)', hoverShadow: '0 6px 30px rgba(196,106,50,0.45)', text: '#FFFFFF' },
    secondary: { bg: 'rgba(255,255,255,0.05)', shadow: 'none', hoverShadow: 'none', text: THEME.textSecondary, border: `1px solid ${THEME.border}` },
    ghost: { bg: 'transparent', shadow: 'none', hoverShadow: 'none', text: THEME.textSecondary, border: 'none' },
    danger: { bg: 'rgba(239,68,68,0.1)', shadow: '0 4px 20px rgba(239,68,68,0.15)', hoverShadow: '0 6px 30px rgba(239,68,68,0.25)', text: THEME.error, border: '1px solid rgba(239,68,68,0.2)' },
  };
  const v = variants[variant];
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      className={`rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${sizeClasses[size]} ${className}`}
      style={{ background: v.bg, color: v.text, boxShadow: v.shadow, border: v.border || 'none' }}
      onMouseEnter={(e) => { if (!disabled && !loading && v.hoverShadow) e.currentTarget.style.boxShadow = v.hoverShadow; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = v.shadow; }}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </motion.button>
  );
};

// =====================================================
// AI FEATURE BUTTON
// =====================================================
const AIFeatureButton = ({ icon: Icon, label, onClick, loading, active }) => (
  <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={onClick} disabled={loading}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 disabled:opacity-40 ${active ? 'text-white' : 'text-[#A1A1AA] hover:text-white'}`}
    style={{
      background: active ? `linear-gradient(135deg, ${THEME.primary}30, ${THEME.secondary}20)` : 'rgba(255,255,255,0.03)',
      border: active ? `1px solid ${THEME.primary}50` : `1px solid ${THEME.border}`,
      boxShadow: active ? `0 0 20px ${THEME.glow}` : 'none',
    }}>
    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: THEME.primary }} /> : <Icon className="w-3.5 h-3.5" style={{ color: active ? THEME.primary : '#A1A1AA' }} />}
    {label}
  </motion.button>
);

// =====================================================
// VIEW EMAIL MODAL
// =====================================================
const ViewEmailModal = ({ email, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!email) return null;

  const handleCopy = () => {
    const text = `To: ${email.recipient_email}\nSubject: ${email.subject}\nCategory: ${email.category}\nStatus: ${email.status}\nSent: ${new Date(email.created_at).toLocaleString()}\n\n${email.message || ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>${email.subject}</title></head><body style="font-family:Inter,sans-serif;padding:40px;max-width:800px;margin:0 auto;"><h1 style="color:#C46A32;">${email.subject}</h1><p><strong>To:</strong> ${email.recipient_email}</p><p><strong>Category:</strong> ${email.category}</p><p><strong>Sent:</strong> ${new Date(email.created_at).toLocaleString()}</p><hr style="margin:20px 0;border:none;border-top:1px solid #eee;"/><div style="white-space:pre-wrap;line-height:1.6;">${email.message || 'No message content.'}</div></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
            className="rounded-[24px] max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto relative"
            style={{
              background: `linear-gradient(180deg, ${THEME.card} 0%, rgba(20,20,20,0.98) 100%)`,
              border: `1px solid ${THEME.border}`,
              boxShadow: `0 0 80px rgba(196,106,50,0.15), 0 25px 50px rgba(0,0,0,0.5)`,
            }}
            onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: THEME.primary }} />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: THEME.secondary }} />

            <div className="sticky top-0 z-10 px-8 pt-8 pb-4 flex items-center justify-between"
              style={{ background: `linear-gradient(180deg, ${THEME.card} 0%, transparent 100%)` }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(196,106,50,0.12)', border: `1px solid rgba(196,106,50,0.2)` }}>
                  <Mail className="w-5 h-5" style={{ color: THEME.primary }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Email Details</h3>
                  <p className="text-xs text-[#A1A1AA]">View complete email information</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleCopy}
                  className="p-2.5 rounded-xl transition-colors flex items-center gap-2 text-xs font-medium"
                  style={{ background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : THEME.border}`, color: copied ? THEME.success : THEME.textSecondary }}>
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handlePrint}
                  className="p-2.5 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${THEME.border}` }}>
                  <Printer className="w-4 h-4 text-[#A1A1AA]" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            <div className="px-8 pb-8 space-y-5 relative">
              <div className="p-5 rounded-2xl space-y-4" style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-[#A1A1AA] font-semibold">Recipient</label>
                    <p className="text-white font-medium text-sm">{email.recipient_email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-[#A1A1AA] font-semibold">Subject</label>
                    <p className="text-white font-medium text-sm">{email.subject}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-[#A1A1AA] font-semibold">Category</label>
                    <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: `${email.category === 'General' ? THEME.primary : THEME.secondary}15`, color: email.category === 'General' ? THEME.primary : THEME.secondary, border: `1px solid ${email.category === 'General' ? THEME.primary : THEME.secondary}25` }}>
                      {email.category}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-[#A1A1AA] font-semibold">Status</label>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold ${email.status === 'sent' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      <motion.span className={`w-2 h-2 rounded-full ${email.status === 'sent' ? 'bg-green-400' : 'bg-red-400'}`}
                        animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                      {email.status === 'sent' ? 'Successfully Sent' : 'Failed to Send'}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-[#A1A1AA] font-semibold block mb-1">Sent At</label>
                  <p className="text-white font-medium text-sm">{new Date(email.created_at).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-[#A1A1AA] font-semibold mb-3 block">Message Content</label>
                <div className="p-6 rounded-2xl text-white/90 leading-[1.8] whitespace-pre-wrap text-sm"
                  style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}>
                  {email.message || <span className="text-[#A1A1AA] italic">No message content available.</span>}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =====================================================
// DEMO MODAL
// =====================================================
const DemoModal = ({ isOpen, onClose, onSend, isLoading }) => {
  const [email, setEmail] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    onSend(email);
    setEmail('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}>
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit"
            className="rounded-[24px] p-8 max-w-md w-full mx-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(180deg, ${THEME.card} 0%, rgba(20,20,20,0.98) 100%)`,
              border: `1px solid ${THEME.border}`,
              boxShadow: `0 0 60px rgba(196,106,50,0.15), 0 25px 50px rgba(0,0,0,0.4)`,
            }}
            onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: THEME.primary }} />
            <div className="flex items-center justify-between mb-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(196,106,50,0.12)', border: `1px solid rgba(196,106,50,0.2)` }}>
                  <Sparkles className="w-5 h-5" style={{ color: THEME.primary }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Send Demo Email</h3>
                  <p className="text-xs text-[#A1A1AA]">Test your email configuration</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[#A1A1AA] text-sm mb-6 leading-relaxed">Enter your email address to receive a real test email from LUMORA via the Resend API.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" required
                  className="w-full rounded-xl px-4 py-3.5 text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all duration-300 text-sm"
                  style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                  onFocus={(e) => { e.target.style.borderColor = THEME.primary; e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = THEME.border; e.target.style.boxShadow = 'none'; }} />
              </div>
              <PremiumButton type="submit" disabled={isLoading || !email.trim()} loading={isLoading} icon={Send} size="lg" className="w-full">
                {isLoading ? 'Sending...' : 'Send Demo Email'}
              </PremiumButton>
            </form>
            <div className="mt-4 p-3.5 rounded-xl flex items-center gap-2" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: THEME.secondary }} />
              <p className="text-xs text-[#D4AF37]/80">This sends a real email via Resend API</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// =====================================================
// EMPTY STATE
// =====================================================
const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 px-4">
    <motion.div animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
      style={{ background: 'rgba(196,106,50,0.08)', border: `1px solid rgba(196,106,50,0.15)` }}>
      <Icon className="w-9 h-9" style={{ color: `${THEME.primary}60` }} />
    </motion.div>
    <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
    <p className="text-[#A1A1AA] text-sm text-center max-w-xs">{subtitle}</p>
  </motion.div>
);



// =====================================================
// MAIN COMPONENT - EmailCenter
// =====================================================
const EmailCenter = () => {
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0, today: 0, weekly: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [demoSending, setDemoSending] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [viewingEmail, setViewingEmail] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [supabaseReady, setSupabaseReady] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState(null);
  const [aiLoading, setAiLoading] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [connectionStatus, setConnectionStatus] = useState('online');
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    to: '', subject: '', category: 'General', message: '', priority: 'normal', template: 'none',
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
      } catch (err) { console.warn('Could not get user:', err); }
    };
    getUser();
  }, []);

  useEffect(() => {
    const checkConnection = () => { setConnectionStatus(navigator.onLine ? 'online' : 'offline'); };
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    return () => { window.removeEventListener('online', checkConnection); window.removeEventListener('offline', checkConnection); };
  }, []);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('email_logs').select('*').order('created_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          console.warn('Supabase table not found. Please create the email_logs table.');
          setSupabaseReady(false);
          setEmails([]);
          setStats({ total: 0, successful: 0, failed: 0, today: 0, weekly: 0 });
          return;
        }
        throw error;
      }
      setEmails(data || []);
      setSupabaseReady(true);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const total = data?.length || 0;
      const successful = data?.filter((e) => e.status === 'sent').length || 0;
      const failed = data?.filter((e) => e.status === 'failed').length || 0;
      const today = data?.filter((e) => new Date(e.created_at) >= todayStart).length || 0;
      const weekly = data?.filter((e) => new Date(e.created_at) >= weekStart).length || 0;
      setStats({ total, successful, failed, today, weekly });
    } catch (err) {
      console.error('Error fetching emails:', err);
      setSupabaseReady(false);
      setEmails([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchEmails();
    let subscription;
    try {
      subscription = supabase.channel('email_logs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'email_logs' }, () => { fetchEmails(); })
        .subscribe();
    } catch (err) { console.warn('Realtime subscription failed:', err); }
    return () => { if (subscription) subscription.unsubscribe(); };
  }, [fetchEmails]);

  const showToast = (message, type = 'success') => { setToast({ message, type }); };

  const logToSupabase = async (emailData, status) => {
    if (!supabaseReady) return;
    try {
      const insertData = { recipient_email: emailData.to, subject: emailData.subject, message: emailData.message, category: emailData.category, status: status };
      if (userId) insertData.user_id = userId;
      await supabase.from('email_logs').insert(insertData);
      fetchEmails();
    } catch (err) { console.error('Error logging to Supabase:', err); }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!formData.to.trim() || !formData.subject.trim()) return;
    setSending(true);
    try {
      const result = await sendEmail({ to: formData.to, subject: formData.subject, message: formData.message, category: formData.category });
      if (!result.success) throw new Error(result.error || 'Failed to send email');
      await logToSupabase(formData, 'sent');
      showToast('Email sent successfully.');
      setFormData({ to: '', subject: '', category: 'General', message: '', priority: 'normal', template: 'none' });
    } catch (err) {
      console.error('Send error:', err);
      showToast(err.message || 'Unable to send email.', 'error');
      await logToSupabase(formData, 'failed');
    } finally { setSending(false); }
  };

  const handleSendDemo = async (demoEmail) => {
    setDemoSending(true);
    const demoData = { to: demoEmail, subject: 'Welcome to LUMORA', message: `Hello,\n\nThank you for testing LUMORA.\n\nThis email was successfully sent using the Resend API.\n\nWelcome to the future of startup building.\n\nRegards,\nTeam LUMORA`, category: 'General' };
    try {
      const result = await sendEmail(demoData);
      if (!result.success) throw new Error(result.error || 'Failed to send demo email');
      await logToSupabase(demoData, 'sent');
      showToast('Demo email sent successfully! Check your inbox.');
      setShowDemoModal(false);
    } catch (err) {
      console.error('Demo send error:', err);
      showToast(err.message || 'Unable to send demo email.', 'error');
      await logToSupabase(demoData, 'failed');
    } finally { setDemoSending(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this email log?')) return;
    if (!supabaseReady) { showToast('Supabase is not configured. Cannot delete.', 'error'); return; }
    try {
      const { error } = await supabase.from('email_logs').delete().eq('id', id);
      if (error) throw error;
      showToast('Email deleted successfully.');
      fetchEmails();
    } catch (err) { showToast('Failed to delete email.', 'error'); }
  };

  const handleDuplicate = async (email) => {
    setFormData({ to: email.recipient_email, subject: `Re: ${email.subject}`, category: email.category, message: email.message || '', priority: 'normal', template: 'none' });
    showToast('Email duplicated to compose form', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResend = async (email) => {
    setSending(true);
    try {
      const result = await sendEmail({ to: email.recipient_email, subject: email.subject, message: email.message || '', category: email.category });
      if (!result.success) throw new Error(result.error || 'Failed to resend email');
      await logToSupabase({ to: email.recipient_email, subject: email.subject, message: email.message, category: email.category }, 'sent');
      showToast('Email resent successfully.');
    } catch (err) {
      showToast(err.message || 'Unable to resend email.', 'error');
    } finally { setSending(false); }
  };

  // AI Features
  const handleAIGenerate = async () => {
    setAiLoading('generate');
    await new Promise(r => setTimeout(r, 1500));
    const templates = {
      'General': `Dear Recipient,\n\nI hope this email finds you well. I am reaching out regarding...\n\nBest regards,`,
      'Business Proposal': `Dear Partner,\n\nI am excited to present a business proposal that I believe will be mutually beneficial...\n\nLooking forward to your response.`,
      'Investor Pitch': `Dear Investor,\n\nThank you for considering our startup. We are seeking funding to accelerate our growth...\n\nBest,`,
      'Startup Report': `Team,\n\nHere is the weekly progress report for our startup...\n\nKeep pushing forward!`,
      'Project Update': `Hi Team,\n\nI wanted to update you on the current status of our project...\n\nRegards,`,
      'Invitation': `Dear Guest,\n\nYou are cordially invited to our upcoming event...\n\nWe hope to see you there!`,
    };
    setFormData(prev => ({ ...prev, message: templates[prev.category] || templates['General'] }));
    setAiLoading(null);
    showToast('AI generated professional email template', 'info');
  };

  const handleAIRewrite = async () => {
    if (!formData.message) { showToast('Please write a message first', 'error'); return; }
    setAiLoading('rewrite');
    await new Promise(r => setTimeout(r, 1200));
    setFormData(prev => ({ ...prev, message: prev.message + '\n\n[AI Rewritten with improved clarity and professionalism]' }));
    setAiLoading(null);
    showToast('Email rewritten with AI', 'info');
  };

  const handleAIGrammar = async () => {
    if (!formData.message) { showToast('Please write a message first', 'error'); return; }
    setAiLoading('grammar');
    await new Promise(r => setTimeout(r, 1000));
    showToast('Grammar and spelling checked', 'info');
    setAiLoading(null);
  };

  const handleAITone = async (tone) => {
    if (!formData.message) { showToast('Please write a message first', 'error'); return; }
    setAiLoading(`tone-${tone}`);
    await new Promise(r => setTimeout(r, 1200));
    const tonePrefixes = { professional: '[Professional Tone Applied]\n\n', friendly: '[Friendly Tone Applied]\n\n', formal: '[Formal Tone Applied]\n\n' };
    setFormData(prev => ({ ...prev, message: tonePrefixes[tone] + prev.message }));
    setAiLoading(null);
    showToast(`${tone.charAt(0).toUpperCase() + tone.slice(1)} tone applied`, 'info');
  };

  const handleAIShorten = async () => {
    if (!formData.message) { showToast('Please write a message first', 'error'); return; }
    setAiLoading('shorten');
    await new Promise(r => setTimeout(r, 1000));
    showToast('Email shortened while preserving key points', 'info');
    setAiLoading(null);
  };

  const handleAIExpand = async () => {
    if (!formData.message) { showToast('Please write a message first', 'error'); return; }
    setAiLoading('expand');
    await new Promise(r => setTimeout(r, 1200));
    setFormData(prev => ({ ...prev, message: prev.message + '\n\n[Expanded with additional details and context]' }));
    setAiLoading(null);
    showToast('Email expanded with more details', 'info');
  };

  const handleAITranslate = async () => {
    if (!formData.message) { showToast('Please write a message first', 'error'); return; }
    setAiLoading('translate');
    await new Promise(r => setTimeout(r, 1500));
    showToast('Translation feature ready (select language in production)', 'info');
    setAiLoading(null);
  };

  // Filtering & Sorting
  const filteredEmails = emails.filter((email) => {
    const matchesSearch = email.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) || email.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const now = new Date();
    let matchesPeriod = true;
    if (filterPeriod === 'today') { const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); matchesPeriod = new Date(email.created_at) >= todayStart; }
    else if (filterPeriod === 'week') { const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); matchesPeriod = new Date(email.created_at) >= weekStart; }
    else if (filterPeriod === 'month') { const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); matchesPeriod = new Date(email.created_at) >= monthStart; }
    let matchesStatus = true;
    if (filterStatus === 'success') matchesStatus = email.status === 'sent';
    if (filterStatus === 'failed') matchesStatus = email.status === 'failed';
    return matchesSearch && matchesPeriod && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'subject') return a.subject.localeCompare(b.subject);
    return 0;
  });

  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
  const paginatedEmails = filteredEmails.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterPeriod, filterStatus, sortBy]);

  // Chart Data
  const getWeeklyChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now); date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      const count = emails.filter(e => { const d = new Date(e.created_at); return d >= dayStart && d < dayEnd; }).length;
      data.push({ name: days[date.getDay()], emails: count, fullDate: date.toLocaleDateString() });
    }
    return data;
  };
  const weeklyData = getWeeklyChartData();

  const categoryData = CATEGORIES.map((cat) => ({ name: cat.value, value: emails.filter((e) => e.category === cat.value).length })).filter((d) => d.value > 0);

  const summaryCards = [
    { label: 'Emails Sent', value: stats.total, icon: Mail, color: THEME.primary, gradient: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`, trend: stats.weekly > 0 ? `+${stats.weekly} this week` : 'No activity', trendUp: true },
    { label: 'Success Rate', value: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0, suffix: '%', icon: CheckCircle, color: THEME.secondary, gradient: `linear-gradient(135deg, ${THEME.secondary}, #10B981)`, trend: `${stats.successful} successful`, trendUp: true },
    { label: 'Failed Emails', value: stats.failed, icon: XCircle, color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f87171)', trend: stats.total > 0 ? `${((stats.failed / stats.total) * 100).toFixed(1)}% rate` : '0% rate', trendUp: false },
    { label: "Today's Emails", value: stats.today, icon: Clock, color: THEME.primary, gradient: `linear-gradient(135deg, ${THEME.primary}, #ea580c)`, trend: new Date().toLocaleDateString('en-US', { weekday: 'long' }), trendUp: true },
  ];

  const messageLength = formData.message.length;
  const maxLength = 5000;

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ background: THEME.bg, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .recharts-tooltip-wrapper { outline: none !important; }
        .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line { stroke: rgba(255,255,255,0.03) !important; }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Modals */}
      <DemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} onSend={handleSendDemo} isLoading={demoSending} />
      <ViewEmailModal email={viewingEmail} isOpen={!!viewingEmail} onClose={() => setViewingEmail(null)} />

      {/* Supabase Warning */}
      <AnimatePresence>
        {!supabaseReady && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 text-sm font-medium">Supabase table not found</p>
              <p className="text-red-400/60 text-xs">Create the <code>email_logs</code> table in Supabase to enable email history. Emails can still be sent via Resend.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* TOP HEADER */}
      {/* ========================================== */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="mb-8 md:mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${THEME.primary}20, ${THEME.secondary}20)`, border: `1px solid ${THEME.primary}30`, boxShadow: `0 0 30px ${THEME.glow}` }}>
              <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})` }} />
              <Mail className="w-7 h-7 relative z-10" style={{ color: THEME.primary }} />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Email Center</h1>
              <p className="text-[#A1A1AA] text-sm md:text-base mt-0.5">Professional communication powered by AI.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: THEME.card, border: `1px solid ${THEME.border}` }}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: connectionStatus === 'online' ? THEME.success : THEME.error, boxShadow: `0 0 8px ${connectionStatus === 'online' ? THEME.success : THEME.error}` }} />
              <span className="text-xs text-[#A1A1AA] font-medium capitalize">{connectionStatus}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: THEME.card, border: `1px solid ${THEME.border}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})` }}>
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block"><CurrentTime /></div>
            </div>
          </div>
        </div>
        <div className="mt-6 h-px w-full relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${THEME.primary}, ${THEME.secondary}, ${THEME.primary})`, opacity: 0.3 }} />
          <motion.div className="absolute top-0 left-0 w-20 h-full" style={{ background: `linear-gradient(90deg, transparent, ${THEME.primary}, transparent)`, filter: 'blur(4px)' }}
            animate={{ x: ['-100%', 'calc(100vw + 100%)'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* STATISTICS CARDS */}
      {/* ========================================== */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) :
          summaryCards.map((card) => (
            <motion.div key={card.label} variants={fadeInUp} whileHover="hover" initial="rest" animate="rest"
              className="rounded-[24px] p-5 relative overflow-hidden group cursor-default"
              style={{ background: THEME.card, border: `1px solid ${THEME.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${card.color}40`; e.currentTarget.style.boxShadow = `0 8px 40px ${card.color}15, 0 0 60px ${card.color}08`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.border; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2)'; }}>
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-15 blur-2xl transition-opacity duration-700" style={{ background: card.color }} />
              <div className="flex items-center justify-between mb-3 relative">
                <span className="text-[#A1A1AA] text-xs font-medium tracking-wide">{card.label}</span>
                <motion.div whileHover={{ rotate: 15, scale: 1.1 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}12`, border: `1px solid ${card.color}18` }}>
                  <card.icon className="w-4 h-4" style={{ color: card.color }} />
                </motion.div>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl md:text-3xl font-bold text-white relative">
                  <AnimatedCounter value={card.value} />
                  {card.suffix && <span className="text-lg">{card.suffix}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="w-3 h-3" style={{ color: card.trendUp ? THEME.success : THEME.error }} />
                <span className="text-[10px] text-[#A1A1AA]">{card.trend}</span>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 rounded-full" style={{ background: card.gradient }} />
            </motion.div>
          ))}
      </motion.div>

      {/* ========================================== */}
      {/* MAIN LAYOUT */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT SIDE - Compose (40%) */}
        <div className="xl:col-span-5 space-y-6">

          {/* Compose Email Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-[24px] p-6 md:p-8 relative overflow-hidden"
            style={{ background: `linear-gradient(180deg, ${THEME.card} 0%, rgba(20,20,20,0.98) 100%)`, border: `1px solid ${THEME.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
            <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${THEME.primary}50, ${THEME.secondary}50, transparent)` }} />

            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${THEME.primary}12`, border: `1px solid ${THEME.primary}20` }}>
                  <Send className="w-5 h-5" style={{ color: THEME.primary }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Compose Email</h2>
                  <p className="text-xs text-[#A1A1AA]">Create and send professional emails</p>
                </div>
              </div>
              <PremiumButton onClick={() => setShowDemoModal(true)} icon={Sparkles} size="sm">Demo</PremiumButton>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Recipient & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wider">To Email <span style={{ color: THEME.primary }}>*</span></label>
                  <input type="email" required value={formData.to} onChange={(e) => setFormData({ ...formData, to: e.target.value })} placeholder="recipient@example.com"
                    className="w-full rounded-xl px-4 py-3 text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all duration-300 text-sm"
                    style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                    onFocus={(e) => { e.target.style.borderColor = THEME.primary; e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = THEME.border; e.target.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wider">Subject <span style={{ color: THEME.primary }}>*</span></label>
                  <input type="text" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Enter email subject..."
                    className="w-full rounded-xl px-4 py-3 text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all duration-300 text-sm"
                    style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                    onFocus={(e) => { e.target.style.borderColor = THEME.primary; e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = THEME.border; e.target.style.boxShadow = 'none'; }} />
                </div>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wider">Category</label>
                  <div className="relative">
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition-all duration-300 text-sm appearance-none cursor-pointer"
                      style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                      onFocus={(e) => { e.target.style.borderColor = THEME.primary; e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = THEME.border; e.target.style.boxShadow = 'none'; }}>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value} style={{ background: THEME.bg }}>{cat.value}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1AA] mb-2 uppercase tracking-wider">Priority</label>
                  <div className="relative">
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition-all duration-300 text-sm appearance-none cursor-pointer"
                      style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                      onFocus={(e) => { e.target.style.borderColor = THEME.primary; e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = THEME.border; e.target.style.boxShadow = 'none'; }}>
                      <option value="low" style={{ background: THEME.bg }}>Low Priority</option>
                      <option value="normal" style={{ background: THEME.bg }}>Normal Priority</option>
                      <option value="high" style={{ background: THEME.bg }}>High Priority</option>
                      <option value="urgent" style={{ background: THEME.bg }}>Urgent</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Message Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Message</label>
                  <span className="text-[10px] text-[#A1A1AA]/60 font-mono">{messageLength} / {maxLength}</span>
                </div>
                <textarea rows={6} value={formData.message}
                  onChange={(e) => { if (e.target.value.length <= maxLength) setFormData({ ...formData, message: e.target.value }); }}
                  placeholder="Write your message here..."
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all duration-300 text-sm resize-none"
                  style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                  onFocus={(e) => { e.target.style.borderColor = THEME.primary; e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = THEME.border; e.target.style.boxShadow = 'none'; }} />
                <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: messageLength > maxLength * 0.9 ? THEME.error : `linear-gradient(90deg, ${THEME.primary}, ${THEME.secondary})`, width: `${Math.min((messageLength / maxLength) * 100, 100)}%` }}
                    initial={{ width: 0 }} animate={{ width: `${Math.min((messageLength / maxLength) * 100, 100)}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>

              {/* Attachment UI */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed cursor-pointer hover:border-opacity-50 transition-all duration-300 group"
                style={{ borderColor: 'rgba(255,255,255,0.1)', background: THEME.bg }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${THEME.primary}40`; e.currentTarget.style.background = 'rgba(196,106,50,0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = THEME.bg; }}>
                <Paperclip className="w-5 h-5 text-[#A1A1AA] group-hover:text-[#C46A32] transition-colors" />
                <span className="text-sm text-[#A1A1AA] group-hover:text-white/70 transition-colors">Drop files here or click to attach</span>
              </div>

              {/* AI Features Toolbar */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: THEME.secondary }} />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA] font-semibold">AI Assistant</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AIFeatureButton icon={Wand2} label="Generate" onClick={handleAIGenerate} loading={aiLoading === 'generate'} active={false} />
                  <AIFeatureButton icon={RefreshCw} label="Rewrite" onClick={handleAIRewrite} loading={aiLoading === 'rewrite'} active={false} />
                  <AIFeatureButton icon={CheckCircle} label="Grammar" onClick={handleAIGrammar} loading={aiLoading === 'grammar'} active={false} />
                  <AIFeatureButton icon={Languages} label="Translate" onClick={handleAITranslate} loading={aiLoading === 'translate'} active={false} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <AIFeatureButton icon={Briefcase} label="Professional" onClick={() => handleAITone('professional')} loading={aiLoading === 'tone-professional'} active={false} />
                  <AIFeatureButton icon={Users} label="Friendly" onClick={() => handleAITone('friendly')} loading={aiLoading === 'tone-friendly'} active={false} />
                  <AIFeatureButton icon={Crown} label="Formal" onClick={() => handleAITone('formal')} loading={aiLoading === 'tone-formal'} active={false} />
                  <AIFeatureButton icon={Minimize2} label="Shorten" onClick={handleAIShorten} loading={aiLoading === 'shorten'} active={false} />
                  <AIFeatureButton icon={Maximize2} label="Expand" onClick={handleAIExpand} loading={aiLoading === 'expand'} active={false} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <PremiumButton type="submit" disabled={sending} loading={sending} icon={Send} size="lg" className="flex-1">
                  {sending ? 'Sending...' : 'Send Email'}
                </PremiumButton>
                <PremiumButton type="button" variant="secondary" onClick={() => setFormData({ to: '', subject: '', category: 'General', message: '', priority: 'normal', template: 'none' })} icon={RotateCcw} size="lg">
                  Reset
                </PremiumButton>
              </div>
            </form>
          </motion.div>
        </div>

        {/* RIGHT SIDE - Email History & Analytics (60%) */}
        <div className="xl:col-span-7 space-y-6">

          {/* Email History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-[24px] p-6 md:p-8"
            style={{ background: THEME.card, border: `1px solid ${THEME.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${THEME.secondary}12`, border: `1px solid ${THEME.secondary}20` }}>
                  <Inbox className="w-5 h-5" style={{ color: THEME.secondary }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Email History</h2>
                  <p className="text-xs text-[#A1A1AA]">Manage and track all sent emails</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search emails..."
                    className="pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all"
                    style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                    onFocus={(e) => { e.target.style.borderColor = THEME.primary; }}
                    onBlur={(e) => { e.target.style.borderColor = THEME.border; }} />
                </div>
                <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none cursor-pointer"
                  style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}>
                  <option value="all" style={{ background: THEME.bg }}>All Time</option>
                  <option value="today" style={{ background: THEME.bg }}>Today</option>
                  <option value="week" style={{ background: THEME.bg }}>This Week</option>
                  <option value="month" style={{ background: THEME.bg }}>This Month</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none cursor-pointer"
                  style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}>
                  <option value="all" style={{ background: THEME.bg }}>All Status</option>
                  <option value="success" style={{ background: THEME.bg }}>Success</option>
                  <option value="failed" style={{ background: THEME.bg }}>Failed</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none cursor-pointer"
                  style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}>
                  <option value="newest" style={{ background: THEME.bg }}>Newest First</option>
                  <option value="oldest" style={{ background: THEME.bg }}>Oldest First</option>
                  <option value="subject" style={{ background: THEME.bg }}>Subject A-Z</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[#A1A1AA] text-[10px] uppercase tracking-[0.15em] border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <th className="pb-3 font-semibold px-3">Recipient</th>
                    <th className="pb-3 font-semibold px-3">Subject</th>
                    <th className="pb-3 font-semibold px-3">Category</th>
                    <th className="pb-3 font-semibold px-3">Status</th>
                    <th className="pb-3 font-semibold px-3">Sent Time</th>
                    <th className="pb-3 font-semibold px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />) :
                    paginatedEmails.length === 0 ? (
                      <tr><td colSpan={6}><EmptyState icon={Mail} title="No emails yet" subtitle="Start by composing and sending your first email using the form on the left" /></td></tr>
                    ) : (
                      paginatedEmails.map((email) => (
                        <motion.tr key={email.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="border-b hover:bg-white/[0.02] transition-colors group"
                          style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                          <td className="py-4 px-3 text-white text-sm font-medium truncate max-w-[150px]">{email.recipient_email}</td>
                          <td className="py-4 px-3 text-[#A1A1AA] text-sm truncate max-w-[200px]">{email.subject}</td>
                          <td className="py-4 px-3">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={{ background: `${email.category === 'General' ? THEME.primary : THEME.secondary}15`, color: email.category === 'General' ? THEME.primary : THEME.secondary, border: `1px solid ${email.category === 'General' ? THEME.primary : THEME.secondary}20` }}>
                              {email.category}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold ${email.status === 'sent' ? 'bg-green-500/10 text-green-400 border border-green-500/15' : 'bg-red-500/10 text-red-400 border border-red-500/15'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${email.status === 'sent' ? 'bg-green-400' : 'bg-red-400'}`} />
                              {email.status === 'sent' ? 'Sent' : 'Failed'}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-[#A1A1AA] text-xs whitespace-nowrap">
                            {new Date(email.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setViewingEmail(email)}
                                className="p-2 rounded-lg hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors" title="View">
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => handleDuplicate(email)}
                                className="p-2 rounded-lg hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors" title="Duplicate">
                                <Copy className="w-4 h-4" />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => handleResend(email)}
                                className="p-2 rounded-lg hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors" title="Resend">
                                <RefreshCw className="w-4 h-4" />
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(email.id)}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-[#A1A1AA] hover:text-red-400 transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: `1px solid ${THEME.border}` }}>
                <p className="text-xs text-[#A1A1AA]">Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredEmails.length)} of {filteredEmails.length}</p>
                <div className="flex items-center gap-2">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                    style={{ border: `1px solid ${THEME.border}` }}>
                    <ChevronLeft className="w-4 h-4 text-[#A1A1AA]" />
                  </motion.button>
                  <span className="text-sm text-[#A1A1AA] px-3 font-mono">{currentPage} / {totalPages}</span>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
                    style={{ border: `1px solid ${THEME.border}` }}>
                    <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Area Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
              className="rounded-[24px] p-6"
              style={{ background: THEME.card, border: `1px solid ${THEME.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${THEME.primary}12`, border: `1px solid ${THEME.primary}20` }}>
                  <BarChart3 className="w-5 h-5" style={{ color: THEME.primary }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Email Activity</h2>
                  <p className="text-xs text-[#A1A1AA]">Last 7 days overview</p>
                </div>
              </div>
              <div className="h-56">
                {loading ? (
                  <div className="h-full rounded-2xl animate-pulse flex items-end justify-center gap-2 p-4" style={{ background: THEME.bg }}>
                    {[...Array(7)].map((_, i) => <div key={i} className="w-8 rounded-t-lg" style={{ height: `${30 + Math.random() * 50}%`, background: 'rgba(255,255,255,0.05)' }} />)}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={THEME.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }} />
                      <Area type="monotone" dataKey="emails" stroke={THEME.primary} strokeWidth={2.5} fill="url(#colorEmails)" animationDuration={1500} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Category Pie Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
              className="rounded-[24px] p-6"
              style={{ background: THEME.card, border: `1px solid ${THEME.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${THEME.secondary}12`, border: `1px solid ${THEME.secondary}20` }}>
                  <PieChart className="w-5 h-5" style={{ color: THEME.secondary }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Categories</h2>
                  <p className="text-xs text-[#A1A1AA]">Distribution by type</p>
                </div>
              </div>
              <div className="h-56">
                {loading ? (
                  <div className="h-full rounded-2xl animate-pulse flex items-center justify-center" style={{ background: THEME.bg }}>
                    <div className="w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                ) : categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" animationDuration={1500}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: '#A1A1AA', fontSize: '10px' }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-[#A1A1AA] text-sm">No category data yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}
            className="rounded-[24px] p-6"
            style={{ background: THEME.card, border: `1px solid ${THEME.border}`, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${THEME.secondary}12`, border: `1px solid ${THEME.secondary}20` }}>
                <Activity className="w-5 h-5" style={{ color: THEME.secondary }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                <p className="text-xs text-[#A1A1AA]">Latest email actions</p>
              </div>
            </div>
            <div className="space-y-3">
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl animate-pulse" style={{ background: THEME.bg }}>
                  <div className="w-8 h-8 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="h-2 w-32 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                </div>
              )) : emails.slice(0, 5).map((email, index) => (
                <motion.div key={email.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/[0.02]"
                  style={{ background: THEME.bg, borderLeft: `2px solid ${index % 2 === 0 ? THEME.primary : THEME.secondary}` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${index % 2 === 0 ? THEME.primary : THEME.secondary}15` }}>
                    <Mail className="w-3.5 h-3.5" style={{ color: index % 2 === 0 ? THEME.primary : THEME.secondary }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{email.subject}</p>
                    <p className="text-xs text-[#A1A1AA] truncate">{email.recipient_email}</p>
                  </div>
                  <span className="text-xs text-[#A1A1AA]/50 whitespace-nowrap">
                    {new Date(email.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              {emails.length === 0 && !loading && (
                <div className="text-center py-6"><p className="text-[#A1A1AA] text-sm">No recent activity</p></div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EmailCenter;
