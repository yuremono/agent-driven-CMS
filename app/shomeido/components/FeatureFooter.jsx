import { featureCopy, footerContact } from "../content.js";

export default function FeatureFooter() {
  return (
    <footer id="global_footer" className="mt-10">
      <section id="recommend" className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <div className="grid gap-0 overflow-hidden rounded-[2.25rem] md:grid-cols-[1fr_1.1fr]">
          <article className="note txwh ACC note_tx relative bg-[#222] px-6 py-10 text-white md:px-10 lg:px-12">
            <div className="mx-auto max-w-[28rem] space-y-5">
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">{featureCopy.title}</h2>
              <p className="TAL text-[0.98rem] leading-8 md:text-[1.05rem]">{featureCopy.body}</p>
              <a
                className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#111] transition hover:-translate-y-0.5"
                href={featureCopy.cta.href}
              >
                {featureCopy.cta.label}
              </a>
            </div>
          </article>

          <article className="ringL relative overflow-hidden bg-[#f5f2eb] px-6 py-10 md:px-10 lg:px-12">
            <div className="mx-auto flex max-w-[28rem] flex-col items-center gap-5 text-center text-[#111]">
              <img
                src={featureCopy.image}
                alt={featureCopy.imageAlt}
                className="block w-full max-w-[360px] object-contain"
              />
              <div className="text-left text-[0.98rem] leading-8">
                <p className="mb-4 whitespace-pre-line text-xl font-black leading-tight">
                  {featureCopy.note}
                </p>
                <p className="whitespace-pre-line">{featureCopy.detail}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        id="contact"
        className="bg-[#f7f0e6] px-4 py-10 lg:px-8"
        style={{
          backgroundImage: `url(${footerContact.backgrounds[0]}), url(${footerContact.backgrounds[1]})`,
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundSize: "cover, cover",
        }}
      >
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] bg-white/80 backdrop-blur-sm">
          <div className="inline TAC em-clip bg_fix __double px-6 py-10 text-center md:px-10 lg:px-14">
            <h2 className="txwh text-4xl font-black tracking-[0.08em] text-white md:text-5xl">
              <em>{footerContact.title}</em>
              {footerContact.subTitle}
            </h2>
            <div className="mt-8">
              <p className="JCC flex flex-col items-center justify-center gap-4 text-lg font-bold md:flex-row">
                <a className="textlink __tel inline-flex items-center gap-2 text-[#ef5c52]" href={`tel:${footerContact.tel}`}>
                  <i className="las la-phone-volume" />
                  {footerContact.tel}
                </a>
                <span className="textlink __fax inline-flex items-center gap-2 text-[#ef5c52]">
                  <i className="las la-fax" />
                  {footerContact.fax}
                </span>
              </p>
            </div>
          </div>

          <div className="f_main wrapper ringT grid gap-8 bg-[var(--bc)] px-6 py-8 md:px-10 lg:grid-cols-[1fr_auto] lg:px-14">
            <div className="f_info flex flex-col gap-6 text-sm leading-7 text-[#312a21]">
              <div className="f_logo h1FZ" style={{ "--logoW": "200px" }}>
                <a href="#top" className="block">
                  <img src="/images/home/logo.png" alt="正明堂" className="block h-auto w-[120px] sm:w-[160px]" />
                </a>
              </div>
              <div className="space-y-2 whitespace-pre-line">
                <address className="not-italic">{footerContact.address}</address>
                <p>
                  tel:{footerContact.tel} fax:{footerContact.fax}
                </p>
                <p>{footerContact.hours}</p>
              </div>
            </div>

            <nav className="f_nav fw700 tar text-right" role="navigation">
              <ul className="grid gap-2 text-sm font-bold">
                {footerContact.navItems.map((item) => (
                  <li key={item.href}>
                    <a className="transition hover:text-[#1bbda4]" href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="f_copy f14 mt-6 rounded-full bg-[var(--un)] px-4 py-2 text-center text-sm font-semibold text-[#312a21]">
                <span>{footerContact.copyright}</span>
              </div>
            </nav>
          </div>
        </div>
      </section>
    </footer>
  );
}
