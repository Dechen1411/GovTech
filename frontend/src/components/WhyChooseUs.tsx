import { FileLock2, History, Scale, SearchCheck, ShieldCheck } from "lucide-react";

const standards = [
  { icon: ShieldCheck, title: "Identity assurance", desc: "Access begins with NDI verification and signed session records." },
  { icon: FileLock2, title: "Document protection", desc: "Uploaded documents are encrypted before storage and represented by hashes." },
  { icon: History, title: "Traceable registry events", desc: "Minting, transfers, leases, and closures are linked to auditable transaction references." },
  { icon: Scale, title: "Officer accountability", desc: "Review decisions and administrative actions are captured in the audit log." },
  { icon: SearchCheck, title: "Public transparency", desc: "Approved listings show status, share availability, seller wallet, and proof references." },
];

const WhyChooseUs = () => {
  return (
    <section id="security" className="section-padding bg-white">
      <div className="container mx-auto">
        <div className="mb-12 max-w-3xl">
          <span className="text-sm font-bold uppercase tracking-widest text-[#7a1f2f]">Security and compliance</span>
          <h2 className="mt-3 text-3xl font-extrabold text-primary md:text-4xl">
            Built around public-service trust requirements.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The portal separates personal identity from public registry proofs while giving citizens and officers a clear trail for property service decisions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {standards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="border border-border bg-background p-5">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-sm bg-white text-gold-dark shadow-sm">
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-primary">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
