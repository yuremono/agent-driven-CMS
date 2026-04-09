import { headerNavItems } from "../content.js";

export default function HeaderSection() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-4 lg:px-8">
        <a href="#top" className="block shrink-0">
          <img src="/images/home/logo.png" alt="正明堂" className="block h-auto w-[120px] sm:w-[150px] lg:w-[190px]" />
        </a>

        <nav className="hidden flex-1 items-center justify-center lg:flex" aria-label="main navigation">
          <ul className="flex flex-wrap items-center justify-center gap-2 rounded-full bg-[#1bbda4] px-4 py-2 text-[0.82rem] font-semibold text-white shadow-sm">
            {headerNavItems.map((item) => (
              <li key={item.href}>
                <a className="inline-flex items-center whitespace-nowrap px-1 py-1 transition hover:opacity-80" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-4 text-right lg:flex">
          <a className="inline-flex items-center gap-1 text-sm font-bold text-[#ef5c52]" href="tel:03-3379-3388">
            <i className="las la-phone-volume" />
            03-3379-3388
          </a>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#ef5c52]">
            <i className="las la-fax" />
            03-3379-3295
          </span>
        </div>

        <details className="relative ml-auto lg:hidden">
          <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-black/10 bg-white text-[#111]">
            <span className="sr-only">メニューを開く</span>
            <span className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </summary>
          <div className="absolute right-0 top-full mt-3 w-[min(20rem,calc(100vw-2rem))] rounded-[1.5rem] border border-black/5 bg-white p-4 shadow-[0_20px_48px_rgba(0,0,0,0.12)]">
            <ul className="grid gap-1 text-sm font-semibold text-[#111]">
              {headerNavItems.map((item) => (
                <li key={item.href}>
                  <a className="block rounded-full px-3 py-2 transition hover:bg-[#1bbda4]/10 hover:text-[#1bbda4]" href={item.href}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2 border-t border-black/5 pt-4 text-sm font-bold text-[#ef5c52]">
              <a className="inline-flex items-center gap-2" href="tel:03-3379-3388">
                <i className="las la-phone-volume" />
                03-3379-3388
              </a>
              <span className="inline-flex items-center gap-2">
                <i className="las la-fax" />
                03-3379-3295
              </span>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
