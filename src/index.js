// Worker for studio.madebydavidmartin.com and fizola.madebydavidmartin.com.
// Both addresses are served from the same public/ folder:
//  - studio.*  : the studio site, as before.
//  - fizola.*  : the Fizola Cola brand page (public/fizola-site/index.html),
//                plus the shared images, video and fonts it uses.
const ASSET = /\.(css|js|jpe?g|png|svg|webp|gif|mp4|mp3|ico|woff2?|pdf)$/i;
const LEGACY = {
  "/fizola": "/fizzypop",
  "/fizola.html": "/fizzypop",
  "/lab": "/method#lab",
  "/lab.html": "/method#lab",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname.startsWith("fizola.")) {
      if (url.pathname === "/") {
        url.pathname = "/fizola-site/";
        return env.ASSETS.fetch(new Request(url, request));
      }
      if (ASSET.test(url.pathname)) return env.ASSETS.fetch(request);
      return Response.redirect(`https://${url.hostname}/`, 301);
    }

    // The brand page lives on its own address.
    if (url.pathname.startsWith("/fizola-site") && !ASSET.test(url.pathname)) {
      return Response.redirect("https://fizola.madebydavidmartin.com/", 301);
    }
    if (LEGACY[url.pathname]) {
      return Response.redirect(new URL(LEGACY[url.pathname], url).toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
