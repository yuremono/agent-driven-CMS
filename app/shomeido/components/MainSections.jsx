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
          className="shrink-0 rounded-2xl bg-[var(--WH70)] p-1"
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
		<main id="contents_wrap" className="bg-[var(--BC)]">
			<section className="mx-auto max-w-[1440px] px-4 pt-4 lg:px-8">
				<div className="relative overflow-hidden rounded-[2rem] bg-[var(--WH)]">
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
							<div className="absolute inset-0 bg-[var(--BK10)]" />
							<div className="absolute left-4 bottom-6 max-w-[34rem] text-[var(--WH)] md:left-10 md:bottom-10">
								<p className="budoux em-clip mb-4 text-[clamp(2rem,4.5vw,4.75rem)] leading-none">
									<em className="block">
										70 Years
										<br />
										in Yoyogi
									</em>
									<span className="mt-4 block text-base font-medium md:text-xl">
										{heroData.lead}
									</span>
								</p>
							</div>
						</div>
						<div className="grid gap-0 bg-[var(--BC)] md:min-h-[540px] md:grid-rows-2">
							{heroData.slides.slice(1).map((slide) => (
								<div
									key={slide.src}
									className="relative min-h-[170px] overflow-hidden"
								>
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
				<div className="wrapper inline2 ringT overflow-hidden rounded-[2rem] bg-[var(--WH)]">
					<div className="grid gap-10 px-6 py-10 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-14">
						<article className="space-y-6">
							<h1 className="max-w-[18ch] text-[clamp(2rem,4vw,3.5rem)] font-black leading-[1.12] tracking-tight text-[var(--BK)]">
								代々木駅から徒歩3分、
								<br />
								文房具・事務用品のことなら
								<span className="text-[var(--MC)]">正明堂へ</span>
							</h1>
							<p className="max-w-2xl  leading-8 text-[var(--GR)] md:text-[1.05rem]">
								{heroData.introBody}
							</p>
						</article>
						<figure className="relative min-h-[18rem] overflow-hidden rounded-[1.75rem] bg-[var(--BC)]">
							<Image
								src="/images/home/001.jpg"
								alt=""
								fill
								sizes="(min-width: 1024px) 45vw, 100vw"
								className="object-cover"
							/>
						</figure>
					</div>
				</div>
			</section>

			<section
				id="products"
				className="mx-auto max-w-[1440px] px-4 py-8 lg:px-8"
			>
				<div className="space-y-8">
					<ProductRail items={productsData.stripItems} />

					<div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
						<div className="space-y-3">
							<h2 className="text-5xl font-black tracking-[0.08em] text-[var(--MC)]">
								{productsData.label}
							</h2>
							<p className="max-w-3xl text-[1rem] leading-8 text-[var(--GR)] md:text-[1.05rem]">
								{productsData.description}
							</p>
						</div>
						<a
							className="inline-flex items-center justify-center rounded-full bg-[var(--BK)] px-6 py-3 text-sm font-semibold text-[var(--WH)] transition hover:-translate-y-0.5"
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
								index === 0 ? "bg-[var(--AC)]" : "bg-[var(--SC)]",
							].join(" ")}
						>
							<div className="mx-auto max-w-[28rem] space-y-5 text-[var(--WH)]">
								<div className="relative mx-auto aspect-[4/3] w-full max-w-[420px] overflow-hidden rounded-[1.5rem]">
									<Image
										src={card.image.src}
										alt={card.image.alt}
										fill
										sizes="(min-width: 768px) 420px, 100vw"
										className="object-cover"
									/>
								</div>
								<h2 className="text-3xl font-black tracking-tight md:text-4xl">
									{card.title}
								</h2>
								<p className=" leading-8 md:text-[1.05rem]">
									{card.body}
								</p>
								<a
									className={[
										"inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold transition hover:-translate-y-0.5",
										index === 0
											? "bg-[var(--WH)] text-[var(--MC)]"
											: "bg-[var(--WH)] text-[var(--SC)]",
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
