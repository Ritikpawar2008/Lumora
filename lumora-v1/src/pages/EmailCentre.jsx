import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, Trash2, Eye, Search, X, Paperclip,
  CheckCircle, XCircle, Clock, Calendar, Zap, BarChart3,
  Activity, ChevronDown, Loader2, Inbox, TrendingUp,
  AlertTriangle, Sparkles, FileText, Briefcase, Users,
  Megaphone, LayoutDashboard, Filter
} from 'lucide-react';
import { supabase } from '../../supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const API_ENDPOINT = "../context/Send-email";

const THEME = {
  bg: '#090909',
  card: '#151515',
  cardHover: '#1a1a1a',
  primary: '#C46A32',
  secondary: '#D4AF37',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(196,106,50,0.3)',
  glass: 'rgba(21,21,21,0.8)',
  success: '#22c55e',
  error: '#ef4444',
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
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } },
};

const toastVariants = {
  hidden: { opacity: 0, x: 100, scale: 0.9 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } },
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed bottom-6 right-6 z-50"
    >
      <div
        style={{
          background: THEME.card,
          border: `1px solid ${type === 'success' ? 'rgba(196,106,50,0.3)' : 'rgba(239,68,68,0.3)'}`,
          boxShadow: `0 0 30px ${type === 'success' ? 'rgba(196,106,50,0.15)' : 'rgba(239,68,68,0.15)'}`,
        }}
        className="rounded-2xl px-6 py-4 flex items-center gap-3 max-w-md"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: type === 'success' ? 'rgba(196,106,50,0.1)' : 'rgba(239,68,68,0.1)',
          }}
        >
          {type === 'success' ? (
            <CheckCircle className="w-5 h-5" style={{ color: THEME.primary }} />
          ) : (
            <XCircle className="w-5 h-5" style={{ color: THEME.error }} />
          )}
        </div>
        <div className="flex-1">
          <p className="text-white font-medium text-sm">{message}</p>
        </div>
        <button onClick={onClose} className="text-[#A1A1AA] hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const SkeletonCard = () => (
  <div
    className="rounded-[20px] p-5 animate-pulse"
    style={{ background: THEME.card }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="h-4 w-24 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
    <div className="h-8 w-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-4 px-2">
      <div className="h-4 w-32 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </td>
    <td className="py-4 px-2">
      <div className="h-4 w-48 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </td>
    <td className="py-4 px-2">
      <div className="h-4 w-20 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </td>
    <td className="py-4 px-2">
      <div className="h-4 w-16 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </td>
    <td className="py-4 px-2">
      <div className="h-4 w-24 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </td>
    <td className="py-4 px-2">
      <div className="h-4 w-16 rounded ml-auto" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </td>
  </tr>
);

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="rounded-[24px] p-8 max-w-md w-full mx-4 relative overflow-hidden"
            style={{
              background: THEME.card,
              border: `1px solid ${THEME.border}`,
              boxShadow: '0 0 60px rgba(196,106,50,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: THEME.primary }}
            />

            <div className="flex items-center justify-between mb-6 relative">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(196,106,50,0.1)' }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: THEME.primary }} />
                </div>
                <h3 className="text-xl font-bold text-white">Send Demo Email</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[#A1A1AA] text-sm mb-6 leading-relaxed">
              Enter your email address to receive a real test email from LUMORA via the Resend API.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  required
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all duration-300"
                  style={{
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = THEME.primary;
                    e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = THEME.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
                  boxShadow: '0 4px 20px rgba(196,106,50,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 6px 30px rgba(196,106,50,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 20px rgba(196,106,50,0.3)';
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Demo Email
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)' }}>
              <p className="text-xs text-[#D4AF37]/80 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                This sends a real email via Resend API
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ViewEmailModal = ({ email, isOpen, onClose }) => {
  if (!email) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="rounded-[24px] p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            style={{
              background: THEME.card,
              border: `1px solid ${THEME.border}`,
              boxShadow: '0 0 60px rgba(196,106,50,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5" style={{ color: THEME.primary }} />
                Email Details
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: THEME.bg }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#A1A1AA] uppercase tracking-wider">Recipient</label>
                    <p className="text-white font-medium mt-1">{email.recipient_email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A1AA] uppercase tracking-wider">Subject</label>
                    <p className="text-white font-medium mt-1">{email.subject}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A1AA] uppercase tracking-wider">Category</label>
                    <span
                      className="inline-block mt-1 px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{
                        background: `${email.category === 'General' ? THEME.primary : THEME.secondary}15`,
                        color: email.category === 'General' ? THEME.primary : THEME.secondary,
                      }}
                    >
                      {email.category}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs text-[#A1A1AA] uppercase tracking-wider">Status</label>
                    <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                      email.status === 'sent'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${email.status === 'sent' ? 'bg-green-400' : 'bg-red-400'}`} />
                      {email.status === 'sent' ? 'Sent' : 'Failed'}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-[#A1A1AA] uppercase tracking-wider">Sent At</label>
                    <p className="text-white font-medium mt-1">
                      {new Date(email.created_at).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#A1A1AA] uppercase tracking-wider mb-2 block">Message</label>
                <div
                  className="p-5 rounded-xl text-white/90 leading-relaxed whitespace-pre-wrap"
                  style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                >
                  {email.message || 'No message content available.'}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const EmailCenter = () => {
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    today: 0,
    weekly: 0,
  });
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

  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    category: 'General',
    message: '',
  });

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false });

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();

    let subscription;
    try {
      subscription = supabase
        .channel('email_logs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'email_logs' }, () => {
          fetchEmails();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription failed:', err);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchEmails]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

   const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!formData.to.trim() || !formData.subject.trim()) return;

    setSending(true);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          message: formData.message,
          category: formData.category,
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let result = {};
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { error: text || `Server returned ${response.status}` };
      }

      if (!response.ok) throw new Error(result.error || `Failed to send email (${response.status})`);

      // Log to Supabase
      if (supabaseReady) {
        await supabase.from('email_logs').insert({
          recipient_email: formData.to,
          subject: formData.subject,
          message: formData.message,
          category: formData.category,
          status: 'sent',
        });
        fetchEmails();
      }

      showToast('Email sent successfully.');
      setFormData({ to: '', subject: '', category: 'General', message: '' });
    } catch (err) {
      console.error('Send error:', err);
      showToast(err.message || 'Unable to send email.', 'error');

      // Log failure
      if (supabaseReady) {
        await supabase.from('email_logs').insert({
          recipient_email: formData.to,
          subject: formData.subject,
          message: formData.message,
          category: formData.category,
          status: 'failed',
        });
        fetchEmails();
      }
    } finally {
      setSending(false);
    }
  };


  const handleSendDemo = async (demoEmail) => {
    setDemoSending(true);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: demoEmail,
          subject: 'Welcome to LUMORA',
          message: `Hello,\n\nThank you for testing LUMORA.\n\nThis email was successfully sent using the Resend API.\n\nWelcome to the future of startup building.\n\nRegards,\nTeam LUMORA`,
          category: 'General',
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let result = {};
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { error: text || `Server returned ${response.status}` };
      }

      if (!response.ok) throw new Error(result.error || `Failed to send demo email (${response.status})`);

      // Log to Supabase
      if (supabaseReady) {
        await supabase.from('email_logs').insert({
          recipient_email: demoEmail,
          subject: 'Welcome to LUMORA',
          message: 'Demo welcome email content',
          category: 'General',
          status: 'sent',
        });
        fetchEmails();
      }

      showToast('Demo email sent successfully! Check your inbox.');
      setShowDemoModal(false);
    } catch (err) {
      console.error('Demo send error:', err);
      showToast(err.message || 'Unable to send demo email.', 'error');

      if (supabaseReady) {
        await supabase.from('email_logs').insert({
          recipient_email: demoEmail,
          subject: 'Welcome to LUMORA',
          message: 'Demo welcome email content',
          category: 'General',
          status: 'failed',
        });
        fetchEmails();
      }
    } finally {
      setDemoSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this email log?')) return;
    if (!supabaseReady) {
      showToast('Supabase is not configured. Cannot delete.', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('email_logs').delete().eq('id', id);
      if (error) throw error;
      showToast('Email deleted successfully.');
      fetchEmails();
    } catch (err) {
      showToast('Failed to delete email.', 'error');
    }
  };

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const now = new Date();
    let matchesPeriod = true;
    if (filterPeriod === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchesPeriod = new Date(email.created_at) >= todayStart;
    } else if (filterPeriod === 'week') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesPeriod = new Date(email.created_at) >= weekStart;
    } else if (filterPeriod === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      matchesPeriod = new Date(email.created_at) >= monthStart;
    }

    let matchesStatus = true;
    if (filterStatus === 'success') matchesStatus = email.status === 'sent';
    if (filterStatus === 'failed') matchesStatus = email.status === 'failed';

    return matchesSearch && matchesPeriod && matchesStatus;
  });

  const weeklyData = [
    { name: 'Mon', emails: Math.floor(Math.random() * 10) + 1 },
    { name: 'Tue', emails: Math.floor(Math.random() * 10) + 1 },
    { name: 'Wed', emails: Math.floor(Math.random() * 10) + 1 },
    { name: 'Thu', emails: Math.floor(Math.random() * 10) + 1 },
    { name: 'Fri', emails: Math.floor(Math.random() * 10) + 1 },
    { name: 'Sat', emails: Math.floor(Math.random() * 5) + 1 },
    { name: 'Sun', emails: Math.floor(Math.random() * 5) + 1 },
  ];

  const categoryData = CATEGORIES.map((cat) => ({
    name: cat.value,
    value: emails.filter((e) => e.category === cat.value).length,
  })).filter((d) => d.value > 0);

  const summaryCards = [
    { label: 'Total Emails', value: stats.total, icon: Mail, color: THEME.primary, gradient: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})` },
    { label: 'Successful', value: stats.successful, icon: CheckCircle, color: THEME.secondary, gradient: `linear-gradient(135deg, ${THEME.secondary}, #10B981)` },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
    { label: "Today's Emails", value: stats.today, icon: Clock, color: THEME.primary, gradient: `linear-gradient(135deg, ${THEME.primary}, #ea580c)` },
    { label: 'Weekly Emails', value: stats.weekly, icon: Calendar, color: THEME.secondary, gradient: `linear-gradient(135deg, ${THEME.secondary}, #d97706)` },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: THEME.bg, fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${THEME.bg}; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .recharts-tooltip-wrapper { outline: none !important; }
      `}</style>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onSend={handleSendDemo}
        isLoading={demoSending}
      />
      <ViewEmailModal
        email={viewingEmail}
        isOpen={!!viewingEmail}
        onClose={() => setViewingEmail(null)}
      />

      {!supabaseReady && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 text-sm font-medium">Supabase table not found</p>
            <p className="text-red-400/70 text-xs">Create the <code>email_logs</code> table in Supabase to enable email history. Emails can still be sent via Resend.</p>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 md:mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${THEME.primary}20, ${THEME.secondary}20)`,
              border: `1px solid ${THEME.primary}30`,
            }}
          >
            <Mail className="w-6 h-6" style={{ color: THEME.primary }} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Email Center
            </h1>
          </div>
        </div>
        <p className="text-[#A1A1AA] text-base md:text-lg ml-[60px]">
          Send professional emails directly from LUMORA using Resend.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8 md:mb-10"
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : summaryCards.map((card) => (
              <motion.div
                key={card.label}
                variants={fadeInUp}
                className="rounded-[20px] p-5 relative overflow-hidden group cursor-default"
                style={{
                  background: THEME.card,
                  border: `1px solid ${THEME.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${card.color}40`;
                  e.currentTarget.style.boxShadow = `0 0 30px ${card.color}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = THEME.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500"
                  style={{ background: card.color }}
                />
                <div className="flex items-center justify-between mb-3 relative">
                  <span className="text-[#A1A1AA] text-xs md:text-sm font-medium">{card.label}</span>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${card.color}15` }}
                  >
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-white relative group-hover:scale-105 transition-transform duration-300 origin-left">
                  {card.value.toLocaleString()}
                </p>
                <div
                  className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
                  style={{ background: card.gradient }}
                />
              </motion.div>
            ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-[20px] p-6 md:p-8 relative overflow-hidden"
            style={{
              background: THEME.card,
              border: `1px solid ${THEME.border}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="absolute top-0 left-0 w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${THEME.primary}40, transparent)` }} />

            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${THEME.primary}15` }}>
                  <Send className="w-4 h-4" style={{ color: THEME.primary }} />
                </div>
                Compose Email
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDemoModal(true)}
                className="px-4 py-2.5 rounded-xl text-white font-medium text-sm flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
                  boxShadow: '0 4px 20px rgba(196,106,50,0.3)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                Send Demo Email
              </motion.button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                    To Email <span style={{ color: THEME.primary }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    placeholder="recipient@example.com"
                    className="w-full rounded-xl px-4 py-3 text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all duration-300 text-sm"
                    style={{
                      background: THEME.bg,
                      border: `1px solid ${THEME.border}`,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = THEME.primary;
                      e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = THEME.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">
                    Subject <span style={{ color: THEME.primary }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Enter email subject..."
                    className="w-full rounded-xl px-4 py-3 text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all duration-300 text-sm"
                    style={{
                      background: THEME.bg,
                      border: `1px solid ${THEME.border}`,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = THEME.primary;
                      e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = THEME.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Category</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition-all duration-300 text-sm appearance-none cursor-pointer"
                    style={{
                      background: THEME.bg,
                      border: `1px solid ${THEME.border}`,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = THEME.primary;
                      e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = THEME.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} style={{ background: THEME.bg }}>
                        {cat.value}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Message</label>
                <textarea
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Write your message here..."
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all duration-300 text-sm resize-none"
                  style={{
                    background: THEME.bg,
                    border: `1px solid ${THEME.border}`,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = THEME.primary;
                    e.target.style.boxShadow = '0 0 0 3px rgba(196,106,50,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = THEME.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div
                className="flex items-center gap-3 p-4 rounded-xl border border-dashed cursor-pointer hover:border-opacity-50 transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.1)', background: THEME.bg }}
              >
                <Paperclip className="w-5 h-5 text-[#A1A1AA]" />
                <span className="text-sm text-[#A1A1AA]">Drop files here or click to attach</span>
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  type="submit"
                  disabled={sending}
                  whileHover={!sending ? { scale: 1.02 } : {}}
                  whileTap={!sending ? { scale: 0.98 } : {}}
                  className="flex-1 py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.primary}, ${THEME.secondary})`,
                    boxShadow: '0 4px 20px rgba(196,106,50,0.3)',
                  }}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Email
                    </>
                  )}
                </motion.button>
                <button
                  type="button"
                  onClick={() => setFormData({ to: '', subject: '', category: 'General', message: '' })}
                  className="px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-300 hover:text-white"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${THEME.border}`,
                    color: THEME.textSecondary,
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-[20px] p-6 md:p-8"
            style={{
              background: THEME.card,
              border: `1px solid ${THEME.border}`,
            }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${THEME.secondary}15` }}>
                  <Inbox className="w-4 h-4" style={{ color: THEME.secondary }} />
                </div>
                Email History
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search emails..."
                    className="pl-9 pr-4 py-2 rounded-xl text-sm text-white placeholder-[#A1A1AA]/40 focus:outline-none transition-all"
                    style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                    onFocus={(e) => {
                      e.target.style.borderColor = THEME.primary;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = THEME.border;
                    }}
                  />
                </div>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm text-white focus:outline-none cursor-pointer"
                  style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm text-white focus:outline-none cursor-pointer"
                  style={{ background: THEME.bg, border: `1px solid ${THEME.border}` }}
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[#A1A1AA] text-xs uppercase tracking-wider border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <th className="pb-3 font-medium px-2">Recipient</th>
                    <th className="pb-3 font-medium px-2">Subject</th>
                    <th className="pb-3 font-medium px-2">Category</th>
                    <th className="pb-3 font-medium px-2">Status</th>
                    <th className="pb-3 font-medium px-2">Sent Time</th>
                    <th className="pb-3 font-medium px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : filteredEmails.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <Mail className="w-8 h-8 text-[#A1A1AA]/30" />
                          </div>
                          <p className="text-[#A1A1AA] text-sm">No emails found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEmails.map((email) => (
                      <motion.tr
                        key={email.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b hover:bg-white/[0.02] transition-colors group"
                        style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                      >
                        <td className="py-4 px-2 text-white text-sm font-medium truncate max-w-[150px]">
                          {email.recipient_email}
                        </td>
                        <td className="py-4 px-2 text-[#A1A1AA] text-sm truncate max-w-[200px]">
                          {email.subject}
                        </td>
                        <td className="py-4 px-2">
                          <span
                            className="px-2.5 py-1 rounded-md text-xs font-medium"
                            style={{
                              background: `${email.category === 'General' ? THEME.primary : THEME.secondary}15`,
                              color: email.category === 'General' ? THEME.primary : THEME.secondary,
                            }}
                          >
                            {email.category}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                            email.status === 'sent'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${email.status === 'sent' ? 'bg-green-400' : 'bg-red-400'}`} />
                            {email.status === 'sent' ? 'Sent' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-[#A1A1AA] text-xs">
                          {new Date(email.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingEmail(email)}
                              className="p-2 rounded-lg hover:bg-white/10 text-[#A1A1AA] hover:text-white transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(email.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-[#A1A1AA] hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-[20px] p-6"
            style={{
              background: THEME.card,
              border: `1px solid ${THEME.border}`,
            }}
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${THEME.primary}15` }}>
                <BarChart3 className="w-4 h-4" style={{ color: THEME.primary }} />
              </div>
              Analytics
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: THEME.bg }}>
                <span className="text-sm text-[#A1A1AA]">Success Rate</span>
                <span className="text-lg font-bold" style={{ color: THEME.secondary }}>
                  {stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: THEME.bg }}>
                <span className="text-sm text-[#A1A1AA]">Failure Rate</span>
                <span className="text-lg font-bold text-red-400">
                  {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>

              <div className="h-48 rounded-xl p-4" style={{ background: THEME.bg }}>
                <p className="text-xs text-[#A1A1AA] mb-2">Emails Per Week</p>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#A1A1AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: THEME.card,
                        border: `1px solid ${THEME.border}`,
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      cursor={{ fill: 'rgba(196,106,50,0.05)' }}
                    />
                    <Bar dataKey="emails" radius={[4, 4, 0, 0]}>
                      {weeklyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? THEME.primary : THEME.secondary} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {categoryData.length > 0 && (
                <div className="h-48 rounded-xl p-4" style={{ background: THEME.bg }}>
                  <p className="text-xs text-[#A1A1AA] mb-2">Category Distribution</p>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: THEME.card,
                          border: `1px solid ${THEME.border}`,
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span style={{ color: '#A1A1AA', fontSize: '10px' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-[20px] p-6"
            style={{
              background: THEME.card,
              border: `1px solid ${THEME.border}`,
            }}
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${THEME.secondary}15` }}>
                <Activity className="w-4 h-4" style={{ color: THEME.secondary }} />
              </div>
              Recent Activity
            </h2>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl animate-pulse" style={{ background: THEME.bg }}>
                    <div className="w-8 h-8 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <div className="h-2 w-32 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                  </div>
                ))
              ) : emails.slice(0, 5).map((email, index) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/[0.02]"
                  style={{
                    background: THEME.bg,
                    borderLeft: `2px solid ${index % 2 === 0 ? THEME.primary : THEME.secondary}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${index % 2 === 0 ? THEME.primary : THEME.secondary}15` }}
                  >
                    <Mail className="w-3.5 h-3.5" style={{ color: index % 2 === 0 ? THEME.primary : THEME.secondary }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{email.subject}</p>
                    <p className="text-xs text-[#A1A1AA] truncate">{email.recipient_email}</p>
                    <p className="text-xs text-[#A1A1AA]/50 mt-1">
                      {new Date(email.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {emails.length === 0 && !loading && (
                <div className="text-center py-6">
                  <p className="text-[#A1A1AA] text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EmailCenter;
