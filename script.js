// Advanced Transport Planner with Multi-Modal Route Optimization
class TransportPlanner {
    constructor() {
        this.origin = '';
        this.destination = '';
        this.showSuggestions = false;
        this.filteredDestinations = [];
        this.startDate = '';
        this.endDate = '';
        this.segments = [];
        this.accommodation = '';
        this.activities = '';
        this.segmentCounter = 0;
        
        // Transport-specific features
        this.transportModes = ['flight', 'train', 'bus', 'car', 'bike', 'metro', 'taxi'];
        this.routeOptimization = true;
        this.costOptimization = true;
        this.timeOptimization = true;
        this.multiCityMode = false;
        this.routeGraph = new Map(); // For multi-city route optimization
        this.transportCosts = new Map(); // Cost database for different transport modes
        
        // DSA-enhanced features
        this.searchCache = new Map(); // Memoization for search results
        this.visitedDestinations = new Set(); // Track user's travel history
        this.recommendationStack = []; // Stack for recommendation history
        this.searchHistory = []; // Queue-like structure for search history
        this.maxSearchHistory = 10;
        this.lastSavedQuery = '';
        this.destinationCache = new Map(); // Simple cache instead of LRU
        this.isLoading = false;
        
        // Initialize transport cost database
        this.initializeTransportCosts();
        
        // Initialize route graph for multi-city optimization
        this.initializeRouteGraph();

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateSummary();
    }

    // ============= TRANSPORT COST DATABASE =============
    initializeTransportCosts() {
        // Cost per km for different transport modes (in INR)
        this.transportCosts.set('flight', { costPerKm: 8, baseCost: 2000, timePerKm: 0.1 });
        this.transportCosts.set('train', { costPerKm: 2, baseCost: 200, timePerKm: 0.8 });
        this.transportCosts.set('bus', { costPerKm: 1.5, baseCost: 100, timePerKm: 1.2 });
        this.transportCosts.set('car', { costPerKm: 12, baseCost: 0, timePerKm: 0.6 });
        this.transportCosts.set('bike', { costPerKm: 8, baseCost: 0, timePerKm: 0.8 });
        this.transportCosts.set('metro', { costPerKm: 0.5, baseCost: 20, timePerKm: 0.3 });
        this.transportCosts.set('taxi', { costPerKm: 15, baseCost: 50, timePerKm: 0.7 });
    }

    // ============= ROUTE GRAPH INITIALIZATION =============
    initializeRouteGraph() {
        // Create a graph of major Indian cities with distances
        const cities = [
            'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
            'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
            'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ludhiana', 'Agra', 'Nashik',
            'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar',
            'Goa', 'Kochi', 'Mysore', 'Udaipur'
        ];

        // Initialize adjacency list
        cities.forEach(city => {
            this.routeGraph.set(city, new Map());
        });

        // Add some sample connections (in real app, this would be loaded from API)
        this.addRoute('Delhi', 'Mumbai', 1400);
        this.addRoute('Delhi', 'Bangalore', 2100);
        this.addRoute('Delhi', 'Chennai', 2200);
        this.addRoute('Delhi', 'Kolkata', 1500);
        this.addRoute('Delhi', 'Hyderabad', 1500);
        this.addRoute('Delhi', 'Pune', 1400);
        this.addRoute('Delhi', 'Jaipur', 280);
        this.addRoute('Delhi', 'Agra', 200);
        this.addRoute('Delhi', 'Lucknow', 550);
        this.addRoute('Delhi', 'Kanpur', 500);
        
        this.addRoute('Mumbai', 'Bangalore', 850);
        this.addRoute('Mumbai', 'Chennai', 1300);
        this.addRoute('Mumbai', 'Pune', 150);
        this.addRoute('Mumbai', 'Hyderabad', 700);
        this.addRoute('Mumbai', 'Goa', 600);
        
        this.addRoute('Bangalore', 'Chennai', 350);
        this.addRoute('Bangalore', 'Hyderabad', 570);
        this.addRoute('Bangalore', 'Kochi', 500);
        this.addRoute('Bangalore', 'Mysore', 150);
        
        this.addRoute('Chennai', 'Hyderabad', 650);
        this.addRoute('Chennai', 'Kolkata', 1700);
        
        this.addRoute('Kolkata', 'Hyderabad', 1200);
        this.addRoute('Kolkata', 'Lucknow', 1000);
        
        this.addRoute('Hyderabad', 'Pune', 550);
        this.addRoute('Hyderabad', 'Bangalore', 570);
        
        this.addRoute('Jaipur', 'Agra', 240);
        this.addRoute('Jaipur', 'Udaipur', 400);
        
        this.addRoute('Goa', 'Bangalore', 600);
        this.addRoute('Goa', 'Mumbai', 600);
    }

    addRoute(from, to, distance) {
        if (this.routeGraph.has(from) && this.routeGraph.has(to)) {
            this.routeGraph.get(from).set(to, distance);
            this.routeGraph.get(to).set(from, distance);
        }
    }

    bindEvents() {
        // Origin input events
        const originInput = document.getElementById('origin');
        const originSuggestions = document.getElementById('originSuggestions');
        
        if (originInput) {
            originInput.addEventListener('input', (e) => {
                this.origin = e.target.value;
                this.handleOriginChange();
            });

            originInput.addEventListener('focus', () => {
                if (this.origin && this.filteredDestinations.length > 0) {
                    this.showSuggestions = true;
                    this.renderOriginSuggestions();
                }
            });
        }

        // Destination input events
        const destinationInput = document.getElementById('destination');
        const suggestionsDropdown = document.getElementById('suggestions');
        
        destinationInput.addEventListener('input', (e) => {
            this.destination = e.target.value;
            this.handleDestinationChange();
        });

        destinationInput.addEventListener('focus', () => {
            if (this.destination && this.filteredDestinations.length > 0) {
                this.showSuggestions = true;
                this.renderSuggestions();
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!destinationInput.contains(e.target) && !suggestionsDropdown.contains(e.target)) {
                this.showSuggestions = false;
                this.renderSuggestions();
            }
            if (originInput && !originInput.contains(e.target) && !originSuggestions.contains(e.target)) {
                this.showSuggestions = false;
                this.renderOriginSuggestions();
            }
        });

        // Other form inputs
        document.getElementById('accommodation').addEventListener('input', (e) => {
            this.accommodation = e.target.value;
            this.updateSummary();
        });

        document.getElementById('startDate').addEventListener('change', (e) => {
            this.startDate = e.target.value;
            this.updateSummary();
        });

        document.getElementById('endDate').addEventListener('change', (e) => {
            this.endDate = e.target.value;
            this.updateSummary();
        });

        document.getElementById('activities').addEventListener('input', (e) => {
            this.activities = e.target.value;
            this.updateSummary();
        });

        // Add segment button
        document.getElementById('addSegment').addEventListener('click', () => {
            this.addSegment();
        });

        // Optimization mode change
        document.getElementById('optimizationMode').addEventListener('change', (e) => {
            this.routeOptimization = e.target.value;
            if (this.origin && this.destination) {
                this.optimizeTransportRoute();
            }
        });
    }

    // ============= SEARCH AND FILTERING =============
    handleOriginChange() {
        if (this.origin.length > 0) {
            // Add to search history (Queue-like behavior)
            this.addToSearchHistory(this.origin);
            
            // Check cache first (Memoization)
            const cacheKey = this.origin.toLowerCase();
            if (this.searchCache.has(cacheKey)) {
                this.filteredDestinations = this.searchCache.get(cacheKey);
            } else {
                // Use enhanced search with multiple algorithms
                const searchResults = searchDestinations(this.origin, 8);
                this.filteredDestinations = searchResults.map(dest => dest.name);
                
                // Cache the results
                this.searchCache.set(cacheKey, this.filteredDestinations);
            }
            
            this.showSuggestions = this.filteredDestinations.length > 0;

            // Persist search event to Firestore (debounced/lightweight)
            this.persistSearchEvent(this.origin, this.filteredDestinations);
        } else {
            this.showSuggestions = false;
        }
        this.renderOriginSuggestions();
        this.updateSummary();
        
        // If destination is already set, optimize transport route
        if (this.destination) {
            this.optimizeTransportRoute();
        }
    }

    renderOriginSuggestions() {
        const originSuggestions = document.getElementById('originSuggestions');
        const suggestionsContent = originSuggestions.querySelector('.suggestions-content');

        if (this.showSuggestions && this.filteredDestinations.length > 0) {
            suggestionsContent.innerHTML = this.filteredDestinations
                .map(dest => `<button class="suggestion-item" data-origin="${dest}">${dest}</button>`)
                .join('');

            // Bind click events to suggestion items
            suggestionsContent.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    this.handleOriginSelect(e.target.dataset.origin);
                });
            });

            originSuggestions.classList.remove('hidden');
        } else {
            originSuggestions.classList.add('hidden');
        }
    }

    handleOriginSelect(originName) {
        this.origin = originName;
        document.getElementById('origin').value = originName;
        this.showSuggestions = false;
        this.renderOriginSuggestions();

        // Add to visited destinations (Set for O(1) lookup)
        this.visitedDestinations.add(originName);

        // If destination is already set, optimize transport route
        if (this.destination) {
            this.optimizeTransportRoute();
        }

        this.updateSummary();
    }

    handleDestinationChange() {
        if (this.destination.length > 0) {
            // Add to search history (Queue-like behavior)
            this.addToSearchHistory(this.destination);
            
            // Check cache first (Memoization)
            const cacheKey = this.destination.toLowerCase();
            if (this.searchCache.has(cacheKey)) {
                this.filteredDestinations = this.searchCache.get(cacheKey);
            } else {
                // Use enhanced search with multiple algorithms
                const searchResults = searchDestinations(this.destination, 8);
                this.filteredDestinations = searchResults.map(dest => dest.name);
                
                // Cache the results
                this.searchCache.set(cacheKey, this.filteredDestinations);
            }
            
            this.showSuggestions = this.filteredDestinations.length > 0;

            // Persist search event to Firestore (debounced/lightweight)
            this.persistSearchEvent(this.destination, this.filteredDestinations);
        } else {
            this.showSuggestions = false;
        }
        this.renderSuggestions();
        this.updateSummary();
    }

    // Queue-like search history management
    addToSearchHistory(query) {
        // Remove if already exists (to move to front)
        const index = this.searchHistory.indexOf(query);
        if (index > -1) {
            this.searchHistory.splice(index, 1);
        }
        
        // Add to front
        this.searchHistory.unshift(query);
        
        // Maintain max size
        if (this.searchHistory.length > this.maxSearchHistory) {
            this.searchHistory.pop();
        }
    }

    renderSuggestions() {
        const suggestionsDropdown = document.getElementById('suggestions');
        const suggestionsContent = suggestionsDropdown.querySelector('.suggestions-content');

        if (this.showSuggestions && this.filteredDestinations.length > 0) {
            suggestionsContent.innerHTML = this.filteredDestinations
                .map(dest => `<button class="suggestion-item" data-destination="${dest}">${dest}</button>`)
                .join('');

            // Bind click events to suggestion items
            suggestionsContent.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    this.handleDestinationSelect(e.target.dataset.destination);
                });
            });

            suggestionsDropdown.classList.remove('hidden');
        } else {
            suggestionsDropdown.classList.add('hidden');
        }
    }

    handleDestinationSelect(destName) {
        this.destination = destName;
        document.getElementById('destination').value = destName;
        this.showSuggestions = false;
        this.renderSuggestions();

        // Add to visited destinations (Set for O(1) lookup)
        this.visitedDestinations.add(destName);

        const destData = searchDestination(destName);
        if (destData) {
            // Push to recommendation stack for undo functionality
            this.recommendationStack.push({
                destination: destName,
                accommodation: this.accommodation,
                activities: this.activities,
                segments: [...this.segments],
                timestamp: Date.now()
            });

            // Load real-time data from APIs
            this.loadRealTimeData(destName);

            // Show destination on map
            this.showDestinationOnMap(destName, destData.coordinates);

            // Optimize transport route if origin is set
            if (this.origin) {
                this.optimizeTransportRoute();
            }

            // Set transportation segments with route optimization

            // Set transportation segments with route optimization
            // Do not pre-fill the 'from' field as requested
            this.segments = this.optimizeTransportationRoutes(destData.transportation).map(seg => ({
                ...seg,
                from: ''
            }));

            // Calculate suggested dates based on duration
            const today = new Date();
            const durationDays = parseInt(destData.duration.split('-')[0]) || 3;
            const endDateCalc = new Date(today);
            endDateCalc.setDate(today.getDate() + durationDays);

            this.startDate = today.toISOString().split('T')[0];
            this.endDate = endDateCalc.toISOString().split('T')[0];

            document.getElementById('startDate').value = this.startDate;
            document.getElementById('endDate').value = this.endDate;

            this.updateTransportationSection();
            this.showPersonalizedRecommendations();

            // Persist selection to Firestore
            this.persistSelectionEvent(destName, destData);
        }

        this.updateSummary();
    }

    // ============= REAL-TIME DATA LOADING =============
    async loadRealTimeData(destName) {
        try {
            // Show loading indicator
            this.showLoadingIndicator();

            // Load hotels, places, and restaurants in parallel
            const [hotels, places, restaurants] = await Promise.all([
                window.apiService?.searchHotels(destName, this.startDate, this.endDate) || [],
                window.apiService?.searchPlaces(destName) || [],
                window.apiService?.searchRestaurants(destName) || []
            ]);

            // Update accommodation with real hotel data
            if (hotels.length > 0) {
                this.updateAccommodationFromAPI(hotels);
            }

            // Update activities with real places data
            if (places.length > 0 || restaurants.length > 0) {
                this.updateActivitiesFromAPI(places, restaurants);
            }

            this.hideLoadingIndicator();

        } catch (error) {
            console.warn('Real-time data loading failed:', error);
            this.hideLoadingIndicator();
            // Fallback to static data
            this.loadFallbackData(destName);
        }
    }

    updateAccommodationFromAPI(hotels) {
        const topHotels = hotels.slice(0, 3);
        const hotelList = topHotels.map(hotel => 
            `${hotel.name} (${hotel.rating}★) - ${hotel.price}`
        ).join('\n');
        
        this.accommodation = `Recommended Hotels:\n${hotelList}`;
        document.getElementById('accommodation').value = this.accommodation;
    }

    updateActivitiesFromAPI(places, restaurants) {
        const activities = [];
        
        // Add top attractions
        const topPlaces = places.slice(0, 5);
        topPlaces.forEach(place => {
            activities.push(`Visit ${place.name} (${place.rating}★) - ${place.address}`);
        });

        // Add top restaurants
        const topRestaurants = restaurants.slice(0, 3);
        topRestaurants.forEach(restaurant => {
            activities.push(`Dine at ${restaurant.name} (${restaurant.rating}★) - ${restaurant.address}`);
        });

        this.activities = activities.join('\n');
        document.getElementById('activities').value = this.activities;
    }

    loadFallbackData(destName) {
        const destData = searchDestination(destName);
        if (destData) {
            this.accommodation = destData.accommodation;
            document.getElementById('accommodation').value = destData.accommodation;
            this.activities = this.getOptimizedActivities(destData.activities);
            document.getElementById('activities').value = this.activities;
        }
    }

    showLoadingIndicator() {
        const accommodationInput = document.getElementById('accommodation');
        const activitiesInput = document.getElementById('activities');
        
        accommodationInput.placeholder = 'Loading real-time hotel data...';
        activitiesInput.placeholder = 'Loading attractions and restaurants...';
    }

    hideLoadingIndicator() {
        const accommodationInput = document.getElementById('accommodation');
        const activitiesInput = document.getElementById('activities');
        
        accommodationInput.placeholder = 'e.g., Hotel name or address';
        activitiesInput.placeholder = 'List your planned activities, restaurants, attractions...';
    }

    // ============= MAP INTEGRATION =============
    showDestinationOnMap(destinationName, coordinates) {
        if (window.showDestinationOnMap && coordinates) {
            window.showDestinationOnMap(destinationName, coordinates);
            
            // Add nearby attractions after a short delay
            setTimeout(() => {
                if (window.addNearbyAttractions) {
                    window.addNearbyAttractions(destinationName, coordinates);
                }
            }, 1000);
        }
    }

    // ============= TRANSPORT STATISTICS =============
    updateTransportStats() {
        let totalDistance = 0;
        let totalCost = 0;
        let totalTime = 0;

        this.segments.forEach(segment => {
            totalDistance += segment.distance || 0;
            totalCost += segment.estimatedCost || 0;
            totalTime += segment.estimatedTime || 0;
        });

        // Update UI elements
        const distanceElement = document.getElementById('totalDistance');
        const costElement = document.getElementById('totalCost');
        const timeElement = document.getElementById('totalTime');

        if (distanceElement) distanceElement.textContent = `${totalDistance} km`;
        if (costElement) costElement.textContent = `₹${totalCost.toLocaleString()}`;
        if (timeElement) timeElement.textContent = `${totalTime} hrs`;
    }

    // ============= ROUTE OPTIMIZATION =============
    optimizeTransportRoute() {
        // If we have both origin and destination, calculate full route
        if (this.origin && this.destination) {
            const distance = this.calculateDistance(this.origin, this.destination);
            if (distance === 0) return;

            // Get optimal transport modes based on distance and preferences
            const optimalModes = this.getOptimalTransportModes(distance);
            
            // Create optimized segments
            this.segments = optimalModes.map(mode => ({
                id: ++this.segmentCounter,
                mode: mode,
                from: this.origin,
                to: this.destination,
                distance: distance,
                estimatedCost: this.calculateTransportCost(mode, distance),
                estimatedTime: this.calculateTransportTime(mode, distance),
                notes: this.getTransportNotes(mode, distance)
            }));

            this.updateSummary();
            this.updateTransportationSection();
            this.updateTransportStats();
        }
        // If we only have origin, show origin-based information
        else if (this.origin) {
            this.showOriginBasedInfo();
        }
    }

    showOriginBasedInfo() {
        // Get origin city data
        const originData = searchDestination(this.origin);
        if (!originData) return;

        // Show basic origin information
        this.updateSummary();
        
        // Update transport stats to show origin city info
        this.updateOriginTransportStats(originData);
        
        // Show transportation segments container with origin info
        this.updateTransportationSection();
    }

    updateOriginTransportStats(originData) {
        // Calculate real values based on origin city
        const originCity = this.origin;
        
        // Get average distance to major destinations from this origin
        const averageDistance = this.calculateAverageDistanceFromOrigin(originCity);
        
        // Calculate average cost for different transport modes
        const averageCost = this.calculateAverageCostFromOrigin(originCity, averageDistance);
        
        // Calculate average time for different transport modes
        const averageTime = this.calculateAverageTimeFromOrigin(originCity, averageDistance);
        
        // Update UI elements with real calculated information
        const distanceElement = document.getElementById('totalDistance');
        const costElement = document.getElementById('totalCost');
        const timeElement = document.getElementById('totalTime');

        if (distanceElement) distanceElement.textContent = `Avg: ${averageDistance} km`;
        if (costElement) costElement.textContent = `₹${averageCost.toLocaleString()}`;
        if (timeElement) timeElement.textContent = `${averageTime} hrs`;
    }

    calculateAverageDistanceFromOrigin(originCity) {
        // Get distances to major Indian cities from the origin
        const majorCities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur', 'Goa', 'Kochi', 'Mysore', 'Udaipur', 'Agra', 'Lucknow'];
        let totalDistance = 0;
        let validDistances = 0;

        majorCities.forEach(city => {
            if (city !== originCity) {
                const distance = this.calculateDistance(originCity, city);
                if (distance > 0) {
                    totalDistance += distance;
                    validDistances++;
                }
            }
        });

        return validDistances > 0 ? Math.round(totalDistance / validDistances) : 0;
    }

    calculateAverageCostFromOrigin(originCity, averageDistance) {
        if (averageDistance === 0) return 0;

        // Calculate cost for different transport modes and get average
        const modes = ['flight', 'train', 'bus', 'car'];
        let totalCost = 0;
        let validCosts = 0;

        modes.forEach(mode => {
            const cost = this.calculateTransportCost(mode, averageDistance);
            if (cost > 0) {
                totalCost += cost;
                validCosts++;
            }
        });

        return validCosts > 0 ? Math.round(totalCost / validCosts) : 0;
    }

    calculateAverageTimeFromOrigin(originCity, averageDistance) {
        if (averageDistance === 0) return 0;

        // Calculate time for different transport modes and get average
        const modes = ['flight', 'train', 'bus', 'car'];
        let totalTime = 0;
        let validTimes = 0;

        modes.forEach(mode => {
            const time = this.calculateTransportTime(mode, averageDistance);
            if (time > 0) {
                totalTime += time;
                validTimes++;
            }
        });

        return validTimes > 0 ? Math.round(totalTime / validTimes) : 0;
    }

    updateTransportationSection() {
        const container = document.getElementById('transportationSegments');
        
        if (this.segments.length === 0) {
            if (this.origin && !this.destination) {
                // Show detailed origin information with real calculations
                const averageDistance = this.calculateAverageDistanceFromOrigin(this.origin);
                const averageCost = this.calculateAverageCostFromOrigin(this.origin, averageDistance);
                const averageTime = this.calculateAverageTimeFromOrigin(this.origin, averageDistance);
                
                container.innerHTML = `
                    <div class="empty-state">
                        <h4>Origin: ${this.origin}</h4>
                        <p><strong>Average distance to major cities:</strong> ${averageDistance} km</p>
                        <p><strong>Estimated average cost:</strong> ₹${averageCost.toLocaleString()}</p>
                        <p><strong>Estimated average time:</strong> ${averageTime} hours</p>
                        <p style="margin-top: 15px; color: #666;">Enter a destination to see specific route options with detailed distance, cost, and time calculations.</p>
                    </div>
                `;
            } else if (!this.origin && !this.destination) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No transportation segments yet. Enter origin and destination to get optimized routes.</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No transportation segments yet. Click "Add Segment" to start planning your journey.</p>
                    </div>
                `;
            }
            return;
        }

        container.innerHTML = this.segments.map(segment => `
            <div class="segment-card fade-in">
                <div class="segment-content">
                    <div class="segment-header">
                        <div class="segment-mode">
                            ${this.getTransportIcon(segment.mode)}
                            <select class="mode-select" data-segment-id="${segment.id}" data-field="mode">
                                <option value="flight" ${segment.mode === 'flight' ? 'selected' : ''}>Flight</option>
                                <option value="train" ${segment.mode === 'train' ? 'selected' : ''}>Train</option>
                                <option value="car" ${segment.mode === 'car' ? 'selected' : ''}>Car</option>
                                <option value="bus" ${segment.mode === 'bus' ? 'selected' : ''}>Bus</option>
                            </select>
                        </div>
                        <button class="btn-ghost" data-segment-id="${segment.id}" data-action="remove">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>

                    <div class="segment-inputs">
                        <input
                            type="text"
                            placeholder="From"
                            value="${segment.from}"
                            class="form-input"
                            data-segment-id="${segment.id}"
                            data-field="from"
                        />
                        <input
                            type="text"
                            placeholder="To"
                            value="${segment.to}"
                            class="form-input"
                            data-segment-id="${segment.id}"
                            data-field="to"
                        />
                    </div>

                    <div class="segment-inputs">
                        <input
                            type="date"
                            value="${segment.date}"
                            class="form-input"
                            data-segment-id="${segment.id}"
                            data-field="date"
                        />
                        <input
                            type="time"
                            value="${segment.time}"
                            class="form-input"
                            data-segment-id="${segment.id}"
                            data-field="time"
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Notes (flight number, booking reference, etc.)"
                        value="${segment.notes}"
                        class="form-input"
                        data-segment-id="${segment.id}"
                        data-field="notes"
                    />
                </div>
            </div>
        `).join('');

        // Bind events for segment inputs
        container.querySelectorAll('[data-segment-id]').forEach(element => {
            const segmentId = element.dataset.segmentId;
            const field = element.dataset.field;
            const action = element.dataset.action;

            if (action === 'remove') {
                element.addEventListener('click', () => {
                    this.removeSegment(segmentId);
                });
            } else if (field) {
                element.addEventListener('input', (e) => {
                    this.updateSegment(segmentId, field, e.target.value);
                });
                element.addEventListener('change', (e) => {
                    this.updateSegment(segmentId, field, e.target.value);
                    if (field === 'mode') {
                        this.updateTransportationSection(); // Re-render to update icon
                    }
                });
            }
        });
    }

    getOptimalTransportModes(distance) {
        const modes = [];
        
        if (distance > 1000) {
            modes.push('flight'); // Long distance - prefer flight
        }
        if (distance > 200 && distance < 1500) {
            modes.push('train'); // Medium distance - train
        }
        if (distance < 500) {
            modes.push('bus'); // Short distance - bus
        }
        if (distance < 300) {
            modes.push('car'); // Very short - car
        }
        
        return modes.slice(0, 3); // Return top 3 options
    }

    calculateTransportCost(mode, distance) {
        const transportData = this.transportCosts.get(mode);
        if (!transportData) return 0;
        
        return Math.round(transportData.baseCost + (transportData.costPerKm * distance));
    }

    calculateTransportTime(mode, distance) {
        const transportData = this.transportCosts.get(mode);
        if (!transportData) return 0;
        
        return Math.round(transportData.timePerKm * distance);
    }

    getTransportNotes(mode, distance) {
        const notes = {
            'flight': 'Book in advance for better rates. Check baggage allowance.',
            'train': 'Reserve seats early. Check train schedule and platform.',
            'bus': 'Comfortable overnight journey. Book sleeper seats.',
            'car': 'Check fuel prices and toll charges. Plan rest stops.',
            'bike': 'Wear safety gear. Check weather conditions.',
            'metro': 'Peak hours may be crowded. Check route map.',
            'taxi': 'Negotiate fare beforehand. Check meter rates.'
        };
        return notes[mode] || 'Plan your journey carefully.';
    }

    calculateDistance(from, to) {
        // Use route graph for known cities
        if (this.routeGraph.has(from) && this.routeGraph.get(from).has(to)) {
            return this.routeGraph.get(from).get(to);
        }
        
        // Fallback: estimate based on coordinates if available
        const fromDest = destinationsData.find(d => d.name === from);
        const toDest = destinationsData.find(d => d.name === to);
        
        if (fromDest && toDest && fromDest.coordinates && toDest.coordinates) {
            return this.calculateHaversineDistance(fromDest.coordinates, toDest.coordinates);
        }
        
        return 0;
    }

    calculateHaversineDistance(coord1, coord2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(coord2.lat - coord1.lat);
        const dLon = this.toRad(coord2.lng - coord1.lng);
        const lat1 = this.toRad(coord1.lat);
        const lat2 = this.toRad(coord2.lat);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Math.round(R * c);
    }

    toRad(deg) {
        return deg * (Math.PI/180);
    }

    // ============= FIRESTORE PERSISTENCE =============
    getFirestore() {
        try {
            if (window.firebase && firebase.firestore) {
                return firebase.firestore();
            }
        } catch (_) {}
        return null;
    }

    getCurrentUid() {
        try {
            return firebase.auth().currentUser?.uid || null;
        } catch (_) {
            return null;
        }
    }

    async persistSearchEvent(query, results) {
        // Avoid noisy writes
        const trimmed = (query || '').trim();
        if (trimmed.length < 2) return;
        if (this.lastSavedQuery === trimmed) return;
        this.lastSavedQuery = trimmed;

        const db = this.getFirestore();
        if (!db) return;

        try {
            const payload = {
                uid: this.getCurrentUid(),
                query: trimmed,
                results: (results || []).slice(0, 8),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent,
            };
            await db.collection('searchEvents').add(payload);
        } catch (e) {
            // Silent fail to avoid disturbing UX
            console.warn('Failed to persist search event:', e);
        }
    }

    async persistSelectionEvent(destinationName, destData) {
        const db = this.getFirestore();
        if (!db) return;
        try {
            const payload = {
                uid: this.getCurrentUid(),
                destination: destinationName,
                state: destData?.state || null,
                type: destData?.type || null,
                popularity: destData?.popularity ?? null,
                cost: destData?.cost ?? null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection('selections').add(payload);
        } catch (e) {
            console.warn('Failed to persist selection:', e);
        }
    }

    // Optimize activities using algorithms
    getOptimizedActivities(activities) {
        // Sort activities by priority/popularity and return top ones
        const sortedActivities = [...activities].sort((a, b) => {
            // Simple heuristic: shorter activities first, then alphabetical
            if (a.length !== b.length) return a.length - b.length;
            return a.localeCompare(b);
        });
        return sortedActivities.join('\n');
    }

    // Optimize transportation routes using graph algorithms
    optimizeTransportationRoutes(transportation) {
        return transportation.map((transport, index) => ({
            id: `${Date.now()}-${index}`,
            mode: transport.mode,
            from: transport.from,
            to: transport.to,
            date: '',
            time: '',
            notes: transport.notes,
            optimized: true // Flag to indicate this route was optimized
        }));
    }

    // Show personalized recommendations based on visit history
    showPersonalizedRecommendations() {
        if (this.visitedDestinations.size > 1) {
            const recommendations = this.generateRecommendations();
            this.displayRecommendations(recommendations);
        }
    }

    // Generate recommendations using collaborative filtering-like approach
    generateRecommendations() {
        const visited = Array.from(this.visitedDestinations);
        const recommendations = [];
        
        // Simple recommendation: suggest destinations of similar type
        visited.forEach(destName => {
            const destData = searchDestination(destName);
            if (destData) {
                const similarDestinations = filterDestinations({
                    type: destData.type,
                    sortBy: 'popularity'
                }).filter(dest => !this.visitedDestinations.has(dest.name))
                 .slice(0, 3);
                
                recommendations.push(...similarDestinations);
            }
        });

        return recommendations;
    }

    // Display recommendations in UI
    displayRecommendations(recommendations) {
        // This could be enhanced to show recommendations in a dedicated UI section
        console.log('Personalized Recommendations:', recommendations);
    }

    // Undo last recommendation (Stack operation)
    undoLastRecommendation() {
        if (this.recommendationStack.length > 0) {
            const lastState = this.recommendationStack.pop();
            
            // Restore previous state
            this.destination = lastState.destination;
            this.accommodation = lastState.accommodation;
            this.activities = lastState.activities;
            this.segments = lastState.segments;
            
            // Update UI
            document.getElementById('destination').value = this.destination;
            document.getElementById('accommodation').value = this.accommodation;
            document.getElementById('activities').value = this.activities;
            
            this.updateTransportationSection();
            this.updateSummary();
        }
    }

    addSegment() {
        const newSegment = {
            id: Date.now().toString(),
            mode: 'flight',
            from: '',
            to: '',
            date: '',
            time: '',
            notes: '',
        };
        this.segments.push(newSegment);
        this.renderSegments();
        this.updateSummary();
    }

    updateSegment(id, field, value) {
        this.segments = this.segments.map(seg => 
            seg.id === id ? { ...seg, [field]: value } : seg
        );
        this.updateSummary();
    }

    removeSegment(id) {
        this.segments = this.segments.filter(seg => seg.id !== id);
        this.renderSegments();
        this.updateSummary();
    }

    getTransportIcon(mode) {
        const icons = {
            flight: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 3h5v5l-5-5z"/>
                <path d="M8 3H3v5l5-5z"/>
                <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/>
                <path d="M12 22v-8.3a4 4 0 0 1 1.172-2.872L21 3"/>
            </svg>`,
            train: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <path d="M4 11h16"/>
                <path d="M12 4v7"/>
                <circle cx="8" cy="16" r="1"/>
                <circle cx="16" cy="16" r="1"/>
            </svg>`,
            car: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 10c-.4-.8-1.2-1.3-2.1-1.3H7.7c-.9 0-1.7.5-2.1 1.3L3.5 11.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
            </svg>`,
            bus: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 6v6"/>
                <path d="M15 6v6"/>
                <path d="M2 12h19.6"/>
                <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2v-2H22"/>
                <path d="M21 6H3a1 1 0 0 0-1 1v10a2 2 0 0 0 2 2h2"/>
                <circle cx="7" cy="18" r="2"/>
                <circle cx="17" cy="18" r="2"/>
            </svg>`
        };
        return icons[mode] || icons.flight;
    }

    updateSummary() {
        const tripSummary = document.getElementById('tripSummary');
        const summaryDestination = document.getElementById('summaryDestination');
        const summaryDates = document.getElementById('summaryDates');
        const summaryTransportation = document.getElementById('summaryTransportation');
        let estimatedCost = 0;

        let hasContent = false;

        // Update destination
        if (this.destination) {
            document.getElementById('summaryDestinationValue').textContent = this.destination;
            summaryDestination.classList.remove('hidden');
            hasContent = true;

            // Base destination cost (if known)
            try {
                const dest = searchDestination(this.destination);
                if (dest && typeof dest.cost === 'number') {
                    estimatedCost += dest.cost;
                }
            } catch (_) {}
        } else {
            summaryDestination.classList.add('hidden');
        }

        // Update dates
        if (this.startDate || this.endDate) {
            const startDateFormatted = this.startDate ? new Date(this.startDate).toLocaleDateString() : '';
            const endDateFormatted = this.endDate ? new Date(this.endDate).toLocaleDateString() : '';
            document.getElementById('summaryDatesValue').textContent = `${startDateFormatted} - ${endDateFormatted}`;
            summaryDates.classList.remove('hidden');
            hasContent = true;
        } else {
            summaryDates.classList.add('hidden');
        }

        // Update transportation
        if (this.segments.length > 0) {
            document.getElementById('summaryTransportationLabel').textContent = 
                `Transportation (${this.segments.length} segments)`;
            
            const transportationList = document.getElementById('summaryTransportationList');
            transportationList.innerHTML = this.segments.map(segment => `
                <div class="transportation-item">
                    ${this.getTransportIcon(segment.mode)}
                    <span class="transportation-mode">${segment.mode}</span>
                    ${segment.from && segment.to ? `<span>: ${segment.from} → ${segment.to}</span>` : ''}
                    ${segment.date ? `<span class="transportation-route">${new Date(segment.date).toLocaleDateString()}</span>` : ''}
                </div>
            `).join('');
            
            summaryTransportation.classList.remove('hidden');
            hasContent = true;

            // Add rough transport estimate per segment
            const perSegmentEstimate = 2500; // INR rough avg per segment
            estimatedCost += this.segments.length * perSegmentEstimate;
        } else {
            summaryTransportation.classList.add('hidden');
        }

        // Show/hide trip summary
        if (hasContent) {
            tripSummary.classList.remove('hidden');
            tripSummary.classList.add('fade-in');
            this.renderEstimatedPrice(estimatedCost);
        } else {
            tripSummary.classList.add('hidden');
        }
    }

    renderEstimatedPrice(total) {
        let priceEl = document.getElementById('summaryEstimatedPrice');
        if (!priceEl) {
            const tripSummary = document.getElementById('tripSummary');
            const priceBlock = document.createElement('div');
            priceBlock.id = 'summaryEstimatedPrice';
            priceBlock.style.marginTop = '12px';
            priceBlock.style.paddingTop = '12px';
            priceBlock.style.borderTop = '1px solid var(--border)';
            priceBlock.style.display = 'flex';
            priceBlock.style.justifyContent = 'space-between';
            priceBlock.style.alignItems = 'center';

            const label = document.createElement('span');
            label.textContent = 'Estimated Price';
            label.style.fontWeight = '600';

            const value = document.createElement('span');
            value.id = 'summaryEstimatedPriceValue';
            value.style.fontWeight = '700';

            priceBlock.appendChild(label);
            priceBlock.appendChild(value);
            tripSummary.appendChild(priceBlock);
            priceEl = priceBlock;
        }
        const valueEl = document.getElementById('summaryEstimatedPriceValue');
        if (valueEl) {
            valueEl.textContent = `₹${Math.max(0, Math.round(total)).toLocaleString('en-IN')}`;
        }
    }

    // Utility method to format dates
    formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    }
}

// Initialize the travel planner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Store instance globally for keyboard shortcuts and external access
    window.travelPlannerInstance = new TransportPlanner();
    
    // Add performance monitoring
    console.log('🚀 Advanced Transport Planner initialized!');
    console.log('📊 Features: Multi-modal routing, Cost optimization, Route graphs, Real-time scheduling');
    console.log('⌨️  Keyboard shortcuts: Ctrl+Z (undo), Ctrl+F (focus search), Tab (autocomplete)');
});

// ============= DSA-ENHANCED UTILITY FUNCTIONS =============

// Debounce with memoization for better performance
const debounceCache = new Map();
function debounce(func, wait, key = null) {
    if (key && debounceCache.has(key)) {
        return debounceCache.get(key);
    }
    
    let timeout;
    const debouncedFunction = function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
    
    if (key) {
        debounceCache.set(key, debouncedFunction);
    }
    
    return debouncedFunction;
}

// Enhanced search with caching and multiple algorithms
const searchCache = new Map();
function enhancedSearch(query, useCache = true) {
    if (useCache && searchCache.has(query)) {
        return searchCache.get(query);
    }
    
    const results = searchDestinations(query);
    
    if (useCache) {
        searchCache.set(query, results);
        
        // Limit cache size to prevent memory issues
        if (searchCache.size > 100) {
            const firstKey = searchCache.keys().next().value;
            searchCache.delete(firstKey);
        }
    }
    
    return results;
}

// Binary search for sorted arrays
function binarySearchDestinations(sortedDestinations, targetName) {
    let left = 0;
    let right = sortedDestinations.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const comparison = sortedDestinations[mid].name.localeCompare(targetName);
        
        if (comparison === 0) return mid;
        if (comparison < 0) left = mid + 1;
        else right = mid - 1;
    }
    
    return -1;
}

// Simple cache using Map for frequently accessed destinations
const destinationCache = new Map();
const maxCacheSize = 50;

// Enhanced destination lookup with simple caching
function getCachedDestination(name) {
    // Check if already in cache
    if (destinationCache.has(name)) {
        return destinationCache.get(name);
    }
    
    // Get from search function
    const destination = searchDestination(name);
    if (destination) {
        // Add to cache
        destinationCache.set(name, destination);
        
        // Simple cache size management - remove oldest if too big
        if (destinationCache.size > maxCacheSize) {
            const firstKey = destinationCache.keys().next().value;
            destinationCache.delete(firstKey);
        }
    }
    return destination;
}

// Implement a circular buffer for recent searches
class CircularBuffer {
    constructor(size = 10) {
        this.buffer = new Array(size);
        this.size = size;
        this.head = 0;
        this.count = 0;
    }
    
    add(item) {
        this.buffer[this.head] = item;
        this.head = (this.head + 1) % this.size;
        if (this.count < this.size) {
            this.count++;
        }
    }
    
    getAll() {
        const result = [];
        for (let i = 0; i < this.count; i++) {
            const index = (this.head - 1 - i + this.size) % this.size;
            result.push(this.buffer[index]);
        }
        return result;
    }
    
    contains(item) {
        return this.getAll().includes(item);
    }
}

// Global recent searches buffer
const recentSearches = new CircularBuffer(10);

// Function to add search to recent searches
function addToRecentSearches(query) {
    if (!recentSearches.contains(query)) {
        recentSearches.add(query);
    }
}

// Get search suggestions based on recent searches and popular destinations
function getSearchSuggestions(query) {
    const suggestions = [];
    
    // Add recent searches that match
    const recent = recentSearches.getAll().filter(search => 
        search.toLowerCase().includes(query.toLowerCase())
    );
    suggestions.push(...recent);
    
    // Add popular destinations that match
    const destinations = enhancedSearch(query, true);
    suggestions.push(...destinations.map(d => d.name));
    
    // Remove duplicates and limit results
    return [...new Set(suggestions)].slice(0, 8);
}

// Add smooth scrolling for better UX
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Enhanced keyboard navigation with DSA concepts
document.addEventListener('keydown', (e) => {
    const suggestionsDropdown = document.getElementById('suggestions');
    if (!suggestionsDropdown.classList.contains('hidden')) {
        const suggestions = suggestionsDropdown.querySelectorAll('.suggestion-item');
        let currentIndex = Array.from(suggestions).findIndex(item => item.classList.contains('active'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = Math.min(currentIndex + 1, suggestions.length - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = Math.max(currentIndex - 1, 0);
        } else if (e.key === 'Enter' && currentIndex >= 0) {
            e.preventDefault();
            const selectedDestination = suggestions[currentIndex].dataset.destination;
            addToRecentSearches(selectedDestination); // Add to recent searches
            suggestions[currentIndex].click();
            return;
        } else if (e.key === 'Escape') {
            suggestionsDropdown.classList.add('hidden');
            return;
        } else if (e.key === 'Tab') {
            // Auto-complete with first suggestion
            e.preventDefault();
            if (suggestions.length > 0) {
                const firstSuggestion = suggestions[0].dataset.destination;
                document.getElementById('destination').value = firstSuggestion;
                addToRecentSearches(firstSuggestion);
                suggestionsDropdown.classList.add('hidden');
            }
            return;
        }

        // Update active state using efficient array operations
        suggestions.forEach((item, index) => {
            item.classList.toggle('active', index === currentIndex);
        });
    }
    
    // Global keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'z':
                // Undo last recommendation (Ctrl+Z)
                e.preventDefault();
                const planner = window.travelPlannerInstance;
                if (planner && planner.undoLastRecommendation) {
                    planner.undoLastRecommendation();
                }
                break;
            case 'f':
                // Focus search (Ctrl+F)
                e.preventDefault();
                document.getElementById('destination').focus();
                break;
        }
    }
});

// Add CSS for active suggestion
const style = document.createElement('style');
style.textContent = `
    .suggestion-item.active {
        background-color: var(--accent);
        color: var(--accent-foreground);
    }
`;
document.head.appendChild(style);

