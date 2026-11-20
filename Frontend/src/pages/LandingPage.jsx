import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import AuthModal from '../components/AuthModal';
import '../landing.css';

// Static content for the landing page (taken from the Figma design).
// Nothing here touches the backend.
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1765518440022-10242cc86895?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1600';

const CATEGORIES = [
  { name: 'Electrical', icon: 'bolt', desc: 'Wiring, lighting & repairs', jobs: '120+ experts' },
  { name: 'Plumbing', icon: 'drop', desc: 'Leaks, fittings & drainage', jobs: '85+ experts' },
  { name: 'AC Repair', icon: 'wind', desc: 'Service, repair & installation', jobs: '70+ experts' },
  { name: 'Computer Repair', icon: 'monitor', desc: 'Hardware, software & network', jobs: '55+ experts' },
  { name: 'Cleaning', icon: 'sparkle', desc: 'Home & office deep cleaning', jobs: '95+ experts' },
  { name: 'Appliance Repair', icon: 'tool', desc: 'All household appliances', jobs: '65+ experts' },
];

const PROVIDERS = [
  { name: 'Nimal Perera', service: 'Master Electrician', city: 'Colombo 05', rating: 4.9, reviews: 128, price: 2500, initials: 'NP', color: 'blue' },
  { name: 'Kasun Silva', service: 'Plumbing Specialist', city: 'Nugegoda', rating: 4.8, reviews: 96, price: 2000, initials: 'KS', color: 'teal' },
  { name: 'Fathima Rizwan', service: 'AC Technician', city: 'Dehiwala', rating: 4.9, reviews: 84, price: 3500, initials: 'FR', color: 'violet' },
  { name: 'Dinesh Fernando', service: 'Appliance Repair', city: 'Kandy', rating: 4.7, reviews: 72, price: 1800, initials: 'DF', color: 'orange' },
];

function Stars({ rating }) {
  return (
    <span className="lp-stars">
      <Icon name="star" size={15} /> <b>{rating}</b>
    </span>
  );
}

function Logo({ light = false }) {
  return (
    <button
      type="button"
      className={`lp-logo ${light ? 'lp-logo-light' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <span>
        <Icon name="tool" size={20} />
      </span>
      FixMate
    </button>
  );
}

function Btn({ children, variant = 'primary', onClick }) {
  return (
    <button type="button" className={`lp-btn lp-btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// auth is "login" or "register" when this page is opened at /login or /register,
// and undefined at "/" (no popup).
export default function LandingPage({ auth }) {
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');

  // Customers need an account to browse, so ProtectedRoute sends
  // anyone who is not logged in on to /login.
  const browse = () => navigate('/services');
  const login = () => navigate('/login');
  const register = () => navigate('/register');

  return (
    <div className="lp">
      <header className="lp-navbar">
        <Logo />
        <nav className={mobileNav ? 'lp-nav-open' : ''}>
          <a href="#services" onClick={() => setMobileNav(false)}>Services</a>
          <a href="#providers" onClick={() => setMobileNav(false)}>Professionals</a>
          <a href="#how" onClick={() => setMobileNav(false)}>How it works</a>
          <button type="button" className="lp-nav-role" onClick={register}>
            For professionals
          </button>
        </nav>
        <div className="lp-nav-actions">
          <Btn variant="ghost" onClick={login}>Log in</Btn>
          <Btn onClick={register}>Get started</Btn>
        </div>
        <button
          type="button"
          className="lp-menu-button"
          aria-label="Toggle menu"
          onClick={() => setMobileNav((open) => !open)}
        >
          <Icon name={mobileNav ? 'close' : 'menu'} />
        </button>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow">
              <span className="lp-pulse" /> Trusted by 10,000+ Sri Lankan homes
            </span>
            <h1>
              Your home deserves the <span>best care.</span>
            </h1>
            <p>
              Book verified, skilled professionals for any home service. Reliable help is just a few
              clicks away.
            </p>
            <div className="lp-hero-search">
              <div>
                <Icon name="search" />
                <label>
                  What do you need?
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="e.g. AC repair"
                  />
                </label>
              </div>
              <div>
                <Icon name="pin" />
                <label>
                  Your location
                  <select>
                    <option>Colombo</option>
                    <option>Kandy</option>
                    <option>Galle</option>
                    <option>Negombo</option>
                  </select>
                </label>
              </div>
              <Btn onClick={browse}>Find a professional</Btn>
            </div>
            <div className="lp-trust-row">
              <span><b>4.9</b> average rating</span>
              <i />
              <span><b>800+</b> verified experts</span>
              <i />
              <span><b>24/7</b> support</span>
            </div>
          </div>

          <div className="lp-hero-visual">
            <img src={HERO_IMAGE} alt="Professional tool belt ready for a home service" />
            <div className="lp-hero-float lp-hero-rating">
              <span className="lp-avatar lp-avatar-blue">NP</span>
              <div>
                <b>Nimal is top-rated</b>
                <small>
                  <Stars rating={4.9} /> · 128 jobs
                </small>
              </div>
            </div>
            <div className="lp-hero-float lp-hero-check">
              <span>
                <Icon name="check" />
              </span>
              <div>
                <b>Booking confirmed</b>
                <small>Electrician · Today, 2:30 PM</small>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-logo-strip">
          <span>Verified professionals</span>
          <b>CEB Certified</b>
          <b>NVQ Qualified</b>
          <b>SLTDA Trusted</b>
          <b>Islandwide Service</b>
        </section>

        <section className="lp-section" id="services">
          <div className="lp-section-heading">
            <div>
              <span className="lp-kicker">Explore services</span>
              <h2>Help for every corner of your home</h2>
              <p>Browse our most requested services, delivered by experienced professionals.</p>
            </div>
            <Btn variant="secondary" onClick={browse}>
              View all services <Icon name="chevron" size={16} />
            </Btn>
          </div>
          <div className="lp-category-grid">
            {CATEGORIES.map((c) => (
              <button type="button" className="lp-category-card" key={c.name} onClick={browse}>
                <span className={`lp-category-icon lp-icon-${c.icon}`}>
                  <Icon name={c.icon} size={25} />
                </span>
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
                <small>{c.jobs}</small>
                <span className="lp-card-arrow">
                  <Icon name="chevron" size={18} />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="lp-section lp-alt-section" id="providers">
          <div className="lp-section-heading">
            <div>
              <span className="lp-kicker">Top professionals</span>
              <h2>Trusted experts near you</h2>
              <p>Handpicked for quality, reliability, and exceptional customer care.</p>
            </div>
          </div>
          <div className="lp-provider-grid">
            {PROVIDERS.map((p) => (
              <div className="lp-provider-card" key={p.name}>
                <div className="lp-provider-top">
                  <span className={`lp-avatar lp-avatar-lg lp-avatar-${p.color}`}>
                    {p.initials}
                    <i>
                      <Icon name="check" size={11} />
                    </i>
                  </span>
                  <span className="lp-available">Available today</span>
                </div>
                <h3>{p.name}</h3>
                <p className="lp-service-name">{p.service}</p>
                <div className="lp-provider-meta">
                  <Stars rating={p.rating} />
                  <span>({p.reviews})</span>
                  <span>
                    <Icon name="pin" size={14} />
                    {p.city}
                  </span>
                </div>
                <div className="lp-provider-footer">
                  <div>
                    <small>Starts from</small>
                    <b>LKR {p.price.toLocaleString()}</b>
                  </div>
                  <Btn variant="secondary" onClick={browse}>
                    View profile
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section lp-how" id="how">
          <div className="lp-center-heading">
            <span className="lp-kicker">Simple &amp; stress-free</span>
            <h2>Book help in three easy steps</h2>
          </div>
          <div className="lp-steps">
            <div>
              <span>01</span>
              <div className="lp-step-icon">
                <Icon name="search" />
              </div>
              <h3>Choose a service</h3>
              <p>Tell us what you need and where you are.</p>
            </div>
            <div>
              <span>02</span>
              <div className="lp-step-icon">
                <Icon name="calendar" />
              </div>
              <h3>Pick your professional</h3>
              <p>Compare profiles, prices, and reviews.</p>
            </div>
            <div>
              <span>03</span>
              <div className="lp-step-icon">
                <Icon name="check" />
              </div>
              <h3>Relax, it&apos;s handled</h3>
              <p>Your professional arrives right on time.</p>
            </div>
          </div>
        </section>

        <section className="lp-testimonial-wrap">
          <div className="lp-testimonial-copy">
            <span className="lp-kicker">Loved across Sri Lanka</span>
            <h2>Home care that earns trust</h2>
            <blockquote>
              “I found an electrician within minutes and he arrived the same afternoon. The service
              was professional, transparent, and incredibly easy.”
            </blockquote>
            <div className="lp-quote-author">
              <span className="lp-avatar lp-avatar-violet">AM</span>
              <div>
                <b>Anushka Mendis</b>
                <small>Customer from Rajagiriya</small>
              </div>
              <Stars rating={5} />
            </div>
          </div>
          <div className="lp-testimonial-stats">
            <div>
              <b>10K+</b>
              <span>Happy customers</span>
            </div>
            <div>
              <b>25K+</b>
              <span>Services completed</span>
            </div>
            <div>
              <b>4.9/5</b>
              <span>Average rating</span>
            </div>
            <div>
              <b>800+</b>
              <span>Verified experts</span>
            </div>
          </div>
        </section>

        <section className="lp-cta">
          <div>
            <span className="lp-eyebrow lp-eyebrow-light">Fast. Reliable. Verified.</span>
            <h2>Ready to get your home sorted?</h2>
            <p>Join thousands of happy homeowners across Sri Lanka.</p>
          </div>
          <Btn variant="secondary" onClick={register}>
            Book your first service <Icon name="chevron" size={16} />
          </Btn>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-main">
          <div className="lp-footer-brand">
            <Logo light />
            <p>Trusted home services, delivered by verified professionals across Sri Lanka.</p>
            <div className="lp-socials">
              <span>f</span>
              <span>in</span>
              <span>ig</span>
            </div>
          </div>
          <div>
            <b>Services</b>
            <a>Electrical</a>
            <a>Plumbing</a>
            <a>AC Repair</a>
            <a>Cleaning</a>
          </div>
          <div>
            <b>Company</b>
            <a>About us</a>
            <a>How it works</a>
            <a>Contact</a>
            <a>Help center</a>
          </div>
          <div>
            <b>For professionals</b>
            <button type="button" onClick={register}>Join as a provider</button>
            <a>Provider resources</a>
            <button type="button" onClick={login}>Admin portal</button>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2025 FixMate (Pvt) Ltd. All rights reserved.</span>
          <span>Privacy policy · Terms of service</span>
        </div>
      </footer>
      {auth && <AuthModal key={auth} mode={auth} />}
    </div>
  );
}
