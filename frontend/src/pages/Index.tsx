import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import PropertiesSection from "@/components/PropertiesSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import NdiLoginDialog from "@/components/NdiLoginDialog";

type LoginMode = "user" | "admin";

const Index = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("user");

  const openLogin = (mode: LoginMode) => {
    setLoginMode(mode);
    setLoginOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar onLoginClick={openLogin} />
      <HeroSection onLoginClick={openLogin} />
      <AboutSection />
      <PropertiesSection />
      <WhyChooseUs />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
      <NdiLoginDialog mode={loginMode} onModeChange={setLoginMode} onOpenChange={setLoginOpen} open={loginOpen} />
    </div>
  );
};

export default Index;
