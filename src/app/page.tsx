import Navbar from "@/components/Navbar";
import IntroSequence from "@/components/IntroSequence";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Programs from "@/components/Programs";
import VideoShowcase from "@/components/VideoShowcase";
import Impact from "@/components/Impact";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import FloatingEmblem from "@/components/FloatingEmblem";

const TICKER_ITEMS = [
  "STEAM Learning",
  "Live Events",
  "Mobile App",
  "Community Workshops",
  "Game Show Challenges",
];

export default function Home() {
  return (
    <>
      <Navbar />
      <IntroSequence />
      <main className="flex-1">
        <Hero />
        <Marquee items={TICKER_ITEMS} />
        <About />
        <Programs />
        <VideoShowcase />
        <Impact />
        <CTA />
      </main>
      <Footer />
      <FloatingEmblem />
    </>
  );
}
