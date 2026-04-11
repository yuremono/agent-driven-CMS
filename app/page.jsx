import Header from "./components/Header.jsx";
import RingScrollShowcase, {
	DEFAULT_SHOWCASE_SECTIONS,
} from "./components/RingScrollShowcase.jsx";

export default function HomePage() {
	return (
		<>
			<Header />
			<RingScrollShowcase sections={DEFAULT_SHOWCASE_SECTIONS} />
		</>
	);
}
