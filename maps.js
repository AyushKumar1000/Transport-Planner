// Google Maps Integration for Travel Planner
// This file handles map display and destination markers

let map;
let currentMarker;
let directionsService;
let directionsRenderer;
let routeMarkers = [];
let geocoder;

// Initialize Google Maps
function initMap() {
    // Default center (India)
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: defaultCenter,
        mapTypeId: 'roadmap',
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
            }
        ]
    });
    
    // Initialize directions services
    try {
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: false,
            preserveViewport: false
        });
        directionsRenderer.setMap(map);
        geocoder = new google.maps.Geocoder();
    } catch (_) {
        console.warn('Directions API not available or not enabled.');
    }
    
    console.log('🗺️ Google Maps initialized');
}

// Geocode a free-text place name → { lat, lng }
function geocodePlace(query) {
    return new Promise((resolve, reject) => {
        if (!geocoder) {
            reject(new Error('Geocoder not available'));
            return;
        }
        geocoder.geocode({ address: query, region: 'in' }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng(), formatted: results[0].formatted_address });
            } else {
                reject(new Error('Geocoding failed: ' + status));
            }
        });
    });
}

// Show destination on map
function showDestinationOnMap(destinationName, coordinates) {
    if (!map) {
        console.warn('Map not initialized yet');
        return;
    }

    // Remove previous marker
    if (currentMarker) {
        currentMarker.setMap(null);
    }

    // Use AdvancedMarkerElement if available (Marker is deprecated)
    try {
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            currentMarker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: coordinates,
                title: destinationName
            });
        } else {
            currentMarker = new google.maps.Marker({
                position: coordinates,
                map: map,
                title: destinationName,
                animation: google.maps.Animation.DROP,
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    scaledSize: new google.maps.Size(40, 40)
                }
            });
        }
    } catch (_) {
        // Fallback to basic marker
        currentMarker = new google.maps.Marker({ position: coordinates, map });
    }

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; font-size: 16px; color: #333;">${destinationName}</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">Your selected destination</p>
            </div>
        `
    });

    // Show info window
    infoWindow.open(map, currentMarker);

    // Center map on destination
    map.setCenter(coordinates);
    map.setZoom(12);

    // Show map container
    const mapContainer = document.getElementById('destinationMap');
    if (mapContainer) {
        mapContainer.classList.remove('hidden');
        mapContainer.classList.add('fade-in');
    }

    console.log(`📍 Map updated for: ${destinationName}`);
}

// Show a single point (e.g., origin) on the map with optional color
function showPointOnMap(name, coordinates, color = 'green') {
    if (!map) return;

    // Clear previous single marker
    if (currentMarker) {
        try { currentMarker.setMap && currentMarker.setMap(null); } catch(_) {}
        currentMarker = null;
    }

    try {
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            currentMarker = new google.maps.marker.AdvancedMarkerElement({
                map,
                position: coordinates,
                title: name
            });
        } else {
            const iconUrl = color === 'green'
                ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
            currentMarker = new google.maps.Marker({
                position: coordinates,
                map,
                title: name,
                icon: iconUrl
            });
        }
    } catch (_) {
        currentMarker = new google.maps.Marker({ position: coordinates, map });
    }

    map.setCenter(coordinates);
    map.setZoom(10);

    const mapContainer = document.getElementById('destinationMap');
    if (mapContainer) {
        mapContainer.classList.remove('hidden');
        mapContainer.classList.add('fade-in');
    }
}

// Hide map
function hideDestinationMap() {
    const mapContainer = document.getElementById('destinationMap');
    if (mapContainer) {
        mapContainer.classList.add('hidden');
    }
    
    if (currentMarker) {
        currentMarker.setMap(null);
        currentMarker = null;
    }
}

// Draw route between origin and destination and return total distance
function showRouteOnMap(origin, destination) {
    return new Promise((resolve, reject) => {
        if (!map || !directionsService || !directionsRenderer) {
            reject(new Error('Map not initialized'));
            return;
        }
        const request = {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
                // Sum distances across all legs
                let totalMeters = 0;
                let totalSeconds = 0;
                const route = result.routes && result.routes[0];
                if (route && route.legs) {
                    route.legs.forEach(leg => {
                        if (leg.distance && typeof leg.distance.value === 'number') {
                            totalMeters += leg.distance.value;
                        }
                        if (leg.duration && typeof leg.duration.value === 'number') {
                            totalSeconds += leg.duration.value;
                        }
                    });
                }
                const distanceKm = Math.round(totalMeters / 1000);
                const durationHrs = Math.max(1, Math.round(totalSeconds / 3600));
                // Ensure map container is visible
                const mapContainer = document.getElementById('destinationMap');
                if (mapContainer) {
                    mapContainer.classList.remove('hidden');
                    mapContainer.classList.add('fade-in');
                }
                // Clear any previous single destination marker
                if (currentMarker) {
                    try { currentMarker.setMap && currentMarker.setMap(null); } catch(_) {}
                    currentMarker = null;
                }
                // Clear previous route markers
                routeMarkers.forEach(m => { try { m.setMap && m.setMap(null); } catch(_) {} });
                routeMarkers = [];
                // Add explicit origin/destination markers
                if (route && route.legs && route.legs.length > 0) {
                    const firstLeg = route.legs[0];
                    const lastLeg = route.legs[route.legs.length - 1];
                    const originPos = firstLeg.start_location;
                    const destPos = lastLeg.end_location;
                    try {
                        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
                            const o = new google.maps.marker.AdvancedMarkerElement({ map, position: originPos, title: 'Origin' });
                            const d = new google.maps.marker.AdvancedMarkerElement({ map, position: destPos, title: 'Destination' });
                            routeMarkers.push(o, d);
                        } else {
                            const o = new google.maps.Marker({ map, position: originPos, title: 'Origin', icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' });
                            const d = new google.maps.Marker({ map, position: destPos, title: 'Destination', icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' });
                            routeMarkers.push(o, d);
                        }
                    } catch(_) {}
                    // Fit bounds to show entire route
                    const bounds = new google.maps.LatLngBounds();
                    route.overview_path?.forEach(p => bounds.extend(p));
                    bounds.extend(originPos);
                    bounds.extend(destPos);
                    map.fitBounds(bounds);
                }
                // Show a visible distance/time label under the map
                let label = document.getElementById('mapRouteInfo');
                if (!label) {
                    label = document.createElement('div');
                    label.id = 'mapRouteInfo';
                    label.style.marginTop = '8px';
                    label.style.fontSize = '14px';
                    label.style.color = '#334155';
                    const mapEl = document.getElementById('map');
                    if (mapEl && mapEl.parentElement) {
                        mapEl.parentElement.appendChild(label);
                    }
                }
                label.textContent = `Route distance: ${distanceKm} km • Est. time: ${Math.round(totalSeconds/60)} mins`;
                resolve({ distanceKm, durationHours: durationHrs, raw: result });
            } else {
                reject(new Error('Directions request failed: ' + status));
            }
        });
    });
}

// Add nearby attractions markers
function addNearbyAttractions(destinationName, coordinates) {
    if (!map) return;

    // Create a Places service
    if (!google.maps.places || !google.maps.places.PlacesService) {
        console.warn('Places library not available or not enabled. Skipping nearby attractions.');
        return;
    }
    const service = new google.maps.places.PlacesService(map);
    
    const request = {
        location: coordinates,
        radius: 5000, // 5km radius
        type: ['tourist_attraction', 'restaurant', 'lodging']
    };

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Limit to top 5 attractions
            results.slice(0, 5).forEach((place, index) => {
                const marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name,
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        scaledSize: new google.maps.Size(30, 30)
                    }
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px;">
                            <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #333;">${place.name}</h4>
                            <p style="margin: 0; font-size: 12px; color: #666;">
                                ${place.rating ? `⭐ ${place.rating}` : ''} 
                                ${place.price_level ? `💰 ${place.price_level}` : ''}
                            </p>
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });
            });
        }
    });
}

// Export functions for use in main script
window.showDestinationOnMap = showDestinationOnMap;
window.hideDestinationMap = hideDestinationMap;
window.addNearbyAttractions = addNearbyAttractions;
window.showRouteOnMap = showRouteOnMap;
window.showPointOnMap = showPointOnMap;
window.geocodePlace = geocodePlace;
