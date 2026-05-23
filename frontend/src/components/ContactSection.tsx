import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Digital Property Services inquiry from ${form.name}`);
    const body = encodeURIComponent(form.message);
    window.location.href = `mailto:property.platform@gov.bt?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container mx-auto">
        <div className="mb-12 max-w-3xl">
          <span className="text-sm font-bold uppercase tracking-widest text-[#7a1f2f]">Help desk</span>
          <h2 className="mt-3 text-3xl font-extrabold text-primary md:text-4xl">
            Contact the property services help desk.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Use this channel for document submission support, registry questions, officer review follow-up, and lease record assistance.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="border border-border bg-background p-6">
            <h3 className="text-lg font-bold text-primary">Service contact</h3>
            <div className="mt-6 space-y-5">
              {[
                { icon: Phone, label: "Phone", value: "+975 17 12 34 56", href: "tel:+97517123456" },
                { icon: Mail, label: "Email", value: "property.platform@gov.bt", href: "mailto:property.platform@gov.bt" },
                { icon: MapPin, label: "Office", value: "Public Service Center, Thimphu, Bhutan" },
                { icon: Clock, label: "Portal availability", value: "Online services available 24/7" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-white text-gold-dark shadow-sm">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="mt-1 block text-sm font-semibold text-primary hover:text-[#7a1f2f]">
                          {item.value}
                        </a>
                      ) : (
                        <div className="mt-1 text-sm font-semibold text-primary">{item.value}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-border bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-primary">Full name</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-sm border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-primary">Email</label>
                  <input
                    type="email"
                    required
                    maxLength={255}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-sm border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-primary">Service request</label>
                <textarea
                  required
                  maxLength={1000}
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full resize-none rounded-sm border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
                  placeholder="Describe the property service request or issue..."
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-sm bg-primary py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors duration-300 hover:bg-[#173b4d]"
              >
                Send service request
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
