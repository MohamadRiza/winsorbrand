import CollectionsSection from "@/components/CollectionsSection/CollectionsSection";
import GiftSection from "@/components/GiftSection/GiftSection";
import Ourdetails from "@/components/OurDetails/Ourdetails";
import WatchbyGender from "@/components/WatchbyGender/WatchbyGender";
import WatchShowcase from "@/components/WatchShowcase/WatchShowcase";
import Watch3DAssembly from "@/components/Watch3DAssembly/Watch3DAssembly";
import BenefitsBanner from "@/components/BenefitsBanner/BenefitsBanner";

// app/page.tsx
export default function Home() {
  return (
    <main>
      {/* Immersive 3D Watch Scroll Assembly Section (Now acting as Hero) */}
      <Watch3DAssembly />

      {/* Collections Section */}
      <CollectionsSection />

      {/* Gender Section */}
      <WatchbyGender />

      {/* Brand Benefits / Trust Banner */}
      <BenefitsBanner />

      {/* Shop CTA Section */}
      <GiftSection />

      {/* Additional sections can be added here */}
      <WatchShowcase />

      <Ourdetails />

    </main>
  );
}