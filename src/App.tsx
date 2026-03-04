import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shows from './pages/Shows';
import ShowDetail from './pages/ShowDetail';
import Checkout from './pages/Checkout';
import Premium from './pages/Premium';
import Admin from './pages/Admin';
import { ComoLlegar, PreguntasFrecuentes } from './pages/StaticPages';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ScrollTopButton() {
  function handleClick() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
  return (
    <button className="scroll-top-btn" onClick={handleClick} title="Volver arriba">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  );
}

function Layout({ children, noFooter = false }: { children: React.ReactNode; noFooter?: boolean }) {
  return (
    <>
      <Navbar />
      {children}
      {!noFooter && <Footer />}
      <ScrollTopButton />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/shows" element={<Layout><Shows /></Layout>} />
        <Route path="/show/:id" element={<Layout><ShowDetail /></Layout>} />
        <Route path="/checkout/:id" element={<Layout noFooter><Checkout /></Layout>} />
        <Route path="/premium" element={<Layout><Premium /></Layout>} />
        <Route path="/como-llegar" element={<Layout><ComoLlegar /></Layout>} />
        <Route path="/preguntas" element={<Layout><PreguntasFrecuentes /></Layout>} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
