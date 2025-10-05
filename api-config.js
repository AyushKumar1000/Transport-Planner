// API Configuration for Real-time Data
// Replace these with your actual API keys

const API_CONFIG = {
    // Amadeus API (Hotels, Flights, Activities)
    amadeus: {
        apiKey: 'YOUR_AMADEUS_API_KEY',
        apiSecret: 'YOUR_AMADEUS_API_SECRET',
        baseUrl: 'https://test.api.amadeus.com/v1',
        enabled: false // Set to true when you have API keys
    },
    
    // Google Places API (Restaurants, Attractions)
    googlePlaces: {
        apiKey: 'YOUR_GOOGLE_PLACES_API_KEY',
        baseUrl: 'https://maps.googleapis.com/maps/api/place',
        enabled: false // Set to true when you have API keys
    },
    
    // Foursquare API (Venues, Restaurants)
    foursquare: {
        clientId: 'YOUR_FOURSQUARE_CLIENT_ID',
        clientSecret: 'YOUR_FOURSQUARE_CLIENT_SECRET',
        baseUrl: 'https://api.foursquare.com/v3',
        enabled: false // Set to true when you have API keys
    }
};

// Export for use in other files
window.API_CONFIG = API_CONFIG;
