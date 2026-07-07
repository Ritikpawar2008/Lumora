import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabase'; // Aapki Supabase config file

export const LogoutManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Successfully logged out
      navigate('/login');
      // Toast message add kar sakte ho yahan (e.g., toast.success("Logged out successfully"))
    } catch (err) {
      alert("Unable to logout. Please try again.");
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-white hover:text-[#C46A32] transition-colors"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#151515] border border-white/10 p-8 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4 text-[#C46A32]">
                <AlertTriangle size={24} />
                <h2 className="text-xl font-bold text-white">Logout</h2>
              </div>
              <p className="text-gray-400 mb-8">Are you sure you want to logout from your account?</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Logout"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};