import { useEffect, useState, type FormEvent } from "react";
import { Building2, Landmark, Menu, Search, ShieldCheck, X } from "lucide-react";

const navLinks = [
  { label: "Service", href: "#service" },
  { label: "Registry", href: "#registry" },
  { label: "Process", href: "#process" },
  { label: "Standards", href: "#service-standards" },
  { label: "Help Desk", href: "#contact" },
];

type NavbarProps = {
  onLoginClick: (mode: "user" | "admin") => void;
  onLoginPreload?: (mode: "user" | "admin") => void;
};

const Navbar = ({ onLoginClick, onLoginPreload }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    window.dispatchEvent(new CustomEvent("property-search", { detail: { query } }));
    document.getElementById("registry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-primary text-white shadow-sm">
      <div className="border-b border-white/10 bg-[#7a1f2f]">
        <div className="container mx-auto flex min-h-9 flex-wrap items-center justify-between gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/90">
          <span className="inline-flex items-center gap-2">
            <Landmark size={14} />
            Public Digital Property Services
          </span>
          <span className="hidden items-center gap-2 sm:inline-flex">
            <ShieldCheck size={14} />
            Bhutan NDI verified access
          </span>
        </div>
      </div>

      <nav className={`transition-colors duration-300 ${scrolled ? "bg-primary" : "bg-primary/95 backdrop-blur-md"}`}>
        <div className="container mx-auto flex items-center justify-between gap-5 px-4 py-4">
          <a href="#home" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gold text-primary">
              <Building2 size={22} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold leading-tight md:text-lg">Digital Property Services Portal</span>
              <span className="block truncate text-xs font-medium text-white/70">Royal Government Service Gateway</span>
            </span>
          </a>

          <div className="hidden items-center gap-5 lg:flex">
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
              className="hidden h-10 w-52 items-center gap-2 rounded-sm border border-white/20 bg-white/10 px-3 text-white/70 focus-within:border-gold xl:flex"
            >
              <button type="submit" aria-label="Search property registry" className="text-gold">
                <Search size={14} />
              </button>
              <input
                aria-label="Search property registry"
                placeholder="Search registry"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
              />
            </form>
            <button
              type="button"
              onFocus={() => onLoginPreload?.("user")}
              onMouseEnter={() => onLoginPreload?.("user")}
              onClick={() => onLoginClick("user")}
              className="rounded-sm bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary transition-colors duration-300 hover:bg-gold-light"
            >
              Citizen Login
            </button>
            <button
              type="button"
              onFocus={() => onLoginPreload?.("admin")}
              onMouseEnter={() => onLoginPreload?.("admin")}
              onClick={() => onLoginClick("admin")}
              className="rounded-sm border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors duration-300 hover:border-gold hover:text-gold"
            >
              Officer Portal
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-sm border border-white/20 p-2 text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="animate-fade-in border-t border-white/10 bg-primary md:hidden">
            <div className="container mx-auto flex flex-col gap-4 px-4 py-5">
              <form
                onSubmit={submitSearch}
                className="flex h-11 items-center gap-2 rounded-sm border border-white/20 bg-white/10 px-3 text-white/70 focus-within:border-gold"
              >
                <button type="submit" aria-label="Search property registry" className="text-gold">
                  <Search size={15} />
                </button>
                <input
                  aria-label="Search property registry"
                  placeholder="Search registry"
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
                  className="py-2 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-gold"
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onFocus={() => onLoginPreload?.("user")}
                onClick={() => {
                  setMobileOpen(false);
                  onLoginClick("user");
                }}
                className="rounded-sm bg-gold px-5 py-3 text-center text-sm font-bold uppercase tracking-wide text-primary"
              >
                Citizen Login
              </button>
              <button
                type="button"
                onFocus={() => onLoginPreload?.("admin")}
                onClick={() => {
                  setMobileOpen(false);
                  onLoginClick("admin");
                }}
                className="rounded-sm border border-white/25 px-5 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white"
              >
                Officer Portal
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
