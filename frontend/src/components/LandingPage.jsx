import React, { useEffect, useRef, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const observerRef = useRef(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.lp-animate').forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [user, navigate]);

  const features = [
    {
      icon: '🖱️',
      title: 'Drag & Drop Builder',
      desc: 'Simply drag elements from the panel and drop them anywhere on your canvas. Resize, reposition, and style with zero code.'
    },
    {
      icon: '👁️',
      title: 'Live Preview',
      desc: 'Instantly toggle between edit and preview mode to see exactly how your site will look to visitors — in real time.'
    },
    {
      icon: '📦',
      title: 'Export as ZIP',
      desc: 'Download your entire website as a standalone ZIP archive with clean HTML, CSS, and JavaScript — ready to deploy anywhere.'
    },
    {
      icon: '✨',
      title: 'Animations & Hover Effects',
      desc: 'Add smooth fade-ins, slide-ups, bounces, pulses, and hover transforms to make your site feel alive and interactive.'
    },
    {
      icon: '📝',
      title: 'Forms & Data Collection',
      desc: 'Build contact forms and input fields. Attach submit buttons that automatically send data to your backend.'
    },
    {
      icon: '📱',
      title: 'Responsive Layouts',
      desc: 'Preview your design on desktop, tablet, and mobile. Multi-column grids that adapt beautifully to any screen size.'
    }
  ];

  const steps = [
    {
      num: '01',
      title: 'Create Your Project',
      desc: 'Sign up, name your website, and pick a starting template or start from a blank canvas.'
    },
    {
      num: '02',
      title: 'Design Visually',
      desc: 'Drag headings, text, images, buttons, forms, and pre-built blocks onto your pages. Style everything with the inspector panel.'
    },
    {
      num: '03',
      title: 'Publish & Export',
      desc: 'Hit publish to go live instantly, or export a ZIP file to host on your own server. It\'s that simple.'
    }
  ];

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', 'Outfit', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .lp-animate {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-animate.lp-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .lp-animate.lp-delay-1 { transition-delay: 0.1s; }
        .lp-animate.lp-delay-2 { transition-delay: 0.2s; }
        .lp-animate.lp-delay-3 { transition-delay: 0.3s; }
        .lp-animate.lp-delay-4 { transition-delay: 0.4s; }
        .lp-animate.lp-delay-5 { transition-delay: 0.5s; }

        @keyframes lp-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes lp-glow-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.2); }
          50% { box-shadow: 0 0 80px rgba(99, 102, 241, 0.4); }
        }
        @keyframes lp-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes lp-hero-fade {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .lp-hero-title {
          animation: lp-hero-fade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .lp-hero-sub {
          animation: lp-hero-fade 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
          opacity: 0;
        }
        .lp-hero-buttons {
          animation: lp-hero-fade 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
        }

        .lp-gradient-text {
          background: linear-gradient(135deg, #818cf8, #6366f1, #a78bfa, #818cf8);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: lp-gradient-shift 4s ease infinite;
        }

        .lp-btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          border: none;
          padding: 16px 36px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }
        .lp-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
        }

        .lp-btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 16px 36px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }
        .lp-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-3px);
        }

        .lp-feature-card {
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 32px 28px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
        }
        .lp-feature-card:hover {
          transform: translateY(-8px);
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(99, 102, 241, 0.1);
          background: rgba(30, 41, 59, 0.8);
        }

        .lp-step-card {
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 36px 28px;
          text-align: center;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .lp-step-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #6366f1, #a78bfa);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .lp-step-card:hover {
          transform: translateY(-6px);
          border-color: rgba(99, 102, 241, 0.25);
        }
        .lp-step-card:hover::before {
          opacity: 1;
        }

        .lp-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(15, 23, 42, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .lp-floating-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          pointer-events: none;
        }
      `}</style>

      {/* ───── NAVBAR ───── */}
      <nav className="lp-nav">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: '900', color: '#fff'
            }}>W</div>
            <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>Web builder</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/login" className="lp-btn-secondary" style={{ padding: '10px 24px', fontSize: '14px' }}>
              Log In
            </Link>
            <Link to="/signup" className="lp-btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
              Get Started Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px', overflow: 'hidden' }}>
        {/* Decorative floating shapes */}
        <div className="lp-floating-shape" style={{ width: '500px', height: '500px', background: '#6366f1', top: '-100px', right: '-150px', animation: 'lp-float 8s ease-in-out infinite' }} />
        <div className="lp-floating-shape" style={{ width: '400px', height: '400px', background: '#a78bfa', bottom: '-100px', left: '-100px', animation: 'lp-float 10s ease-in-out infinite 1s' }} />
        <div className="lp-floating-shape" style={{ width: '300px', height: '300px', background: '#818cf8', top: '30%', left: '60%', animation: 'lp-float 7s ease-in-out infinite 0.5s' }} />

        <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 2 }}>
          <div className="lp-hero-title">
            <span style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: '99px',
              background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '13px', fontWeight: '600', color: '#a5b4fc', marginBottom: '28px', letterSpacing: '0.5px'
            }}>
              ✦ No-Code Website Builder
            </span>
            <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: '900', lineHeight: '1.1', marginBottom: '24px', fontFamily: "'Outfit', sans-serif" }}>
              Build Stunning Websites{' '}
              <span className="lp-gradient-text">Without Code</span>
            </h1>
          </div>
          <p className="lp-hero-sub" style={{ fontSize: '20px', color: '#94a3b8', lineHeight: '1.7', maxWidth: '640px', margin: '0 auto 40px' }}>
            Drag, drop, style, animate — and publish. Create professional websites visually with our powerful builder. No coding skills required.
          </p>
          <div className="lp-hero-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/signup" className="lp-btn-primary" style={{ fontSize: '17px', padding: '18px 40px' }}>
              Start Building Free →
            </Link>
            <Link to="/login" className="lp-btn-secondary" style={{ fontSize: '17px', padding: '18px 40px' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section style={{ padding: '120px 32px', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="lp-animate" style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: '99px',
              background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '13px', fontWeight: '600', color: '#34d399', marginBottom: '20px'
            }}>
              ✦ Powerful Features
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '800', marginBottom: '16px', fontFamily: "'Outfit', sans-serif" }}>
              Everything You Need to Build
            </h2>
            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '560px', margin: '0 auto' }}>
              Professional tools packed into a simple, visual interface that anyone can master in minutes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {features.map((f, i) => (
              <div key={i} className={`lp-feature-card lp-animate lp-delay-${(i % 3) + 1}`}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', marginBottom: '20px'
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', fontFamily: "'Outfit', sans-serif" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.7' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section style={{ padding: '100px 32px', background: 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(30,41,59,0.3) 50%, rgba(15,23,42,0) 100%)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="lp-animate" style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: '99px',
              background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '13px', fontWeight: '600', color: '#a5b4fc', marginBottom: '20px'
            }}>
              ✦ Simple Process
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: '800', fontFamily: "'Outfit', sans-serif" }}>
              How It Works
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {steps.map((s, i) => (
              <div key={i} className={`lp-step-card lp-animate lp-delay-${i + 1}`}>
                <div style={{
                  fontSize: '48px', fontWeight: '900', fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text', marginBottom: '18px', lineHeight: '1'
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', fontFamily: "'Outfit', sans-serif" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.7' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="lp-animate" style={{ padding: '100px 32px' }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '24px', padding: '64px 40px',
          position: 'relative', overflow: 'hidden'
        }}>
          <div className="lp-floating-shape" style={{ width: '300px', height: '300px', background: '#6366f1', top: '-100px', right: '-100px', opacity: '0.08', filter: 'blur(60px)' }} />
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: '800', marginBottom: '16px', fontFamily: "'Outfit', sans-serif", position: 'relative', zIndex: 2 }}>
            Ready to Build Your Website?
          </h2>
          <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '500px', margin: '0 auto 32px', position: 'relative', zIndex: 2 }}>
            Join thousands of creators building beautiful websites without writing a single line of code.
          </p>
          <Link to="/signup" className="lp-btn-primary" style={{ fontSize: '17px', padding: '18px 44px', position: 'relative', zIndex: 2 }}>
            Get Started — It's Free →
          </Link>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', padding: '40px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '900', color: '#fff'
            }}>W</div>
            <span style={{ fontSize: '16px', fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>Web builder</span>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            © {new Date().getFullYear()} Web builder. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#94a3b8' }}>
            <Link to="/login" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Login</Link>
            <Link to="/signup" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
