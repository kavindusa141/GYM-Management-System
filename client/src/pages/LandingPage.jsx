import { Link } from 'react-router-dom';
import { Dumbbell, Users, Calendar, ArrowRight, CheckCircle, Star, TrendingUp, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* --- NAVIGATION (Glass Effect) --- */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              R
            </div>
            ROYAL<span className="text-blue-600">FITNESS</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">FEATURES</a>
            <a href="#pricing" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">PRICING</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
              Log In
            </Link>
            <Link to="/register" className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/30">
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-slate-900">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80" 
            alt="Gym Background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Star size={12} fill="currentColor" /> #1 Rated Gym in the City
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
              FORGE YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                LEGACY.
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              Stop wishing, start working. Join an elite community dedicated to strength, discipline, and results. Your transformation starts here.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/register" className="group flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20">
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="flex items-center justify-center px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
                Member Login
              </Link>
            </div>

            {/* Stats */}
            <div className="pt-10 flex items-center gap-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-black text-white">2k+</p>
                <p className="text-xs text-slate-500 font-bold uppercase">Members</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <p className="text-3xl font-black text-white">50+</p>
                <p className="text-xs text-slate-500 font-bold uppercase">Trainers</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <p className="text-3xl font-black text-white">24/7</p>
                <p className="text-xs text-slate-500 font-bold uppercase">Access</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- FEATURES SECTION (Bento Grid Style) --- */}
      <section id="features" className="py-24 bg-white relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Why Royal Fitness</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Everything you need to exceed your limits.</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300 text-blue-600">
                <Dumbbell size={28} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Premium Equipment</h4>
              <p className="text-slate-500 leading-relaxed">
                Train with industry-leading Hammer Strength & Life Fitness machines designed for biomechanical perfection.
              </p>
            </div>

            {/* Feature 2 (Highlighted) */}
            <div className="group bg-slate-900 p-8 rounded-3xl shadow-2xl shadow-slate-900/20 transform md:-translate-y-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 group-hover:scale-110 transition-transform duration-300 text-white">
                <Users size={28} />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Elite Coaching</h4>
              <p className="text-slate-400 leading-relaxed">
                Our certified trainers don't just count reps; they build personalized periodization plans to guarantee results.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300 text-orange-500">
                <Calendar size={28} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">Dynamic Classes</h4>
              <p className="text-slate-500 leading-relaxed">
                From high-intensity HIIT to restorative Yoga, join classes that keep your body guessing and growing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Membership Plans</h2>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">Invest in yourself.</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            
            {/* Basic Plan */}
            <PricingCard 
              title="Monthly" 
              price="5,000" 
              features={['Gym Access', 'Locker Room', 'Free Wifi', 'Standard Support']} 
            />

            {/* Pro Plan (Highlighted) */}
            <div className="relative bg-white p-8 rounded-3xl shadow-2xl border-2 border-blue-600 transform scale-105 z-10">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wide">
                Best Value
              </div>
              <h3 className="text-xl font-bold text-slate-900">Annual Pass</h3>
              <div className="flex items-end gap-1 my-6">
                <span className="text-4xl font-black text-slate-900">Rs. 45,000</span>
                <span className="text-slate-500 font-medium mb-1">/year</span>
              </div>
              <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
                Commit to a year of transformation. Save 25% compared to monthly.
              </p>
              <ul className="space-y-4 mb-8">
                {['24/7 All Club Access', 'Free Personal Training Session', 'Nutrition Guide Included', 'Guest Privileges', 'Priority Class Booking'].map((f, i) => (
                  <li key={i} className="flex items-center text-sm font-bold text-slate-700">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-3 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block w-full py-4 bg-blue-600 text-white text-center rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30">
                Get Started Now
              </Link>
            </div>

            {/* Day Pass */}
             <PricingCard 
              title="Day Pass" 
              price="1,500" 
              features={['Single Day Access', 'Locker Room', 'Class Drop-in (+$500)']} 
              buttonText="Buy Pass"
            />

          </div>
        </div>
      </section>

      {/* --- CTA BANNER --- */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">
            READY TO LEVEL UP?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            Your future self is waiting. Join Royal Fitness Kingdom today and build the body you deserve.
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
             <div className="text-2xl font-black text-white mb-4">ROYAL<span className="text-blue-600">FITNESS</span></div>
             <p className="max-w-xs text-sm">Premium fitness facilities designed for those who refuse to settle for average.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-500">About Us</a></li>
              <li><a href="#" className="hover:text-blue-500">Classes</a></li>
              <li><a href="#" className="hover:text-blue-500">Trainers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>support@royalfitness.com</li>
              <li>+94 11 234 5678</li>
              <li>Colombo, Sri Lanka</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs pt-8 border-t border-slate-900">
          <p>© 2026 Royal Fitness Kingdom. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ title, price, features, buttonText = "Choose Plan" }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <div className="flex items-end gap-1 my-6">
        <span className="text-3xl font-black text-slate-900">Rs. {price}</span>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center text-sm font-medium text-slate-600">
            <CheckCircle className="w-5 h-5 text-slate-300 mr-3 shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <Link to="/register" className="block w-full py-3 bg-slate-100 text-slate-900 text-center rounded-xl font-bold hover:bg-slate-200 transition-colors">
        {buttonText}
      </Link>
    </div>
  );
}