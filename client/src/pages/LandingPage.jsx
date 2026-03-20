import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { motion, useScroll, useTransform, AnimatePresence, useInView, useMotionValue, animate } from 'framer-motion';
import {
  Dumbbell, Users, Calendar, ArrowRight, CheckCircle, Star, Package, ChevronDown, ChevronUp, Menu, X, Clock, Footprints, Activity, ShieldCheck, Zap, Tag
} from 'lucide-react';

import GYM_Background from '../assets/images/GYM_Background.jpg';
import logo from '../assets/images/logo.png';

// --- ANIMATION VARIANTS ---
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

// --- GRADIENT HELPER ---
const getCardColor = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes('gold')) return 'from-yellow-400 via-amber-500 to-yellow-600';
  if (n.includes('silver')) return 'from-gray-300 via-gray-400 to-gray-500';
  if (n.includes('platinum')) return 'from-slate-200 via-slate-300 to-slate-400';
  if (n.includes('bronze')) return 'from-orange-500 via-orange-600 to-orange-800';
  return 'from-blue-500 via-indigo-500 to-purple-600';
};

export default function LandingPage() {
  const [config, setConfig] = useState({
    system_name: "Royal Fitness Kingdom",
    gym_location: "Colombo, Sri Lanka",
    contact_email: "support@royalfitness.com",
    contact_phone: "+94 11 234 5678"
  });

  const [plans, setPlans] = useState([]);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // New Promo State
  const [activePromo, setActivePromo] = useState(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityBg = useTransform(scrollYProgress, [0, 1], [0.5, 0]);

  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  // Derive the server URL to render uploaded images properly
  const SERVER_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

  useEffect(() => {
    api.get('/settings/public-config')
      .then(res => res.data && setConfig(prev => ({ ...prev, ...res.data })))
      .catch(console.error);

    api.get('/memberships')
      .then(res => setPlans(res.data))
      .catch(console.error)
      .finally(() => setLoadingPlans(false));

    api.get('/gallery')
      .then(res => setGalleryImages(res.data))
      .catch(console.error)
      .finally(() => setLoadingGallery(false));

    api.get('/promotions/active')
      .then(res => setActivePromo(res.data))
      .catch(() => { });

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getSafeFeatures = (featuresData) => {
    if (Array.isArray(featuresData)) return featuresData;
    if (typeof featuresData === 'string') {
      try {
        const parsed = JSON.parse(featuresData);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    return [];
  };

  const visiblePlans = showAllPlans ? plans : plans.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">

      {/* --- FLOATING ORBS BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen animate-pulse duration-10000"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[150px] mix-blend-screen animate-pulse duration-7000"></div>
      </div>

      {/* --- NAVIGATION BAR --- */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed w-full z-50 top-0 transition-all duration-500 border-b border-white/5 backdrop-blur-md
        ${isScrolled ? 'bg-slate-950/80 py-4 shadow-2xl shadow-black/50' : 'bg-transparent py-6'}`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-3 group z-50">
            <img src={logo} alt="Royal Fitness Kingdom" className="h-16 w-auto object-contain" />
            <span className="uppercase text-white group-hover:text-blue-400 transition-colors">{config.system_name}</span>
          </Link>

          <div className="hidden md:flex items-center space-x-10">
            {['features', 'gallery', 'pricing'].map((item) => (
              <a key={item} href={`#${item}`} className="text-sm font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors duration-300 relative group">
                {item}
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-5">
            <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors duration-300">
              Log In
            </Link>
            <Link to="/register" className="relative group px-7 py-3 rounded-xl overflow-hidden shadow-xl shadow-blue-500/20">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:scale-105 transition-transform duration-300"></span>
              <span className="relative text-sm font-black text-white uppercase tracking-wider">Join Now</span>
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg relative z-50 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/5 p-6 flex flex-col gap-6 md:hidden shadow-2xl"
            >
              {['features', 'gallery', 'pricing'].map(item => (
                <a key={item} href={`#${item}`} className="text-white text-lg font-black uppercase tracking-widest py-2 border-b border-white/5" onClick={() => setMobileMenuOpen(false)}>{item}</a>
              ))}
              <Link to="/login" className="text-slate-400 font-bold py-2 text-center text-lg" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
              <Link to="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4 rounded-xl text-center uppercase tracking-widest shadow-lg shadow-blue-600/20" onClick={() => setMobileMenuOpen(false)}>Join Now</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* --- HERO SECTION --- */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-40 lg:pt-48 pb-20 overflow-hidden">
        <motion.div style={{ y: yBg, opacity: opacityBg }} className="absolute inset-0 z-0 scale-110">
          <img src={GYM_Background} alt="Gym Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950"></div>
          <div className="absolute inset-0 bg-black/40"></div>
        </motion.div>

        <div className="relative z-10 container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-3xl space-y-8">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-blue-400 text-xs font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Premium Fitness Experience
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black text-white leading-[1.05] tracking-tighter">
              REDEFINE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                YOUR LIMITS.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-xl text-slate-400 leading-relaxed max-w-xl font-medium">
              Step into the future of fitness. State-of-the-art tech, elite coaching, and a community built on relentless progress.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5 pt-6">
              <Link to="/register" className="group relative flex items-center justify-center px-10 py-5 bg-white text-black rounded-2xl font-black text-lg overflow-hidden transition-transform hover:scale-[1.02]">
                <span className="relative z-10 flex items-center gap-2">Start Your Journey <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <a href="#gallery" className="flex items-center justify-center px-10 py-5 rounded-2xl font-bold text-lg text-white border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
                Explore Facility
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="pt-12 flex flex-wrap items-center justify-start gap-10 sm:gap-16 border-t border-white/10">
              <AnimatedCounter value={24} label="Access" suffix="/7" />
              <AnimatedCounter value={50} label="Premium Machines" suffix="+" />
              <AnimatedCounter value={50} label="Members" suffix="+" />
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll down indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/30"
        >
          <span className="text-[10px] uppercase font-black tracking-[0.3em]">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent"></div>
        </motion.div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features" className="py-32 relative z-10 bg-slate-950">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.h2 variants={fadeUp} className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] mb-4">The Evolution of Fitness</motion.h2>
            <motion.h3 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white tracking-tight">Engineered for Excellence.</motion.h3>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            <FeatureCard
              icon={<Zap size={32} />}
              title="Next-Gen Equipment"
              desc="You can use modern equipment."
            />
            <FeatureCard
              icon={<ShieldCheck size={32} />}
              title="Elite Periodization"
              desc="Forget generic routines. Our premium coaching staff builds true micro and macro cycles for your goals."
              highlight
            />
            <FeatureCard
              icon={<Activity size={32} />}
              title="E-Management"
              desc="Intuitive platform for seamless gym management."
            />
          </motion.div>
        </div>
      </section>

      {/* --- BMI CALCULATOR --- */}
      <BMICalculator />

      {/* --- GALLERY SECTION --- */}
      <section id="gallery" className="py-32 relative overflow-hidden bg-slate-900">
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] rounded-full bg-blue-900/10 blur-[150px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

        <div className="container mx-auto px-6 mb-16 relative z-10">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="flex flex-col md:flex-row justify-between items-end gap-8"
          >
            <div className="max-w-2xl">
              <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] mb-4">The Sanctuary</h2>
              <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight">Aesthetic. Functional. <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-200">Uncompromised.</span></h3>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/50"><ArrowRight className="rotate-180" size={20} /></div>
              <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center"><ArrowRight size={20} /></div>
            </div>
          </motion.div>
        </div>

        {/* HORIZONTAL SWIPE GALLERY */}
        {loadingGallery ? (
          <div className="flex justify-center py-20 pb-32">
            <div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : galleryImages.length === 0 ? (
          <div className="text-center text-slate-500 py-10 pb-32 font-bold uppercase tracking-widest">
            More inspiring spaces coming soon.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}
            className="flex overflow-x-auto gap-6 px-6 pb-16 snap-x snap-mandatory scroll-smooth no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {galleryImages.map((img) => (
              <motion.div
                key={img.id}
                whileHover={{ scale: 0.98 }}
                className="relative shrink-0 w-[85vw] md:w-[500px] lg:w-[600px] h-[400px] lg:h-[550px] rounded-3xl overflow-hidden snap-center group cursor-pointer border border-white/5 shadow-2xl bg-black/50 flex items-center justify-center"
              >
                <img src={img.image_url.startsWith('http') ? img.image_url : SERVER_URL + img.image_url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <Activity size={18} />
                  </div>
                  <h4 className="text-white font-black text-3xl mb-2">Facility View</h4>
                  <p className="text-blue-400 text-sm font-bold tracking-widest uppercase">Premium Standard</p>
                </div>
              </motion.div>
            ))}
            <div className="w-12 shrink-0"></div>
          </motion.div>
        )}
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-32 relative z-10 bg-slate-950">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.h2 variants={fadeUp} className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Select Your Tier</motion.h2>
            <motion.h3 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white tracking-tight">Invest in Greatness.</motion.h3>
          </motion.div>

          {loadingPlans ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center text-slate-500 py-10 font-bold uppercase tracking-widest">No tiers available.</div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              <AnimatePresence>
                {visiblePlans.map((plan, i) => {
                  const features = getSafeFeatures(plan.features);
                  const isBestValue = plan.duration_months >= 12;
                  const gradient = getCardColor(plan.name);

                  return (
                    <motion.div
                      variants={fadeUp}
                      whileHover={{ y: -10 }}
                      key={plan.plan_id}
                      className={`relative group bg-slate-900 rounded-[2rem] overflow-hidden border ${isBestValue ? 'border-blue-500/50' : 'border-white/5'} flex flex-col shadow-2xl`}
                    >
                      {isBestValue && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-20"></div>
                      )}

                      {/* Glowing effect behind card on hover */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                      <div className="p-10 relative z-10 flex-1 flex flex-col">
                        {isBestValue && (
                          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest w-max">
                            Best Value
                          </div>
                        )}

                        <h3 className="text-3xl font-black text-white mb-2">{plan.name}</h3>
                        <p className="text-slate-400 text-sm font-medium mb-8 min-h-[40px]">{plan.description || "Unlock peak performance with this tier."}</p>

                        <div className="flex items-end gap-2 mb-10">
                          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                            Rs. {parseInt(plan.price).toLocaleString()}
                          </span>
                          <span className="text-slate-500 font-bold mb-2">/{plan.duration_months}mo</span>
                        </div>

                        <div className="space-y-4 mb-10 flex-1">
                          {plan.includes_trainer && (
                            <div className="flex items-start text-sm font-bold text-slate-300">
                              <CheckCircle className="w-5 h-5 text-blue-500 mr-3 shrink-0" /> Personal Trainer
                            </div>
                          )}
                          {plan.visit_limit_per_week ? (
                            <div className="flex items-start text-sm font-bold text-slate-300">
                              <CheckCircle className="w-5 h-5 text-blue-500 mr-3 shrink-0" /> {plan.visit_limit_per_week} Visits / Week
                            </div>
                          ) : (
                            <div className="flex items-start text-sm font-bold text-slate-300">
                              <CheckCircle className="w-5 h-5 text-blue-500 mr-3 shrink-0" /> Unlimited Access
                            </div>
                          )}
                          {plan.class_limit_per_week ? (
                            <div className="flex items-start text-sm font-bold text-slate-300">
                              <CheckCircle className="w-5 h-5 text-blue-500 mr-3 shrink-0" /> {plan.class_limit_per_week} Classes / Week
                            </div>
                          ) : (
                            <div className="flex items-start text-sm font-bold text-slate-300">
                              <CheckCircle className="w-5 h-5 text-blue-500 mr-3 shrink-0" /> Unlimited Classes
                            </div>
                          )}
                          {features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-start text-sm font-bold text-slate-400">
                              <CheckCircle className="w-5 h-5 text-white/20 mr-3 shrink-0" />{feature}
                            </div>
                          ))}
                        </div>
                        <Link
                          to="/register"
                          className={`block w-full py-5 text-center rounded-xl font-black uppercase tracking-widest transition-all duration-300 
                            ${isBestValue
                              ? 'bg-white text-black hover:bg-slate-200'
                              : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'}`}
                        >
                          Select Tier
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )
          }

          {
            plans.length > 3 && (
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mt-16">
                <button
                  onClick={() => setShowAllPlans(!showAllPlans)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold hover:bg-white/10 transition-all shadow-xl"
                >
                  {showAllPlans ? <>Collapse <ChevronUp size={18} /></> : <>View All Tiers <ChevronDown size={18} /></>}
                </button>
              </motion.div>
            )
          }

        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-32 relative overflow-hidden bg-slate-950 border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] rounded-full bg-blue-600/10 blur-[200px] pointer-events-none"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.h2 variants={fadeUp} className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">STOP THINKING. <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">START DOING.</span></motion.h2>
            <motion.p variants={fadeUp} className="text-slate-400 text-xl font-medium mb-12 max-w-2xl mx-auto">
              The only thing standing between you and your goals is the decision to start. Join the elite today.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link to="/register" className="inline-flex items-center px-12 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                Join To Kingdom <ArrowRight className="ml-3" size={24} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section >

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 text-slate-500 py-16 border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6 flex items-center gap-4">
              <img src={logo} alt="Royal Fitness Kingdom" className="h-20 w-auto object-contain" />
              <div className="text-3xl font-black text-white uppercase tracking-widest leading-none">{config.system_name}</div>
            </div>
            <p className="max-w-sm text-sm font-medium leading-relaxed">
              Premium fitness facilities engineered for absolute performance. Don't settle for average.
            </p>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest mb-6 text-sm">Location</h4>
            <p className="text-sm font-medium">{config.gym_location}</p>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest mb-6 text-sm">Contact</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li className="hover:text-white transition-colors cursor-pointer">{config.contact_email}</li>
              <li className="hover:text-white transition-colors cursor-pointer">{config.contact_phone}</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs font-bold tracking-widest uppercase pt-8 border-t border-white/5">
          <p>© {new Date().getFullYear()} {config.system_name}. DOMINATE YOUR GOALS.</p>
        </div>
      </footer>

      {/* --- FLOATING PROMO BANNER --- */}
      <AnimatePresence>
        {activePromo && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-t border-white/10 text-white py-4 px-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between"
          >
            <div className="flex items-center gap-4 mb-3 sm:mb-0">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 shrink-0">
                <Tag size={20} className="text-yellow-400" />
              </span>
              <div>
                <p className="font-black tracking-widest uppercase text-sm sm:text-base drop-shadow-md">{activePromo.title}</p>
                <p className="text-xs sm:text-sm font-medium opacity-90 mt-0.5 max-w-xl pr-4">
                  {activePromo.description} • Save {activePromo.discountType === 'PERCENTAGE' ? `${activePromo.discountValue}%` : `Rs. ${activePromo.discountValue}`} on your registration fee until {new Date(activePromo.endDate).toLocaleDateString()}!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link to="/register" className="px-6 py-2.5 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 hover:shadow-xl transition-all">
                Claim Offer
              </Link>
              <button onClick={() => setActivePromo(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function FeatureCard({ icon, title, desc, highlight }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -10 }}
      className={`relative group p-10 rounded-[2rem] overflow-hidden transition-all duration-300
        ${highlight
          ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30'
          : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
    >
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 
        ${highlight ? 'bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.5)]' : 'bg-white/10 text-white'}`}>
        {icon}
      </div>
      <h4 className="text-2xl font-black text-white mb-4">{title}</h4>
      <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function AnimatedCounter({ value, label, suffix = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 2, ease: "easeOut" });
      return controls.stop;
    }
  }, [isInView, value, count]);

  return (
    <div ref={ref}>
      <p className="text-4xl md:text-5xl font-black text-white flex items-center">
        <motion.span>{rounded}</motion.span>{suffix}
      </p>
      <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function BMICalculator() {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);

  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);

  let category = "";
  let color = "";
  if (bmi < 18.5) { category = "Underweight"; color = "text-blue-400"; }
  else if (bmi < 25) { category = "Normal weight"; color = "text-green-400"; }
  else if (bmi < 30) { category = "Overweight"; color = "text-yellow-400"; }
  else { category = "Obese"; color = "text-red-400"; }

  return (
    <section className="py-24 relative z-10 bg-slate-950 border-t border-white/5">
      <div className="container mx-auto px-6">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="max-w-5xl mx-auto bg-slate-900 border border-white/10 rounded-[2rem] p-8 md:p-14 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] pointer-events-none rounded-full"></div>

          <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <motion.h2 variants={fadeUp} className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Know Your Numbers</motion.h2>
              <motion.h3 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">BMI Calculator.</motion.h3>
              <motion.p variants={fadeUp} className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                Your Body Mass Index is a quick screening tool to understand your baseline. Adjust the sliders to see where you stand, then let our trainers take you to the next level.
              </motion.p>

              <motion.div variants={fadeUp} className="space-y-8">
                <div>
                  <div className="flex justify-between mb-3 text-sm font-bold">
                    <label className="text-white">Height</label>
                    <span className="text-blue-400">{height} cm</span>
                  </div>
                  <input type="range" min="120" max="220" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-3 text-sm font-bold">
                    <label className="text-white">Weight</label>
                    <span className="text-blue-400">{weight} kg</span>
                  </div>
                  <input type="range" min="40" max="150" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center p-12 bg-black/40 rounded-3xl border border-white/5 h-full">
              <div className="text-center mb-8">
                <p className="text-slate-500 font-black uppercase tracking-widest text-sm mb-3">Your Result</p>
                <div className="text-7xl md:text-8xl font-black text-white tracking-tighter">{bmi}</div>
              </div>
              <div className={`px-8 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-md ${color} font-black uppercase tracking-widest text-sm shadow-xl`}>
                {category}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}