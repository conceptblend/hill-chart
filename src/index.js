const Koa = require("koa");
const Router = require("@koa/router");
const stream = require("stream");
const app = new Koa();
const router = new Router();

const { streamHillChart } = require("./hill-chart");
const PORT = process.env.PORT || 3000;

/**
 * @typedef {Object} hillChartPublicOptions
 * @property {string} [title] - The title for the image
 * @property {boolean} [hideLabels=false] - Hide the labels
 * @property {any} [download=false] - Immediately download the image. Any value triggers it
 */
router.get("/:t", (ctx, next) => {
  // ctx.router available
  //
  const q = ctx.request.query;
  const tRaw = parseInt(ctx.params.t);

  // const tRaw = parseInt(ctx.params.t);
  // Restrict `t` to Numbers
  if (typeof tRaw !== "number" || Number.isNaN(tRaw)) {
    ctx.throw(422, "Parameter `t` must be a number");
  }
  // Clamp between 0..100 then map to 0..1
  const tClamped = Math.min(100, Math.max(0, tRaw));
  const t = tClamped / 100;

  const dispositionType = q.download ? "attachment" : "inline";
  const cleanTitle = q.title ? "-" + q.title.replace(/\s/g, "_") : "";
  const dispositionFilename = `hill-chart-at-${tClamped}${cleanTitle}.jpg`;

  ctx.type = "image/jpeg";
  ctx.set(
    "Content-Disposition",
    `${dispositionType}; filename="${dispositionFilename}"`,
  );
  // ctx.set("X-Content-Type-Options", "nosniff");
  ctx.set("Cache-Control", "public, max-age:86400");
  ctx.body = streamHillChart(t, {
    title: q.title || "",
    showLabels: !!!q.hideLabels,
  });
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
