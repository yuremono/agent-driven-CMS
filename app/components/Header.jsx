import Link from "next/link";

const logo = {
  src: "/images/home/logo.png",
  alt: "Agent Driven CMS Demo",
  eyebrow: "Agent Driven CMS",
  name: "Site Editor",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/shomeido", label: "Showcase" },
];

const demoItems = [
  { href: "/shomeido", label: "Shomeido Demo" },
  { href: "/services", label: "Service Outline" },
  { href: "/admin", label: "Bridge Console" },
];

const actionItems = [
  {
    href: "/services",
    label: "Service Guide",
    className:
      "inline-flex min-h-11 items-center justify-center rounded-full border border-[--TC] px-4 text-sm tracking-[0.08em] text-[--TC] transition hover:bg-[--BC]",
  },
  {
    href: "/admin",
    label: "Open Admin",
    className:
      "inline-flex min-h-11 items-center justify-center rounded-full bg-[--MC] px-5 text-sm tracking-[0.08em] text-[--WH] transition hover:bg-[--SC]",
  },
];

function BrandLockup() {
  return (
    <Link href="/" className="shrink-0" aria-label="Agent Driven CMS ホーム">
      <span className="">
        {/* <img
          src={logo.src}
          alt={logo.alt}
          className="block h-auto w-[110px] sm:w-[132px] lg:w-[164px]"
        /> */}
        <span className="">
          <span className="block">
            {logo.eyebrow}
          </span>
          <span className='block'>
            {logo.name}
          </span>
        </span>
      </span>
    </Link>
  );
}

function DesktopNav() {
  return (
    <nav className="hidden flex-1 justify-center lg:flex" aria-label="main navigation">
      <ul className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-[--TC] bg-[--BC] px-3 py-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex rounded-full px-4 py-2 text-sm tracking-[0.12em] text-[--TC] transition hover:bg-[--WH] hover:text-[--SC]"
            >
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full px-4 py-2 text-sm tracking-[0.12em] text-[--TC] transition hover:bg-[--WH] hover:text-[--SC] [&::-webkit-details-marker]:hidden">
              Demos
              <span className="text-[0.7rem] transition group-open:rotate-180">v</span>
            </summary>
            <div
              className="absolute right-0 top-full z-30 mt-3 min-w-[13rem] rounded-[24px] border border-[--TC] bg-[--WH] p-2"
              style={{
                boxShadow:
                  "0 20px 48px color-mix(in srgb, var(--BK) 14%, transparent)",
              }}
            >
              <ul className="grid gap-1">
                {demoItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-full px-4 py-3 text-[0.82rem] tracking-[0.12em] text-[--TC] transition hover:bg-[--BC] hover:text-[--MC]"
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
    <div className="hidden items-center gap-2 lg:flex">
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
      <summary className="flex size-12 cursor-pointer list-none items-center justify-center rounded-full border border-[--TC] bg-[--BC] text-[--TC] [&::-webkit-details-marker]:hidden">
        <span className="sr-only">メニューを開く</span>
        <span className="flex flex-col gap-[5px]">
          <span className="block h-0.5 w-5 rounded-full bg-[--MC]" />
          <span className="block h-0.5 w-5 rounded-full bg-[--MC]" />
          <span className="block h-0.5 w-5 rounded-full bg-[--MC]" />
        </span>
      </summary>

      <div
        className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-[24px] border border-[--TC] bg-[--WH]"
        style={{
          boxShadow: "0 20px 48px color-mix(in srgb, var(--BK) 14%, transparent)",
        }}
      >
        <div className="border-b border-[--TC] px-4 py-4">
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-[--SC]">
            {logo.eyebrow}
          </p>
          <p className='mt-2 font-["Iowan_Old_Style","Palatino_Linotype","Book_Antiqua",Georgia,serif] text-[1.35rem] tracking-[-0.04em] text-[--TC]'>
            {logo.name}
          </p>
        </div>

        <nav aria-label="mobile navigation" className="px-3 py-3">
          <ul className="grid gap-1">
            {[...navItems, { href: "/admin", label: "Admin" }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-full px-4 py-3 text-[0.82rem] tracking-[0.14em] text-[--TC] transition hover:bg-[--BC] hover:text-[--MC]"
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
		<header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 lg:px-6">
			<div
				className="mx-auto max-w-[1440px] rounded-[28px] border border-[--TC] bg-[--WH]"
				style={{
					boxShadow:
						"0 20px 48px color-mix(in srgb, var(--BK) 14%, transparent)",
				}}
			>
				<div className="flex items-center gap-3 px-4 py-3 lg:px-5">
					<BrandLockup />
					<DesktopNav />
					<HeaderActions />
					<MobileMenu />
				</div>
			</div>
		</header>
	);
}
