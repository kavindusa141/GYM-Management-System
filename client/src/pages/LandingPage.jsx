import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Dumbbell, Users, Calendar, ArrowRight, CheckCircle, Star, Package, ChevronDown, ChevronUp, Menu, X, Instagram 
} from 'lucide-react';


import GYM_Background from '../assets/images/GYM_Background.jpg';
// --- IMPORT ALL 9 LOCAL IMAGES ---
import gym1 from '../assets/images/gym1.jpeg';
import gym2 from '../assets/images/gym2.jpeg';
import gym3 from '../assets/images/gym3.jpeg';
import gym4 from '../assets/images/gym4.jpeg';
import gym5 from '../assets/images/gym5.jpeg';
import gym6 from '../assets/images/gym6.jpeg';
import gym7 from '../assets/images/gym7.jpeg';
import gym8 from '../assets/images/gym8.jpeg';
import gym9 from '../assets/images/gym9.jpeg';

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

  // --- SCROLL STATE ---
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- GALLERY CONFIGURATION (ALL 9 IMAGES) ---
  const galleryImages = [
    { url: gym1, title: "Main Strength Zone", subtitle: "Hammer Strength Certified" },
    { url: gym2, title: "Free Weights Area", subtitle: "Dumbbells up to 50kg" },
    { url: gym3, title: "Personal Training", subtitle: "1-on-1 Elite Coaching" },
    { url: gym4, title: "Cardio Theater", subtitle: "Life Fitness Consoles" },
    { url: gym5, title: "CrossFit Box", subtitle: "Functional Training" },
    { url: gym6, title: "Group Studio", subtitle: "Yoga & Pilates" },
    { url: gym7, title: "HIIT Zone", subtitle: "High Intensity Training" },
    { url: gym8, title: "Recovery Lounge", subtitle: "Post-Workout Relax" },
    { url: gym9, title: "Premium Amenities", subtitle: "Luxury Locker Rooms" }
  ];

  useEffect(() => {
    // 1. Load Data
    api.get('/settings/public-config')
      .then(res => res.data && setConfig(prev => ({ ...prev, ...res.data })))
      .catch(console.error);

    api.get('/memberships')
      .then(res => setPlans(res.data))
      .catch(console.error)
      .finally(() => setLoadingPlans(false));

    // 2. Scroll Handler
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 50);
    };

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
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white animate-fade-in">
      
      {/* --- NAVIGATION BAR --- */}
      <nav 
        className={`fixed w-full z-50 top-0 transition-all duration-300 border-b 
        ${isScrolled 
          ? 'bg-white border-gray-200 py-3 shadow-md' 
          : 'bg-transparent border-transparent py-6' 
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          
          {/* LOGO */}
          <div className={`text-2xl font-black tracking-tighter flex items-center gap-2 transition-colors duration-300 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white uppercase shadow-lg shadow-blue-600/20">
              {config.system_name.charAt(0)}
            </div>
            <span className="uppercase">{config.system_name}</span>
          </div>
          
          {/* DESKTOP LINKS */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? 'text-slate-500 hover:text-blue-600' : 'text-slate-300 hover:text-white'}`}>FEATURES</a>
            <a href="#gallery" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? 'text-slate-500 hover:text-blue-600' : 'text-slate-300 hover:text-white'}`}>GALLERY</a>
            <a href="#pricing" className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? 'text-slate-500 hover:text-blue-600' : 'text-slate-300 hover:text-white'}`}>PRICING</a>
          </div>

          {/* ACTION BUTTONS */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/login" 
              className={`px-5 py-2.5 text-sm font-bold transition-colors duration-300 ${isScrolled ? 'text-slate-700 hover:text-blue-600' : 'text-white hover:text-blue-200'}`}
            >
              Log In
            </Link>
            <Link 
              to="/register" 
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/30
                ${isScrolled 
                  ? 'bg-slate-900 text-white hover:bg-blue-600' 
                  : 'bg-white text-slate-900 hover:bg-blue-50'
                }`}
            >
              Join Now
            </Link>
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button 
            className="md:hidden p-2 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen 
              ? <X className={isScrolled ? 'text-slate-900' : 'text-white'} /> 
              : <Menu className={isScrolled ? 'text-slate-900' : 'text-white'} />
            }
          </button>
        </div>

        {/* MOBILE DROPDOWN */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl p-6 flex flex-col gap-4 md:hidden animate-fade-in-up">
            <a href="#features" className="text-slate-600 font-bold py-2" onClick={() => setMobileMenuOpen(false)}>FEATURES</a>
            <a href="#gallery" className="text-slate-600 font-bold py-2" onClick={() => setMobileMenuOpen(false)}>GALLERY</a>
            <a href="#pricing" className="text-slate-600 font-bold py-2" onClick={() => setMobileMenuOpen(false)}>PRICING</a>
            <hr className="border-gray-100" />
            <Link to="/login" className="text-slate-900 font-bold py-2 text-center" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
            <Link to="/register" className="bg-blue-600 text-white font-bold py-3 rounded-xl text-center shadow-lg shadow-blue-600/20" onClick={() => setMobileMenuOpen(false)}>Join Now</Link>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src={GYM_Background}
            alt="Gym Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Star size={12} fill="currentColor" /> #1 Rated Gym in {config.gym_location.split(',')[0]}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
              FORGE YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                LEGACY.
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              Stop wishing, start working. Join <b>{config.system_name}</b> — an elite community dedicated to strength, discipline, and results.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/register" className="group flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="pt-10 flex items-center gap-8 border-t border-white/10">
              <div><p className="text-3xl font-black text-white">2k+</p><p className="text-xs text-slate-500 font-bold uppercase">Members</p></div>
              <div className="w-px h-10 bg-white/10"></div>
              <div><p className="text-3xl font-black text-white">50+</p><p className="text-xs text-slate-500 font-bold uppercase">Trainers</p></div>
              <div className="w-px h-10 bg-white/10"></div>
              <div><p className="text-3xl font-black text-white">24/7</p><p className="text-xs text-slate-500 font-bold uppercase">Access</p></div>
            </div>
          </div>
        </div>
      </header>

      {/* --- FEATURES --- */}
      <section id="features" className="py-24 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Why {config.system_name}</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Everything you need to exceed your limits.</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard icon={<Dumbbell size={28}/>} title="Premium Equipment" desc="Train with industry-leading Hammer Strength & Life Fitness machines designed for biomechanical perfection." />
            <FeatureCard icon={<Users size={28}/>} title="Elite Coaching" desc="Our certified trainers don't just count reps; they build personalized periodization plans to guarantee results." highlight />
            <FeatureCard icon={<Calendar size={28}/>} title="Dynamic Classes" desc="From high-intensity HIIT to restorative Yoga, join classes that keep your body guessing and growing." />
          </div>
        </div>
      </section>

      {/* --- GALLERY SECTION (UPDATED: All 9 Images) --- */}
      <section id="gallery" className="py-24 bg-slate-950 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/10 to-transparent pointer-events-none"></div>

        <div className="container mx-auto px-6 mb-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-xl">
              <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2">Inside The Kingdom</h2>
              <h3 className="text-4xl font-black text-white tracking-tight">World-class facilities.</h3>
              <p className="text-slate-400 mt-4 leading-relaxed">
                Swipe through our premium training zones. Every corner is built to inspire greatness.
              </p>
            </div>
            {/* Scroll Indicator */}
            <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm font-bold">
              <span>Scroll to explore</span> <ArrowRight size={16} />
            </div>
          </div>
        </div>

        {/* HORIZONTAL SCROLL CONTAINER */}
        <div className="flex overflow-x-auto gap-6 px-6 pb-12 snap-x snap-mandatory scroll-smooth no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {galleryImages.map((img, idx) => (
            <div 
              key={idx} 
              className="relative shrink-0 w-[85vw] md:w-[600px] h-[500px] rounded-[2rem] overflow-hidden snap-center group cursor-pointer border border-white/5 shadow-2xl"
            >
              <img 
                src={img.url} 
                alt={img.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              
              {/* Dark Gradient Overlay (Bottom) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Glass Info Card */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h4 className="text-white font-bold text-2xl mb-1">{img.title}</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-blue-300 text-sm font-medium tracking-wide uppercase">{img.subtitle || "Premium Zone"}</p>
                    <div className="bg-white/20 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Spacer for end of scroll */}
          <div className="w-6 shrink-0"></div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Membership Plans</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Invest in yourself.</h3>
          </div>

          {loadingPlans ? (
            <div className="text-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400 font-medium">Loading Packages...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center text-gray-400 py-10">No packages available right now.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {visiblePlans.map((plan) => {
                  const features = getSafeFeatures(plan.features);
                  const isBestValue = plan.duration_months >= 12;

                  return (
                    <div 
                      key={plan.plan_id}
                      className="relative group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col"
                    >
                      <div className="bg-slate-900 p-8 text-white relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                          <Package size={120} />
                        </div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2">
                                {plan.duration_months} Month Access
                              </p>
                            </div>
                            {isBestValue && (
                              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                Best Value
                              </span>
                            )}
                          </div>
                          <div className="mt-8 flex items-baseline gap-1">
                            <span className="text-4xl font-black tracking-tight">
                              Rs. {parseInt(plan.price).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 flex flex-col flex-1">
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed min-h-[40px] line-clamp-2">
                          {plan.description || "Unlock full access to gym facilities and equipment."}
                        </p>
                        
                        <div className="space-y-4 mb-8 flex-1">
                          {features.slice(0, 5).map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-sm text-gray-700 font-bold">
                              <CheckCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                              <span className="leading-tight">{feature}</span>
                            </div>
                          ))}
                          {features.length > 5 && (
                             <div className="pl-8 text-xs font-bold text-blue-600">+ {features.length - 5} more benefits</div>
                          )}
                        </div>

                        <Link 
                          to="/register"
                          className="block w-full py-4 bg-slate-100 text-slate-900 text-center rounded-xl font-black hover:bg-slate-900 hover:text-white transition-all duration-300"
                        >
                          Choose Plan
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {plans.length > 3 && (
                <div className="text-center mt-12">
                  <button
                    onClick={() => setShowAllPlans(!showAllPlans)}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-full font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                  >
                    {showAllPlans ? <>Show Less <ChevronUp size={16} /></> : <>View All Packages <ChevronDown size={16} /></>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">READY TO LEVEL UP?</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Your future self is waiting. Join <b>{config.system_name}</b> today.
          </p>
          <Link to="/register" className="inline-flex items-center px-10 py-5 bg-white text-slate-900 rounded-full font-black text-lg hover:bg-blue-50 transition-transform hover:scale-105">
            Join The Kingdom <ArrowRight className="ml-2" />
          </Link>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-black text-white mb-4 uppercase">{config.system_name}</div>
              <p className="max-w-xs text-sm">Premium fitness facilities designed for those who refuse to settle for average.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>{config.contact_email}</li>
              <li>{config.contact_phone}</li>
              <li className="flex items-start gap-2">{config.gym_location}</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs pt-8 border-t border-slate-900">
          <p>© {new Date().getFullYear()} {config.system_name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Simple Helper Component for Features
function FeatureCard({ icon, title, desc, highlight }) {
  return (
    <div className={`group p-8 rounded-3xl transition-all duration-300 ${highlight ? 'bg-slate-900 shadow-2xl shadow-slate-900/20 transform md:-translate-y-4' : 'bg-slate-50 border border-slate-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-900/5'}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300 ${highlight ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-white text-blue-600'}`}>
        {icon}
      </div>
      <h4 className={`text-xl font-bold mb-3 ${highlight ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
      <p className={`leading-relaxed ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
    </div>
  );
}