import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase'; 
import { Settings, User, Lock, Palette, Plug, Gem, Shield, AlertTriangle, Save, ArrowLeft } from 'lucide-react';

const LumoraSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    full_name: '', email: '', website: '', timezone: 'UTC', autoSave: true
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) setData({ ...profile, email: user.email });
    };
    loadData();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').update({ 
      full_name: data.full_name,
      website: data.website
    }).eq('id', user.id);
    setLoading(false);
    alert('Settings Updated Successfully!');
  };

  const tabs = [
    { name: 'General', icon: Settings },
    { name: 'Account', icon: User },
    { name: 'Security', icon: Lock },
    { name: 'Appearance', icon: Palette },
    { name: 'Integrations', icon: Plug },
    { name: 'Subscription', icon: Gem },
    { name: 'Privacy', icon: Shield },
    { name: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#090909] text-white p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header with Back Button */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/5 border border-white/5 transition-all">
              <ArrowLeft size={20} className="text-[#A1A1AA]" />
            </button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
              <p className="text-[#A1A1AA] mt-2">Manage your workspace configuration.</p>
            </div>
          </div>
          
          <button onClick={handleUpdate} className="px-5 py-2.5 bg-[#C46A32] rounded-xl flex items-center gap-2 hover:bg-[#a85a2a] transition-all font-medium">
            {loading ? 'Saving...' : <><Save size={16}/> Save Changes</>}
          </button>
        </header>

        {/* Content Layout */}
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Nav */}
          <nav className="w-full md:w-64 space-y-2 flex-shrink-0">
            {tabs.map((tab) => (
              <button 
                key={tab.name} 
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.name ? 'bg-[#151515] text-[#C46A32] border border-white/5' : 'text-[#A1A1AA] hover:text-white'}`}
              >
                <tab.icon size={18} /> {tab.name}
              </button>
            ))}
          </nav>

          {/* Tab Content Panel */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab} 
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="bg-[#151515] p-8 rounded-[20px] border border-white/5 shadow-2xl"
              >
                <h2 className="text-2xl font-semibold mb-8">{activeTab}</h2>

                {activeTab === 'General' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 border border-white/5 rounded-lg">
                      <span>Auto Save</span>
                      <input type="checkbox" checked={data.autoSave} onChange={() => setData({...data, autoSave: !data.autoSave})} className="cursor-pointer" />
                    </div>
                  </div>
                )}

                {activeTab === 'Account' && (
                  <div className="space-y-6">
                    <input className="w-full bg-[#090909] p-3 rounded-lg border border-white/5 outline-none focus:border-[#C46A32]" placeholder="Full Name" value={data.full_name} onChange={(e) => setData({...data, full_name: e.target.value})} />
                    <input className="w-full bg-[#090909] p-3 rounded-lg border border-white/5 outline-none" placeholder="Website" value={data.website} onChange={(e) => setData({...data, website: e.target.value})} />
                  </div>
                )}

                {activeTab === 'Security' && (
                  <div className="space-y-6">
                    <input type="password" placeholder="New Password" className="w-full bg-[#090909] p-3 rounded-lg border border-white/5 outline-none" />
                    <button className="text-[#C46A32] text-sm font-medium hover:underline">Reset Password via Email</button>
                  </div>
                )}

                {activeTab === 'Danger Zone' && (
                  <div className="border border-red-900/30 p-6 rounded-2xl bg-red-950/5">
                    <h3 className="text-red-500 font-medium mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Delete Account</h3>
                    <p className="text-sm text-[#A1A1AA] mb-4">This will permanently erase your Lumora startup data.</p>
                    <button className="px-5 py-2.5 bg-red-600/10 text-red-500 rounded-lg border border-red-900 hover:bg-red-600/20 transition-all">
                      Delete Permanently
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default LumoraSettings;