export default function Head() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.classList.add('home');",
        }}
      />
      <link rel="stylesheet" href="/css/index_html.css" />
      <link rel="stylesheet" href="/css/bxi.css" />
      <link rel="stylesheet" href="/css/common_style.css" />
      <link rel="stylesheet" href="/css/common.css" />
      <link rel="stylesheet" href="/css/style.css" />
      <link
        rel="stylesheet"
        href="https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/yakuhanjp@3.4.1/dist/css/yakuhanjp-narrow.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/1.2.0/magnific-popup.min.css"
      />
      <link rel="stylesheet" href="https://unpkg.com/scroll-hint@1.1.10/css/scroll-hint.css" />
      <link rel="stylesheet" href="/js/slick/slick.css" />
      <link rel="stylesheet" href="/js/slick/slick-theme.css" />
    </>
  );
}
