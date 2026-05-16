import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dorji Wangmo",
    role: "Homeowner",
    text: "I could review blockchain-verified ownership records and documents before paying the booking amount. That transparency made my decision easy.",
  },
  {
    name: "Tshering Penjor",
    role: "Property Investor",
    text: "The ownership timeline feature helped me compare assets quickly. It reduced due diligence time for my investment team.",
  },
  {
    name: "Karma Choden",
    role: "First-time Buyer",
    text: "As a first-time buyer, I trusted the platform because every listing showed document verification status and clear on-chain history.",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="section-padding bg-card/50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold text-sm font-semibold tracking-widest uppercase">Testimonials</span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold mt-3">
            Trusted by <span className="text-gold-gradient">Buyers & Agents</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-card border border-border p-8 rounded-lg hover:gold-border hover:gold-glow transition-all duration-500 relative"
            >
              <Quote className="text-gold/20 absolute top-6 right-6" size={40} />
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className="fill-gold text-gold" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6 italic">"{t.text}"</p>
              <div className="border-t border-border pt-4">
                <div className="font-serif font-semibold">{t.name}</div>
                <div className="text-gold text-sm">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
