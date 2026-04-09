import Image from "next/image";

import { heroData, productsData, serviceData } from "../content.js";

function ProductRail({ items, reverse = false }) {
  return (
    <div
      className={[
        "flex gap-3 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        reverse ? "flex-row-reverse" : "",
      ].join(" ")}
      aria-label="商品紹介の装飾列"
    >
      {items.map((item) => (
        <div
          key={item.src}
          className="shrink-0 rounded-2xl bg-white/70 p-1 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          style={{ width: item.width ?? 270 }}
        >
          <Image
            src={item.src}
            alt={item.alt}
            width={item.width ?? 270}
            height={item.height ?? 160}
            sizes="(min-width: 768px) 18rem, 12rem"
            className="block h-auto w-full rounded-xl"
          />
        </div>
      ))}
    </div>
  );
}

export default function MainSections() {
  return (
    <main id="contents_wrap" className="bg-[#fbfaf7]">
      <section className="mx-auto max-w-[1440px] px-4 pt-4 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(34,24,10,0.08)]">
          <div className="grid min-h-[540px] gap-0 md:grid-cols-[1.25fr_0.85fr]">
          <div className="relative min-h-[340px] overflow-hidden">
              <Image
                src={heroData.slides[0].src}
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 60vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/12 via-transparent to-transparent" />
              <div className="absolute left-4 bottom-6 max-w-[34rem] text-white md:left-10 md:bottom-10">
                <p className="budoux em-clip mb-4 text-[clamp(2rem,4.5vw,4.75rem)] leading-none">
                  <em className="block">70 Years<br />in Yoyogi</em>
                  <span className="mt-4 block text-base font-medium md:text-xl">
                    {heroData.lead}
                  </span>
                </p>
              </div>
            </div>
            <div className="grid gap-0 bg-[#f9f7f2] md:min-h-[540px] md:grid-rows-2">
              {heroData.slides.slice(1).map((slide) => (
                <div key={slide.src} className="relative min-h-[170px] overflow-hidden">
                  <Image
                    src={slide.src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 35vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-10 lg:px-8 lg:py-14">
        <div className="wrapper inline2 ringT overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_54px_rgba(34,24,10,0.08)]">
          <div className="grid gap-10 px-6 py-10 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-14">
            <article className="space-y-6">
              <h1 className="max-w-[18ch] text-[clamp(2rem,4vw,3.5rem)] font-black leading-[1.12] tracking-tight text-[#111]">
                代々木駅から徒歩3分、<br />
                文房具・事務用品のことなら<span className="text-[#1bbda4]">正明堂へ</span>
              </h1>
              <p className="max-w-2xl text-[0.98rem] leading-8 text-[#4b4339] md:text-[1.05rem]">
                {heroData.introBody}
              </p>
            </article>
            <figure className="relative min-h-[18rem] overflow-hidden rounded-[1.75rem] bg-[#eef6f3]">
              <Image src="/images/home/001.jpg" alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </figure>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <div className="space-y-8">
          <ProductRail items={productsData.stripItems} />

          <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <h2 className="text-5xl font-black tracking-[0.08em] text-[#1bbda4]">{productsData.label}</h2>
              <p className="max-w-3xl text-[1rem] leading-8 text-[#51483e] md:text-[1.05rem]">
                {productsData.description}
              </p>
            </div>
            <a
              className="inline-flex items-center justify-center rounded-full bg-[#111] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
              href="#products"
            >
              取扱商品
            </a>
          </div>

          <ProductRail items={productsData.stripItems} reverse />
          <ProductRail items={productsData.accentItems} reverse />
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8">
        <div className="grid gap-0 overflow-hidden rounded-[2.25rem] md:grid-cols-2">
          {serviceData.items.map((card, index) => (
            <article
              key={card.id}
              id={card.id}
              className={[
                "relative overflow-hidden p-6 md:p-10",
                index === 0 ? "bg-[#f5c86f]" : "bg-[#4b6fa3]",
              ].join(" ")}
            >
              <div className="mx-auto max-w-[28rem] space-y-5 text-white">
                <div className="relative mx-auto aspect-[4/3] w-full max-w-[420px] overflow-hidden rounded-[1.5rem] shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
                  <Image
                    src={card.image.src}
                    alt={card.image.alt}
                    fill
                    sizes="(min-width: 768px) 420px, 100vw"
                    className="object-cover"
                  />
                </div>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">{card.title}</h2>
                <p className="text-[0.98rem] leading-8 md:text-[1.05rem]">{card.body}</p>
                <a
                  className={[
                    "inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold transition hover:-translate-y-0.5",
                    index === 0 ? "bg-white text-[#8a6b22]" : "bg-white text-[#355a8d]",
                  ].join(" ")}
                  href={card.cta.href}
                >
                  {card.cta.label}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
