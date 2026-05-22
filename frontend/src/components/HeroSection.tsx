import { ArrowRight, BadgeCheck, ClipboardCheck, FileCheck, Landmark, LockKeyhole, ShieldCheck } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const primaryActions = [
  {
    title: "Submit property records",
    description: "Upload encrypted ownership documents for officer review.",
    icon: FileCheck,
  },
  {
    title: "View verified registry",
    description: "Inspect approved listings, share supply, and ownership history.",
    icon: ClipboardCheck,
  },
  {
    title: "Record lease activity",
    description: "Create tamper-resistant lease and resale records.",
    icon: BadgeCheck,
  },
];

const serviceSignals = [
  { label: "NDI authentication", icon: ShieldCheck },
  { label: "Encrypted document review", icon: LockKeyhole },
  { label: "Sepolia registry proof", icon: Landmark },
];

type HeroSectionProps = {
  onLoginClick: (mode: "user" | "admin") => void;
  onLoginPreload?: (mode: "user" | "admin") => void;
};

const HeroSection = ({ onLoginClick, onLoginPreload }: HeroSectionProps) => {
  return (
    <section id="home" className="relative overflow-hidden bg-background pt-32">
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Public digital property services in Bhutan"
          width={1920}
          height={1080}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,248,250,0.98)_0%,rgba(246,248,250,0.94)_43%,rgba(246,248,250,0.78)_70%,rgba(246,248,250,0.70)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-4 pb-16 pt-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.7fr)] lg:items-end">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-sm border border-[#7a1f2f]/20 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#7a1f2f] shadow-sm">
              <Landmark size={14} />
              Government property service portal
            </div>

            <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-normal text-primary md:text-5xl lg:text-6xl">
              Digital Property Services Portal
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              A public service gateway for NDI-verified property submission, officer review, ownership share records, and lease history backed by encrypted documents and blockchain proof.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onFocus={() => onLoginPreload?.("user")}
                onMouseEnter={() => onLoginPreload?.("user")}
                onClick={() => onLoginClick("user")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#173b4d] sm:w-fit"
              >
                Citizen Login with NDI
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onFocus={() => onLoginPreload?.("admin")}
                onMouseEnter={() => onLoginPreload?.("admin")}
                onClick={() => onLoginClick("admin")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-primary/20 bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary transition-colors hover:border-[#7a1f2f] hover:text-[#7a1f2f] sm:w-fit"
              >
                Officer Portal
              </button>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {serviceSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div key={signal.label} className="flex items-center gap-2 rounded-sm border border-border bg-white/85 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm">
                    <Icon size={15} className="shrink-0 text-gold-dark" />
                    <span>{signal.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="border border-border bg-white/90 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#7a1f2f]">Service Status</p>
                <h2 className="mt-1 text-xl font-bold text-primary">Available Online</h2>
              </div>
              <span className="rounded-sm bg-emerald-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">Live</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Identity provider</dt>
                <dd className="font-semibold text-primary">Bhutan NDI</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Document storage</dt>
                <dd className="font-semibold text-primary">Encrypted IPFS</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Contract network</dt>
                <dd className="font-semibold text-primary">Sepolia</dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {primaryActions.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.title}
                href="#registry"
                className="group border-l-4 border-gold bg-white p-5 text-left shadow-sm transition-colors hover:border-[#7a1f2f]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-sm bg-primary text-gold">
                  <Icon size={21} />
                </div>
                <h2 className="text-lg font-bold text-primary">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
