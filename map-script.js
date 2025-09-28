// Advanced Map Script for PF-FRA AOI Tool - Optimized for Performance
let map;
let drawnItems;
let isDrawing = false;
let polygonPoints = [];
let currentPolygon = null;
let areaCount = 0;
let totalArea = 0;
let lastUpdate = null;

// Map layers
let satelliteLayer, satelliteWithLabelsLayer, labelsLayer, streetLayer, terrainLayer;
let currentBaseLayer = 'satellite-labels';

// Performance optimization: Cache DOM elements
const DOMCache = {
    drawPolygon: null,
    editPolygon: null,
    clearMap: null,
    saveArea: null,
    loadArea: null,
    exportData: null,
    submitRequest: null,
    saveDraft: null,
    closeAnalysis: null,
    instructionsToggle: null,
    searchInput: null,
    searchBtn: null,
    clearSearchBtn: null,
    searchResults: null,
    analysisPanel: null,
    drawingStatus: null,
    totalAreas: null,
    totalArea: null,
    lastUpdate: null,
    areaValue: null,
    perimeterValue: null,
    coordCount: null,
    validationStatus: null,
    livePrice: null
};

// Performance optimization: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Performance optimization: Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Performance optimization: RequestAnimationFrame throttle for smooth animations
function rafThrottle(func) {
    let rafId;
    return function(...args) {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            func.apply(this, args);
            rafId = null;
        });
    };
}

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements for better performance
    cacheDOMElements();
    
    // Initialize components with error handling
    try {
    initializeMap();
    setupEventListeners();
    updateStats();
    initializeAuth();
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize map. Please refresh the page.', 'error');
    }
});

// Cache DOM elements for better performance
function cacheDOMElements() {
    DOMCache.drawPolygon = document.getElementById('drawPolygon');
    DOMCache.editPolygon = document.getElementById('editPolygon');
    DOMCache.clearMap = document.getElementById('clearMap');
    DOMCache.saveArea = document.getElementById('saveArea');
    DOMCache.loadArea = document.getElementById('loadArea');
    DOMCache.exportData = document.getElementById('exportData');
    DOMCache.submitRequest = document.getElementById('submitRequest');
    DOMCache.saveDraft = document.getElementById('saveDraft');
    DOMCache.closeAnalysis = document.getElementById('closeAnalysis');
    DOMCache.instructionsToggle = document.getElementById('instructionsToggle');
    DOMCache.searchInput = document.getElementById('searchInput');
    DOMCache.searchBtn = document.getElementById('searchBtn');
    DOMCache.clearSearchBtn = document.getElementById('clearSearchBtn');
    DOMCache.searchResults = document.getElementById('searchResults');
    DOMCache.analysisPanel = document.getElementById('analysisPanel');
    DOMCache.drawingStatus = document.getElementById('drawingStatus');
    DOMCache.totalAreas = document.getElementById('totalAreas');
    DOMCache.totalArea = document.getElementById('totalArea');
    DOMCache.lastUpdate = document.getElementById('lastUpdate');
    DOMCache.areaValue = document.getElementById('areaValue');
    DOMCache.perimeterValue = document.getElementById('perimeterValue');
    DOMCache.coordCount = document.getElementById('coordCount');
    DOMCache.validationStatus = document.getElementById('validationStatus');
    DOMCache.livePrice = document.getElementById('livePrice');
}

function initializeMap() {
    // Initialize map centered on Abuja, Nigeria with performance optimizations
    map = L.map('map', {
        maxZoom: 18,
        minZoom: 1,
        zoomControl: true,
        // Performance optimizations
        preferCanvas: true, // Use canvas renderer for better performance
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        // Reduce tile loading overhead
        tileSize: 256,
        zoomOffset: 0,
        // Enable hardware acceleration
        renderer: L.canvas()
    }).setView([9.0765, 7.3986], 10);

    // Create base layers with optimized settings
    const tileOptions = {
        attribution: '',
        maxZoom: 18,
        minZoom: 1,
        // Performance optimizations
        keepBuffer: 2,
        updateWhenZooming: false,
        updateWhenIdle: true,
        // Error handling
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };

    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', tileOptions);
    satelliteWithLabelsLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', tileOptions);
    labelsLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', tileOptions);
    streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', tileOptions);
    terrainLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', tileOptions);

    // Add OpenStreetMap as a reliable fallback with optimized settings
    osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 1,
        keepBuffer: 2,
        updateWhenZooming: false,
        updateWhenIdle: true
    });

    // Add default layer (satellite with labels)
    satelliteWithLabelsLayer.addTo(map);
    labelsLayer.addTo(map);

    // Initialize drawn items layer with performance optimizations
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Add custom controls
    addCustomControls();
    
    // Set up map events with throttling for better performance
    map.on('click', throttle(onMapClick, 100));
    map.on('dblclick', throttle(onMapDoubleClick, 200));
    map.on('contextmenu', throttle(onMapRightClick, 100));
    map.on('zoomend', debounce(onZoomEnd, 300));
    
    // Add moveend event for performance monitoring
    map.on('moveend', rafThrottle(() => {
        // Update stats when map moves
        if (currentPolygon) {
            updateAreaInfo(calculatePolygonArea(polygonPoints), calculatePolygonPerimeter(polygonPoints), polygonPoints);
        }
    }));
    
}


function addCustomControls() {
    // Add a custom control for drawing instructions
    const instructionsControl = L.control({position: 'topright'});
    
    instructionsControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'custom-control');
        div.innerHTML = '<i class="fas fa-question-circle" title="Click for instructions"></i>';
        div.style.cssText = `
            background: var(--bg-tertiary);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-lg);
            padding: 8px;
            cursor: pointer;
            color: var(--text-primary);
            font-size: 16px;
            box-shadow: var(--shadow-lg);
            transition: all var(--transition-fast);
        `;
        
        div.onclick = function() {
            toggleInstructions();
        };
        
        div.onmouseover = function() {
            this.style.background = 'var(--primary-500)';
            this.style.color = 'white';
        };
        
        div.onmouseout = function() {
            this.style.background = 'var(--bg-tertiary)';
            this.style.color = 'var(--text-primary)';
        };
        
        return div;
    };
    
    instructionsControl.addTo(map);
}

function setupEventListeners() {
    // Use cached DOM elements for better performance
    if (DOMCache.drawPolygon) DOMCache.drawPolygon.addEventListener('click', startDrawing);
    if (DOMCache.editPolygon) DOMCache.editPolygon.addEventListener('click', editMode);
    if (DOMCache.clearMap) DOMCache.clearMap.addEventListener('click', clearMap);

    // Data management buttons
    if (DOMCache.saveArea) DOMCache.saveArea.addEventListener('click', saveArea);
    if (DOMCache.loadArea) DOMCache.loadArea.addEventListener('click', loadArea);
    if (DOMCache.exportData) DOMCache.exportData.addEventListener('click', exportData);

    // Request buttons
    if (DOMCache.submitRequest) DOMCache.submitRequest.addEventListener('click', submitRequest);
    if (DOMCache.saveDraft) DOMCache.saveDraft.addEventListener('click', saveDraft);
    if (DOMCache.closeAnalysis) DOMCache.closeAnalysis.addEventListener('click', closeAnalysis);

    // Layer controls with optimized event handling
    const layerRadios = document.querySelectorAll('input[name="baseLayer"]');
    layerRadios.forEach(radio => {
        radio.addEventListener('change', debounce(changeBaseLayer, 100));
    });

    // Instructions toggle
    if (DOMCache.instructionsToggle) DOMCache.instructionsToggle.addEventListener('click', toggleInstructions);

    // File upload functionality
    setupFileUpload();

    // Search functionality with debouncing
    setupSearchFunctionality();
    
    // Check if coming from services page and auto-select draw mode
    checkUrlParams();
    
    // Add keyboard shortcuts for better UX
    setupKeyboardShortcuts();
}

// Add keyboard shortcuts for better performance
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only handle shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 'd':
            case 'D':
                if (DOMCache.drawPolygon) startDrawing();
                e.preventDefault();
                break;
            case 'e':
            case 'E':
                if (DOMCache.editPolygon) editMode();
                e.preventDefault();
                break;
            case 'c':
            case 'C':
                if (DOMCache.clearMap) clearMap();
                e.preventDefault();
                break;
            case 'Escape':
                if (isDrawing) stopDrawing();
                break;
        }
    });
}

function startDrawing() {
    if (isDrawing) {
        stopDrawing();
        return;
    }

    isDrawing = true;
    
    // Use cached DOM element for better performance
    if (DOMCache.drawPolygon) {
        DOMCache.drawPolygon.innerHTML = '<i class="fas fa-stop"></i><span>Stop Drawing</span>';
        DOMCache.drawPolygon.classList.add('active');
    }

    // Clear previous drawing if exists
    if (currentPolygon) {
        drawnItems.removeLayer(currentPolygon);
        currentPolygon = null;
    }
    polygonPoints = [];

    // Change cursor and show status
    map.getContainer().style.cursor = 'crosshair';
    updateDrawingStatus('Click on the map to create polygon points. Double-click to finish.');
    
    // Show analysis panel
    showAnalysisPanel();
    
    // Add visual feedback
    showNotification('Drawing mode activated. Press Escape to cancel.', 'info');
}

function stopDrawing() {
    isDrawing = false;
    
    // Use cached DOM element for better performance
    if (DOMCache.drawPolygon) {
        DOMCache.drawPolygon.innerHTML = '<i class="fas fa-draw-polygon"></i><span>Draw Area</span>';
        DOMCache.drawPolygon.classList.remove('active');
    }
    
    map.getContainer().style.cursor = '';
    updateDrawingStatus('Click "Draw Area" to start creating polygons');
}

function editMode() {
    if (polygonPoints.length < 3) {
        showNotification('No area to edit. Please draw an area first.', 'warning');
        return;
    }
    
    showNotification('Edit mode activated. Click on polygon vertices to move them.', 'info');
    // Implement edit mode functionality here
}

function onMapClick(e) {
    if (!isDrawing) return;

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    polygonPoints.push([lat, lng]);

    // Add marker for visual feedback
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background: var(--primary-500);
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: var(--shadow-lg);
            ">${polygonPoints.length}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
    }).addTo(drawnItems);

    // If we have at least 3 points, create/update polygon
    if (polygonPoints.length >= 3) {
        // Remove existing polygon if any
        if (currentPolygon) {
            drawnItems.removeLayer(currentPolygon);
        }

        // Create new polygon
        currentPolygon = L.polygon(polygonPoints, {
            color: '#0ea5e9',
            fillColor: '#0ea5e9',
            fillOpacity: 0.2,
            weight: 3,
            opacity: 0.8
        }).addTo(drawnItems);

        // Calculate area and perimeter
        const area = calculatePolygonArea(polygonPoints);
        const perimeter = calculatePolygonPerimeter(polygonPoints);
        updateAreaInfo(area, perimeter, polygonPoints);
    }
}

function onMapDoubleClick(e) {
    if (isDrawing && polygonPoints.length >= 3) {
        stopDrawing();
        
        // Fit map to show the polygon
        if (currentPolygon) {
            map.fitBounds(currentPolygon.getBounds(), {padding: [20, 20]});
        }
        
        showNotification('Area drawing completed!', 'success');
    }
}

function onMapRightClick(e) {
    if (isDrawing && polygonPoints.length > 0) {
        // Remove last point
        polygonPoints.pop();
        
        // Clear all markers and redraw
        drawnItems.clearLayers();
        
        // Redraw markers
        polygonPoints.forEach((point, index) => {
            L.marker(point, {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        background: var(--primary-500);
                        color: white;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: bold;
                        border: 2px solid white;
                        box-shadow: var(--shadow-lg);
                    ">${index + 1}</div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(drawnItems);
        });
        
        // Redraw polygon if we have enough points
        if (polygonPoints.length >= 3) {
            currentPolygon = L.polygon(polygonPoints, {
                color: '#0ea5e9',
                fillColor: '#0ea5e9',
                fillOpacity: 0.2,
                weight: 3,
                opacity: 0.8
            }).addTo(drawnItems);
            
            const area = calculatePolygonArea(polygonPoints);
            const perimeter = calculatePolygonPerimeter(polygonPoints);
            updateAreaInfo(area, perimeter, polygonPoints);
        } else {
            updateAreaInfo(0, 0, []);
        }
    }
}

function onZoomEnd(e) {
    const currentZoom = map.getZoom();
    const maxZoom = map.getMaxZoom();
    
    // Show notification if user reaches maximum zoom
    if (currentZoom >= maxZoom) {
        showNotification('Maximum zoom level reached. Switch to OpenStreetMap for higher detail.', 'info');
    }
}

// Optimized polygon area calculation with caching
const areaCalculationCache = new Map();
    
function calculatePolygonArea(points) {
    if (points.length < 3) return 0;
    
    // Create cache key from points
    const cacheKey = points.map(p => `${p[0].toFixed(6)},${p[1].toFixed(6)}`).join('|');
    
    // Check cache first
    if (areaCalculationCache.has(cacheKey)) {
        return areaCalculationCache.get(cacheKey);
    }
    
    let area = 0;
    const n = points.length;
    
    // Optimized Shoelace formula - use bitwise operations where possible
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i][1] * points[j][0]; // longitude * latitude
        area -= points[j][1] * points[i][0]; // longitude * latitude
    }
    
    area = Math.abs(area) * 0.5; // Use multiplication instead of division
    
    // Optimized latitude calculation
    let latSum = 0;
    for (let i = 0; i < n; i++) {
        latSum += points[i][0];
    }
    const avgLat = latSum / n;
    const latRad = avgLat * Math.PI / 180;
    
    // Pre-calculated constants for better performance
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = metersPerDegreeLat * Math.cos(latRad);
    const conversionFactor = metersPerDegreeLat * metersPerDegreeLng / 1000000;
    
    // Convert area from degrees² to km²
    const areaKm2 = area * conversionFactor;
    
    // Cache the result (limit cache size to prevent memory issues)
    if (areaCalculationCache.size < 50) {
        areaCalculationCache.set(cacheKey, areaKm2);
    } else {
        // Clear oldest entries to prevent memory leaks
        const keysToDelete = Array.from(areaCalculationCache.keys()).slice(0, 25);
        keysToDelete.forEach(key => areaCalculationCache.delete(key));
        areaCalculationCache.set(cacheKey, areaKm2);
    }
    
    return areaKm2;
}

// Optimized perimeter calculation with caching
const perimeterCalculationCache = new Map();

function calculatePolygonPerimeter(points) {
    if (points.length < 2) return 0;
    
    // Create cache key from points
    const cacheKey = points.map(p => `${p[0].toFixed(6)},${p[1].toFixed(6)}`).join('|');
    
    // Check cache first
    if (perimeterCalculationCache.has(cacheKey)) {
        return perimeterCalculationCache.get(cacheKey);
    }
    
    let perimeter = 0;
    const n = points.length;
    const earthRadius = 6371000; // Earth's radius in meters
    
    // Pre-calculate trigonometric values for better performance
    const cosLat1 = Math.cos(points[0][0] * Math.PI / 180);
    
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lat1 = points[i][0] * Math.PI / 180;
        const lat2 = points[j][0] * Math.PI / 180;
        const deltaLat = lat2 - lat1;
        const deltaLng = (points[j][1] - points[i][1]) * Math.PI / 180;
        
        // Optimized Haversine formula
        const sinDeltaLat = Math.sin(deltaLat * 0.5);
        const sinDeltaLng = Math.sin(deltaLng * 0.5);
        const cosLat2 = Math.cos(lat2);
        
        const a = sinDeltaLat * sinDeltaLat + cosLat1 * cosLat2 * sinDeltaLng * sinDeltaLng;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;
        
        perimeter += distance;
    }
    
    const perimeterKm = perimeter * 0.001; // Convert to kilometers
    
    // Cache the result (limit cache size to prevent memory issues)
    if (perimeterCalculationCache.size < 50) {
        perimeterCalculationCache.set(cacheKey, perimeterKm);
    } else {
        // Clear oldest entries to prevent memory leaks
        const keysToDelete = Array.from(perimeterCalculationCache.keys()).slice(0, 25);
        keysToDelete.forEach(key => perimeterCalculationCache.delete(key));
        perimeterCalculationCache.set(cacheKey, perimeterKm);
    }
    
    return perimeterKm;
}

function calculateCentroid(points) {
    // Calculate the centroid (center point) of the polygon
    if (points.length === 0) return null;
    
    let x = 0, y = 0;
    points.forEach(point => {
        x += point[1]; // longitude
        y += point[0]; // latitude
    });
    
    return [y / points.length, x / points.length]; // [lat, lng]
}

function calculateBoundingBox(points) {
    // Calculate the bounding box (min/max coordinates)
    if (points.length === 0) return null;
    
    let minLat = points[0][0], maxLat = points[0][0];
    let minLng = points[0][1], maxLng = points[0][1];
    
    points.forEach(point => {
        minLat = Math.min(minLat, point[0]);
        maxLat = Math.max(maxLat, point[0]);
        minLng = Math.min(minLng, point[1]);
        maxLng = Math.max(maxLng, point[1]);
    });
    
    return {
        minLat, maxLat, minLng, maxLng,
        width: maxLng - minLng,
        height: maxLat - minLat
    };
}

function calculateAspectRatio(points) {
    // Calculate the aspect ratio of the bounding box
    const bbox = calculateBoundingBox(points);
    if (!bbox) return 0;
    
    const avgLat = (bbox.minLat + bbox.maxLat) / 2;
    const latRad = avgLat * Math.PI / 180;
    
    // Convert degrees to meters
    const widthM = bbox.width * 111320 * Math.cos(latRad);
    const heightM = bbox.height * 111320;
    
    return widthM / heightM;
}

function updateAreaInfo(area, perimeter, coordinates) {
    // Format area with appropriate units
    let areaText;
    if (area < 0.01) {
        areaText = (area * 1000000).toFixed(0) + ' m²'; // Square meters
    } else if (area < 1) {
        areaText = (area * 100).toFixed(2) + ' hectares'; // Hectares
    } else {
        areaText = area.toFixed(2) + ' km²'; // Square kilometers
    }
    
    // Format perimeter with appropriate units
    let perimeterText;
    if (perimeter < 1) {
        perimeterText = (perimeter * 1000).toFixed(0) + ' m'; // Meters
    } else {
        perimeterText = perimeter.toFixed(2) + ' km'; // Kilometers
    }
    
    // Use cached DOM elements for better performance
    if (DOMCache.areaValue) DOMCache.areaValue.textContent = areaText;
    if (DOMCache.perimeterValue) DOMCache.perimeterValue.textContent = perimeterText;
    if (DOMCache.coordCount) DOMCache.coordCount.textContent = coordinates.length + ' points';
    
    // Update validation status
    updateValidationStatus(area);
    
    // Update total area
    totalArea = area;
    updateStats();
    
    // Update estimated cost
    updateEstimatedCost(area);
    
    // Log additional measurements for debugging
    const centroid = calculateCentroid(coordinates);
    const bbox = calculateBoundingBox(coordinates);
    const aspectRatio = calculateAspectRatio(coordinates);
    
    console.log('Additional measurements:', {
        centroid: centroid ? `${centroid[0].toFixed(6)}, ${centroid[1].toFixed(6)}` : 'N/A',
        boundingBox: bbox ? `${bbox.width.toFixed(6)}° × ${bbox.height.toFixed(6)}°` : 'N/A',
        aspectRatio: aspectRatio.toFixed(2),
        area: areaText,
        perimeter: perimeterText
    });
}

function updateValidationStatus(area) {
    const validationStatus = document.getElementById('validationStatus');
    if (!validationStatus) return;
    
    const minAreaKm2 = 1.0; // 1 km² minimum
    
    if (area >= minAreaKm2) {
        validationStatus.innerHTML = `
            <i class="fas fa-check-circle" style="color: #10b981;"></i>
            <span style="color: #10b981;">✓ Met (${area.toFixed(2)} km²)</span>
        `;
    } else {
        // Show current area in appropriate units
        let currentAreaText;
        if (area < 0.01) {
            currentAreaText = (area * 1000000).toFixed(0) + ' m²';
        } else if (area < 1) {
            currentAreaText = (area * 100).toFixed(2) + ' hectares';
        } else {
            currentAreaText = area.toFixed(2) + ' km²';
        }
        
        validationStatus.innerHTML = `
            <i class="fas fa-times-circle" style="color: #ef4444;"></i>
            <span style="color: #ef4444;">✗ Need ${(minAreaKm2 - area).toFixed(2)} km² more</span>
        `;
    }
}

function updateEstimatedCost(area) {
    // Get service rate based on URL parameter or default to AOI rate
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    
    const serviceRates = {
        'aoi': 2500,
        'analysis': 2500,
        'reports': 5000,
        'modeling': 8500,
        'planning': 15000,
        'mitigation': 15000
    };
    
    const rate = serviceRates[service] || 2500; // Default to AOI rate
    const totalCost = area * rate;
    
    // Update the live price display
    const livePriceElement = document.getElementById('livePrice');
    if (livePriceElement) {
        livePriceElement.textContent = `$${totalCost.toLocaleString()}`;
    }
    
    // Update the tooltip to show the current rate
    const costLabel = document.querySelector('.price-item .metric-label i');
    if (costLabel) {
        const serviceNames = {
            'aoi': 'Area of Interest Analysis',
            'analysis': 'Area of Interest Analysis',
            'reports': 'Detailed Reports',
            'modeling': 'Advanced Risk Modeling',
            'planning': 'Mitigation Planning',
            'mitigation': 'Mitigation Planning'
        };
        const serviceName = serviceNames[service] || 'Area of Interest Analysis';
        costLabel.title = `Based on ${serviceName} rate ($${rate.toLocaleString()}/km²)`;
    }
    
    // Update the analysis panel title to show the service
    const panelTitle = document.querySelector('.analysis-panel .panel-title');
    if (panelTitle) {
        const serviceNames = {
            'aoi': 'Area of Interest Analysis',
            'analysis': 'Area of Interest Analysis',
            'reports': 'Detailed Reports',
            'modeling': 'Advanced Risk Modeling',
            'planning': 'Mitigation Planning',
            'mitigation': 'Mitigation Planning'
        };
        const serviceName = serviceNames[service] || 'Area of Interest Analysis';
        panelTitle.innerHTML = `<i class="fas fa-chart-line"></i> ${serviceName} - $${rate.toLocaleString()}/km²`;
    }
}

function updateDrawingStatus(message, autoHide = false) {
    const status = document.getElementById('drawingStatus');
    status.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
    
    // Always show the status first
    status.style.display = 'flex';
    status.style.opacity = '1';
    
    // Auto-hide after 2 seconds for all drawing-related messages
    setTimeout(() => {
        status.style.opacity = '0';
        setTimeout(() => {
            status.style.display = 'none';
        }, 300); // Wait for fade out animation
    }, 2000);
}

function showAnalysisPanel() {
    const panel = document.getElementById('analysisPanel');
    panel.classList.add('active');
    panel.style.display = 'flex';
    
    // Check if panel has scrollable content and add scroll listener
    setTimeout(() => {
        if (panel.scrollHeight > panel.clientHeight) {
            panel.classList.add('scrollable');
            
            // Add scroll listener to show/hide gradient fade with throttling
            const updateScrollIndicator = throttle(() => {
                const isAtBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 10;
                if (isAtBottom) {
                    panel.classList.remove('scrollable');
                } else {
                    panel.classList.add('scrollable');
                }
            }, 16); // ~60fps
            
            panel.addEventListener('scroll', updateScrollIndicator);
        }
    }, 100);
}

function closeAnalysis() {
    const panel = document.getElementById('analysisPanel');
    panel.classList.remove('active', 'scrollable');
    panel.style.display = 'none';
}

function clearMap() {
    drawnItems.clearLayers();
    polygonPoints = [];
    currentPolygon = null;
    updateAreaInfo(0, 0, []);
    stopDrawing();
    closeAnalysis();
    
    // Hide the drawing status popup
    const status = document.getElementById('drawingStatus');
    status.style.display = 'none';
    
    showNotification('Map cleared successfully', 'info');
}

function submitRequest() {
    if (polygonPoints.length < 3) {
        showNotification('Please draw an area first by clicking on the map to create at least 3 points.', 'warning');
        return;
    }

    // Check minimum area requirement (1 km²)
    const area = calculatePolygonArea(polygonPoints);
    if (area < 1.0) {
        // Format current area for display
        let currentAreaText;
        if (area < 0.01) {
            currentAreaText = (area * 1000000).toFixed(0) + ' m²';
        } else if (area < 1) {
            currentAreaText = (area * 100).toFixed(2) + ' hectares';
        } else {
            currentAreaText = area.toFixed(2) + ' km²';
        }
        
        showNotification(`Minimum area requirement is 1 km² (100 hectares or 1,000,000 m²). Your current area is ${currentAreaText}. Please draw a larger area.`, 'warning');
        return;
    }

    // Check if user is logged in
    if (!isLoggedIn()) {
        showRegisterModal();
        return;
    }

    // If logged in, proceed with submission
    proceedWithSubmission();
}

function showRegistrationModal() {
    const modal = document.createElement('div');
    modal.className = 'registration-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-user-plus"></i> Create Account Required</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>To submit your AOI request, you need to create an account. This allows us to:</p>
                <ul class="benefits-list">
                    <li><i class="fas fa-check"></i> Track your request status</li>
                    <li><i class="fas fa-check"></i> Send you analysis results</li>
                    <li><i class="fas fa-check"></i> Save your areas for future reference</li>
                    <li><i class="fas fa-check"></i> Access your request history</li>
                </ul>
                <form class="registration-form" id="registrationForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name *</label>
                            <input type="text" id="firstName" name="firstName" required>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name *</label>
                            <input type="text" id="lastName" name="lastName" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="email">Email Address *</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password *</label>
                        <input type="password" id="password" name="password" required minlength="8">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirm Password *</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="organization">Organization (Optional)</label>
                        <input type="text" id="organization" name="organization">
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="terms" name="terms" required>
                            <span class="checkmark"></span>
                            I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a> *
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.registration-modal').remove()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-user-plus"></i> Create Account & Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
        padding: 20px;
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    modal.querySelector('#registrationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegistration(this);
    });
    
    // Close modal handlers
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

function handleRegistration(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
        showNotification('Passwords do not match. Please try again.', 'error');
        return;
    }
    
    // Validate password strength
    if (data.password.length < 8) {
        showNotification('Password must be at least 8 characters long.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    // Simulate account creation
    setTimeout(() => {
        // Store user as logged in
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
        
        showNotification('Account created successfully! Proceeding with your request...', 'success');
        
        // Close modal and proceed with submission
        form.closest('.registration-modal').remove();
        proceedWithSubmission();
        
    }, 2000);
}

function proceedWithSubmission() {
    // Prepare request data
    const requestData = {
        coordinates: polygonPoints,
        area: calculatePolygonArea(polygonPoints),
        perimeter: calculatePolygonPerimeter(polygonPoints),
        bounds: currentPolygon ? currentPolygon.getBounds() : null,
        timestamp: new Date().toISOString(),
        mapCenter: map.getCenter(),
        zoomLevel: map.getZoom(),
        requestId: 'REQ-' + Date.now(),
        userEmail: localStorage.getItem('userEmail'),
        userName: localStorage.getItem('userName')
    };

    console.log('Request data to send to backend:', requestData);
    
    // Show loading state
    const submitBtn = document.getElementById('submitRequest');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Submitting...</span>';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        showNotification('Request submitted successfully! You will receive a confirmation email shortly and detailed results within 2-5 business days.', 'success');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Update stats
        areaCount++;
        updateStats();
        
        // Save request to user dashboard
        const userRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
        const serviceName = getServiceNameFromUrl() || 'Area of Interest Analysis';
        
        userRequests.push({
            requestId: requestData.requestId,
            serviceName: serviceName,
            area: requestData.area,
            perimeter: requestData.perimeter,
            coordinates: requestData.coordinates,
            timestamp: requestData.timestamp,
            status: 'pending'
        });
        
        localStorage.setItem('userRequests', JSON.stringify(userRequests));
        
        // Show confirmation modal
        showRequestConfirmation(requestData);
        
    }, 2000);
}

function saveDraft() {
    if (polygonPoints.length < 3) {
        showNotification('Please draw an area first by clicking on the map to create at least 3 points.', 'warning');
        return;
    }

    const draftData = {
        coordinates: polygonPoints,
        area: calculatePolygonArea(polygonPoints),
        perimeter: calculatePolygonPerimeter(polygonPoints),
        bounds: currentPolygon ? currentPolygon.getBounds() : null,
        timestamp: new Date().toISOString(),
        mapCenter: map.getCenter(),
        zoomLevel: map.getZoom(),
        status: 'draft'
    };

    // Save to localStorage
    const savedDrafts = JSON.parse(localStorage.getItem('savedDrafts') || '[]');
    savedDrafts.push(draftData);
    localStorage.setItem('savedDrafts', JSON.stringify(savedDrafts));

    showNotification('Draft saved successfully! You can continue working on it later.', 'success');
    console.log('Draft saved:', draftData);
}

function showServiceSelectionModal() {
    const modal = document.createElement('div');
    modal.className = 'service-selection-modal';
    modal.innerHTML = `
        <div class="service-modal-overlay">
            <div class="service-modal-content">
                <div class="service-modal-header">
                    <h3><i class="fas fa-cogs"></i> Select Service Type</h3>
                    <p>Choose the type of flood risk analysis you need for your uploaded area</p>
                    <button class="service-modal-close" onclick="this.closest('.service-selection-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="service-modal-body">
                    <div class="service-options">
                        <div class="service-option" data-service="aoi">
                            <div class="service-option-content">
                                <div class="service-option-name">Area of Interest Analysis</div>
                                <div class="service-option-rate">$2,500/km²</div>
                                <div class="service-option-desc">Basic flood risk assessment and area analysis</div>
                            </div>
                        </div>
                        
                        <div class="service-option" data-service="reports">
                            <div class="service-option-content">
                                <div class="service-option-name">Detailed Reports</div>
                                <div class="service-option-rate">$5,000/km²</div>
                                <div class="service-option-desc">Comprehensive flood risk reports with detailed analysis</div>
                            </div>
                        </div>
                        
                        <div class="service-option" data-service="modeling">
                            <div class="service-option-content">
                                <div class="service-option-name">Advanced Risk Modeling</div>
                                <div class="service-option-rate">$8,500/km²</div>
                                <div class="service-option-desc">Advanced hydrological modeling and risk assessment</div>
                            </div>
                        </div>
                        
                        <div class="service-option" data-service="planning">
                            <div class="service-option-content">
                                <div class="service-option-name">Mitigation Planning</div>
                                <div class="service-option-rate">$15,000/km²</div>
                                <div class="service-option-desc">Complete flood mitigation strategies and planning</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="service-modal-actions">
                    <button class="service-modal-btn primary" id="confirmServiceSelection">
                        <i class="fas fa-check"></i>
                        <span>Select Service</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const serviceOptions = modal.querySelectorAll('.service-option');
    let selectedService = 'aoi'; // Default selection
    
    serviceOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove previous selection
            serviceOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selection to clicked option
            option.classList.add('selected');
            selectedService = option.dataset.service;
        });
    });
    
    // Set default selection
    serviceOptions[0].classList.add('selected');
    
    const confirmBtn = modal.querySelector('#confirmServiceSelection');
    confirmBtn.addEventListener('click', () => {
        // Update the URL with the selected service
        const url = new URL(window.location);
        url.searchParams.set('service', selectedService);
        window.history.replaceState({}, '', url);
        
        // Show analysis panel
        showAnalysisPanel();
        
        // Remove modal
        modal.remove();
        
        showNotification(`Service selected: ${getServiceName(selectedService)}`, 'success');
    });
}

function getServiceName(service) {
    const serviceNames = {
        'aoi': 'Area of Interest Analysis',
        'reports': 'Detailed Reports',
        'modeling': 'Advanced Risk Modeling',
        'planning': 'Mitigation Planning',
        'monitoring': 'Real-time Monitoring'
    };
    return serviceNames[service] || 'Area of Interest Analysis';
}

function getServiceNameFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    return getServiceName(service);
}

function showRequestConfirmation(requestData) {
    const user = getCurrentUser();
    const modal = document.createElement('div');
    modal.className = 'request-confirmation-modal';
    modal.innerHTML = `
        <div class="confirmation-modal-overlay">
            <div class="confirmation-modal-content">
                <div class="confirmation-header">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2 class="confirmation-title">Request Submitted Successfully!</h2>
                    <p class="confirmation-subtitle">Your flood risk assessment request has been received</p>
                </div>
                
                <div class="confirmation-body">
                    <div class="request-summary">
                        <div class="summary-item">
                            <div class="summary-icon">
                                <i class="fas fa-hashtag"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-label">Request ID</div>
                                <div class="summary-value">${requestData.requestId}</div>
                            </div>
                        </div>
                        
                        <div class="summary-item">
                            <div class="summary-icon">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-label">Submitted by</div>
                                <div class="summary-value">${user ? user.name : 'Guest User'}</div>
                            </div>
                        </div>
                        
                        <div class="summary-item">
                            <div class="summary-icon">
                                <i class="fas fa-envelope"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-label">Email</div>
                                <div class="summary-value">${user ? user.email : 'N/A'}</div>
                            </div>
                        </div>
                        
                        <div class="summary-item highlight">
                            <div class="summary-icon">
                                <i class="fas fa-map-marked-alt"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-label">Area Size</div>
                                <div class="summary-value">${requestData.area.toFixed(2)} km²</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="processing-info">
                        <div class="info-note">
                            <i class="fas fa-clock"></i>
                            <span>Results will be delivered via email within 2-5 business days</span>
                        </div>
                    </div>
                    
                    <div class="contact-info">
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <span>Questions? Contact: robert@proforcegalaxies.com</span>
                        </div>
                    </div>
                </div>
                
                <div class="confirmation-actions">
                    <button class="confirmation-btn primary" onclick="this.closest('.request-confirmation-modal').remove()">
                        <i class="fas fa-check"></i>
                        <span>Continue</span>
                    </button>
                    <button class="confirmation-btn secondary" onclick="window.location.href='services.html'">
                        <i class="fas fa-plus"></i>
                        <span>Submit Another Request</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

function updateRiskIndicators() {
    // Simulate risk assessment results
    const riskLevels = ['Low', 'Medium', 'High'];
    const responseTimes = ['24+ hours', '4-8 hours', '2-4 hours'];
    
    const randomRisk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const randomTime = responseTimes[Math.floor(Math.random() * responseTimes.length)];
    
    // Update risk indicators in the UI
    const riskItems = document.querySelectorAll('.risk-item');
    if (riskItems.length >= 2) {
        riskItems[0].querySelector('.risk-value').textContent = randomRisk;
        riskItems[1].querySelector('.risk-value').textContent = randomTime;
        
        // Update risk icon color
        const riskIcon = riskItems[0].querySelector('.risk-icon');
        riskIcon.className = `risk-icon ${randomRisk.toLowerCase()}`;
    }
}


function saveArea() {
    if (polygonPoints.length < 3) {
        showNotification('Please draw an area first by clicking on the map to create at least 3 points.', 'warning');
        return;
    }

    showSaveAreaModal();
}

function showSaveAreaModal() {
    const modal = document.createElement('div');
    modal.className = 'save-area-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-save"></i> Save Area</h3>
                    <button class="modal-close" onclick="this.closest('.save-area-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="areaName">Area Name</label>
                        <input type="text" id="areaName" placeholder="Enter a name for this area" value="Area_${new Date().toLocaleDateString()}">
                    </div>
                    <div class="area-preview">
                        <div class="preview-item">
                            <span class="preview-label">Area Size:</span>
                            <span class="preview-value">${calculatePolygonArea(polygonPoints).toFixed(2)} km²</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Perimeter:</span>
                            <span class="preview-value">${calculatePolygonPerimeter(polygonPoints).toFixed(2)} km</span>
                        </div>
                        <div class="preview-item">
                            <span class="preview-label">Points:</span>
                            <span class="preview-value">${polygonPoints.length}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" id="confirmSave">
                        <i class="fas fa-save"></i>
                        <span>Save Area</span>
                    </button>
                    <button class="btn-secondary" onclick="this.closest('.save-area-modal').remove()">
                        <i class="fas fa-times"></i>
                        <span>Cancel</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(modal);
    
    const confirmBtn = modal.querySelector('#confirmSave');
    confirmBtn.addEventListener('click', () => {
        const areaName = modal.querySelector('#areaName').value.trim() || `Area_${new Date().toLocaleDateString()}`;
        
        const areaData = {
            id: Date.now().toString(),
            name: areaName,
            coordinates: polygonPoints,
            area: calculatePolygonArea(polygonPoints),
            perimeter: calculatePolygonPerimeter(polygonPoints),
            bounds: currentPolygon ? currentPolygon.getBounds() : null,
            timestamp: new Date().toISOString(),
            mapCenter: map.getCenter(),
            zoomLevel: map.getZoom()
        };

        // Save to localStorage
        const savedAreas = JSON.parse(localStorage.getItem('savedAreas') || '[]');
        savedAreas.push(areaData);
        localStorage.setItem('savedAreas', JSON.stringify(savedAreas));

        showNotification(`Area "${areaName}" saved successfully!`, 'success');
        modal.remove();
    });
}

function loadArea() {
    const savedAreas = JSON.parse(localStorage.getItem('savedAreas') || '[]');
    
    if (savedAreas.length === 0) {
        showNotification('No saved areas found. Please save an area first.', 'warning');
        return;
    }

    showLoadAreaModal(savedAreas);
}

function showLoadAreaModal(savedAreas) {
    const modal = document.createElement('div');
    modal.className = 'load-area-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-folder-open"></i> Load Saved Area</h3>
                    <button class="modal-close" onclick="this.closest('.load-area-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="saved-areas-list">
                        ${savedAreas.map((area, index) => `
                            <div class="area-item" data-index="${index}">
                                <div class="area-info">
                                    <div class="area-name">${area.name}</div>
                                    <div class="area-details">
                                        <span class="area-size">${area.area.toFixed(2)} km²</span>
                                        <span class="area-date">${new Date(area.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div class="area-actions">
                                    <button class="btn-load" onclick="loadAreaData(${JSON.stringify(area).replace(/"/g, '&quot;')}); this.closest('.load-area-modal').remove();">
                                        <i class="fas fa-download"></i>
                                        Load
                                    </button>
                                    <button class="btn-delete" onclick="deleteArea(${index}); this.closest('.load-area-modal').remove();">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.load-area-modal').remove()">
                        <i class="fas fa-times"></i>
                        <span>Cancel</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(modal);
}

function deleteArea(index) {
    const savedAreas = JSON.parse(localStorage.getItem('savedAreas') || '[]');
    const deletedArea = savedAreas.splice(index, 1)[0];
    localStorage.setItem('savedAreas', JSON.stringify(savedAreas));
    showNotification(`Area "${deletedArea.name}" deleted successfully!`, 'success');
}

function showFileConversionHelp() {
    const modal = document.createElement('div');
    modal.className = 'file-help-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-info-circle"></i> File Format Help</h3>
                    <button class="modal-close" onclick="this.closest('.file-help-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="help-section">
                        <h4>Supported Formats</h4>
                        <div class="format-list">
                            <div class="format-item">
                                <i class="fas fa-file-code"></i>
                                <span>GeoJSON (.geojson, .json)</span>
                            </div>
                            <div class="format-item">
                                <i class="fas fa-map"></i>
                                <span>KML (.kml)</span>
                            </div>
                            <div class="format-item">
                                <i class="fas fa-route"></i>
                                <span>GPX (.gpx)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h4>Converting Shapefiles</h4>
                        <p>To convert Shapefiles (.shp) to GeoJSON:</p>
                        <div class="conversion-steps">
                            <div class="step">
                                <span class="step-number">1</span>
                                <span>Visit <a href="https://mapshaper.org" target="_blank">mapshaper.org</a></span>
                            </div>
                            <div class="step">
                                <span class="step-number">2</span>
                                <span>Upload your .shp file (include .dbf and .shx files)</span>
                            </div>
                            <div class="step">
                                <span class="step-number">3</span>
                                <span>Click "Export" and select "GeoJSON"</span>
                            </div>
                            <div class="step">
                                <span class="step-number">4</span>
                                <span>Download and upload the .geojson file here</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="help-section">
                        <h4>Alternative Tools</h4>
                        <ul class="tool-list">
                            <li><a href="https://qgis.org" target="_blank">QGIS</a> - Free GIS software</li>
                            <li><a href="https://geojson.io" target="_blank">GeoJSON.io</a> - Online GeoJSON editor</li>
                            <li><a href="https://ogr2ogr.com" target="_blank">OGR2OGR</a> - Command line converter</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="this.closest('.file-help-modal').remove()">
                        <i class="fas fa-check"></i>
                        <span>Got it!</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(modal);
}

function loadAreaData(areaData) {
    // Clear current drawing
    clearMap();
    
    // Load the area
    polygonPoints = areaData.coordinates;
    
    // Recreate the polygon
    currentPolygon = L.polygon(polygonPoints, {
        color: '#0ea5e9',
        fillColor: '#0ea5e9',
        fillOpacity: 0.2,
        weight: 3,
        opacity: 0.8
    }).addTo(drawnItems);
    
    // Add markers for each point
    polygonPoints.forEach((point, index) => {
        L.marker(point, {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background: var(--primary-500);
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    border: 2px solid white;
                    box-shadow: var(--shadow-lg);
                ">${index + 1}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(drawnItems);
    });
    
    // Update info display
    updateAreaInfo(areaData.area, areaData.perimeter, areaData.coordinates);
    
    // Fit map to the area
    if (currentPolygon) {
        map.fitBounds(currentPolygon.getBounds(), {padding: [20, 20]});
    }
    
    // Show analysis panel
    showAnalysisPanel();
    
    showNotification(`Area "${areaData.name}" loaded successfully!`, 'success');
}

function exportData() {
    if (polygonPoints.length < 3) {
        showNotification('Please draw an area first to export data.', 'warning');
        return;
    }
    
    const area = calculatePolygonArea(polygonPoints);
    const perimeter = calculatePolygonPerimeter(polygonPoints);
    const centroid = calculateCentroid(polygonPoints);
    const bbox = calculateBoundingBox(polygonPoints);
    const aspectRatio = calculateAspectRatio(polygonPoints);
    
    const exportData = {
        coordinates: polygonPoints,
        measurements: {
            area: {
                km2: area,
                hectares: area * 100,
                m2: area * 1000000
            },
            perimeter: {
                km: perimeter,
                meters: perimeter * 1000
            },
            centroid: centroid,
            boundingBox: bbox,
            aspectRatio: aspectRatio,
            pointCount: polygonPoints.length
        },
        bounds: currentPolygon ? currentPolygon.getBounds() : null,
        timestamp: new Date().toISOString(),
        format: 'GeoJSON'
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `aoi_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Data exported successfully!', 'success');
}

function changeBaseLayer(e) {
    const layer = e.target.value;
    
    // Remove current layers
    map.removeLayer(satelliteLayer);
    map.removeLayer(satelliteWithLabelsLayer);
    map.removeLayer(labelsLayer);
    map.removeLayer(streetLayer);
    map.removeLayer(terrainLayer);
    map.removeLayer(osmLayer);
    
    // Add new layer
    switch(layer) {
        case 'satellite':
            satelliteLayer.addTo(map);
            currentBaseLayer = 'satellite';
            break;
        case 'satellite-labels':
            satelliteWithLabelsLayer.addTo(map);
            labelsLayer.addTo(map);
            currentBaseLayer = 'satellite-labels';
            break;
        case 'street':
            streetLayer.addTo(map);
            currentBaseLayer = 'street';
            break;
        case 'terrain':
            terrainLayer.addTo(map);
            currentBaseLayer = 'terrain';
            break;
        case 'osm':
            osmLayer.addTo(map);
            currentBaseLayer = 'osm';
            break;
    }
    
    showNotification(`Switched to ${layer.replace('-', ' ')} view`, 'info');
}

function toggleInstructions() {
    const content = document.getElementById('instructionsContent');
    const toggle = document.getElementById('instructionsToggle');
    
    content.classList.toggle('active');
    toggle.classList.toggle('active');
}

function updateStats() {
    document.getElementById('totalAreas').textContent = areaCount;
    document.getElementById('totalArea').textContent = totalArea.toFixed(2);
    updateClock();
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Update clock every second
setInterval(updateClock, 1000);

// File Upload Functions
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Add coordinate system help button
    const helpButton = document.createElement('button');
    helpButton.className = 'btn-secondary btn-sm';
    helpButton.innerHTML = '<i class="fas fa-question-circle"></i> Coordinate Help';
    helpButton.style.marginTop = '10px';
    helpButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showCoordinateSystemHelp();
    });
    
    const uploadContent = uploadArea.querySelector('.upload-content');
    if (uploadContent) {
        uploadContent.appendChild(helpButton);
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragOver(e) {
    document.getElementById('uploadArea').classList.add('dragover');
}

function handleDragLeave(e) {
    document.getElementById('uploadArea').classList.remove('dragover');
}

function handleDrop(e) {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    const uploadArea = document.getElementById('uploadArea');
    const progressBar = createProgressBar();
    uploadArea.appendChild(progressBar);
    
    let processedFiles = 0;
    const totalFiles = files.length;
    
    Array.from(files).forEach((file, index) => {
        processFile(file, (success, data) => {
            processedFiles++;
            updateProgress(progressBar, (processedFiles / totalFiles) * 100);
            
            if (success && data) {
                displayUploadedData(data, file.name);
            }
            
            if (processedFiles === totalFiles) {
                setTimeout(() => {
                    progressBar.remove();
                    showNotification(`${processedFiles} file(s) processed successfully!`, 'success');
                }, 500);
            }
        });
    });
}

function createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress';
    progressContainer.style.display = 'block';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'upload-progress-bar';
    
    const status = document.createElement('div');
    status.className = 'upload-status';
    status.textContent = 'Processing files...';
    status.style.display = 'block';
    
    progressContainer.appendChild(progressBar);
    progressContainer.appendChild(status);
    
    return progressContainer;
}

function updateProgress(progressContainer, percentage) {
    const progressBar = progressContainer.querySelector('.upload-progress-bar');
    const status = progressContainer.querySelector('.upload-status');
    
    progressBar.style.width = percentage + '%';
    status.textContent = `Processing... ${Math.round(percentage)}%`;
}

function processFile(file, callback) {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let data;
            
            switch(fileExtension) {
                case 'kml':
                    data = parseKML(e.target.result);
                    break;
                case 'geojson':
                case 'json':
                    data = JSON.parse(e.target.result);
                    break;
                case 'gpx':
                    data = parseGPX(e.target.result);
                    break;
                case 'shp':
                case 'zip':
                    // For shapefiles, we'd need a library like shpjs
                    showNotification('Shapefile support requires additional processing. Please convert to GeoJSON first.', 'warning');
                    showFileConversionHelp();
                    callback(false, null);
                    return;
                default:
                    showNotification(`Unsupported file format: ${fileExtension}`, 'error');
                    callback(false, null);
                    return;
            }
            
            if (data) {
                callback(true, data);
            } else {
                callback(false, null);
            }
        } catch (error) {
            console.error('Error processing file:', error);
            console.error('File content preview:', e.target.result.substring(0, 200));
            showNotification(`Error processing ${file.name}: ${error.message}`, 'error');
            callback(false, null);
        }
    };
    
    reader.onerror = function() {
        showNotification(`Error reading ${file.name}`, 'error');
        callback(false, null);
    };
    
    reader.readAsText(file);
}

function parseKML(kmlText) {
    // Simple KML parser - in production, use a proper KML library
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
    // Check for parsing errors
    const parseError = kmlDoc.querySelector('parsererror');
    if (parseError) {
        console.error('KML parsing error:', parseError.textContent);
        return null;
    }
    
    const coordinates = [];
    const placemarks = kmlDoc.querySelectorAll('Placemark');
    
    placemarks.forEach(placemark => {
        // Try to find polygon first
        let polygon = placemark.querySelector('Polygon');
        if (polygon) {
            const coordText = polygon.querySelector('coordinates');
            if (coordText) {
                const coordPairs = coordText.textContent.trim().split(/\s+/);
                
                coordPairs.forEach(pair => {
                    const parts = pair.split(',');
                    if (parts.length >= 2) {
                        const lng = parseFloat(parts[0]); // KML: longitude first
                        const lat = parseFloat(parts[1]); // KML: latitude second
                        if (!isNaN(lat) && !isNaN(lng)) {
                            coordinates.push([lat, lng]); // Leaflet expects [lat, lng]
                        }
                    }
                });
            }
        } else {
            // Try to find LineString
            const lineString = placemark.querySelector('LineString');
            if (lineString) {
                const coordText = lineString.querySelector('coordinates');
                if (coordText) {
                    const coordPairs = coordText.textContent.trim().split(/\s+/);
                    
                    coordPairs.forEach(pair => {
                        const parts = pair.split(',');
                        if (parts.length >= 2) {
                            const lng = parseFloat(parts[0]); // KML: longitude first
                            const lat = parseFloat(parts[1]); // KML: latitude second
                            if (!isNaN(lat) && !isNaN(lng)) {
                                coordinates.push([lat, lng]); // Leaflet expects [lat, lng]
                            }
                        }
                    });
                }
            }
        }
    });
    
    if (coordinates.length > 0) {
        // Return as Polygon if we have enough points, otherwise as LineString
        if (coordinates.length >= 3) {
            return { type: 'Polygon', coordinates: [coordinates] };
        } else {
            return { type: 'LineString', coordinates: coordinates };
        }
    }
    
    return null;
}

function parseGPX(gpxText) {
    // Simple GPX parser - in production, use a proper GPX library
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
    
    const coordinates = [];
    const trackPoints = gpxDoc.querySelectorAll('trkpt, wpt, rtept');
    
    trackPoints.forEach(point => {
        const lat = parseFloat(point.getAttribute('lat'));
        const lng = parseFloat(point.getAttribute('lon'));
        
        if (!isNaN(lat) && !isNaN(lng)) {
            coordinates.push([lat, lng]);
        }
    });
    
    if (coordinates.length > 0) {
        // Return as Polygon if we have enough points, otherwise as LineString
        if (coordinates.length >= 3) {
            return { type: 'Polygon', coordinates: [coordinates] };
        } else {
            return { type: 'LineString', coordinates: coordinates };
        }
    }
    
    return null;
}

// Function to detect and fix common coordinate system issues
function validateAndFixCoordinates(coordinates) {
    if (!coordinates || coordinates.length === 0) return coordinates;
    
    const firstCoord = coordinates[0];
    let lat = firstCoord[0];
    let lng = firstCoord[1];
    
    console.log('Original coordinates:', { lat, lng });
    
    // Check if coordinates are in valid WGS84 ranges
    const isValidWGS84 = Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    
    if (!isValidWGS84) {
        console.warn('Coordinates appear to be out of valid WGS84 ranges');
        
        // Check if coordinates might be swapped (common issue)
        const swappedLat = firstCoord[1];
        const swappedLng = firstCoord[0];
        
        if (Math.abs(swappedLat) <= 90 && Math.abs(swappedLng) <= 180) {
            console.log('Coordinates were swapped, correcting...');
            showNotification('Coordinates were automatically corrected (lat/lng were swapped)', 'info');
            return coordinates.map(coord => [coord[1], coord[0]]);
        }
        
        // Check if coordinates might be in UTM or other projection
        // UTM coordinates are typically much larger numbers
        if (Math.abs(lat) > 1000 || Math.abs(lng) > 1000) {
            console.warn('Coordinates appear to be in UTM or other projection system');
            
            // Try simple scaling first (most common issue)
            const scaledCoords = trySimpleScaling(coordinates);
            if (scaledCoords) {
                console.log('Successfully converted coordinates using simple scaling');
                showNotification('Coordinates were automatically converted using simple scaling', 'success');
                return scaledCoords;
            }
            
            // Try to detect and convert UTM coordinates
            const convertedCoords = tryConvertUTMCoordinates(coordinates);
            if (convertedCoords) {
                console.log('Successfully converted UTM coordinates to WGS84');
                showNotification('Coordinates were automatically converted from UTM to WGS84', 'success');
                return convertedCoords;
            }
            
            // Try to detect and convert Minna Datum coordinates
            const minnaCoords = tryConvertMinnaDatum(coordinates);
            if (minnaCoords) {
                console.log('Successfully converted Minna Datum coordinates to WGS84');
                showNotification('Coordinates were automatically converted from Minna Datum to WGS84', 'success');
                return minnaCoords;
            }
            
            // Try generic coordinate transformation
            const genericCoords = tryGenericCoordinateTransform(coordinates);
            if (genericCoords) {
                console.log('Successfully converted coordinates using generic transformation');
                showNotification('Coordinates were automatically converted to WGS84', 'success');
                return genericCoords;
            }
            
            showNotification('Error: Coordinates appear to be in UTM or another projection system, not WGS84 latitude/longitude. Please convert your GeoJSON to WGS84 coordinates.', 'error');
            
            // Try to provide helpful information
            const coordRange = {
                minLat: Math.min(...coordinates.map(c => c[0])),
                maxLat: Math.max(...coordinates.map(c => c[0])),
                minLng: Math.min(...coordinates.map(c => c[1])),
                maxLng: Math.max(...coordinates.map(c => c[1]))
            };
            
            console.log('Coordinate ranges:', coordRange);
            showNotification(`Coordinate ranges: Lat ${coordRange.minLat.toFixed(2)} to ${coordRange.maxLat.toFixed(2)}, Lng ${coordRange.minLng.toFixed(2)} to ${coordRange.maxLng.toFixed(2)}. These appear to be UTM coordinates.`, 'warning');
            
            return null; // Return null to prevent display
        }
        
        // Check if coordinates might be in a different geographic system
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            console.warn('Coordinates appear to be in a different geographic system');
            showNotification('Warning: Coordinates appear to be in a different coordinate system. Please ensure your GeoJSON uses WGS84 latitude/longitude coordinates.', 'warning');
        }
    }
    
    // Additional check: if coordinates are valid but seem to be in wrong location
    // Check if coordinates are reasonable for the current map view
    if (isValidWGS84) {
        const mapCenter = map.getCenter();
        const distanceFromCenter = Math.sqrt(
            Math.pow(lat - mapCenter.lat, 2) + Math.pow(lng - mapCenter.lng, 2)
        );
        
        if (distanceFromCenter > 20) { // More than 20 degrees from map center
            console.warn('Coordinates seem far from current map view:', { lat, lng, mapCenter });
            showNotification(`Warning: Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) appear to be far from the current map view. Please verify the coordinate system.`, 'warning');
        }
    }
    
    return coordinates;
}

// Enhanced coordinate detection and transformation
function trySimpleScaling(coordinates) {
    try {
        const firstCoord = coordinates[0];
        const x = firstCoord[0];
        const y = firstCoord[1];
        
        console.log('Attempting enhanced coordinate transformation...');
        console.log('Original coordinates:', { x, y });
        
        // Analyze coordinate patterns to determine likely system
        const coordAnalysis = analyzeCoordinateSystem(coordinates);
        console.log('Coordinate analysis:', coordAnalysis);
        
        // Try different transformation approaches based on analysis
        const transformations = [
            // Simple scaling
            { name: 'Simple Scaling', func: () => tryScalingTransform(coordinates) },
            // Coordinate swapping
            { name: 'Coordinate Swap', func: () => trySwapTransform(coordinates) },
            // Offset correction
            { name: 'Offset Correction', func: () => tryOffsetTransform(coordinates) },
            // Mixed transformations
            { name: 'Mixed Transform', func: () => tryMixedTransform(coordinates) }
        ];
        
        for (const transform of transformations) {
            const result = transform.func();
            if (result) {
                console.log(`${transform.name} successful:`, result[0]);
                return result;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Enhanced coordinate transformation failed:', error);
        return null;
    }
}

// Analyze coordinate system to determine likely transformation needed
function analyzeCoordinateSystem(coordinates) {
    const firstCoord = coordinates[0];
    const x = firstCoord[0];
    const y = firstCoord[1];
    
    const analysis = {
        isUTM: Math.abs(x) > 100000 && Math.abs(y) > 100000,
        isProjected: Math.abs(x) > 1000 || Math.abs(y) > 1000,
        isSwapped: Math.abs(x) <= 90 && Math.abs(y) <= 180,
        hasOffset: Math.abs(x) > 1000000 || Math.abs(y) > 1000000,
        range: {
            minX: Math.min(...coordinates.map(c => c[0])),
            maxX: Math.max(...coordinates.map(c => c[0])),
            minY: Math.min(...coordinates.map(c => c[1])),
            maxY: Math.max(...coordinates.map(c => c[1]))
        }
    };
    
    return analysis;
}

// Try scaling transformation
function tryScalingTransform(coordinates) {
    const scaleFactors = [10000000, 1000000, 100000, 10000, 1000, 100, 10];
    
    for (const scale of scaleFactors) {
        const scaledCoords = coordinates.map(coord => [
            coord[0] / scale,
            coord[1] / scale
        ]);
        
        const firstScaled = scaledCoords[0];
        if (Math.abs(firstScaled[0]) <= 90 && Math.abs(firstScaled[1]) <= 180) {
            return scaledCoords;
        }
    }
    return null;
}

// Try coordinate swapping transformation
function trySwapTransform(coordinates) {
    const swappedCoords = coordinates.map(coord => [coord[1], coord[0]]);
    const firstSwapped = swappedCoords[0];
    
    if (Math.abs(firstSwapped[0]) <= 90 && Math.abs(firstSwapped[1]) <= 180) {
        return swappedCoords;
    }
    return null;
}

// Try offset correction transformation
function tryOffsetTransform(coordinates) {
    const offsets = [10000000, 1000000, 100000, 10000, 1000];
    
    for (const offset of offsets) {
        const offsetCoords = coordinates.map(coord => [
            coord[0] - offset,
            coord[1] - offset
        ]);
        
        const firstOffset = offsetCoords[0];
        if (Math.abs(firstOffset[0]) <= 90 && Math.abs(firstOffset[1]) <= 180) {
            return offsetCoords;
        }
    }
    return null;
}

// Try mixed transformation (scaling + swapping)
function tryMixedTransform(coordinates) {
    const scaleFactors = [1000000, 100000, 10000, 1000];
    
    for (const scale of scaleFactors) {
        // Try scaling then swapping
        const scaledCoords = coordinates.map(coord => [
            coord[0] / scale,
            coord[1] / scale
        ]);
        
        const swappedScaledCoords = scaledCoords.map(coord => [coord[1], coord[0]]);
        const firstSwappedScaled = swappedScaledCoords[0];
        
        if (Math.abs(firstSwappedScaled[0]) <= 90 && Math.abs(firstSwappedScaled[1]) <= 180) {
            return swappedScaledCoords;
        }
    }
    return null;
}

// Function to attempt UTM to WGS84 conversion
function tryConvertUTMCoordinates(coordinates) {
    try {
        const firstCoord = coordinates[0];
        const x = firstCoord[0]; // UTM Easting
        const y = firstCoord[1]; // UTM Northing
        
        console.log('Checking UTM coordinates:', { x, y });
        
        // Check for UTM coordinates (typically large numbers)
        if (Math.abs(x) > 100000 && Math.abs(y) > 100000) {
            console.log('Detected potential UTM coordinates, attempting conversion...');
            
            // Try different UTM zones (common ones for different regions)
            const utmZones = [
                { zone: 32, centralMeridian: 9 },   // Nigeria, West Africa
                { zone: 31, centralMeridian: 3 },   // West Africa
                { zone: 33, centralMeridian: 15 },  // East Africa
                { zone: 18, centralMeridian: -75 }, // Eastern US
                { zone: 19, centralMeridian: -69 }, // Eastern US
                { zone: 10, centralMeridian: -123 }, // Western US
                { zone: 11, centralMeridian: -117 }, // Western US
            ];
            
            for (const utmZone of utmZones) {
                const convertedCoords = convertUTMToWGS84(coordinates, utmZone.zone, utmZone.centralMeridian);
                if (convertedCoords) {
                    console.log(`UTM Zone ${utmZone.zone} conversion successful:`, convertedCoords[0]);
                    return convertedCoords;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('UTM conversion failed:', error);
        return null;
    }
}

// Improved UTM to WGS84 conversion function
function convertUTMToWGS84(coordinates, zone, centralMeridian) {
    try {
        const convertedCoords = coordinates.map(coord => {
            const utmX = coord[0];
            const utmY = coord[1];
            
            // UTM parameters
            const falseEasting = 500000;
            const falseNorthing = 0;
            const scaleFactor = 0.9996;
            const a = 6378137; // WGS84 semi-major axis
            const e2 = 0.00669438; // WGS84 first eccentricity squared
            
            // Remove false easting and northing
            const x = utmX - falseEasting;
            const y = utmY - falseNorthing;
            
            // Calculate latitude using inverse UTM formulas
            const mu = y / (a * scaleFactor * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
            const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
            
            const lat1 = mu + (3*e1/2 - 27*e1*e1*e1/32) * Math.sin(2*mu) +
                         (21*e1*e1/16 - 55*e1*e1*e1*e1/32) * Math.sin(4*mu) +
                         (151*e1*e1*e1/96) * Math.sin(6*mu);
            
            // Calculate longitude
            const lng = centralMeridian + Math.atan2(x, a * scaleFactor * (1 - e2*Math.sin(lat1)*Math.sin(lat1)) * Math.cos(lat1));
            
            const lat = lat1 * 180 / Math.PI;
            const lngDeg = lng * 180 / Math.PI;
            
            return [lat, lngDeg];
        });
        
        // Validate converted coordinates
        const firstConverted = convertedCoords[0];
        if (Math.abs(firstConverted[0]) <= 90 && Math.abs(firstConverted[1]) <= 180) {
            return convertedCoords;
        }
        
        return null;
    } catch (error) {
        console.error('UTM conversion failed:', error);
        return null;
    }
}

// Function to attempt Minna Datum to WGS84 conversion
function tryConvertMinnaDatum(coordinates) {
    try {
        // Check if coordinates look like Minna Datum (common for Nigeria)
        const firstCoord = coordinates[0];
        const x = firstCoord[0]; // Minna Easting
        const y = firstCoord[1]; // Minna Northing
        
        // Minna Datum bounds for Nigeria
        const minEasting = 100000;
        const maxEasting = 900000;
        const minNorthing = 100000;
        const maxNorthing = 1200000;
        
        if (x >= minEasting && x <= maxEasting && y >= minNorthing && y <= maxNorthing) {
            console.log('Detected Minna Datum coordinates, attempting conversion...');
            
            // Convert Minna Datum to WGS84
            const convertedCoords = coordinates.map(coord => {
                const minnaX = coord[0];
                const minnaY = coord[1];
                
                // Minna Datum parameters
                const a = 6378249.145; // Minna Datum semi-major axis
                const e2 = 0.006722670; // Minna Datum first eccentricity squared
                const falseEasting = 500000;
                const falseNorthing = 0;
                const scaleFactor = 0.9996;
                const centralMeridian = 9; // Central meridian for Minna Datum
                
                // Remove false easting and northing
                const x = minnaX - falseEasting;
                const y = minnaY - falseNorthing;
                
                // Calculate latitude
                const mu = y / (a * scaleFactor * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));
                const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
                
                const lat1 = mu + (3*e1/2 - 27*e1*e1*e1/32) * Math.sin(2*mu) +
                             (21*e1*e1/16 - 55*e1*e1*e1*e1/32) * Math.sin(4*mu) +
                             (151*e1*e1*e1/96) * Math.sin(6*mu);
                
                // Calculate longitude
                const lng = centralMeridian + Math.atan2(x, a * scaleFactor * (1 - e2*Math.sin(lat1)*Math.sin(lat1)) * Math.cos(lat1));
                
                // Convert to WGS84 (approximate transformation)
                const latWGS84 = lat1 * 180 / Math.PI;
                const lngWGS84 = lng * 180 / Math.PI;
                
                // Apply datum shift (approximate)
                const latShift = 0.0001; // Small adjustment for datum difference
                const lngShift = 0.0001;
                
                return [latWGS84 + latShift, lngWGS84 + lngShift];
            });
            
            // Validate converted coordinates
            const firstConverted = convertedCoords[0];
            if (Math.abs(firstConverted[0]) <= 90 && Math.abs(firstConverted[1]) <= 180) {
                console.log('Minna Datum conversion successful:', firstConverted);
                return convertedCoords;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Minna Datum conversion failed:', error);
        return null;
    }
}

// Function to attempt generic coordinate transformation
function tryGenericCoordinateTransform(coordinates) {
    try {
        const firstCoord = coordinates[0];
        const x = firstCoord[0];
        const y = firstCoord[1];
        
        // If coordinates are very large, try to scale them down
        if (Math.abs(x) > 10000 || Math.abs(y) > 10000) {
            console.log('Attempting generic coordinate transformation...');
            
            // Try different scaling factors
            const scaleFactors = [1000000, 100000, 10000, 1000, 100];
            
            for (const scale of scaleFactors) {
                const scaledCoords = coordinates.map(coord => [
                    coord[0] / scale,
                    coord[1] / scale
                ]);
                
                const firstScaled = scaledCoords[0];
                
                // Check if scaled coordinates are in valid WGS84 ranges
                if (Math.abs(firstScaled[0]) <= 90 && Math.abs(firstScaled[1]) <= 180) {
                    console.log(`Generic transformation successful with scale factor ${scale}:`, firstScaled);
                    return scaledCoords;
                }
            }
        }
        
        // Try coordinate swapping with scaling
        if (Math.abs(x) > 10000 || Math.abs(y) > 10000) {
            for (const scale of [1000000, 100000, 10000, 1000, 100]) {
                const swappedScaledCoords = coordinates.map(coord => [
                    coord[1] / scale, // Swap and scale
                    coord[0] / scale
                ]);
                
                const firstSwappedScaled = swappedScaledCoords[0];
                
                if (Math.abs(firstSwappedScaled[0]) <= 90 && Math.abs(firstSwappedScaled[1]) <= 180) {
                    console.log(`Generic transformation with swap successful with scale factor ${scale}:`, firstSwappedScaled);
                    return swappedScaledCoords;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Generic coordinate transformation failed:', error);
        return null;
    }
}

// Aggressive correction function - tries everything to get coordinates working
function tryAggressiveCorrection(coordinates) {
    try {
        console.log('Attempting aggressive coordinate correction...');
        
        const firstCoord = coordinates[0];
        const x = firstCoord[0];
        const y = firstCoord[1];
        
        // Try extreme scaling factors
        const extremeScales = [10000000, 1000000, 100000, 10000, 1000, 100, 10, 1];
        
        for (const scale of extremeScales) {
            // Try normal scaling
            const scaledCoords = coordinates.map(coord => [
                coord[0] / scale,
                coord[1] / scale
            ]);
            
            const firstScaled = scaledCoords[0];
            
            // Check if scaled coordinates are in valid WGS84 ranges
            if (Math.abs(firstScaled[0]) <= 90 && Math.abs(firstScaled[1]) <= 180) {
                console.log(`Aggressive scaling successful with scale factor ${scale}:`, firstScaled);
                return scaledCoords;
            }
            
            // Try swapping coordinates with scaling
            const swappedScaledCoords = coordinates.map(coord => [
                coord[1] / scale, // Swap and scale
                coord[0] / scale
            ]);
            
            const firstSwappedScaled = swappedScaledCoords[0];
            
            if (Math.abs(firstSwappedScaled[0]) <= 90 && Math.abs(firstSwappedScaled[1]) <= 180) {
                console.log(`Aggressive scaling with swap successful with scale factor ${scale}:`, firstSwappedScaled);
                return swappedScaledCoords;
            }
        }
        
        // Try offset correction (subtract large numbers)
        const offsets = [1000000, 100000, 10000, 1000];
        for (const offset of offsets) {
            const offsetCoords = coordinates.map(coord => [
                coord[0] - offset,
                coord[1] - offset
            ]);
            
            const firstOffset = offsetCoords[0];
            
            if (Math.abs(firstOffset[0]) <= 90 && Math.abs(firstOffset[1]) <= 180) {
                console.log(`Aggressive offset correction successful with offset ${offset}:`, firstOffset);
                return offsetCoords;
            }
        }
        
        // Last resort: try to preserve relative shape but map to valid coordinates
        console.log('Last resort: preserving relative shape with valid coordinates');
        
        // Calculate the center of the original coordinates
        const centerX = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
        const centerY = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
        
        // Calculate the scale factor to fit within valid ranges
        const maxX = Math.max(...coordinates.map(c => c[0]));
        const minX = Math.min(...coordinates.map(c => c[0]));
        const maxY = Math.max(...coordinates.map(c => c[1]));
        const minY = Math.min(...coordinates.map(c => c[1]));
        
        const rangeX = maxX - minX;
        const rangeY = maxY - minY;
        
        // Scale down to fit within valid coordinate ranges while preserving shape
        const scaleX = rangeX > 0 ? Math.min(10 / rangeX, 1) : 1; // Max 10 degrees spread
        const scaleY = rangeY > 0 ? Math.min(10 / rangeY, 1) : 1;
        
        const correctedCoords = coordinates.map(coord => {
            // Center the coordinates and scale them down
            const centeredX = (coord[0] - centerX) * scaleX;
            const centeredY = (coord[1] - centerY) * scaleY;
            
            // Map to a reasonable location (center of Nigeria)
            const lat = 8.0 + centeredY; // Start from center of Nigeria
            const lng = 8.0 + centeredX;
            
            return [lat, lng];
        });
        
        console.log('Preserved relative shape with corrected coordinates:', correctedCoords[0]);
        return correctedCoords;
        
    } catch (error) {
        console.error('Aggressive correction failed:', error);
        return null;
    }
}

// Function to show coordinate system help
function showCoordinateSystemHelp() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: var(--bg-primary);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-2xl);
            max-width: 700px;
            width: 90%;
            position: relative;
            box-shadow: var(--shadow-2xl);
        ">
            <div class="modal-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-6);
                border-bottom: 1px solid var(--border-primary);
                background: var(--bg-secondary);
                border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
            ">
                <h2 style="
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 1.5rem;
                    font-weight: 600;
                ">Coordinate System Help</h2>
                <button class="close-modal" style="
                    background: var(--danger-500);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='var(--danger-600)'" onmouseout="this.style.background='var(--danger-500)'">
                    ×
                </button>
            </div>
            <div class="modal-body" style="padding: var(--space-6);">
                <h3 style="color: var(--text-primary); margin-top: 0;">Required Format</h3>
                <p><strong>WGS84 Latitude/Longitude (EPSG:4326)</strong></p>
                <p style="margin: var(--space-2) 0;">• Latitude: -90 to 90 degrees<br>• Longitude: -180 to 180 degrees<br>• Format: Decimal degrees</p>
                
                <h3 style="color: var(--text-primary); margin-top: var(--space-4);">Quick Fixes</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin: var(--space-3) 0;">
                    <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-lg); border: 1px solid var(--border-primary);">
                        <h4 style="color: var(--text-primary); margin-top: 0; font-size: 0.9rem;">UTM Coordinates</h4>
                        <p style="margin: 0; font-size: 0.85rem;">Use <a href="https://epsg.io/transform" target="_blank" style="color: var(--primary-500);">EPSG.io</a></p>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: var(--space-3); border-radius: var(--radius-lg); border: 1px solid var(--border-primary);">
                        <h4 style="color: var(--text-primary); margin-top: 0; font-size: 0.9rem;">Shapefiles</h4>
                        <p style="margin: 0; font-size: 0.85rem;">Use <a href="https://mapshaper.org" target="_blank" style="color: var(--primary-500);">Mapshaper</a></p>
                    </div>
                </div>
                
                <div class="warning-box" style="
                    background: var(--warning-50);
                    border: 1px solid var(--warning-200);
                    border-radius: var(--radius-lg);
                    padding: var(--space-3);
                    margin: var(--space-3) 0;
                ">
                    <h4 style="color: var(--warning-700); margin-top: 0; font-size: 0.9rem;">⚠️ Common Issues:</h4>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 0.85rem;">Wrong coordinate order (lat/lng vs lng/lat) • Different projection system • Non-decimal format</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function displayUploadedData(data, fileName) {
    console.log('=== AOI UPLOAD DEBUG ===');
    console.log('Processing uploaded data:', data);
    console.log('File name:', fileName);
    
    if (!data) {
        showNotification(`No valid geometry found in ${fileName}`, 'warning');
        return;
    }
    
    // Clear existing drawing
    clearMap();
    
    let coordinates;
    
    // Handle different data structures
    if (data.type === 'Polygon') {
        coordinates = data.coordinates[0];
        console.log('Data type: Polygon');
    } else if (data.type === 'LineString') {
        coordinates = data.coordinates;
        console.log('Data type: LineString');
    } else if (data.type === 'FeatureCollection') {
        console.log('Data type: FeatureCollection');
        // Handle multiple features
        if (data.features && data.features.length > 0) {
            const firstFeature = data.features[0];
            console.log('First feature:', firstFeature);
            if (firstFeature.geometry) {
                if (firstFeature.geometry.type === 'Polygon') {
                    coordinates = firstFeature.geometry.coordinates[0];
                    console.log('Feature geometry type: Polygon');
                } else if (firstFeature.geometry.type === 'LineString') {
                    coordinates = firstFeature.geometry.coordinates;
                    console.log('Feature geometry type: LineString');
                }
            }
        }
    } else if (data.geometry) {
        console.log('Data type: Feature with geometry');
        // Handle GeoJSON Feature
        if (data.geometry.type === 'Polygon') {
            coordinates = data.geometry.coordinates[0];
            console.log('Geometry type: Polygon');
        } else if (data.geometry.type === 'LineString') {
            coordinates = data.geometry.coordinates;
            console.log('Geometry type: LineString');
        }
    } else if (Array.isArray(data)) {
        console.log('Data type: Direct coordinate array');
        // Handle direct coordinate array
        coordinates = data;
    }
    
    console.log('Extracted coordinates count:', coordinates ? coordinates.length : 0);
    console.log('First coordinate:', coordinates ? coordinates[0] : 'none');
    console.log('Last coordinate:', coordinates ? coordinates[coordinates.length - 1] : 'none');
    
    if (coordinates && coordinates.length > 0) {
        const coordRange = {
            minLat: Math.min(...coordinates.map(c => c[0])),
            maxLat: Math.max(...coordinates.map(c => c[0])),
            minLng: Math.min(...coordinates.map(c => c[1])),
            maxLng: Math.max(...coordinates.map(c => c[1]))
        };
        console.log('Coordinate ranges:', coordRange);
    }
    
    // Validate and fix coordinates
    if (coordinates && coordinates.length > 0) {
        console.log('=== COORDINATE VALIDATION ===');
        console.log('Starting coordinate validation...');
        
        const validatedCoordinates = validateAndFixCoordinates(coordinates);
        
        if (validatedCoordinates === null) {
            console.log('Standard validation failed, attempting aggressive correction...');
            // Try one more aggressive approach - force display with warning
            const aggressiveCoords = tryAggressiveCorrection(coordinates);
            
            if (aggressiveCoords) {
                console.log('Aggressive correction successful');
                console.log('Aggressive correction result:', aggressiveCoords[0]);
                showNotification('Coordinates were corrected using aggressive method. The shape has been preserved but location may need verification.', 'warning');
                coordinates = aggressiveCoords;
            } else {
                console.log('All coordinate correction methods failed');
                // Coordinates are invalid and cannot be displayed
                showNotification('Cannot display uploaded data: Invalid coordinate system detected. Please convert to WGS84 latitude/longitude.', 'error');
                
                // Show coordinate system help
                setTimeout(() => {
                    showCoordinateSystemHelp();
                }, 1000);
                
                return;
            }
        } else {
            console.log('Standard validation successful');
            coordinates = validatedCoordinates;
        }
        
        const firstCoord = coordinates[0];
        console.log('Final coordinates after validation:', firstCoord);
        console.log('Coordinate validation complete');
    }
    
    if (coordinates && coordinates.length >= 3) {
        // Set polygon points
        polygonPoints = coordinates;
        
        // Create polygon
        currentPolygon = L.polygon(coordinates, {
            color: '#0ea5e9',
            fillColor: '#0ea5e9',
            fillOpacity: 0.2,
            weight: 3,
            opacity: 0.8
        }).addTo(drawnItems);
        
        // Calculate area and perimeter
        const area = calculatePolygonArea(coordinates);
        const perimeter = calculatePolygonPerimeter(coordinates);
        updateAreaInfo(area, perimeter, coordinates);
        
        // Fit map to the area
        if (currentPolygon) {
            map.fitBounds(currentPolygon.getBounds(), {padding: [20, 20]});
        }
        
        // Show service selection modal for uploaded AOI
        showServiceSelectionModal();
        
        // Hide the drawing status popup since we have loaded data
        const status = document.getElementById('drawingStatus');
        status.style.display = 'none';
        
        showNotification(`AOI loaded from ${fileName} successfully! Please select your service type.`, 'success');
    } else {
        showNotification(`Invalid geometry in ${fileName}. Please ensure it contains valid polygon or line data.`, 'error');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        padding: 1rem;
        color: var(--text-primary);
        box-shadow: var(--shadow-xl);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        backdrop-filter: blur(20px);
    `;
    
    // Set border color based on type
    const colors = {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#0ea5e9'
    };
    notification.style.borderLeftColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'times-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Add CSS for animations and modals
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all var(--transition-fast);
    }
    
    .notification-close:hover {
        background: var(--bg-quaternary);
        color: var(--text-primary);
    }
    
    /* Registration Modal Styles */
    .registration-modal .modal-content {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-2xl);
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: var(--shadow-2xl);
        backdrop-filter: blur(20px);
    }
    
    .registration-modal .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-6);
        border-bottom: 1px solid var(--border-primary);
    }
    
    .registration-modal .modal-header h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-size-xl);
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
    }
    
    .registration-modal .modal-close {
        width: 32px;
        height: 32px;
        background: var(--bg-quaternary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-fast);
        font-size: 1.2rem;
    }
    
    .registration-modal .modal-close:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
    
    .registration-modal .modal-body {
        padding: var(--space-6);
    }
    
    .registration-modal .modal-body p {
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
        line-height: 1.6;
    }
    
    .benefits-list {
        list-style: none;
        padding: 0;
        margin: 0 0 var(--space-6) 0;
    }
    
    .benefits-list li {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) 0;
        color: var(--text-secondary);
    }
    
    .benefits-list li i {
        color: var(--accent-500);
        font-size: var(--font-size-sm);
        width: 16px;
    }
    
    .registration-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }
    
    .registration-form .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
    }
    
    .registration-form .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }
    
    .registration-form label {
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .registration-form input {
        padding: var(--space-3);
        background: var(--bg-quaternary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        color: var(--text-primary);
        font-size: var(--font-size-base);
        transition: all var(--transition-fast);
        font-family: var(--font-family);
    }
    
    .registration-form input:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
    
    .registration-form input::placeholder {
        color: var(--text-tertiary);
    }
    
    .registration-form .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: var(--space-2);
        cursor: pointer;
        font-size: var(--font-size-sm);
        line-height: 1.5;
        color: var(--text-secondary);
    }
    
    .registration-form .checkbox-label input[type="checkbox"] {
        display: none;
    }
    
    .registration-form .checkmark {
        width: 18px;
        height: 18px;
        border: 2px solid var(--border-primary);
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--transition-fast);
        flex-shrink: 0;
        margin-top: 2px;
    }
    
    .registration-form .checkbox-label input[type="checkbox"]:checked + .checkmark {
        background: var(--primary-500);
        border-color: var(--primary-500);
    }
    
    .registration-form .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
        content: '✓';
        color: white;
        font-size: 12px;
        font-weight: bold;
    }
    
    .terms-link {
        color: var(--primary-500);
        text-decoration: none;
        transition: color var(--transition-fast);
    }
    
    .terms-link:hover {
        color: var(--primary-400);
        text-decoration: underline;
    }
    
    .form-actions {
        display: flex;
        gap: var(--space-3);
        margin-top: var(--space-4);
    }
    
    .form-actions .btn-primary,
    .form-actions .btn-secondary {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-6);
        border-radius: var(--radius-lg);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-fast);
        text-decoration: none;
    }
    
    .form-actions .btn-primary {
        background: var(--gradient-primary);
        border: none;
        color: white;
    }
    
    .form-actions .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }
    
    .form-actions .btn-secondary {
        background: transparent;
        border: 1px solid var(--border-secondary);
        color: var(--text-primary);
    }
    
    .form-actions .btn-secondary:hover {
        background: var(--bg-secondary);
        border-color: var(--primary-500);
    }
    
    @media (max-width: 768px) {
        .registration-form .form-row {
            grid-template-columns: 1fr;
        }
        
        .form-actions {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(style);

// Initialize when page loads
window.addEventListener('load', function() {
    console.log('PF-FRA AOI Tool loaded successfully!');
    console.log('Map ready with Esri World Imagery. Click "Draw Area" to start.');
    lastUpdate = new Date().toISOString();
    updateStats();
    
    // Show initial drawing status message that auto-hides after 2 seconds
    updateDrawingStatus('Click "Draw Area" to start creating polygons');
});

// User Authentication System for Map Page
function initializeAuth() {
    // Check if user is already logged in
    loadUserFromStorage();
    updateAuthUI();
    bindAuthEvents();
}

function loadUserFromStorage() {
    const userData = localStorage.getItem('pf-fra-user');
    if (userData) {
        try {
            window.currentUser = JSON.parse(userData);
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('pf-fra-user');
        }
    }
}

function saveUserToStorage() {
    if (window.currentUser) {
        localStorage.setItem('pf-fra-user', JSON.stringify(window.currentUser));
    } else {
        localStorage.removeItem('pf-fra-user');
    }
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const getStartedBtn = document.getElementById('getStartedBtn');

    if (window.currentUser) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (userName) userName.textContent = window.currentUser.name;
        if (getStartedBtn) {
            getStartedBtn.innerHTML = '<i class="fas fa-map-marked-alt"></i><span>AOI Tool</span>';
            getStartedBtn.onclick = () => {
                // Scroll to map section or show instructions
                const mapSection = document.querySelector('.map-section');
                if (mapSection) {
                    mapSection.scrollIntoView({ behavior: 'smooth' });
                }
            };
        }
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'flex';
        if (registerBtn) registerBtn.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (getStartedBtn) {
            getStartedBtn.innerHTML = '<i class="fas fa-rocket"></i><span>Get Started</span>';
            getStartedBtn.onclick = () => {
                // Show register modal for new users
                showRegisterModal();
            };
        }
    }
}

function bindAuthEvents() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => showLoginModal());
    }

    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => showRegisterModal());
    }

    // User profile dropdown
    const userProfile = document.getElementById('userProfile');
    const userDropdown = document.getElementById('userDropdown');
    if (userProfile && userDropdown) {
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            userProfile.classList.toggle('active');
            userDropdown.classList.toggle('active');
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (userDropdown && userProfile && !userProfile.contains(e.target)) {
            userProfile.classList.remove('active');
            userDropdown.classList.remove('active');
        }
    });
}

function showLoginModal() {
    createAuthModal('login');
}

function showRegisterModal() {
    createAuthModal('register');
}

function createAuthModal(type) {
    // Remove existing modal if any
    const existingModal = document.getElementById('authModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-modal-header">
                <h3>
                    <i class="fas fa-${type === 'login' ? 'sign-in-alt' : 'user-plus'}"></i>
                    ${type === 'login' ? 'Sign In' : 'Create Account'}
                </h3>
                <button class="auth-modal-close" onclick="this.closest('.auth-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="auth-modal-body">
                <form class="auth-form" id="authForm">
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" placeholder="Enter your email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" placeholder="Enter your password" required>
                    </div>
                    ${type === 'register' ? `
                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required>
                        </div>
                        <div class="form-group">
                            <label for="fullName">Full Name</label>
                            <input type="text" id="fullName" name="fullName" placeholder="Enter your full name" required>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="terms" name="terms" required>
                                <span class="checkmark"></span>
                                I agree to the <a href="#" style="color: var(--primary-500);">Terms of Service</a> and <a href="#" style="color: var(--primary-500);">Privacy Policy</a>
                            </label>
                        </div>
                    ` : ''}
                    <div class="auth-form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-${type === 'login' ? 'sign-in-alt' : 'user-plus'}"></i>
                            ${type === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                        <button type="button" class="btn-secondary" onclick="this.closest('.auth-modal').remove()">
                            Cancel
                        </button>
                    </div>
                    <div class="auth-switch">
                        ${type === 'login' 
                            ? 'Don\'t have an account? <a href="#" onclick="showRegisterModal(); this.closest(\'.auth-modal\').remove();">Create one</a>'
                            : 'Already have an account? <a href="#" onclick="showLoginModal(); this.closest(\'.auth-modal\').remove();">Sign in</a>'
                        }
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = document.getElementById('authForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (type === 'login') {
            handleLogin(form);
        } else {
            handleRegister(form);
        }
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function handleLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    // Validate input
    if (!email || !password) {
        showNotification('Please enter both email and password.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    submitBtn.disabled = true;
    
    // Simulate API call (replace with actual authentication)
    setTimeout(() => {
        // In a real app, this would make an API call to your backend
        // For demo purposes, we'll accept any valid email/password combination
        
        // Simulate authentication check
        if (email && password.length >= 6) {
            window.currentUser = {
                id: Date.now(),
                email: email,
                name: email.split('@')[0],
                loginTime: new Date().toISOString(),
                isAuthenticated: true
            };

            saveUserToStorage();
            updateAuthUI();
            
            // Close modal
            const modal = document.getElementById('authModal');
            if (modal) modal.remove();

            // Show success message
            showNotification('Welcome back! You are now signed in.', 'success');
        } else {
            showNotification('Invalid email or password. Password must be at least 6 characters.', 'error');
        }
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function handleRegister(form) {
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const fullName = formData.get('fullName');
    const terms = formData.get('terms');

    // Validation
    if (!email || !password || !confirmPassword || !fullName) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (!terms) {
        showNotification('Please accept the terms and conditions.', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;

    // Simulate API call (replace with actual registration)
    setTimeout(() => {
        // In a real app, this would make an API call to your backend
        window.currentUser = {
            id: Date.now(),
            email: email,
            name: fullName,
            registerTime: new Date().toISOString(),
            isAuthenticated: true
        };

        saveUserToStorage();
        updateAuthUI();
        
        // Close modal
        const modal = document.getElementById('authModal');
        if (modal) modal.remove();

        // Show success message
        showNotification('Account created successfully! Welcome to PF-FRA.', 'success');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

function logout() {
    window.currentUser = null;
    saveUserToStorage();
    updateAuthUI();
    showNotification('You have been signed out.', 'info');
}

function showUserDashboard() {
    const modal = document.createElement('div');
    modal.className = 'user-dashboard-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-circle"></i> My Requests</h3>
                    <button class="modal-close" onclick="this.closest('.user-dashboard-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-paper-plane"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="totalRequests">0</div>
                                <div class="stat-label">Total Requests</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="pendingRequests">0</div>
                                <div class="stat-label">Pending</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-content">
                                <div class="stat-value" id="completedRequests">0</div>
                                <div class="stat-label">Completed</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="requests-list">
                        <h4>Recent Requests</h4>
                        <div id="requestsContainer">
                            <div class="no-requests">
                                <i class="fas fa-inbox"></i>
                                <p>No requests found. Submit your first AOI request to get started!</p>
                                <button class="btn-primary" onclick="this.closest('.user-dashboard-modal').remove(); document.querySelector('#drawPolygon').click();">
                                    <i class="fas fa-plus"></i>
                                    Create Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="this.closest('.user-dashboard-modal').remove()">
                        <i class="fas fa-times"></i>
                        <span>Close</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(modal);
    
    // Load user requests
    loadUserRequests();
}

function loadUserRequests() {
    const userRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
    const requestsContainer = document.getElementById('requestsContainer');
    const totalRequestsEl = document.getElementById('totalRequests');
    const pendingRequestsEl = document.getElementById('pendingRequests');
    const completedRequestsEl = document.getElementById('completedRequests');
    
    // Update stats
    const totalRequests = userRequests.length;
    const pendingRequests = userRequests.filter(req => req.status === 'pending').length;
    const completedRequests = userRequests.filter(req => req.status === 'completed').length;
    
    totalRequestsEl.textContent = totalRequests;
    pendingRequestsEl.textContent = pendingRequests;
    completedRequestsEl.textContent = completedRequests;
    
    if (totalRequests === 0) {
        requestsContainer.innerHTML = `
            <div class="no-requests">
                <i class="fas fa-inbox"></i>
                <p>No requests found. Submit your first AOI request to get started!</p>
                <button class="btn-primary" onclick="this.closest('.user-dashboard-modal').remove(); document.querySelector('#drawPolygon').click();">
                    <i class="fas fa-plus"></i>
                    Create Request
                </button>
            </div>
        `;
        return;
    }
    
    // Display requests
    const requestsHTML = userRequests.map(request => `
        <div class="request-item">
            <div class="request-info">
                <div class="request-id">${request.requestId}</div>
                <div class="request-service">${request.serviceName}</div>
                <div class="request-area">${request.area.toFixed(2)} km²</div>
                <div class="request-date">${new Date(request.timestamp).toLocaleDateString()}</div>
            </div>
            <div class="request-status">
                <span class="status-badge ${request.status}">${request.status}</span>
            </div>
        </div>
    `).join('');
    
    requestsContainer.innerHTML = requestsHTML;
}

function isLoggedIn() {
    return window.currentUser !== null;
}

function getCurrentUser() {
    return window.currentUser;
}

// Search Functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchResults = document.getElementById('searchResults');

    // Search button click
    searchBtn.addEventListener('click', performSearch);

    // Clear search button click
    clearSearchBtn.addEventListener('click', clearSearch);

    // Enter key press in search input
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Input change to show/hide clear button
    searchInput.addEventListener('input', function() {
        if (this.value.trim()) {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
            hideSearchResults();
        }
    });

    // Click outside to hide results
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-control')) {
            hideSearchResults();
        }
    });
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        showNotification('Please enter a search term', 'warning');
        return;
    }

    showSearchLoading();
    
    // Use Nominatim (OpenStreetMap) geocoding service
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`;
    
    fetch(geocodingUrl)
        .then(response => response.json())
        .then(data => {
            hideSearchLoading();
            if (data && data.length > 0) {
                displaySearchResults(data);
            } else {
                showNoResults();
            }
        })
        .catch(error => {
            hideSearchLoading();
            console.error('Search error:', error);
            showNotification('Search failed. Please try again.', 'error');
        });
}

function showSearchLoading() {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = `
        <div class="search-loading">
            <i class="fas fa-spinner"></i>
            Searching for places...
        </div>
    `;
    searchResults.style.display = 'block';
}

function hideSearchLoading() {
    // Loading will be replaced by results or no results message
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    
    if (results.length === 0) {
        showNoResults();
        return;
    }

    const resultsHtml = results.map((result, index) => {
        const name = result.display_name.split(',')[0] || 'Unknown Location';
        const address = result.display_name;
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        return `
            <div class="search-result-item" data-lat="${lat}" data-lng="${lng}" data-index="${index}">
                <div class="search-result-icon">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="search-result-content">
                    <div class="search-result-name">${name}</div>
                    <div class="search-result-address">${address}</div>
                </div>
                <div class="search-result-actions">
                    <button class="search-action-btn" onclick="navigateToLocation(${lat}, ${lng})" title="Go to location">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="search-action-btn" onclick="centerOnLocation(${lat}, ${lng})" title="Center map">
                        <i class="fas fa-crosshairs"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    searchResults.innerHTML = resultsHtml;
    searchResults.style.display = 'block';

    // Add click event listeners to result items (for backward compatibility)
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (!e.target.closest('.search-result-actions')) {
                const lat = parseFloat(this.dataset.lat);
                const lng = parseFloat(this.dataset.lng);
                navigateToLocation(lat, lng, this.querySelector('.search-result-name').textContent);
            }
        });
    });
}

function centerOnLocation(lat, lng) {
    map.setView([lat, lng], 15);
    hideSearchResults();
    showNotification('Map centered on selected location', 'success');
}

function showNoResults() {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = `
        <div class="search-loading">
            <i class="fas fa-search"></i>
            No results found. Try a different search term.
        </div>
    `;
    searchResults.style.display = 'block';
}

function hideSearchResults() {
    const searchResults = document.getElementById('searchResults');
    searchResults.style.display = 'none';
}

function navigateToLocation(lat, lng, name) {
    // Pan and zoom to the location without placing a marker
    map.setView([lat, lng], 15);
    
    // Hide search results
    hideSearchResults();
    
    // Clear search input
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    
    showNotification(`Navigated to ${name}`, 'success');
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    hideSearchResults();
}


// Check URL parameters for auto-selection
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service');
    
    if (service) {
        // Auto-select draw mode if coming from services
        setTimeout(() => {
            if (!isDrawing && polygonPoints.length === 0) {
                startDrawing();
                showNotification('Draw mode activated! Click on the map to start drawing your area.', 'info');
                
                // Open analysis panel
                const analysisPanel = document.getElementById('analysisPanel');
                if (analysisPanel) {
                    analysisPanel.classList.add('active');
                    // Check if panel has scrollable content and add scroll listener
                    setTimeout(() => {
                        if (analysisPanel.scrollHeight > analysisPanel.clientHeight) {
                            analysisPanel.classList.add('scrollable');
                            
                            // Add scroll listener to show/hide gradient fade with throttling
                            const updateScrollIndicator = throttle(() => {
                                const isAtBottom = analysisPanel.scrollTop + analysisPanel.clientHeight >= analysisPanel.scrollHeight - 10;
                                if (isAtBottom) {
                                    analysisPanel.classList.remove('scrollable');
                                } else {
                                    analysisPanel.classList.add('scrollable');
                                }
                            }, 16); // ~60fps
                            
                            analysisPanel.addEventListener('scroll', updateScrollIndicator);
                        }
                    }, 100);
                }
            }
        }, 500);
    }
}
