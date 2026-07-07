import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';
import Sidebar from './Sidebar';

const StartupDetails = () => {
  const { id } = useParams();
  const [startup, setStartup] = useState(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    const fetchS = async () => {
      const { data } = await supabase.from('startups').select('*').eq('id', id).single();
      setStartup(data);
      setContent(data.description || '');
    };
    fetchS();
  }, [id]);

  const saveDetails = async () => {
    await supabase.from('startups').update({ description: content }).eq('id', id);
    alert("Saved!");
  };

  if (!startup) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#090909', color: '#fff' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px' }}>
        <button onClick={() => window.history.back()}>← Back</button>
        <h1>{startup.name}</h1>
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          style={{ width: '100%', height: '300px', backgroundColor: '#151515', color: '#fff', padding: '20px' }} 
        />
        <button onClick={saveDetails} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#C46A32' }}>Save Changes</button>
      </div>
    </div>
  );
};
export default StartupDetails;