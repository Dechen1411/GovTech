import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Building2, Menu, Search, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Properties", href: "#properties" },
  { label: "Why Us", href: "#why-us" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    window.dispatchEvent(new CustomEvent("property-search", { detail: { query } }));
    document.getElementById("properties")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-primary shadow-lg shadow-primary/20" : "bg-primary/95 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between gap-5 py-4">
        <a href="#home" className="flex items-center gap-2 font-sans text-lg font-bold tracking-wide text-white md:text-xl">
          <Building2 size={20} className="text-gold" />
          <span>Smart Property</span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-semibold uppercase tracking-wide text-white/80 transition-colors duration-300 hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <form
            onSubmit={submitSearch}
            className="hidden h-9 w-44 items-center gap-2 rounded-sm border border-white/20 bg-white/10 px-3 text-white/70 focus-within:border-gold lg:flex"
          >
            <button type="submit" aria-label="Search properties" className="text-gold">
              <Search size={14} />
            </button>
            <input
              aria-label="Search property listings"
              placeholder="Search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
            />
          </form>
          <Link
            to="/login"
            className="rounded-sm border border-gold/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gold transition-colors duration-300 hover:bg-gold hover:text-primary"
          >
            Login
          </Link>
          <a
            href="#contact"
            className="rounded-sm bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-wide text-primary transition-colors duration-300 hover:bg-gold-light"
          >
            Contact
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-white/10 bg-primary md:hidden">
          <div className="container mx-auto py-6 flex flex-col gap-4">
            <form
              onSubmit={submitSearch}
              className="flex h-11 items-center gap-2 rounded-sm border border-white/20 bg-white/10 px-3 text-white/70 focus-within:border-gold"
            >
              <button type="submit" aria-label="Search properties" className="text-gold">
                <Search size={15} />
              </button>
              <input
                aria-label="Search property listings"
                placeholder="Search properties"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
              />
            </form>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm font-medium uppercase tracking-wide text-white/80 hover:text-gold"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-sm border border-gold/40 px-5 py-3 text-center text-sm font-semibold uppercase tracking-wide text-gold transition-colors duration-300 hover:bg-gold hover:text-primary"
            >
              Login
            </Link>
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="rounded-sm bg-gold px-6 py-3 text-center text-sm font-semibold uppercase tracking-wide text-primary"
            >
              Contact
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
