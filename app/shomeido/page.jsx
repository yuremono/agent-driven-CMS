import HomeClass from "./HomeClass.jsx";
import FeatureFooter from "./components/FeatureFooter.jsx";
import HeaderSection from "./components/HeaderSection.jsx";
import MainSections from "./components/MainSections.jsx";
import {
  siteDescription,
  siteKeywords,
  siteTitle,
  stylesheetHrefs,
} from "./content.js";

export const metadata = {
  title: siteTitle,
  description: siteDescription,
  keywords: siteKeywords,
};

export default function ShomeidoPage() {
  return (
    <>
      {stylesheetHrefs.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <HomeClass />
      <div id="top" className="min-h-screen bg-[#fbfaf7] text-[#1b1712]">
        <HeaderSection />
        <MainSections />
        <FeatureFooter />
      </div>
    </>
  );
}
