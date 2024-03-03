const Koa = require("koa");
const Router = require("@koa/router");
const stream = require("stream");
const app = new Koa();
const router = new Router();

const { streamHillChart } = require("./hill-chart");
const PORT = process.env.PORT || 3000;

router.get("/:t", (ctx, next) => {
  // ctx.router available
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

  ctx.type = "image/jpeg";
  ctx.set(
    "Content-Disposition",
    `inline; filename="hill-chart-at-${tClamped}.jpg"`,
  );
  ctx.set("X-Content-Type-Options", "nosniff");
  ctx.set("Cache-Control", "public");
  ctx.body = streamHillChart(t);
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
