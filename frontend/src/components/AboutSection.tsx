import { BadgeCheck, FileCheck, Landmark, ShieldCheck } from "lucide-react";

const stats = [
  { icon: BadgeCheck, label: "NDI", desc: "Verified Access" },
  { icon: Landmark, label: "Gov", desc: "Property Service Portal" },
  { icon: FileCheck, label: "Hash", desc: "Document Proof" },
  { icon: ShieldCheck, label: "Full", desc: "Ownership Audit Trail" },
];

const AboutSection = () => {
  return (
    <section id="about" className="section-padding">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <span className="text-gold text-sm font-semibold tracking-widest uppercase">About the Service</span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mt-3 mb-6">
              A trusted digital gateway for <span className="text-gold-gradient">property ownership</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              The Smart Property Platform supports a more transparent public property service by combining Bhutan NDI identity verification, secure document review, and blockchain-backed fractional ownership records.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Citizens can access verified listings, submit property documents for review, purchase approved shares, and inspect ownership history without exposing personal identity data on-chain.
            </p>
            <div className="h-px bg-gradient-to-r from-gold/50 via-gold/20 to-transparent" />
          </div>

          {/* Right - Stats */}
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card border border-border p-6 rounded-lg hover:gold-border hover:gold-glow transition-all duration-500 group"
              >
                <stat.icon className="text-gold mb-4 group-hover:scale-110 transition-transform duration-300" size={32} />
                <div className="font-serif text-2xl font-bold text-foreground">{stat.label}</div>
                <div className="text-muted-foreground text-sm mt-1">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
