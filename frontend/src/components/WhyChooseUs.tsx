import { ShieldCheck, FileCheck, History, SearchCheck } from "lucide-react";

const reasons = [
  { icon: ShieldCheck, title: "Blockchain Verification", desc: "Blockchain-backed verification confirms legal ownership before a listing goes live." },
  { icon: History, title: "On-Chain History", desc: "Track timeline events and past transfers for each property in one clear, tamper-resistant view." },
  { icon: FileCheck, title: "Document Hash Validation", desc: "Critical property files are hash-verified and matched to ledger records to reduce fraud risks." },
  { icon: SearchCheck, title: "Agent-Buyer Clarity", desc: "Buyers and agents use the same transparent data to move deals faster and safer." },
];

const WhyChooseUs = () => {
  return (
    <section id="why-us" className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold text-sm font-semibold tracking-widest uppercase">Our Promise</span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold mt-3">
            Why Choose <span className="text-gold-gradient">Blockchain Verification</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="text-center group p-8 bg-card border border-border rounded-lg hover:gold-border hover:gold-glow transition-all duration-500"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-6 group-hover:bg-gold/20 transition-colors duration-300">
                <r.icon className="text-gold" size={28} />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-3">{r.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
