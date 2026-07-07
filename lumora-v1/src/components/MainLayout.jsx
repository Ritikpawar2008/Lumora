import { Outlet } from 'react-router-dom';

const Navbar = () => (
  <nav className="p-6 flex justify-between items-center border-b border-surface">
    <div className="text-2xl font-bold text-primary">LUMORA</div>
    <div className="space-x-6 text-secondaryText">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <button className="bg-primary px-4 py-2 rounded-lg text-white">Get Started</button>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="p-6 text-center text-secondaryText border-t border-surface">
    <p>© 2026 Lumora. Build Brands. Launch Faster.</p>
  </footer>
);

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-background text-text">
      <Navbar />
      <main>
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
};