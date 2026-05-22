import { BadgeCheck, ClipboardList, FileCheck, Landmark, ShieldCheck, UserCheck } from "lucide-react";

const processSteps = [
  {
    icon: UserCheck,
    title: "1. NDI verification",
    desc: "Citizens authenticate through Bhutan NDI before submitting or purchasing records.",
  },
  {
    icon: FileCheck,
    title: "2. Officer review",
    desc: "Property documents are encrypted, hashed, and queued for administrative validation.",
  },
  {
    icon: BadgeCheck,
    title: "3. Registry update",
    desc: "Approved ownership shares and lease records are written to the smart property registry.",
  },
];

const serviceFacts = [
  { icon: Landmark, label: "Public service", desc: "Designed for citizen and officer workflows" },
  { icon: ClipboardList, label: "Review queue", desc: "Structured document assessment before listing" },
  { icon: ShieldCheck, label: "Audit trail", desc: "Ownership actions remain traceable and verifiable" },
];

const AboutSection = () => {
  return (
    <section id="service" className="section-padding bg-white">
      <div className="container mx-auto">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <span className="text-sm font-bold uppercase tracking-widest text-[#7a1f2f]">Service overview</span>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-primary md:text-4xl">
              A single public portal for property records, review, and verified ownership activity.
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              The platform supports a transparent property service model by combining identity assurance, document validation, digital wallets, and tamper-resistant registry events.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Personal identity details remain off-chain while the public record keeps the proof needed for ownership, fractional shares, resale, and lease activity.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {serviceFacts.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="border border-border bg-background p-5">
                  <Icon className="mb-4 text-gold-dark" size={28} />
                  <h3 className="font-bold text-primary">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div id="process" className="mt-14 border border-border bg-background p-5 md:p-6">
          <div className="mb-6 flex flex-col justify-between gap-3 border-b border-border pb-5 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gold-dark">How the service works</span>
              <h3 className="mt-2 text-2xl font-extrabold text-primary">Citizen to officer to registry</h3>
            </div>
            <a href="#contact" className="text-sm font-bold uppercase tracking-wide text-[#7a1f2f] hover:underline">
              Contact help desk
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-gold">
                    <Icon size={20} />
                  </div>
                  <h4 className="font-bold text-primary">{step.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
