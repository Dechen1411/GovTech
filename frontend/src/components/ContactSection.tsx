import { useState } from "react";
import { Phone, MapPin, Clock, Mail } from "lucide-react";

const ContactSection = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Smart Property Platform inquiry from ${form.name}`);
    const body = encodeURIComponent(form.message);
    window.location.href = `mailto:property.platform@gov.bt?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold text-sm font-semibold tracking-widest uppercase">Service Desk</span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold mt-3">
            Contact the <span className="text-gold-gradient">Property Service Team</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-card border border-border rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Full Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold transition"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Email</label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold transition"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Message</label>
                <textarea
                  required
                  maxLength={1000}
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold transition resize-none"
                  placeholder="Tell us about your property service request..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-4 text-sm font-semibold tracking-widest uppercase hover:bg-gold-light transition-colors duration-300 rounded-sm"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Info + Map */}
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Phone, label: "Phone", value: "+975 17 42 17 32", href: "tel:+97517421732" },
                { icon: Mail, label: "Email", value: "property.platform@gov.bt", href: "mailto:property.platform@gov.bt" },
                { icon: MapPin, label: "Office", value: "Public Service Center, Thimphu, Bhutan" },
                { icon: Clock, label: "Portal", value: "Online services available 24/7" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-gold" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    {item.href ? (
                      <a href={item.href} className="text-foreground font-medium hover:text-gold transition-colors text-sm">
                        {item.value}
                      </a>
                    ) : (
                      <div className="text-foreground font-medium text-sm">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg overflow-hidden border border-border h-72">
              <iframe
                title="Smart Property Platform service location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14194.81651793685!2d89.63!3d27.47!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e19414c0a4f8b3%3A0x7f4c2e6f99a1b2c3!2sThimphu%2C%20Bhutan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
