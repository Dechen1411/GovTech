import { Phone, MapPin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto py-16 px-4">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="font-serif text-2xl font-bold mb-4">
              <span className="text-gold-gradient">Smart Property</span> Platform
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              A public digital property service for NDI-verified access, secure document review, and transparent ownership records.
            </p>
            <div className="flex gap-4">
              {["F", "N", "G"].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/40 transition-all duration-300 text-xs font-semibold"
                  aria-label={`Service channel ${label}`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-3">
              {["Home", "About", "Properties", "Why Us", "Testimonials", "Contact"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(" ", "-")}`}
                  className="block text-muted-foreground text-sm hover:text-gold transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">Service Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone size={16} className="text-gold shrink-0" />
                <a href="tel:+97517421732" className="hover:text-gold transition-colors">
                  +975 17 42 17 32
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail size={16} className="text-gold shrink-0" />
                <span>property.platform@gov.bt</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin size={16} className="text-gold shrink-0 mt-0.5" />
                <span>Public Service Center, Thimphu, Bhutan</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground text-sm">
          Copyright {new Date().getFullYear()} Smart Property Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
