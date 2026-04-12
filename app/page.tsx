import Header from "./components/Header";
import RingScrollShowcase, {
	DEFAULT_SHOWCASE_SECTIONS,
} from "./components/RingScrollShowcase";

export default function HomePage() {
	return (
		<>
			<Header />
			<RingScrollShowcase sections={DEFAULT_SHOWCASE_SECTIONS} />
		</>
	);
}
