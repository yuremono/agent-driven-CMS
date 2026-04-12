import Link from "next/link";

const logo = {
  src: "/images/home/logo.png",
  alt: "Agent Driven CMS Demo",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
];

const demoItems = [
  { href: "/services", label: "Service Outline" },
  { href: "/admin", label: "Bridge Console" },
];

const actionItems = [
  {
    href: "/services",
    label: "Service Guide",
    className:
      "inline-flex min-h-11 items-center justify-center rounded-full  px-4  tracking-[0.08em] transition hover:bg-[--BC]",
  },
  {
    href: "/admin",
    label: "Open Admin",
    className:
      "inline-flex min-h-11 items-center justify-center rounded-full bg-[--MC] px-5  tracking-[0.08em] text-[--WH] transition hover:bg-[--SC]",
  },
];

function BrandLockup() {
  return (
    <Link href="/" className="HeaderLogo absolute w-[var(--logoW)] top-1/2 left-0 translate-y-[-50%] pointer-events-auto" aria-label="Agent Driven CMS ホーム">
      <span className="HeaderLogoText ">
              わ
        {/* <img
          src={logo.src}
          alt={logo.alt}
          className="block h-auto w-[110px] sm:w-[132px] lg:w-[164px]"
        /> */}
      </span>
    </Link>
  );
}

function DesktopNav() {
  return (
    <nav className="HeaderNav hidden  lg:flex text-white font-bold pointer-events-auto" aria-label="main navigation">
      <ul className="HeaderUl flex flex-wrap items-center justify-center gap-2   px-3 py-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex rounded-full px-4 py-2  tracking-[0.12em] transition hover:bg-[--WH] hover:text-[--SC]"
            >
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full px-4 py-2  tracking-[0.12em] transition hover:bg-[--WH] hover:text-[--SC] [&::-webkit-details-marker]:hidden">
              Demos
              <span className=" transition group-open:rotate-180">v</span>
            </summary>
            <div
              className="absolute right-0 top-full z-30 mt-3 min-w-[13rem] rounded-[24px] border border-[--TC] bg-[--WH] p-2"
              
            >
              <ul className="grid gap-1">
                {demoItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-full px-4 py-3  tracking-[0.12em] transition hover:bg-[--BC] hover:text-[--MC]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </li>
      </ul>
    </nav>
  );
}

function HeaderActions() {
  return (
    <div className="HeaderItems hidden  lg:grid  pointer-events-auto text-white font-bold">
      {actionItems.map((item) => (
        <Link key={item.href} href={item.href} className={item.className}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function MobileMenu() {
  return (
    <details className="relative ml-auto lg:hidden">
      <summary className="flex size-12 cursor-pointer list-none items-center justify-center rounded-full border border-[--TC] bg-[--BC] [&::-webkit-details-marker]:hidden">
        <span className="sr-only">メニューを開く</span>
        <span className="flex flex-col gap-[5px]">
          <span className="block h-0.5 w-5 rounded-full bg-[--MC]" />
          <span className="block h-0.5 w-5 rounded-full bg-[--MC]" />
          <span className="block h-0.5 w-5 rounded-full bg-[--MC]" />
        </span>
      </summary>

      <div
        className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-[24px] border border-[--TC] bg-[--WH]"

      >
        <div className="border-b border-[--TC] px-4 py-4">
          <p className="uppercase text-[--SC]">
            {logo.eyebrow}
          </p>
          <p className='mt-2  text-[1.35rem]  text-[--TC]'>
            {logo.name}
          </p>
        </div>

        <nav aria-label="mobile navigation" className="px-3 py-3">
          <ul className="grid gap-1">
            {[...navItems, { href: "/admin", label: "Admin" }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-full px-4 py-3   transition hover:bg-[--BC] hover:text-[--MC]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-2 border-t border-[--TC] px-4 py-4">
          {actionItems.map((item) => (
            <Link key={item.href} href={item.href} className={item.className}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}

export default function Header() {
	return (
		<header className="Header fixed top-0 z-40 w-full h-full pointer-events-none">
				<div className="flex flex-col items-end justify-between h-full">
					<BrandLockup />
					<DesktopNav />
					<HeaderActions />
					<MobileMenu />
				</div>
		</header>
	);
}
