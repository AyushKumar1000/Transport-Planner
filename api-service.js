// Real-time API Service for Hotels and Places
// This service fetches live data from various APIs

class APIService {
    constructor() {
        this.config = window.API_CONFIG || {};
        this.cache = new Map(); // Cache API responses
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // ============= HOTEL SEARCH =============
    async searchHotels(city, checkIn, checkOut, adults = 2) {
        if (!this.config.amadeus?.enabled) {
            return this.getFallbackHotels(city);
        }

        try {
            // Get access token first
            const token = await this.getAmadeusToken();
            
            const params = new URLSearchParams({
                cityCode: await this.getCityCode(city),
                checkInDate: checkIn,
                checkOutDate: checkOut,
                adults: adults,
                currency: 'INR',
                max: 20
            });

            const response = await fetch(
                `${this.config.amadeus.baseUrl}/shopping/hotel-offers?${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) throw new Error('Hotel search failed');
            
            const data = await response.json();
            return this.formatHotelData(data);
            
        } catch (error) {
            console.warn('API hotel search failed, using fallback:', error);
            return this.getFallbackHotels(city);
        }
    }

    // ============= PLACES/ATTRACTIONS SEARCH =============
    async searchPlaces(city, category = 'tourist_attraction') {
        if (!this.config.googlePlaces?.enabled) {
            return this.getFallbackPlaces(city);
        }

        try {
            const params = new URLSearchParams({
                query: `${category} in ${city}, India`,
                key: this.config.googlePlaces.apiKey,
                fields: 'name,rating,price_level,formatted_address,place_id'
            });

            const response = await fetch(
                `${this.config.googlePlaces.baseUrl}/textsearch/json?${params}`
            );

            if (!response.ok) throw new Error('Places search failed');
            
            const data = await response.json();
            return this.formatPlacesData(data);
            
        } catch (error) {
            console.warn('API places search failed, using fallback:', error);
            return this.getFallbackPlaces(city);
        }
    }

    // ============= RESTAURANTS SEARCH =============
    async searchRestaurants(city) {
        if (!this.config.googlePlaces?.enabled) {
            return this.getFallbackRestaurants(city);
        }

        try {
            const params = new URLSearchParams({
                query: `restaurants in ${city}, India`,
                key: this.config.googlePlaces.apiKey,
                fields: 'name,rating,price_level,formatted_address,place_id'
            });

            const response = await fetch(
                `${this.config.googlePlaces.baseUrl}/textsearch/json?${params}`
            );

            if (!response.ok) throw new Error('Restaurants search failed');
            
            const data = await response.json();
            return this.formatRestaurantsData(data);
            
        } catch (error) {
            console.warn('API restaurants search failed, using fallback:', error);
            return this.getFallbackRestaurants(city);
        }
    }

    // ============= AMADEUS AUTHENTICATION =============
    async getAmadeusToken() {
        const cacheKey = 'amadeus_token';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < 1800000) { // 30 minutes
            return cached.token;
        }

        const response = await fetch(`${this.config.amadeus.baseUrl}/security/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.amadeus.apiKey,
                client_secret: this.config.amadeus.apiSecret
            })
        });

        if (!response.ok) throw new Error('Amadeus authentication failed');
        
        const data = await response.json();
        this.cache.set(cacheKey, {
            token: data.access_token,
            timestamp: Date.now()
        });
        
        return data.access_token;
    }

    // ============= CITY CODE LOOKUP =============
    async getCityCode(cityName) {
        // Common Indian city codes for Amadeus
        const cityCodes = {
            'delhi': 'DEL',
            'mumbai': 'BOM',
            'bangalore': 'BLR',
            'chennai': 'MAA',
            'kolkata': 'CCU',
            'hyderabad': 'HYD',
            'pune': 'PNQ',
            'goa': 'GOI',
            'jaipur': 'JAI',
            'udaipur': 'UDR',
            'srinagar': 'SXR',
            'leh': 'IXL',
            'kerala': 'COK',
            'manali': 'KUU',
            'shimla': 'SLV'
        };

        const normalizedCity = cityName.toLowerCase().replace(/\s+/g, '');
        return cityCodes[normalizedCity] || 'DEL'; // Default to Delhi
    }

    // ============= DATA FORMATTING =============
    formatHotelData(apiData) {
        if (!apiData.data || !apiData.data.length) return [];
        
        return apiData.data.map(hotel => ({
            name: hotel.hotel.name,
            rating: hotel.hotel.rating || 0,
            price: hotel.offers?.[0]?.price?.total || 'Price on request',
            address: hotel.hotel.contact?.address?.lines?.[0] || 'Address not available',
            amenities: hotel.hotel.amenities || [],
            description: hotel.hotel.description?.text || '',
            images: hotel.hotel.media || []
        }));
    }

    formatPlacesData(apiData) {
        if (!apiData.results || !apiData.results.length) return [];
        
        return apiData.results.map(place => ({
            name: place.name,
            rating: place.rating || 0,
            address: place.formatted_address,
            priceLevel: place.price_level || 0,
            placeId: place.place_id,
            type: 'attraction'
        }));
    }

    formatRestaurantsData(apiData) {
        if (!apiData.results || !apiData.results.length) return [];
        
        return apiData.results.map(restaurant => ({
            name: restaurant.name,
            rating: restaurant.rating || 0,
            address: restaurant.formatted_address,
            priceLevel: restaurant.price_level || 0,
            placeId: restaurant.place_id,
            type: 'restaurant'
        }));
    }

    // ============= FALLBACK DATA =============
    getFallbackHotels(city) {
        return [
            {
                name: `Premium Hotel ${city}`,
                rating: 4.5,
                price: '₹3,500 - ₹5,000',
                address: `City Center, ${city}`,
                amenities: ['WiFi', 'Restaurant', 'Pool', 'Spa'],
                description: 'Luxury accommodation with modern amenities'
            },
            {
                name: `Budget Stay ${city}`,
                rating: 3.8,
                price: '₹1,500 - ₹2,500',
                address: `Near Railway Station, ${city}`,
                amenities: ['WiFi', 'Parking'],
                description: 'Comfortable budget accommodation'
            }
        ];
    }

    getFallbackPlaces(city) {
        return [
            {
                name: `Famous Temple in ${city}`,
                rating: 4.2,
                address: `Temple Area, ${city}`,
                priceLevel: 1,
                type: 'attraction'
            },
            {
                name: `${city} Museum`,
                rating: 4.0,
                address: `Museum Road, ${city}`,
                priceLevel: 2,
                type: 'attraction'
            }
        ];
    }

    getFallbackRestaurants(city) {
        return [
            {
                name: `Local Cuisine ${city}`,
                rating: 4.3,
                address: `Food Street, ${city}`,
                priceLevel: 2,
                type: 'restaurant'
            },
            {
                name: `Fine Dining ${city}`,
                rating: 4.5,
                address: `Hotel District, ${city}`,
                priceLevel: 3,
                type: 'restaurant'
            }
        ];
    }
}

// Initialize global API service
window.apiService = new APIService();
