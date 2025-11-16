# Hill charts

API for generating hill chart images representing project progress. Hill charts visualize work progress along a curve, with the left side representing "FIGURING THINGS OUT" and the right side representing "MAKING IT HAPPEN".

## Development

```zsh
yarn dev
```

## Production

```zsh
yarn start
```

## Deployment

Automatically deploys to Railway.app when the `main` branch of the GitHub repo receives updates.

## Documentation

For complete API documentation, see [API.md](./API.md).

## Quick Start

### HTTP API

All endpoints are prefixed with `/v2/`.

#### Set the percentage complete

Use the URL path to include the percentage complete (0 - 100).

```txt
# 0% -- Not started
http://localhost:3000/v2/0

# 35%
http://localhost:3000/v2/35

# 80%
http://localhost:3000/v2/80

# 100% -- Done
http://localhost:3000/v2/100
```

#### Add a Title

Use the `title` parameter to include a title within the image. The value provided will be added to the filename as well.

```txt
http://localhost:3000/v2/35?title=Amazing+new+feature
```

![Hillchart for "Amazing new feature" at 35% completion](./images/hill-chart-at-35-Amazing_new_feature.jpg)

#### Hide the labels

Use the `hideLabels` parameter to hide the chart labels.

```txt
http://localhost:3000/v2/35?title=Amazing+new+feature&hideLabels=true
```

![Hillchart for "Amazing new feature" at 35% completion without labels](./images/hill-chart-at-35-Amazing_new_feature--no-labels.jpg)

#### Choose your image format

Use the path to set the desired image format `jpg|png|svg` (default is `jpg`).

```txt
# For a JPG (default)
http://localhost:3000/v2/35?title=As+a+JPG
http://localhost:3000/v2/35/jpg?title=As+a+JPG

# For a PNG
http://localhost:3000/v2/35/png?title=As+a+PNG

# For an SVG
http://localhost:3000/v2/35/svg?title=As+a+SVG

# PNG convenience endpoint
http://localhost:3000/v2/35/hill-chart.png?title=As+a+PNG
```

#### Download immediately

Add the `download` parameter with _any_ value to initiate a download.

```txt
http://localhost:3000/v2/35?download=1
```

### Programmatic API

```javascript
const { streamHillChart } = require("./src/hill-chart");
const fs = require("fs");

// Generate a PNG at 35% completion with a title
const buffer = streamHillChart(0.35, "png", {
  title: "Amazing new feature",
  showLabels: true,
});

// Save to file
fs.writeFileSync("chart.png", buffer);
```

## Testing

A comprehensive test suite is available to verify API functionality. See [API.md](./API.md) for full documentation.

### Running Tests

Start the server in one terminal:

```zsh
yarn start
```

Run tests in another terminal:

```zsh
node src/test-api.js
```

Or test against a different URL:

```zsh
TEST_BASE_URL=https://your-server.com node src/test-api.js
```

The test suite validates:

- HTTP endpoints (PNG and generic format)
- Query parameters (title, hideLabels, download)
- Path parameters and validation
- Response headers and content types
- Programmatic API functionality
- Error handling and edge cases
