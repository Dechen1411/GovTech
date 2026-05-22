import { Clock3, FileWarning, Headphones, ShieldCheck } from "lucide-react";

const standards = [
  {
    icon: Clock3,
    title: "Clear processing stages",
    text: "Submission, review, approval, listing, purchase, resale, and lease states are visible to authorized users.",
  },
  {
    icon: FileWarning,
    title: "No raw identity data on-chain",
    text: "Identity proof is verified off-chain while only property, wallet, and document proof references are recorded.",
  },
  {
    icon: Headphones,
    title: "Help desk escalation",
    text: "Citizens and officers can route service issues to the property desk for manual review or dispute handling.",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="service-standards" className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-sm font-bold uppercase tracking-widest text-[#7a1f2f]">Service standards</span>
            <h2 className="mt-3 text-3xl font-extrabold text-primary md:text-4xl">
              Public service controls instead of marketing claims.
            </h2>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-sm border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <ShieldCheck size={18} />
            Backend service online
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {standards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="border border-border bg-white p-6 shadow-sm">
                <Icon className="mb-5 text-gold-dark" size={30} />
                <h3 className="text-lg font-bold text-primary">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
