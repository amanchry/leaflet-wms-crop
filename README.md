# Leaflet WMS Crop Plugin

[![npm version](https://img.shields.io/npm/v/leaflet-wms-crop.svg)](https://www.npmjs.com/package/leaflet-wms-crop)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/stars/amanchry/leaflet-wms-crop?style=social)](https://github.com/amanchry/leaflet-wms-crop)

A lightweight **Leaflet.js plugin** that clips/crops **WMS TileLayers on the client-side**, so the WMS layer is only visible **inside a specified boundary** (Polygon, GeoJSON, or extent).

## Installation

### Option 1: npm (Recommended for React/Node.js projects)

```bash
npm install leaflet-wms-crop
```

**Usage in React/Next.js:**
```javascript
import 'leaflet-wms-crop';
// or
import 'leaflet-wms-crop/leaflet-wms-crop.js';
```

### Option 2: CDN (Recommended for HTML/vanilla JS)

**Via GitHub (jsDelivr):**
```html
<script src="https://cdn.jsdelivr.net/gh/amanchry/leaflet-wms-crop@latest/leaflet-wms-crop.js"></script>
```

**Via npm (unpkg.com):**
```html
<script src="https://unpkg.com/leaflet-wms-crop@1.0.0/leaflet-wms-crop.js"></script>
```

## Quick Start

### Basic HTML Example

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
        
        // Define boundary polygon (array of [lat, lng] coordinates)
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

## API Reference

### Main Method

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
- **boundary**: Boundary to clip to (see [Boundary Formats](#boundary-formats) below)

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

The simplest format: an array of `[lat, lng]` coordinate pairs.

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

### 7. GeoJSON FeatureCollection (with Turf.js)

For FeatureCollection with multiple features, use Turf.js to merge them first:

```javascript
// Load GeoJSON from URL
fetch('https://example.com/boundary.geojson')
    .then(response => response.json())
    .then(geoJson => {
        let mergedPolygon = geoJson.features[0];
        
        // Merge all features using Turf.js
        for (let i = 1; i < geoJson.features.length; i++) {
            mergedPolygon = turf.union(mergedPolygon, geoJson.features[i]);
        }
        
        // Extract coordinates and convert [lng, lat] to [lat, lng]
        const geometry = mergedPolygon.geometry;
        const coordinates = geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        
        // Create clipped WMS layer
        var wmsLayer = L.tileLayer.wms.clipped(url, options, coordinates);
        wmsLayer.addTo(map);
    });
```

## React/Next.js Usage

### Basic React Example

```jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@turf/turf/turf.min.js';
import 'leaflet-wms-crop';

function MapComponent() {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            // Initialize map
            const map = L.map(mapRef.current).setView([20, 77], 5);
            mapInstanceRef.current = map;

            // Add base layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Define boundary
            const boundary = [
                [35.6, 68.0],
                [35.6, 97.5],
                [6.5, 97.5],
                [6.5, 68.0],
                [35.6, 68.0]
            ];

            // Create clipped WMS layer
            const wmsLayer = L.tileLayer.wms.clipped('https://services.terrascope.be/wms/v2', {
                layers: 'WORLDCOVER_2021_MAP',
                format: 'image/png',
                transparent: true,
                opacity: 1
            }, boundary);

            wmsLayer.addTo(map);

            // Cleanup
            return () => {
                map.remove();
            };
        }
    }, []);

    return <div ref={mapRef} style={{ height: '100vh', width: '100%' }} />;
}

export default MapComponent;
```

### React with Dynamic Boundary Updates

```jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@turf/turf/turf.min.js';
import 'leaflet-wms-crop';

function ClippedWMSMap({ boundary, wmsUrl, wmsLayers }) {
    const mapRef = useRef(null);
    const wmsLayerRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current) return;

        const map = L.map(mapRef.current).setView([20, 77], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        // Create clipped WMS layer
        const wmsLayer = L.tileLayer.wms.clipped(wmsUrl, {
            layers: wmsLayers,
            format: 'image/png',
            transparent: true
        }, boundary);

        wmsLayer.addTo(map);
        wmsLayerRef.current = wmsLayer;

        return () => map.remove();
    }, []);

    // Update boundary when prop changes
    useEffect(() => {
        if (wmsLayerRef.current && boundary) {
            wmsLayerRef.current.setBoundary(boundary);
        }
    }, [boundary]);

    return <div ref={mapRef} style={{ height: '500px' }} />;
}
```

### React with GeoJSON Loading

```jsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import 'leaflet-wms-crop';

function GeoJSONClippedMap({ geoJsonUrl, wmsUrl, wmsLayers }) {
    const mapRef = useRef(null);
    const [boundary, setBoundary] = useState(null);

    useEffect(() => {
        // Load and process GeoJSON
        fetch(geoJsonUrl)
            .then(response => response.json())
            .then(geoJson => {
                let mergedPolygon = geoJson;
                
                if (geoJson.type === 'FeatureCollection') {
                    mergedPolygon = geoJson.features[0];
                    for (let i = 1; i < geoJson.features.length; i++) {
                        mergedPolygon = turf.union(mergedPolygon, geoJson.features[i]);
                    }
                }

                const geometry = mergedPolygon.geometry;
                const coordinates = geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                setBoundary(coordinates);
            });
    }, [geoJsonUrl]);

    useEffect(() => {
        if (!mapRef.current || !boundary) return;

        const map = L.map(mapRef.current).setView([20, 77], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        const wmsLayer = L.tileLayer.wms.clipped(wmsUrl, {
            layers: wmsLayers,
            format: 'image/png',
            transparent: true
        }, boundary);

        wmsLayer.addTo(map);

        return () => map.remove();
    }, [boundary, wmsUrl, wmsLayers]);

    return <div ref={mapRef} style={{ height: '500px' }} />;
}
```

### Next.js Configuration

If using Next.js, you may need to configure webpack to handle the plugin:

```javascript
// next.config.js
module.exports = {
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    }
};
```

## Requirements

- **Leaflet.js** v1.0.0 or higher
- **Turf.js** (required for merging multiple features in GeoJSON FeatureCollection)

## Live Demo

Check out the live demo with a complete working example:

🔗 **[View Demo](https://amanchry.github.io/leaflet-wms-crop/)**

The demo:
- Loads a GeoJSON boundary from URL
- Merges multiple features using Turf.js
- Clips WMS layer to the boundary
- Displays boundary outline

## Links

- **npm Package:** https://www.npmjs.com/package/leaflet-wms-crop
- **GitHub Repository:** https://github.com/amanchry/leaflet-wms-crop
- **Live Demo:** https://amanchry.github.io/leaflet-wms-crop/
- **Issues:** https://github.com/amanchry/leaflet-wms-crop/issues

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/amanchry/leaflet-wms-crop/issues).

## Acknowledgments

- Built for [Leaflet.js](https://leafletjs.com/)
- Uses [Turf.js](https://turfjs.org/) for GeoJSON operations
- Inspired by the need for client-side WMS clipping functionality