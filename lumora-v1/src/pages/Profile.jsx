import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase'; // Aapki config file
import Sidebar from './Sidebar';

const FounderProfile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ startups: 0, ideas: 0, chats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get Authenticated User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // 2. Fetch Profile from 'profiles' table using user.id
      let { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Agar profile nahi hai toh create karo
      if (!prof) {
        const { data: newProf } = await supabase
          .from('profiles')
          .insert([{ id: user.id, full_name: user.user_metadata?.full_name || 'Founder' }])
          .select()
          .single();
        prof = newProf;
      }
      setProfile(prof);

      // 3. Fetch Real Stats from various tables
      const { count: sCount } = await supabase.from('startups').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { count: iCount } = await supabase.from('ideas').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      
      setStats({ startups: sCount || 0, ideas: iCount || 0 });
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-white">Loading your workspace...</div>;

  return (
    <div className="flex bg-[#090909] min-h-screen">
      <Sidebar />
      <main className="flex-1 p-10">
        {/* Welcome Section */}
        <h1 className="text-4xl font-bold text-white mb-8">Welcome back, {profile.full_name.split(' ')[0]} 👋</h1>

        {/* Real Profile Card */}
        <div className="bg-[#151515] p-8 rounded-3xl border border-[#C46A32]/20 shadow-[0_0_50px_-12px_rgba(196,106,50,0.2)]">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#C46A32] to-[#D4AF37] flex items-center justify-center text-2xl font-bold">
                    {profile.full_name[0]}
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                    <p className="text-[#C46A32]">Founder • Entrepreneur</p>
                </div>
            </div>
            {/* Founder Score Component */}
            <div className="mt-8">
                <p className="text-gray-400">Founder Score</p>
                <h1 className="text-5xl font-bold">89</h1>
                <div className="w-full bg-[#1F1F1F] h-2 rounded-full mt-2 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '89%' }} className="h-full bg-[#C46A32]" />
                </div>
            </div>
        </div>

        {/* Real Stats Display */}
        <div className="grid grid-cols-3 gap-6 mt-8">
            <StatCard label="Startups Launched" value={stats.startups} />
            <StatCard label="Ideas Captured" value={stats.ideas} />
            <StatCard label="Platform Trust" value="98%" />
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value }) => (
    <div className="bg-[#151515] p-6 rounded-2xl border border-white/5">
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
);

export default FounderProfile;