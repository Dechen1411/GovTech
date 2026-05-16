import { ArrowRight, BadgeCheck, FileCheck, Landmark, WalletCards } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const serviceCards = [
  {
    icon: FileCheck,
    title: "Submit property",
    description: "Encrypted document review and approval queue",
  },
  {
    icon: WalletCards,
    title: "Buy shares",
    description: "Full and fractional ownership listings",
  },
  {
    icon: BadgeCheck,
    title: "Resell holdings",
    description: "Secondary market for verified shareholders",
  },
];

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-primary pt-24">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Verified property in Bhutan" width={1920} height={1080} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,31,58,0.96)_0%,rgba(11,31,58,0.84)_42%,rgba(11,31,58,0.40)_72%,rgba(11,31,58,0.22)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-primary to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto flex min-h-[calc(100vh-6rem)] flex-col justify-center px-4 pb-12 pt-10">
        <div className="max-w-3xl opacity-0 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gold backdrop-blur-sm">
            <Landmark size={14} />
            NDI Verified Property Services
          </div>

          <h1 className="max-w-4xl font-sans text-4xl font-bold uppercase leading-[1.08] text-white drop-shadow-lg md:text-5xl lg:text-6xl">
            The best place to find property services and information
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 drop-shadow md:text-lg">
            Access verified real estate listings, fractional ownership, document review, and wallet-backed transfers from one trusted property platform.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="#properties"
              className="inline-flex w-fit items-center gap-2 rounded-sm bg-gold px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary transition-colors hover:bg-gold-light"
            >
              Explore services
              <ArrowRight size={16} />
            </a>
            <a
              href="/login"
              className="inline-flex w-fit items-center gap-2 rounded-sm border border-white/30 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:border-gold hover:text-gold"
            >
              Sign in with NDI
            </a>
          </div>
        </div>

        <div className="mt-12 grid max-w-5xl gap-4 opacity-0 animate-fade-in-up sm:grid-cols-3" style={{ animationDelay: "0.35s" }}>
          {serviceCards.map((card) => {
            const Icon = card.icon;
            return (
              <a
                key={card.title}
                href="#properties"
                className="group border-t-4 border-gold bg-white/95 p-5 text-left shadow-xl shadow-primary/20 transition-transform hover:-translate-y-1"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-sm bg-primary text-gold">
                  <Icon size={21} />
                </div>
                <h2 className="font-sans text-lg font-bold text-primary">{card.title}</h2>
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
