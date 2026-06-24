// Public marketing landing page shown at "/" for signed-out visitors.
// Authenticated users get the real app Home instead (see App.jsx RootEntry).
// Animated, 3D-style page built with Framer Motion: parallax hero studio preview,
// scroll reveals, tilt-on-hover cards, animated counters and a category marquee.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import {
  IoShirtOutline,
  IoCameraOutline,
  IoGridOutline,
  IoColorPaletteOutline,
  IoVideocamOutline,
  IoCodeSlashOutline,
  IoArrowForward,
  IoCheckmarkCircle,
  IoSparkles,
  IoFlashOutline,
  IoCloudUploadOutline,
  IoOptionsOutline,
} from 'react-icons/io5';
import ThemeToggle from './ThemeToggle';
import './Landing.css';

const FEATURES = [
  {
    icon: <IoShirtOutline />,
    title: 'Virtual Try-On',
    text: 'Upload a photo and instantly see any garment or product worn on a real body — no fitting room, no reshoots.',
    tag: 'Shoppers love it',
  },
  {
    icon: <IoCameraOutline />,
    title: 'Model Photoshoot',
    text: 'Turn one product image into studio-grade model shots across poses, gestures, scenes and lighting.',
    tag: 'No camera or crew',
  },
  {
    icon: <IoGridOutline />,
    title: 'Catalog Creation',
    text: 'Generate full, on-brand catalogs at scale — consistent models, backgrounds and lighting on every single shot.',
    tag: 'Built for scale',
  },
  {
    icon: <IoColorPaletteOutline />,
    title: 'Branding Content',
    text: 'Craft campaign visuals and ad creatives tuned to your brand’s colors, logo and style in a few clicks.',
    tag: 'On-brand, always',
  },
  {
    icon: <IoVideocamOutline />,
    title: 'AI Video Ads',
    text: 'Type a prompt and get a scroll-stopping vertical video ad with cinematic motion — ready to post.',
    tag: 'Prompt to video',
  },
  {
    icon: <IoCodeSlashOutline />,
    title: 'Developer API',
    text: 'Drop BrandShoot into any store with a single API key. Try-On, Photoshoot and Catalog endpoints, plan-based quotas.',
    tag: 'Integrate anywhere',
  },
];

const STEPS = [
  {
    icon: <IoCloudUploadOutline />,
    n: '1',
    title: 'Upload',
    text: 'Add a product, garment or brand asset — a single photo is enough.',
  },
  {
    icon: <IoOptionsOutline />,
    n: '2',
    title: 'Choose',
    text: 'Pick a model, pose, scene, catalog style or describe a video prompt.',
  },
  {
    icon: <IoFlashOutline />,
    n: '3',
    title: 'Generate',
    text: 'Get high-res images and videos in seconds — ready to download and publish.',
  },
];

const STATS = [
  { num: 6, suffix: '', label: 'Creative tools in one studio' },
  { text: '30-40s', label: 'Average render time' },
  { text: 'HD', label: 'Export-ready quality' },
  { text: '∞', label: 'Style variations' },
];

const CATEGORIES = [
  'Jewelry', 'Fashion', 'Footwear', 'Beauty', 'Home Decor',
  'Accessories', 'Kidswear', 'Eyewear', 'Watches', 'Cosmetics',
];

const EASE = [0.22, 1, 0.36, 1];

/* Scroll-reveal wrapper. Reveals when scrolled into view, with a short fallback
   timer so content is never stuck hidden if the observer doesn't fire. */
function Reveal({ children, delay = 0, y = 28, className }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFallback(true), 2200);
    return () => clearTimeout(t);
  }, []);
  const show = reduce || inView || fallback;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* Pointer-driven 3D tilt card */
function TiltCard({ children, className }) {
  const rx = useSpring(0, { stiffness: 220, damping: 18 });
  const ry = useSpring(0, { stiffness: 220, damping: 18 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 14);
    rx.set(-py * 14);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };
  return (
    <motion.div
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
    >
      {children}
    </motion.div>
  );
}

/* Count-up stat */
function Stat({ stat }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [n, setN] = useState(0);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFallback(true), 2200);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!(inView || fallback) || stat.num == null) return;
    if (reduce) { setN(stat.num); return; }
    let raf;
    const start = performance.now();
    const dur = 1100;
    const step = (t) => {
      const p = Math.min(Math.max((t - start) / dur, 0), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * stat.num));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, fallback, stat.num, reduce]);
  return (
    <div className="stat" ref={ref}>
      <div className="stat-num">
        {stat.text != null ? stat.text : n}
        {stat.suffix}
      </div>
      <div className="stat-label">{stat.label}</div>
    </div>
  );
}

export default function Landing() {
  // Hero pointer parallax
  const heroRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const panelX = useTransform(sx, (v) => v * 22);
  const panelY = useTransform(sy, (v) => v * 22);
  const chipAX = useTransform(sx, (v) => v * 46);
  const chipAY = useTransform(sy, (v) => v * 46);
  const chipBX = useTransform(sx, (v) => v * -38);
  const chipBY = useTransform(sy, (v) => v * -38);

  const onHeroMove = (e) => {
    const r = heroRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  // Scroll progress + nav state
  const { scrollYProgress, scrollY } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 12));

  return (
    <div className="landing">
      <motion.div className="scroll-progress" style={{ scaleX: progressScaleX }} />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-container landing-nav-inner">
          <a className="brand" href="/">
            <span className="brand-mark"><IoSparkles /></span>
            <span className="brand-name">BrandShoot&nbsp;AI</span>
          </a>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#api">Developers</a>
            <ThemeToggle className="nav-theme-toggle" />
            <Link className="btn btn-ghost" to="/login">Login</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="hero" ref={heroRef} onMouseMove={onHeroMove}>
        <div className="aurora" aria-hidden="true">
          <span className="blob blob-1" />
          <span className="blob blob-2" />
          <span className="blob blob-3" />
        </div>
        <div className="grid-overlay" aria-hidden="true" />

        <div className="landing-container hero-grid">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <span className="eyebrow"><IoSparkles /> The AI creative studio for modern brands</span>
            <h1 className="hero-title">
              Your entire product studio,
              <span className="grad-text"> generated by AI</span>
            </h1>
            <p className="hero-sub">
              BrandShoot AI turns a single photo into virtual try-ons, model photoshoots,
              full catalogs, branded content and motion video ads — in seconds. No camera,
              no crew, no studio.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/login">
                Start creating <IoArrowForward />
              </Link>
              <a className="btn btn-glass btn-lg" href="#features">See what it does</a>
            </div>
            <ul className="hero-points">
              <li><IoCheckmarkCircle /> No studio needed</li>
              <li><IoCheckmarkCircle /> Ready in seconds</li>
              <li><IoCheckmarkCircle /> HD-ready exports</li>
            </ul>
          </motion.div>

          {/* 3D studio preview */}
          <motion.div
            className="hero-scene"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          >
            <motion.div className="scene-panel-wrap" style={{ x: panelX, y: panelY }}>
              <div className="scene-panel">
                <div className="panel-top">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                  <span className="panel-title">BrandShoot Studio</span>
                  <span className="panel-live"><span className="pulse" /> generating</span>
                </div>
                <div className="panel-grid">
                  {['g1.jpg', 'g3.jpg', 'g4.jpg', 'g5.jpg', 'g6.jpg', 'g7.png'].map((g, i) => (
                    <div className={`thumb thumb-${i % 3}`} key={g}>
                      <img src={`/landing/${g}`} alt="BrandShoot AI generated result" loading="lazy" />
                      {i === 4 && <span className="thumb-shimmer" />}
                    </div>
                  ))}
                </div>
                <div className="panel-bar"><span className="panel-bar-fill" /></div>
                <div className="panel-foot">Rendering model photoshoot — 4 poses</div>
              </div>
            </motion.div>

            <motion.div className="float-chip chip-a" style={{ x: chipAX, y: chipAY }}>
              <span className="chip-inner"><IoShirtOutline /> Try-On ready</span>
            </motion.div>
            <motion.div className="float-chip chip-b" style={{ x: chipBX, y: chipBY }}>
              <span className="chip-inner"><IoVideocamOutline /> Video ad rendered</span>
            </motion.div>
            <motion.div className="float-chip chip-c" style={{ x: chipAX, y: chipAY }}>
              <span className="chip-inner"><IoCodeSlashOutline /> API connected</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Category marquee */}
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
              <span className="marquee-item" key={`${c}-${i}`}>
                <IoSparkles /> {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="landing-container stats-grid">
          {STATS.map((s) => <Stat stat={s} key={s.label} />)}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="features" id="features">
        <div className="landing-container">
          <Reveal className="section-head">
            <span className="kicker">Everything in one studio</span>
            <h2>Six tools. One photo away from ready.</h2>
            <p>From try-on to motion video ads — every BrandShoot feature, on tap.</p>
          </Reveal>
          <div className="feature-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <TiltCard className="feature-card">
                  <div className="feature-icon">{f.icon}</div>
                  <span className="feature-tag">{f.tag}</span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  <span className="feature-shine" aria-hidden="true" />
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="how" id="how">
        <div className="landing-container">
          <Reveal className="section-head">
            <span className="kicker">How it works</span>
            <h2>From idea to finished asset in three steps</h2>
          </Reveal>
          <div className="steps">
            <span className="steps-line" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.12}>
                <div className="step">
                  <span className="step-icon">{s.icon}</span>
                  <span className="step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Developer API ───────────────────────────────────── */}
      <section className="api-section" id="api">
        <div className="aurora aurora-dark" aria-hidden="true">
          <span className="blob blob-1" />
          <span className="blob blob-2" />
        </div>
        <div className="landing-container api-grid">
          <Reveal className="api-copy">
            <span className="kicker light">For developers</span>
            <h2>Plug BrandShoot into any store</h2>
            <p>
              Generate an API key and call BrandShoot from your own backend. Offer your
              shoppers Try-On, Model Photoshoot and Catalog creation — billed to your
              credits, bounded by per-key plan limits.
            </p>
            <ul className="api-points">
              <li><IoCheckmarkCircle /> Simple REST API with full docs</li>
              <li><IoCheckmarkCircle /> Plan-based rate limits &amp; monthly quotas</li>
              <li><IoCheckmarkCircle /> One key, three generation endpoints</li>
            </ul>
            <Link className="btn btn-primary btn-lg" to="/login">
              Get your API key <IoArrowForward />
            </Link>
          </Reveal>

          <Reveal delay={0.15}>
            <TiltCard className="code-card">
              <div className="code-top">
                <span className="dot" /><span className="dot" /><span className="dot" />
                <span className="code-file">tryon.sh</span>
              </div>
              <pre className="code-body">
{`curl -X POST https://api.brandshoot.ai/v1/tryon \\
  -H "X-API-Key: bsk_live_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "categoryId": "fashion",
    "productImage": "<base64>",
    "userImage":    "<base64>"
  }'

# → { "jobId": "a1b2c3d4", "feature": "tryon" }`}
              </pre>
            </TiltCard>
          </Reveal>
        </div>
      </section>

      {/* ── CTA band ────────────────────────────────────────── */}
      <section className="cta-band">
        <div className="landing-container">
          <Reveal className="cta-inner">
            <span className="cta-spark"><IoSparkles /></span>
            <h2>Ready to build your brand’s studio?</h2>
            <p>Join BrandShoot AI and turn one photo into a full creative pipeline.</p>
            <Link className="btn btn-light btn-lg" to="/login">
              Start creating now <IoArrowForward />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <a className="brand" href="/">
            <span className="brand-mark"><IoSparkles /></span>
            <span className="brand-name">BrandShoot&nbsp;AI</span>
          </a>
          <span className="footer-copy">
            © {new Date().getFullYear()} BrandShoot AI · Try-On · Photoshoot · Catalog · Branding · Video · API
          </span>
          <Link className="btn btn-ghost" to="/login">Login</Link>
        </div>
      </footer>
    </div>
  );
}
