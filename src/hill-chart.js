const { createCanvas } = require("canvas");

const PIXEL_DENSITY = 2;
const HEIGHT = 200 * PIXEL_DENSITY;
const WIDTH = HEIGHT * 3; // maintain a 3:1 ratio

/**
 * @typedef {Object} hillChartOptions
 * @property {boolean} showLabels - Show the labels or not
 */
/**
 * @param {number} t
 * @param {...hillChartOptions} options
 */
exports.streamHillChart = (t, options = { showLabels: true }) => {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const drawingCtx = canvas.getContext("2d");

  const [xbase, ybase] = getPointOnCurve(WIDTH, HEIGHT, 0);

  const sx = Math.floor(t * 4) * 0.25; // Calculate the quarter

  drawingCtx.save();
  drawingCtx.fillStyle = "#FFFFFF";
  drawingCtx.fillRect(0, 0, WIDTH, HEIGHT);
  drawingCtx.restore();
  drawAreaUnderCurve(drawingCtx, ybase, sx, sx + 0.25);
  drawCurve(drawingCtx, WIDTH, HEIGHT);
  drawPointOnCurve(drawingCtx, WIDTH, HEIGHT, t);
  drawLabels(drawingCtx, ybase, sx);

  return canvas.toBuffer("image/jpeg");
  // return canvas.createPNGStream();
};

/**
 * @param {CanvasRenderingContext2D} drawingCtx
 * @param {number} h - Height
 * @param {number} w - Width
 */
function drawCurve(drawingCtx, w, h) {
  const inset = w * 0.05;
  const mid = w * 0.5;
  const xoffset = w * 0.2;
  const ybase = h - inset,
    ypeak = inset;

  /**
   * Divide the curve into quarters and draw divider lines
   **/
  let [q1x, q1y] = getPointOnCurve(WIDTH, HEIGHT, 0.25);
  let [q2x, q2y] = getPointOnCurve(WIDTH, HEIGHT, 0.5);
  let [q3x, q3y] = getPointOnCurve(WIDTH, HEIGHT, 0.75);

  /**
   * Draw divider lines
   **/
  drawingCtx.save();
  drawingCtx.strokeStyle = "#AAAAAA";
  drawingCtx.setLineDash([0.5 * inset, 0.5 * inset]);
  drawingCtx.lineWidth = 1;
  line(drawingCtx, q2x, ybase, q2x, q2y);
  line(drawingCtx, q1x, ybase, q1x, q1y);
  line(drawingCtx, q3x, ybase, q3x, q3y);
  drawingCtx.restore();

  /**
   * Draw the curve
   **/
  drawingCtx.save();
  drawingCtx.lineWidth = 4;
  drawingCtx.beginPath();
  drawingCtx.moveTo(0, ybase);
  drawingCtx.bezierCurveTo(xoffset, ybase, mid - xoffset, ypeak, mid, ypeak);
  drawingCtx.bezierCurveTo(mid + xoffset, ypeak, w - xoffset, ybase, w, ybase);
  drawingCtx.stroke();
  drawingCtx.restore();
}

/**
 * Helper to draw a sstraight line.
 * @param {CanvasRenderingContext2D} drawingCtx
 * @param {number} x1 - Start x coordinate
 * @param {number} y2 - Start y coordinate
 * @param {number} x2 - End x coordinate
 * @param {number} y2 - End y coordinate
 */
function line(drawingCtx, x1, y1, x2, y2) {
  drawingCtx.beginPath();
  drawingCtx.moveTo(x1, y1);
  drawingCtx.lineTo(x2, y2);
  drawingCtx.stroke();
}

/**
 * @param {number} h - Height
 * @param {number} w - Width
 * @param {number} t - t
 */
function getPointOnCurve(w, h, t) {
  const inset = w * 0.05;
  const mid = w * 0.5;
  const xoffset = w * 0.2;
  const ybase = h - inset,
    ypeak = inset;

  let x, y;

  if (t < 0.5) {
    x = bezierPoint(0, xoffset, mid - xoffset, mid, t * 2);
    y = bezierPoint(ybase, ybase, ypeak, ypeak, t * 2);
  } else {
    x = bezierPoint(mid, mid + xoffset, w - xoffset, w, (t - 0.5) * 2);
    y = bezierPoint(ypeak, ypeak, ybase, ybase, (t - 0.5) * 2);
  }
  return [x, y];
}

/**
 * @param {CanvasRenderingContext2D} drawingCtx
 * @param {number} h - Height
 * @param {number} w - Width
 * @param {number} t - t
 */
function drawPointOnCurve(drawingCtx, w, h, t) {
  const [x, y] = getPointOnCurve(w, h, t);
  const radius = 0.5 * Math.max(8, w * 0.025);

  drawingCtx.save();
  drawingCtx.strokeStyle = "#FFFFFF";
  drawingCtx.fillStyle = "#F802C1";
  drawingCtx.lineWidth = 2;
  drawingCtx.beginPath();
  drawingCtx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
  drawingCtx.fill();
  drawingCtx.stroke();
  drawingCtx.restore();
}

/**
 * @param {CanvasRenderingContext2D} drawingCtx
 * @param {number} ybase - Y coordinate of the base of the shape
 * @param {number} sx - Not really sure
 */
function drawLabels(drawingCtx, ybase, sx) {
  const labels = ["Figuring things out", "Making it happen"];
  const [l1x, l1y] = getPointOnCurve(WIDTH, HEIGHT, 0.25);
  const [l2x, l2y] = getPointOnCurve(WIDTH, HEIGHT, 0.75);

  const c = (v, min, max) => (v >= min && v < max ? "#333333" : "#AAAAAA");
  const textSize = 12 * PIXEL_DENSITY;

  drawingCtx.save();
  drawingCtx.textAlign = "center";
  drawingCtx.font = `${textSize}px sans-serif`;
  drawingCtx.fillStyle = c(sx, 0, 0.5);
  drawingCtx.fillText(labels[0], l1x, ybase + textSize);
  drawingCtx.fillStyle = c(sx, 0.5, 1.0);
  drawingCtx.fillText(labels[1], l2x, ybase + textSize);
  drawingCtx.restore();
}

/**
 * @method drawAreaUnderCurve
 * @param {CanvasRenderingContext2D} drawingCtx
 * @param {number} ybase - Y coordinate of the base of the shape
 * @param {number} x1 - Start X coordinate of area
 * @param {number} x2 - End X coordinateof area
 */
function drawAreaUnderCurve(drawingCtx, ybase, x1, x2) {
  /**
   * Draw divided section
   **/

  // Calculate some interpolated points on the curved portion
  const steps = 10;
  const step = (x2 - x1) / steps;
  const curvePoints = [];
  for (let i = 0; i < steps; i++) {
    curvePoints.push(getPointOnCurve(WIDTH, HEIGHT, x1 + step * i));
  }

  // Calculate the lower and upper boundaries
  let [q1x, q1y] = getPointOnCurve(WIDTH, HEIGHT, x1);
  let [q2x, q2y] = getPointOnCurve(WIDTH, HEIGHT, x2);

  drawingCtx.save();
  drawingCtx.fillStyle = "#F8F4DA";
  // Draw the shape in a clockwise direction, starting with the lower-left vertex.
  drawingCtx.beginPath();
  drawingCtx.moveTo(q1x, q1y);
  curvePoints.forEach((p) => drawingCtx.lineTo(p[0], p[1]));
  drawingCtx.lineTo(q2x, q2y);
  drawingCtx.lineTo(q2x, ybase);
  drawingCtx.lineTo(q1x, ybase);
  drawingCtx.closePath();
  drawingCtx.fill();
  drawingCtx.restore();
}

/**
 * FROM p5.js
 * Given the x or y co-ordinate values of control and anchor points of a bezier
 * curve, it evaluates the x or y coordinate of the bezier at position t. The
 * parameters a and d are the x or y coordinates of first and last points on the
 * curve while b and c are of the control points.The final parameter t is the
 * position of the resultant point which is given between 0 and 1.
 * This can be done once with the x coordinates and a second time
 * with the y coordinates to get the location of a bezier curve at t.
 *
 * @method bezierPoint
 * @param {Number} a coordinate of first point on the curve
 * @param {Number} b coordinate of first control point
 * @param {Number} c coordinate of second control point
 * @param {Number} d coordinate of second point on the curve
 * @param {Number} t value between 0 and 1
 * @return {Number} the value of the Bezier at position t

 */
function bezierPoint(a, b, c, d, t) {
  const adjustedT = 1 - t;
  return (
    Math.pow(adjustedT, 3) * a +
    3 * Math.pow(adjustedT, 2) * t * b +
    3 * adjustedT * Math.pow(t, 2) * c +
    Math.pow(t, 3) * d
  );
}
