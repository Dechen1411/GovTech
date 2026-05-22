import { Landmark, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-primary text-white">
      <div className="container mx-auto px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_0.8fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-gold text-primary">
                <Landmark size={22} />
              </span>
              <div>
                <div className="font-bold">Digital Property Services Portal</div>
                <div className="text-sm text-white/70">Public digital service gateway</div>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/72">
              A government-style digital property service for NDI-verified access, secure document review, transparent ownership records, and lease management.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/80">
              <ShieldCheck size={14} className="text-gold" />
              NDI secured service access
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gold">Service Links</h3>
            <div className="space-y-3">
              {[
                ["Service", "#service"],
                ["Registry", "#registry"],
                ["Process", "#process"],
                ["Standards", "#service-standards"],
                ["Help Desk", "#contact"],
              ].map(([label, href]) => (
                <a key={href} href={href} className="block text-sm text-white/72 transition-colors hover:text-gold">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-gold">Service Contact</h3>
            <div className="space-y-4 text-sm text-white/72">
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-gold" />
                <a href="tel:+97517123456" className="hover:text-gold">
                  +975 17 12 34 56
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-gold" />
                <span>property.platform@gov.bt</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
                <span>Public Service Center, Thimphu, Bhutan</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/60">
          Copyright {new Date().getFullYear()} Digital Property Services Portal. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
