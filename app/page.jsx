import HomeHeader from "./components/HomeHeader.jsx";
import RingScrollShowcase, {
  DEFAULT_SHOWCASE_SECTIONS,
} from "./components/RingScrollShowcase.jsx";

export default function HomePage() {
  return (
    <>
      <HomeHeader />
      <RingScrollShowcase sections={DEFAULT_SHOWCASE_SECTIONS} />
    </>
  );
}
