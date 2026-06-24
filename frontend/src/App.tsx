import { ThemeProvider } from "./ThemeContext";
import Navbar        from "./components/Navbar";
import Hero          from "./components/Hero";
import HowItWorks    from "./components/HowItWorks";
import Features      from "./components/Features";
import ToolSection   from "./components/ToolSection";
import About         from "./components/About";
import FAQ           from "./components/FAQ";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Footer        from "./components/Footer";
import ScrollToTop   from "./components/ScrollToTop";

export default function App() {
  return (
    <ThemeProvider>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <ToolSection />
      <About />
      <FAQ />
      <PrivacyPolicy />
      <Footer />
      <ScrollToTop />
    </ThemeProvider>
  );
}
