"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const logo = {
  src: "/images/home/logo.png",
  alt: "Agent Driven CMS Demo",
  eyebrow: "わ",
  name: "Agent Driven CMS Demo",
};

const navItems = [
  { href: "https://cms0505.vercel.app/", label: "Works" },
  { href: "https://github.com/yuremono/BurnYourOwnStyle/tree/react", label: "BYOS" },
  { href: "https://chat-kanban.vercel.app/", label: "ChatCanban" },
];

const actionItems = [
  {
    href: "https://github.com/yuremono/creative-demos",
    label: "CreativeDemos",
    className:
      "p-2   ",
  },
  {
    href: "https://yuremono.github.io/BurnYourOwnStyle/rects",
    label: "RandomRects",
    className:
      "p-2   ",
  },
];

function BrandLockup() {
  return (
    <Link href="/" className="HeaderLogo absolute w-[var(--logoW)] top-1/2 left-0 translate-y-[-50%] pointer-events-auto" aria-label="Agent Driven CMS ホーム">
      <span className="HeaderLogoText ">
              <span>わ</span>
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
    <nav className="HeaderNav hidden md:flex pointer-events-auto" aria-label="main navigation">
      <ul className="HeaderUl flex flex-wrap items-center justify-center gap-1 p-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
                                href={item.href}
                                target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--TC)]  "
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function HeaderActions() {
  return (
    <div className="HeaderItems hidden md:grid  pointer-events-auto text-right p-2">
      {actionItems.map((item) => (
              <Link
              target="_blank" rel="noopener noreferrer" 
                      key={item.href} href={item.href} className={item.className}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mobileMenu") === "open") {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="fixed top-[var(--PX)]  right-[var(--PX)] ml-auto md:hidden pointer-events-auto">
      <button
        type="button"
        className={`HeaderMenu dots inline-flex items-center  transition-opacity  ${
          open ? "active " : ""
        }`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        aria-controls="mobile-header-drawer"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
      >
          <span className="span1 " />
          <span className="span2 " />
          <span className="span3 " />
      </button>

      <div
        className={`fixed inset-0 z-50 transition-opacity  ease-out ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute inset-0 bg-[var(--WH)]"
          onClick={() => setOpen(false)}
          tabIndex={-1}
          aria-label="メニューを閉じる"
        />

        <div
          id="mobile-header-drawer"
          className={`relative flex h-full w-full flex-col bg-[var(--WH)] transition-[opacity,transform]  ease-out ${
            open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >

          <nav aria-label="mobile navigation" className="mt-16 flex-1 overflow-y-auto px-[var(--PX)] pb-6 text-white text-right">
            <ul className="">
                <li className="">
                  <Link
                    href="/"
                    className="block px-1 py-4 text-lg font-medium tracking-tight text-[var(--TC)]"
                    onClick={() => setOpen(false)}
                  >
             HOME
                  </Link>
                </li>
              {navItems.map((item) => (
                <li key={item.href} className="">
                  <Link
                                      href={item.href}
                                      target="_blank" rel="noopener noreferrer"
                    className="block px-1 py-4 text-lg font-medium tracking-tight text-[var(--TC)]"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {actionItems.map((item) => (
                <li key={item.href} className="">
                  <Link
                                      href={item.href}
                                      target="_blank" rel="noopener noreferrer"
                    className="block px-1 py-4 text-lg font-medium tracking-tight text-[var(--TC)]"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
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
