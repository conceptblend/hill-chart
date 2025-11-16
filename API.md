# Hill Chart API Documentation

## Overview

The Hill Chart API generates visual hill chart images representing project progress. Hill charts visualize work progress along a curve, with the left side representing "FIGURING THINGS OUT" and the right side representing "MAKING IT HAPPEN".

## HTTP API Endpoints

### Base URL

All endpoints are prefixed with `/v2/`.

### Endpoints

#### 1. PNG Endpoint

```
GET /v2/:t/hill-chart.png
```

Generates a PNG image. This is a convenience endpoint that always returns PNG format.

**Path Parameters:**

- `t` (required): Integer between 0-100 representing the percentage complete

**Query Parameters:**

- `title` (optional): String - Title text displayed at the top of the image
- `hideLabels` (optional): Boolean - Set to `"true"` or `"1"` to hide the "FIGURING THINGS OUT" and "MAKING IT HAPPEN" labels
- `download` (optional): Any value - When present, sets the response to trigger a download instead of inline display

**Example:**

```
GET /v2/35/hill-chart.png?title=Amazing+new+feature&hideLabels=false
```

---

#### 2. Generic Format Endpoint

```
GET /v2/:t/:imageType
```

Generates an image in the specified format. If `imageType` is omitted, defaults to JPG.

**Path Parameters:**

- `t` (required): Integer between 0-100 representing the percentage complete
- `imageType` (optional): String - One of `"jpg"`, `"png"`, or `"svg"` (case-insensitive). Defaults to `"jpg"` if omitted.

**Query Parameters:**

- `title` (optional): String - Title text displayed at the top of the image
- `hideLabels` (optional): Boolean - Set to `"true"` or `"1"` to hide the labels
- `download` (optional): Any value - When present, sets the response to trigger a download instead of inline display

**Examples:**

```
GET /v2/35/jpg?title=My+Project
GET /v2/35/png?title=My+Project
GET /v2/35/svg?title=My+Project
GET /v2/35?title=My+Project  # Defaults to JPG
```

---

## Programmatic API

### `streamHillChart(t, type, options)`

The core function for generating hill chart images programmatically.

**Parameters:**

1. **`t`** (number, required)

   - Progress value between 0 and 1
   - `0` = Not started
   - `1` = Complete
   - Values are clamped to this range internally

2. **`type`** (string, required)

   - Image format: `"png"`, `"svg"`, or `"jpg"` (case-insensitive)
   - Determines the output buffer format

3. **`options`** (object, optional)
   - `title` (string, optional): Title text displayed at the top-left of the image
   - `showLabels` (boolean, optional): Whether to display the "FIGURING THINGS OUT" and "MAKING IT HAPPEN" labels. Defaults to `true`

**Returns:**

- Buffer containing the image data in the specified format

**Example:**

```javascript
const { streamHillChart } = require("./hill-chart");

// Generate a PNG at 35% completion with a title
const buffer = streamHillChart(0.35, "png", {
  title: "Amazing new feature",
  showLabels: true,
});

// Save to file
fs.writeFileSync("chart.png", buffer);
```

---

## Response Details

### Content Types

- PNG: `image/png`
- JPG: `image/jpeg`
- SVG: `image/svg+xml`

### Headers

- `Content-Type`: Set based on the image format
- `Content-Disposition`:
  - `inline; filename="hill-chart-at-{percentage}-{title}.{ext}"` (default)
  - `attachment; filename="hill-chart-at-{percentage}-{title}.{ext}"` (when `download` query parameter is present)
- `Cache-Control`: `public, max-age:86400` (24 hours)

### Filename Format

The generated filename follows this pattern:

```
hill-chart-at-{percentage}-{title}.{ext}
```

Where:

- `{percentage}` is the clamped value of `t` (0-100)
- `{title}` is the sanitized title (spaces replaced with underscores), or omitted if no title provided
- `{ext}` is the image format extension

---

## Image Specifications

### Dimensions

- **Height**: 200px (at 1x, 400px at 2x pixel density)
- **Width**: 500px (at 1x, 1000px at 2x pixel density)
- **Aspect Ratio**: 2.5:1 (width:height)
- **Pixel Density**: 2x (retina-ready)

### Visual Elements

1. **Hill Curve**: A bezier curve representing the progress path
2. **Progress Dot**: A filled circle positioned on the curve at the specified progress value
3. **Progress Fill**: A filled area under the curve showing the current quarter of progress
4. **Divider Lines**: Dashed vertical lines at 25%, 50%, and 75% progress points
5. **Labels**:
   - "FIGURING THINGS OUT" (left side, at 25% point)
   - "MAKING IT HAPPEN" (right side, at 75% point)
6. **Title**: Optional text displayed at the top-left corner (when provided)

### Color Scheme

The default color scheme (not configurable via API):

- Background: `#FFFFFF` (white)
- Subtle elements: `#cccccc` (light gray)
- Base/text: `#000000` (black)
- Dot fill: `#00A0F8` (blue)
- Hill fill: `#D3EBF8` (light blue)

---

## Error Handling

### HTTP API Errors

- **422 Unprocessable Entity**: Returned when the `t` parameter is not a valid number
  - Example: `/v2/abc` → 422 error

### Parameter Validation

- The `t` parameter is automatically clamped to 0-100 range
  - Values < 0 are treated as 0
  - Values > 100 are treated as 100
- Invalid `imageType` values default to JPG format
- The `title` parameter is sanitized (spaces replaced with underscores) in the filename

---

## Usage Examples

### Basic Usage

```bash
# 35% complete, JPG format
curl http://localhost:3000/v2/35

# 50% complete, PNG format
curl http://localhost:3000/v2/50/png

# 75% complete, SVG format
curl http://localhost:3000/v2/75/svg
```

### With Title

```bash
# With title
curl "http://localhost:3000/v2/35?title=My+Project"

# Title appears in filename: hill-chart-at-35-My_Project.jpg
```

### Hide Labels

```bash
# Hide the progress labels
curl "http://localhost:3000/v2/35?hideLabels=true"
```

### Download

```bash
# Trigger download instead of inline display
curl "http://localhost:3000/v2/35?download=1" -o chart.png
```

### Combined Options

```bash
# PNG format, with title, labels hidden, download
curl "http://localhost:3000/v2/35/png?title=Feature+Name&hideLabels=true&download=1" -o chart.png
```

### Programmatic Usage

```javascript
const { streamHillChart } = require("./hill-chart");
const fs = require("fs");

// Generate chart at 35% completion
const imageBuffer = streamHillChart(0.35, "png", {
  title: "Amazing new feature",
  showLabels: true,
});

// Save to file
fs.writeFileSync("hill-chart.png", imageBuffer);

// Or use in HTTP response
app.get("/chart", (req, res) => {
  const buffer = streamHillChart(0.35, "png", {
    title: req.query.title,
    showLabels: !req.query.hideLabels,
  });
  res.type("png");
  res.send(buffer);
});
```

---

## Notes

- The API uses a 2x pixel density for high-resolution displays
- Progress is divided into quarters (0-25%, 25-50%, 50-75%, 75-100%)
- The progress fill area highlights the current quarter of progress
- Labels are positioned at the 25% and 75% points on the curve
- The title is rendered in bold, 16px font at the top-left corner
- All images are cached for 24 hours via the `Cache-Control` header
