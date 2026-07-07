import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainLanding = () => {
  const navigate = useNavigate();
  const styles = {
    page: { backgroundColor: '#090909', color: '#F5F5F5', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
    nav: { display: 'flex', justifyContent: 'space-between', padding: '24px 64px', alignItems: 'center' },
    btn: { backgroundColor: '#C46A32', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' },
    section: { padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '40px' },
    card: { backgroundColor: '#171717', padding: '32px', borderRadius: '16px', border: '1px solid #262626' }
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#C46A32' }}>LUMORA</div>
        <button style={styles.btn} onClick={() => navigate('/auth')}>Get Started</button>
      </nav>
      <header style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '72px', fontWeight: '700', marginBottom: '24px' }}>Build Brands.<br/><span style={{ color: '#C46A32' }}>Launch Faster.</span></h1>
        <p style={{ color: '#A1A1AA', fontSize: '20px', maxWidth: '600px', margin: '0 auto 40px' }}>LUMORA is your AI-powered Founder Operating System. One workspace for everything.</p>
        <button style={{...styles.btn, fontSize: '18px'}} onClick={() => navigate('/auth')}>Launch Now</button>
      </header>
      <section style={styles.section}>
        <h2>Core Capabilities</h2>
        <div style={styles.grid}>
          {['Idea Vault', 'Brand Studio', 'Vision AI', 'Founder Assistant', 'Analytics', 'Email Center'].map(i => (
            <div key={i} style={styles.card}><h3>{i}</h3><p style={{color: '#A1A1AA'}}>Professional tools for your startup.</p></div>
          ))}
        </div>
      </section>
      <footer style={{ padding: '40px', borderTop: '1px solid #262626', textAlign: 'center', color: '#A1A1AA' }}>&copy; 2026 LUMORA. All rights reserved.</footer>
    </div>
  );
};
export default MainLanding;