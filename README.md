# Leaflet WMS Crop / Clip Plugin

A lightweight **Leaflet.js plugin** that clips/crops **WMS TileLayers on the client-side**, so the WMS is only visible **inside a given boundary** (Polygon / GeoJSON / extent).


## Installation

### Option 1: Direct Download

Download the files:
- `leaflet-wms-crop.js` - The plugin file

### Option 2: CDN (Recommended)

Include Leaflet, Turf.js, and the plugin:

```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Turf.js (required for merging features) -->
<script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>

<!-- WMS Clip Plugin -->
<script src="https://cdn.jsdelivr.net/gh/amanchry/leaflet-wms-crop@latest/leaflet-wms-crop.js"></script>
```

**Note:** Turf.js is required for merging multiple features in FeatureCollection.

## Quick Start

### Basic Example

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</head>
<body>
    <div id="map" style="height: 100vh;"></div>
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/amanchry/leaflet-wms-crop@latest/leaflet-wms-crop.js"></script>
    <script>
        // Create map
        var map = L.map('map').setView([20, 77], 5);
        
        // Add base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        // Define boundary polygon
        var boundary = [
        [35.6, 68.0],  // NW
        [35.6, 97.5],  // NE
        [6.5, 97.5],   // SE
        [6.5, 68.0],   // SW
        [35.6, 68.0]   // Close polygon
        ];
        
        // Create clipped WMS layer
        var wmsLayer = L.tileLayer.wms.clipped('https://services.terrascope.be/wms/v2', {
            layers: 'WORLDCOVER_2021_MAP',
            format: 'image/png',
            transparent: true,
            opacity: 1
        }, boundary);
        
        wmsLayer.addTo(map);
    </script>
</body>
</html>
```

## Usage

### API

```javascript
L.tileLayer.wms.clipped(baseUrl, options, boundary)
```

#### Parameters

- **baseUrl** (String): WMS server URL
- **options** (Object): WMS layer options
  - `layers` (String): Comma-separated layer names (required)
  - `format` (String): Image format, default: `'image/png'`
  - `transparent` (Boolean): Enable transparency, default: `true`
  - `opacity` (Number): Layer opacity 0-1, default: `1`
  - `attribution` (String): Attribution text
  - `tileSize` (Number): Tile size in pixels, default: `256`
- **boundary**: Boundary to clip to (see [Boundary Formats](#boundary-formats))

#### Returns

`L.TileLayer.WMS.Clipped` - A Leaflet tile layer clipped to the boundary


### Methods

#### `setBoundary(boundary)`

Update the clipping boundary dynamically.

```javascript
var newBoundary = [
    [28.0, 68.0],
    [38.0, 68.0],
    [38.0, 98.0],
    [28.0, 98.0],
    [28.0, 68.0]
];

wmsLayer.setBoundary(newBoundary);
```

#### `getBoundary()`

Get the current clipping boundary.

```javascript
var currentBoundary = wmsLayer.getBoundary();
console.log(currentBoundary); // Array of [lat, lng] pairs
```

## Boundary Formats

The plugin supports multiple boundary formats for clipping WMS layers. The boundary will be automatically normalized internally.

### 1. Array of Coordinates

The simplest format: an array of `[lat, lng]` coordinate pairs. The polygon should be closed (first and last point should be the same).

```javascript
var boundary = [
    [35.6, 68.0],  // NW
    [35.6, 97.5],  // NE
    [6.5, 97.5],   // SE
    [6.5, 68.0],   // SW
    [35.6, 68.0]   // Close polygon
];

var wmsLayer = L.tileLayer.wms.clipped(url, options, boundary);
```

### 2. L.LatLngBounds

Use Leaflet's `LatLngBounds` for rectangular boundaries.

```javascript
var bounds = L.latLngBounds([6.5, 68.0], [35.6, 97.5]); // [south, west], [north, east]
var wmsLayer = L.tileLayer.wms.clipped(url, options, bounds);
```

### 3. L.Polygon

Use an existing Leaflet `Polygon` layer.

```javascript
var polygon = L.polygon([
    [35.6, 68.0],
    [35.6, 97.5],
    [6.5, 97.5],
    [6.5, 68.0]
]);

var wmsLayer = L.tileLayer.wms.clipped(url, options, polygon);
```

### 4. GeoJSON Polygon

Standard GeoJSON Polygon format. Note: GeoJSON uses `[lng, lat]` coordinate order, which is automatically converted.

```javascript
var geoJsonPolygon = {
    "type": "Polygon",
    "coordinates": [[
        [68.0, 35.6],  // [lng, lat]
        [97.5, 35.6],
        [97.5, 6.5],
        [68.0, 6.5],
        [68.0, 35.6]   // Close polygon
    ]]
};

var wmsLayer = L.tileLayer.wms.clipped(url, options, geoJsonPolygon);
```

### 5. GeoJSON MultiPolygon

GeoJSON MultiPolygon format. Only the first polygon in the MultiPolygon will be used.

```javascript
var geoJsonMultiPolygon = {
    "type": "MultiPolygon",
    "coordinates": [[[
        [68.0, 35.6],
        [97.5, 35.6],
        [97.5, 6.5],
        [68.0, 6.5],
        [68.0, 35.6]
    ]]]
};

var wmsLayer = L.tileLayer.wms.clipped(url, options, geoJsonMultiPolygon);
```

### 6. GeoJSON Feature

A GeoJSON Feature object containing a Polygon or MultiPolygon geometry.

```javascript
var geoJsonFeature = {
    "type": "Feature",
    "properties": {
        "name": "India Boundary"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [68.0, 35.6],
            [97.5, 35.6],
            [97.5, 6.5],
            [68.0, 6.5],
            [68.0, 35.6]
        ]]
    }
};

var wmsLayer = L.tileLayer.wms.clipped(url, options, geoJsonFeature);
```



## Demo

See `index.html` for a complete working example that:
- Loads a GeoJSON boundary from URL
- Merges multiple features using Turf.js
- Clips WMS layer to the boundary
- Displays boundary outline



