// Google Maps Integration for Travel Planner
// This file handles map display and destination markers

let map;
let currentMarker;

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
    
    console.log('🗺️ Google Maps initialized');
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

    // Create new marker
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

// Add nearby attractions markers
function addNearbyAttractions(destinationName, coordinates) {
    if (!map) return;

    // Create a Places service
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
