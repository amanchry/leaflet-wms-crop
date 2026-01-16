/**
 * Leaflet WMS Clip Plugin
 * 
 * Clips/crops a WMS layer to show only within a specified boundary/extent.
 * 
 * @author Aman Chaudhary
 * @version 1.0.0
 * 
 * Usage:
 *   var clippedWMS = L.tileLayer.wms.clipped('http://wms.example.com/wms', {
 *       layers: 'layer1',
 *       format: 'image/png',
 *       transparent: true
 *   }, boundaryPolygon).addTo(map);
 * 
 * Or with bounds:
 *   var clippedWMS = L.tileLayer.wms.clipped('http://wms.example.com/wms', {
 *       layers: 'layer1'
 *   }, L.latLngBounds([[lat1, lng1], [lat2, lng2]])).addTo(map);
 */

(function() {
    'use strict';

    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        throw new Error('Leaflet must be loaded first');
    }

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    /**
     * Convert boundary to polygon coordinates
     * Supports: L.LatLngBounds, L.Polygon, GeoJSON, Array of [lat, lng] pairs
     */
    function normalizeBoundary(boundary) {
        // If it's already an array of [lat, lng] pairs
        if (Array.isArray(boundary) && boundary.length > 0) {
            if (Array.isArray(boundary[0]) && typeof boundary[0][0] === 'number') {
                return boundary; // Already in correct format
            }
        }
        
        // If it's L.LatLngBounds, convert to rectangle polygon
        if (boundary instanceof L.LatLngBounds) {
            var sw = boundary.getSouthWest();
            var ne = boundary.getNorthEast();
            return [
                [sw.lat, sw.lng], // SW
                [ne.lat, sw.lng], // SE
                [ne.lat, ne.lng], // NE
                [sw.lat, ne.lng], // NW
                [sw.lat, sw.lng]  // Close polygon
            ];
        }
        
        // If it's L.Polygon, extract latlngs
        if (boundary instanceof L.Polygon) {
            return boundary.getLatLngs()[0].map(function(ll) {
                return [ll.lat, ll.lng];
            });
        }
        
        // If it's GeoJSON Polygon
        if (boundary && boundary.type === 'Polygon' && boundary.coordinates) {
            // GeoJSON coordinates are [lng, lat], convert to [lat, lng]
            return boundary.coordinates[0].map(function(coord) {
                return [coord[1], coord[0]]; // [lng, lat] -> [lat, lng]
            });
        }
        
        // If it's GeoJSON MultiPolygon (use first polygon)
        if (boundary && boundary.type === 'MultiPolygon' && boundary.coordinates) {
            return boundary.coordinates[0][0].map(function(coord) {
                return [coord[1], coord[0]]; // [lng, lat] -> [lat, lng]
            });
        }
        
        // If it's GeoJSON Feature
        if (boundary && boundary.type === 'Feature' && boundary.geometry) {
            return normalizeBoundary(boundary.geometry);
        }
        
        throw new Error('Unsupported boundary format. Use L.LatLngBounds, L.Polygon, GeoJSON, or Array of [lat, lng] pairs.');
    }

    /**
     * Project geographic coordinates to tile pixel coordinates
     */
    function projectToTilePixels(latlng, tileCoords, tileSize, map) {
        var zoom = tileCoords.z;
        var n = Math.pow(2, zoom);
        
        // Calculate tile bounds
        var lonMin = (tileCoords.x / n) * 360 - 180;
        var lonMax = ((tileCoords.x + 1) / n) * 360 - 180;
        var latMin = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileCoords.y + 1) / n))) * 180 / Math.PI;
        var latMax = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileCoords.y / n))) * 180 / Math.PI;
        
        // Convert lat/lng to pixel coordinates within tile
        var pixelX = ((latlng.lng - lonMin) / (lonMax - lonMin)) * tileSize.x;
        var pixelY = ((latMax - latlng.lat) / (latMax - latMin)) * tileSize.y;
        
        return { x: pixelX, y: pixelY };
    }

    /**
     * Check if a point is inside a polygon (ray casting algorithm)
     */
    function pointInPolygon(point, polygon) {
        var x = point.x;
        var y = point.y;
        var inside = false;
        
        for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            var xi = polygon[i].x;
            var yi = polygon[i].y;
            var xj = polygon[j].x;
            var yj = polygon[j].y;
            
            var intersect = ((yi > y) !== (yj > y)) && 
                           (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    }

    // ============================================================================
    // CLIPPED WMS TILE LAYER
    // ============================================================================

    /**
     * WMS Tile Layer with boundary clipping
     * Extends L.TileLayer.WMS and clips tiles to a boundary
     */
    L.TileLayer.WMS.Clipped = L.TileLayer.WMS.extend({
        
        /**
         * Initialize clipped WMS layer
         * 
         * @param {String} baseUrl - WMS server URL
         * @param {Object} options - WMS layer options
         * @param {L.LatLngBounds|L.Polygon|GeoJSON|Array} boundary - Boundary to clip to
         */
        initialize: function(baseUrl, options, boundary) {
            // Call parent constructor
            L.TileLayer.WMS.prototype.initialize.call(this, baseUrl, options);
            
            // Normalize and store boundary
            this._boundary = normalizeBoundary(boundary);
            this._clipMode = options.clipMode || 'canvas'; // 'canvas' or 'css'
            this._invertClip = options.invertClip || false; // Show outside boundary instead
            
            // Cache for tile canvases
            this._tileCanvases = {};
        },
        
        /**
         * Create a clipped tile
         */
        createTile: function(coords, done) {
            var tileSize = this.getTileSize();
            var key = coords.z + '/' + coords.x + '/' + coords.y;
            
            // Create canvas for clipping
            var canvas = document.createElement('canvas');
            canvas.width = tileSize.x;
            canvas.height = tileSize.y;
            var ctx = canvas.getContext('2d');
            
            // Get original tile image
            var self = this;
            var img = L.TileLayer.WMS.prototype.createTile.call(this, coords, function(err, tile) {
                if (err) {
                    done(err);
                    return;
                }
                
                // Once tile image loads, apply clipping
                if (tile.complete) {
                    self._applyClip(canvas, ctx, tile, coords, done);
                } else {
                    tile.onload = function() {
                        self._applyClip(canvas, ctx, tile, coords, done);
                    };
                    tile.onerror = function() {
                        done(new Error('Failed to load tile'));
                    };
                }
            });
            
            // Store canvas
            this._tileCanvases[key] = canvas;
            
            return canvas;
        },
        
        /**
         * Apply clipping to tile
         */
        _applyClip: function(canvas, ctx, tileImg, coords, done) {
            var tileSize = this.getTileSize();
            var zoom = coords.z;
            
            // Project boundary coordinates to tile pixel space
            var boundaryPixels = this._boundary.map(function(latlng) {
                var ll = L.latLng(latlng[0], latlng[1]);
                return projectToTilePixels(ll, coords, tileSize, this._map);
            }, this);
            
            // Check if tile intersects with boundary
            var tileBounds = this._tileCoordsToBounds(coords);
            var tileCenter = tileBounds.getCenter();
            var centerPixel = projectToTilePixels(tileCenter, coords, tileSize, this._map);
            
            // Quick check: is tile center inside boundary?
            var isInside = pointInPolygon(centerPixel, boundaryPixels);
            
            // If tile is completely outside boundary (and not inverted), skip
            if (!this._invertClip && !this._tileIntersectsBoundary(coords)) {
                // Return transparent tile
                done(null, canvas);
                return;
            }
            
            // Save context state
            ctx.save();
            
            // Create clipping path from boundary
            ctx.beginPath();
            var first = true;
            boundaryPixels.forEach(function(point) {
                if (first) {
                    ctx.moveTo(point.x, point.y);
                    first = false;
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.closePath();
            
            // Apply clipping
            if (this._invertClip) {
                // Inverted: clip inside boundary (show outside)
                ctx.clip();
                // Fill with transparent
                ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                ctx.fill();
            } else {
                // Normal: clip outside boundary (show inside)
                ctx.clip();
            }
            
            // Draw the tile image (only the clipped portion will be visible)
            ctx.drawImage(tileImg, 0, 0, tileSize.x, tileSize.y);
            
            // Restore context
            ctx.restore();
            
            // Call done callback
            done(null, canvas);
        },
        
        /**
         * Check if tile intersects with boundary
         */
        _tileIntersectsBoundary: function(coords) {
            var tileBounds = this._tileCoordsToBounds(coords);
            var tileCorners = [
                tileBounds.getSouthWest(),
                tileBounds.getNorthEast(),
                tileBounds.getSouthEast(),
                tileBounds.getNorthWest()
            ];
            
            // Check if any tile corner is inside boundary
            for (var i = 0; i < tileCorners.length; i++) {
                if (this._pointInBoundary(tileCorners[i])) {
                    return true;
                }
            }
            
            // Check if any boundary point is inside tile
            for (var j = 0; j < this._boundary.length; j++) {
                var ll = L.latLng(this._boundary[j][0], this._boundary[j][1]);
                if (tileBounds.contains(ll)) {
                    return true;
                }
            }
            
            // TODO: More sophisticated intersection test (line-segment intersection)
            // For now, use simpler heuristic: check if tile bounds overlap with boundary bounds
            var boundaryBounds = this._getBoundaryBounds();
            return tileBounds.intersects(boundaryBounds);
        },
        
        /**
         * Check if a point is inside the boundary
         */
        _pointInBoundary: function(latlng) {
            var point = { x: latlng.lng, y: latlng.lat };
            var polygon = this._boundary.map(function(ll) {
                return { x: ll[1], y: ll[0] }; // [lat, lng] -> {x: lng, y: lat}
            });
            
            return pointInPolygon(point, polygon);
        },
        
        /**
         * Get boundary bounds
         */
        _getBoundaryBounds: function() {
            var minLat = Infinity, maxLat = -Infinity;
            var minLng = Infinity, maxLng = -Infinity;
            
            this._boundary.forEach(function(ll) {
                minLat = Math.min(minLat, ll[0]);
                maxLat = Math.max(maxLat, ll[0]);
                minLng = Math.min(minLng, ll[1]);
                maxLng = Math.max(maxLng, ll[1]);
            });
            
            return L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
        },
        
        /**
         * Convert tile coordinates to bounds
         */
        _tileCoordsToBounds: function(coords) {
            var n = Math.pow(2, coords.z);
            var lonMin = (coords.x / n) * 360 - 180;
            var lonMax = ((coords.x + 1) / n) * 360 - 180;
            var latMin = Math.atan(Math.sinh(Math.PI * (1 - 2 * (coords.y + 1) / n))) * 180 / Math.PI;
            var latMax = Math.atan(Math.sinh(Math.PI * (1 - 2 * coords.y / n))) * 180 / Math.PI;
            
            return L.latLngBounds([latMin, lonMin], [latMax, lonMax]);
        },
        
        /**
         * Update boundary (useful for dynamic clipping)
         */
        setBoundary: function(boundary) {
            this._boundary = normalizeBoundary(boundary);
            // Redraw all tiles
            this.redraw();
            return this;
        },
        
        /**
         * Get current boundary
         */
        getBoundary: function() {
            return this._boundary;
        },
        
        /**
         * Clean up on remove
         */
        onRemove: function(map) {
            // Clear tile canvas cache
            this._tileCanvases = {};
            L.TileLayer.WMS.prototype.onRemove.call(this, map);
        }
    });

    // ============================================================================
    // CLIPPED IMAGE OVERLAY (Single-Tile Mode)
    // ============================================================================

    // Create namespace if it doesn't exist
    if (!L.ImageOverlay.WMS) {
        L.ImageOverlay.WMS = {};
    }

    /**
     * Single-tile WMS overlay with boundary clipping
     * Uses ImageOverlay for better performance on small viewports
     */
    L.ImageOverlay.WMS.Clipped = L.ImageOverlay.extend({
        
        /**
         * Initialize clipped WMS image overlay
         */
        initialize: function(baseUrl, options, boundary) {
            this._baseUrl = baseUrl;
            this._wmsParams = L.extend({
                layers: '',
                format: 'image/png',
                transparent: true,
                version: '1.1.1'
            }, options);
            
            // Normalize and store boundary
            this._boundary = normalizeBoundary(boundary);
            this._clipMode = options.clipMode || 'canvas';
            this._invertClip = options.invertClip || false;
            
            // Create canvas overlay
            this._canvas = document.createElement('canvas');
            this._ctx = this._canvas.getContext('2d');
            
            // Create dummy image overlay (will be masked)
            L.ImageOverlay.prototype.initialize.call(this, '', L.latLngBounds([[0,0],[0,0]]), options);
        },
        
        /**
         * Called when added to map
         */
        onAdd: function(map) {
            this._map = map;
            this._update();
            
            map.on('moveend', this._update, this);
            map.on('zoomend', this._update, this);
            map.on('resize', this._update, this);
            
            L.ImageOverlay.prototype.onAdd.call(this, map);
        },
        
        /**
         * Called when removed from map
         */
        onRemove: function(map) {
            map.off('moveend', this._update, this);
            map.off('zoomend', this._update, this);
            map.off('resize', this._update, this);
            
            L.ImageOverlay.prototype.onRemove.call(this, map);
        },
        
        /**
         * Update clipped image
         */
        _update: function() {
            if (!this._map) return;
            
            var bounds = this._map.getBounds();
            var size = this._map.getSize();
            
            // Build WMS request for entire viewport
            var params = {
                SERVICE: 'WMS',
                VERSION: this._wmsParams.version,
                REQUEST: 'GetMap',
                LAYERS: this._wmsParams.layers,
                STYLES: this._wmsParams.styles || '',
                FORMAT: this._wmsParams.format,
                TRANSPARENT: this._wmsParams.transparent ? 'true' : 'false',
                WIDTH: size.x,
                HEIGHT: size.y,
                BBOX: bounds.getWest() + ',' + bounds.getSouth() + ',' + 
                      bounds.getEast() + ',' + bounds.getNorth(),
                SRS: 'EPSG:3857'
            };
            
            var url = this._baseUrl + L.Util.getParamString(params);
            
            // Load image and apply clipping
            var self = this;
            var img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                self._applyClipToImage(img, bounds, size);
            };
            
            img.onerror = function() {
                console.error('Failed to load WMS image:', url);
            };
            
            img.src = url;
        },
        
        /**
         * Apply clipping to image
         */
        _applyClipToImage: function(img, bounds, size) {
            // Set canvas size
            this._canvas.width = size.x;
            this._canvas.height = size.y;
            
            var ctx = this._ctx;
            
            // Project boundary to pixel coordinates
            var boundaryPixels = this._boundary.map(function(latlng) {
                var ll = L.latLng(latlng[0], latlng[1]);
                var point = this._map.latLngToContainerPoint(ll);
                return { x: point.x, y: point.y };
            }, this);
            
            // Save context
            ctx.save();
            
            // Create clipping path
            ctx.beginPath();
            var first = true;
            boundaryPixels.forEach(function(point) {
                if (first) {
                    ctx.moveTo(point.x, point.y);
                    first = false;
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.closePath();
            
            // Apply clipping
            if (this._invertClip) {
                ctx.clip();
                ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                ctx.fill();
            } else {
                ctx.clip();
            }
            
            // Draw image (only clipped portion visible)
            ctx.drawImage(img, 0, 0, size.x, size.y);
            
            // Restore context
            ctx.restore();
            
            // Convert canvas to data URL and update overlay
            var dataUrl = this._canvas.toDataURL('image/png');
            this.setUrl(dataUrl);
            this.setBounds(bounds);
        },
        
        /**
         * Update boundary
         */
        setBoundary: function(boundary) {
            this._boundary = normalizeBoundary(boundary);
            this._update();
            return this;
        },
        
        /**
         * Get boundary
         */
        getBoundary: function() {
            return this._boundary;
        }
    });

    // ============================================================================
    // FACTORY FUNCTIONS
    // ============================================================================

    /**
     * Create clipped WMS tile layer
     * 
     * @param {String} baseUrl - WMS server URL
     * @param {Object} options - WMS options
     * @param {L.LatLngBounds|L.Polygon|GeoJSON|Array} boundary - Clipping boundary
     * @returns {L.TileLayer.WMS.Clipped}
     */
    L.tileLayer.wms.clipped = function(baseUrl, options, boundary) {
        return new L.TileLayer.WMS.Clipped(baseUrl, options, boundary);
    };

    /**
     * Create clipped WMS image overlay (single-tile mode)
     * 
     * @param {String} baseUrl - WMS server URL
     * @param {Object} options - WMS options
     * @param {L.LatLngBounds|L.Polygon|GeoJSON|Array} boundary - Clipping boundary
     * @returns {L.ImageOverlay.WMS.Clipped}
     */
    // Create namespace if it doesn't exist
    if (!L.imageOverlay.wms) {
        L.imageOverlay.wms = {};
    }
    
    L.imageOverlay.wms.clipped = function(baseUrl, options, boundary) {
        return new L.ImageOverlay.WMS.Clipped(baseUrl, options, boundary);
    };

})();
