const Koa = require("koa");
const Router = require("@koa/router");
const app = new Koa();
const router = new Router();

const { createCanvas } = require("canvas");

const PORT = 3000;

router.get("/:t", (ctx, next) => {
  // ctx.router available
  const q = ctx.request.query;
  console.log(q);
  console.log(ctx.params);

  const tRaw = parseInt(ctx.params.t);
  // Restrict `t` to Numbers
  if (typeof tRaw !== "number" || Number.isNaN(tRaw)) {
    ctx.throw(422, "Parameter `t` must be a number");
  }
  // Clamp between 0..100 then map to 0..1
  const t = Math.min(100, Math.max(0, tRaw)) / 100;

  const canvas = createCanvas(200, 200);
  const drawingCtx = canvas.getContext("2d");

  // Write "Awesome!"
  drawingCtx.font = "30px Arial";
  drawingCtx.fillText(`Awesome!\n${t}`, 50, 100);
  ctx.type = "image/png";

  ctx.body = canvas.toBuffer();
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT);
console.log(`Listening on http://localhost:${PORT}`);
