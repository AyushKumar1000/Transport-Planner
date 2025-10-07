// Enhanced Travel Planner with Data Structures and Algorithms

// ============= DATA STRUCTURES =============

// 1. TRIE DATA STRUCTURE for efficient string searching
class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.destinationData = null;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    // Insert destination into trie - O(m) where m is length of word
    insert(destination, data) {
        let current = this.root;
        const word = destination.toLowerCase();
        
        for (let char of word) {
            if (!current.children[char]) {
                current.children[char] = new TrieNode();
            }
            current = current.children[char];
        }
        
        current.isEndOfWord = true;
        current.destinationData = data;
    }

    // Search for destinations with prefix - O(p + n) where p is prefix length, n is number of results
    searchWithPrefix(prefix) {
        const results = [];
        let current = this.root;
        const searchPrefix = prefix.toLowerCase();
        
        // Navigate to prefix
        for (let char of searchPrefix) {
            if (!current.children[char]) {
                return results; // No matches found
            }
            current = current.children[char];
        }
        
        // DFS to find all words with this prefix
        this._dfsCollect(current, searchPrefix, results);
        return results;
    }

    _dfsCollect(node, prefix, results) {
        if (node.isEndOfWord) {
            results.push({
                name: prefix,
                data: node.destinationData
            });
        }
        
        for (let char in node.children) {
            this._dfsCollect(node.children[char], prefix + char, results);
        }
    }
}

// 2. PRIORITY QUEUE (Min-Heap) for activity recommendations
class PriorityQueue {
    constructor(compareFn = (a, b) => a.priority - b.priority) {
        this.heap = [];
        this.compare = compareFn;
    }

    // Insert with O(log n) complexity
    enqueue(item) {
        this.heap.push(item);
        this._heapifyUp(this.heap.length - 1);
    }

    // Remove min/max with O(log n) complexity
    dequeue() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();
        
        const root = this.heap[0];
        this.heap[0] = this.heap.pop();
        this._heapifyDown(0);
        return root;
    }

    _heapifyUp(index) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (parentIndex >= 0 && this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            this._heapifyUp(parentIndex);
        }
    }

    _heapifyDown(index) {
        const leftChild = 2 * index + 1;
        const rightChild = 2 * index + 2;
        let smallest = index;

        if (leftChild < this.heap.length && this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
            smallest = leftChild;
        }
        if (rightChild < this.heap.length && this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
            smallest = rightChild;
        }

        if (smallest !== index) {
            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            this._heapifyDown(smallest);
        }
    }

    size() {
        return this.heap.length;
    }
}

// 3. GRAPH DATA STRUCTURE for route optimization
class Graph {
    constructor() {
        this.adjacencyList = new Map();
    }

    addVertex(vertex) {
        if (!this.adjacencyList.has(vertex)) {
            this.adjacencyList.set(vertex, []);
        }
    }

    addEdge(vertex1, vertex2, weight = 1, mode = 'flight') {
        this.addVertex(vertex1);
        this.addVertex(vertex2);
        
        this.adjacencyList.get(vertex1).push({ 
            destination: vertex2, 
            weight, 
            mode,
            cost: this._calculateCost(mode, weight)
        });
        this.adjacencyList.get(vertex2).push({ 
            destination: vertex1, 
            weight, 
            mode,
            cost: this._calculateCost(mode, weight)
        });
    }

    _calculateCost(mode, distance) {
        const costPerKm = {
            'flight': 8,
            'train': 2,
            'bus': 1.5,
            'car': 3
        };
        return (costPerKm[mode] || 5) * distance;
    }

    // Dijkstra's algorithm for shortest path - O((V + E) log V)
    findShortestPath(start, end, preferredMode = null) {
        const distances = new Map();
        const previous = new Map();
        const pq = new PriorityQueue((a, b) => a.distance - b.distance);
        
        // Initialize distances
        for (let vertex of this.adjacencyList.keys()) {
            distances.set(vertex, Infinity);
            previous.set(vertex, null);
        }
        distances.set(start, 0);
        pq.enqueue({ vertex: start, distance: 0 });

        while (pq.size() > 0) {
            const { vertex: currentVertex } = pq.dequeue();
            
            if (currentVertex === end) break;

            for (let neighbor of this.adjacencyList.get(currentVertex) || []) {
                let weight = neighbor.weight;
                
                // Apply preference bonus
                if (preferredMode && neighbor.mode === preferredMode) {
                    weight *= 0.8; // 20% preference bonus
                }
                
                const distance = distances.get(currentVertex) + weight;
                
                if (distance < distances.get(neighbor.destination)) {
                    distances.set(neighbor.destination, distance);
                    previous.set(neighbor.destination, {
                        vertex: currentVertex,
                        mode: neighbor.mode,
                        cost: neighbor.cost
                    });
                    pq.enqueue({ 
                        vertex: neighbor.destination, 
                        distance 
                    });
                }
            }
        }

        return this._reconstructPath(previous, start, end);
    }

    _reconstructPath(previous, start, end) {
        const path = [];
        let current = end;
        let totalCost = 0;

        while (current !== null) {
            const prev = previous.get(current);
            if (prev) {
                path.unshift({
                    from: prev.vertex,
                    to: current,
                    mode: prev.mode,
                    cost: prev.cost
                });
                totalCost += prev.cost;
            }
            current = prev ? prev.vertex : null;
        }

        return { path, totalCost };
    }
}

// 4. HASH MAP for O(1) destination lookup
class DestinationHashMap {
    constructor() {
        this.buckets = new Array(100);
        this.size = 0;
    }

    _hash(key) {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = (hash + key.charCodeAt(i) * i) % this.buckets.length;
        }
        return hash;
    }

    set(key, value) {
        const index = this._hash(key.toLowerCase());
        if (!this.buckets[index]) {
            this.buckets[index] = [];
        }
        
        const bucket = this.buckets[index];
        const existingPair = bucket.find(pair => pair[0] === key.toLowerCase());
        
        if (existingPair) {
            existingPair[1] = value;
        } else {
            bucket.push([key.toLowerCase(), value]);
            this.size++;
        }
    }

    get(key) {
        const index = this._hash(key.toLowerCase());
        const bucket = this.buckets[index];
        
        if (bucket) {
            const pair = bucket.find(pair => pair[0] === key.toLowerCase());
            return pair ? pair[1] : null;
        }
        return null;
    }
}

// ============= ALGORITHMS =============

// 1. MERGE SORT for sorting destinations - O(n log n)
function mergeSort(arr, compareFunction) {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid), compareFunction);
    const right = mergeSort(arr.slice(mid), compareFunction);
    
    return merge(left, right, compareFunction);
}

function merge(left, right, compareFunction) {
    const result = [];
    let leftIndex = 0;
    let rightIndex = 0;
    
    while (leftIndex < left.length && rightIndex < right.length) {
        if (compareFunction(left[leftIndex], right[rightIndex]) <= 0) {
            result.push(left[leftIndex]);
            leftIndex++;
        } else {
            result.push(right[rightIndex]);
            rightIndex++;
        }
    }
    
    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

// 2. BINARY SEARCH for fast lookups - O(log n)
function binarySearch(sortedArray, target, compareFunction) {
    let left = 0;
    let right = sortedArray.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const comparison = compareFunction(sortedArray[mid], target);
        
        if (comparison === 0) return mid;
        if (comparison < 0) left = mid + 1;
        else right = mid - 1;
    }
    
    return -1;
}

// 3. SIMPLE STRING MATCHING for basic fuzzy search
function simpleStringMatch(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Check if one string contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
        return 0; // Perfect match
    }
    
    // Check if they start with same characters
    let commonStart = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
        if (s1[i] === s2[i]) {
            commonStart++;
        } else {
            break;
        }
    }
    
    // Return similarity score (higher = more similar)
    return commonStart;
}

// ============= DESTINATION DATA =============

const destinationsData = [
    // BEACH DESTINATIONS
    {
        name: "Goa",
        state: "Goa",
        type: "Beach",
        duration: "3-5 days",
        bestTime: "November to March",
        accommodation: "Beach Resort Goa - Beachfront property with sea view rooms",
        activities: [
            "Visit Baga Beach and enjoy water sports",
            "Explore Old Goa churches and Portuguese architecture", 
            "Take a sunset cruise on Mandovi River",
            "Visit Anjuna Flea Market for shopping",
            "Try Goan cuisine at local restaurants"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Goa Airport", notes: "Direct flights available, 2.5 hours" },
            { mode: "train", from: "Mumbai", to: "Goa", notes: "Konkan Railway, scenic route, 12 hours" }
        ],
        coordinates: { lat: 15.2993, lng: 74.1240 },
        popularity: 95,
        cost: 15000
    },
    {
        name: "Andaman and Nicobar Islands",
        state: "Andaman and Nicobar Islands",
        type: "Beach",
        duration: "5-7 days",
        bestTime: "October to May",
        accommodation: "Tropical Beach Resort - Overwater bungalows and beachfront villas",
        activities: [
            "Snorkeling and scuba diving at Havelock Island",
            "Visit Cellular Jail National Memorial",
            "Explore Radhanagar Beach",
            "Go island hopping to Neil Island",
            "Experience glass bottom boat rides"
        ],
        transportation: [
            { mode: "flight", from: "Chennai", to: "Port Blair", notes: "2.5 hour flight" },
            { mode: "ship", from: "Chennai", to: "Port Blair", notes: "3-day cruise journey" }
        ],
        coordinates: { lat: 11.7401, lng: 92.6586 },
        popularity: 85,
        cost: 25000
    },
    {
        name: "Puri",
        state: "Odisha",
        type: "Beach",
        duration: "2-3 days",
        bestTime: "October to March",
        accommodation: "Seaside Hotel Puri - Traditional hotel near Jagannath Temple",
        activities: [
            "Visit Jagannath Temple",
            "Relax at Puri Beach",
            "Explore Konark Sun Temple",
            "Attend beach festivals",
            "Try local Odia cuisine"
        ],
        transportation: [
            { mode: "train", from: "Kolkata", to: "Puri", notes: "Jagannath Express, 7 hours" },
            { mode: "car", from: "Bhubaneswar", to: "Puri", notes: "1.5 hour drive" }
        ],
        coordinates: { lat: 19.8135, lng: 85.8312 },
        popularity: 78,
        cost: 8000
    },
    {
        name: "Kovalam",
        state: "Kerala",
        type: "Beach",
        duration: "3-4 days",
        bestTime: "September to March",
        accommodation: "Lighthouse Beach Resort - Ayurvedic spa and beachfront location",
        activities: [
            "Relax at Lighthouse Beach",
            "Experience Ayurvedic treatments",
            "Visit Padmanabhaswamy Temple",
            "Enjoy sunset views from lighthouse",
            "Try traditional Kerala seafood"
        ],
        transportation: [
            { mode: "flight", from: "Mumbai", to: "Trivandrum Airport", notes: "2 hour flight + 30 min drive" },
            { mode: "train", from: "Bangalore", to: "Trivandrum", notes: "15 hours journey" }
        ],
        coordinates: { lat: 8.4004, lng: 76.9784 },
        popularity: 82,
        cost: 12000
    },
    
    // HERITAGE DESTINATIONS
    {
        name: "Jaipur",
        state: "Rajasthan", 
        type: "Heritage",
        duration: "2-4 days",
        bestTime: "October to March",
        accommodation: "Heritage Hotel Jaipur - Traditional Rajasthani palace hotel",
        activities: [
            "Visit Amber Fort and take elephant ride",
            "Explore City Palace and its museums",
            "Shop at Johari Bazaar for jewelry and textiles",
            "Visit Hawa Mahal (Palace of Winds)",
            "Take a hot air balloon ride over the city"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Jaipur Airport", notes: "1 hour flight" },
            { mode: "train", from: "Delhi", to: "Jaipur Junction", notes: "Shatabdi Express, 4.5 hours" },
            { mode: "car", from: "Delhi", to: "Jaipur", notes: "5 hours drive via NH48" }
        ],
        coordinates: { lat: 26.9124, lng: 75.7873 },
        popularity: 90,
        cost: 12000
    },
    {
        name: "Agra",
        state: "Uttar Pradesh",
        type: "Heritage", 
        duration: "1-2 days",
        bestTime: "October to March",
        accommodation: "Taj View Hotel - Hotel with Taj Mahal views",
        activities: [
            "Visit Taj Mahal at sunrise and sunset",
            "Explore Agra Fort",
            "Visit Mehtab Bagh for Taj views",
            "Shop for marble handicrafts",
            "Try Agra's famous petha sweets"
        ],
        transportation: [
            { mode: "train", from: "Delhi", to: "Agra", notes: "Gatimaan Express, 2 hours" },
            { mode: "car", from: "Delhi", to: "Agra", notes: "4 hours via Yamuna Expressway" }
        ],
        coordinates: { lat: 27.1767, lng: 78.0081 },
        popularity: 98,
        cost: 8000
    },
    {
        name: "Udaipur",
        state: "Rajasthan",
        type: "Heritage",
        duration: "3-4 days",
        bestTime: "October to March",
        accommodation: "Lake Palace Hotel - Luxury heritage hotel on Lake Pichola",
        activities: [
            "Take boat ride on Lake Pichola",
            "Visit City Palace complex",
            "Explore Saheliyon Ki Bari gardens", 
            "Watch sunset from Sajjangarh Palace",
            "Shopping at local handicraft markets"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Udaipur Airport", notes: "1.5 hour flight" },
            { mode: "train", from: "Jaipur", to: "Udaipur", notes: "6 hours train journey" }
        ],
        coordinates: { lat: 24.5854, lng: 73.7125 },
        popularity: 87,
        cost: 16000
    },
    {
        name: "Varanasi",
        state: "Uttar Pradesh",
        type: "Spiritual",
        duration: "2-3 days",
        bestTime: "October to March",
        accommodation: "Ganges View Hotel - Traditional hotel overlooking the river",
        activities: [
            "Attend Ganga Aarti at Dashashwamedh Ghat",
            "Take boat ride during sunrise",
            "Visit Kashi Vishwanath Temple",
            "Explore narrow lanes of old city",
            "Experience classical music and dance"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Varanasi Airport", notes: "1.5 hour flight" },
            { mode: "train", from: "Delhi", to: "Varanasi Junction", notes: "12 hours overnight journey" }
        ],
        coordinates: { lat: 25.3176, lng: 82.9739 },
        popularity: 88,
        cost: 9000
    },
    {
        name: "Hampi",
        state: "Karnataka",
        type: "Heritage",
        duration: "2-3 days",
        bestTime: "October to March",
        accommodation: "Heritage Resort Hampi - Eco-friendly resort near ruins",
        activities: [
            "Explore Vijayanagara Empire ruins",
            "Visit Virupaksha Temple",
            "Climb Matanga Hill for sunrise",
            "Take coracle ride on Tungabhadra River",
            "Explore Stone Chariot at Vittala Temple"
        ],
        transportation: [
            { mode: "train", from: "Bangalore", to: "Hospet Junction", notes: "10 hours + 30 min drive" },
            { mode: "car", from: "Bangalore", to: "Hampi", notes: "6 hours drive" }
        ],
        coordinates: { lat: 15.3350, lng: 76.4600 },
        popularity: 83,
        cost: 11000
    },
    {
        name: "Khajuraho",
        state: "Madhya Pradesh",
        type: "Heritage",
        duration: "1-2 days",
        bestTime: "October to March",
        accommodation: "Temple View Hotel - Heritage property near temple complex",
        activities: [
            "Explore Western Group of Temples",
            "Visit Kandariya Mahadeva Temple",
            "Attend light and sound show",
            "Explore Eastern and Southern temple groups",
            "Visit Khajuraho Archaeological Museum"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Khajuraho Airport", notes: "1.5 hour flight" },
            { mode: "train", from: "Delhi", to: "Khajuraho", notes: "12 hours via Jhansi" }
        ],
        coordinates: { lat: 24.8318, lng: 79.9199 },
        popularity: 75,
        cost: 9500
    },
    {
        name: "Ajanta and Ellora Caves",
        state: "Maharashtra",
        type: "Heritage",
        duration: "2-3 days",
        bestTime: "November to March",
        accommodation: "Cave View Resort - Modern hotel near archaeological sites",
        activities: [
            "Explore ancient Buddhist caves at Ajanta",
            "Visit Hindu and Jain caves at Ellora",
            "See the magnificent Kailasa Temple",
            "Study ancient Indian art and sculpture",
            "Photography of rock-cut architecture"
        ],
        transportation: [
            { mode: "flight", from: "Mumbai", to: "Aurangabad Airport", notes: "1 hour flight + drive" },
            { mode: "train", from: "Mumbai", to: "Aurangabad", notes: "7 hours journey" }
        ],
        coordinates: { lat: 20.5522, lng: 75.7004 },
        popularity: 79,
        cost: 10000
    },
    
    // NATURE & BACKWATER DESTINATIONS
    {
        name: "Kerala Backwaters",
        state: "Kerala",
        type: "Nature",
        duration: "5-7 days", 
        bestTime: "September to March",
        accommodation: "Backwater Resort Kerala - Houseboat and lakeside cottages",
        activities: [
            "Cruise through Alleppey backwaters on houseboat",
            "Visit tea plantations in Munnar",
            "Experience Ayurvedic spa treatments",
            "Watch Kathakali dance performance",
            "Explore Periyar Wildlife Sanctuary"
        ],
        transportation: [
            { mode: "flight", from: "Mumbai", to: "Kochi Airport", notes: "2 hour flight" },
            { mode: "train", from: "Bangalore", to: "Ernakulam", notes: "Island Express, 11 hours" }
        ],
        coordinates: { lat: 10.8505, lng: 76.2711 },
        popularity: 88,
        cost: 18000
    },
    {
        name: "Jim Corbett National Park",
        state: "Uttarakhand",
        type: "Nature",
        duration: "2-3 days",
        bestTime: "November to June",
        accommodation: "Jungle Lodge Corbett - Wildlife resort with safari facilities",
        activities: [
            "Tiger safari in jeep and elephant",
            "Bird watching at Dhikala zone",
            "River rafting in Kosi River",
            "Nature walks and trekking",
            "Visit Corbett Museum"
        ],
        transportation: [
            { mode: "train", from: "Delhi", to: "Ramnagar", notes: "5 hours + park entry" },
            { mode: "car", from: "Delhi", to: "Corbett", notes: "6 hours drive" }
        ],
        coordinates: { lat: 29.5316, lng: 78.8125 },
        popularity: 84,
        cost: 13000
    },
    {
        name: "Ranthambore National Park",
        state: "Rajasthan",
        type: "Nature",
        duration: "2-3 days",
        bestTime: "October to April",
        accommodation: "Tiger Resort Ranthambore - Luxury wildlife resort",
        activities: [
            "Tiger spotting safari",
            "Visit Ranthambore Fort",
            "Bird watching",
            "Photography tours",
            "Village visits"
        ],
        transportation: [
            { mode: "train", from: "Delhi", to: "Sawai Madhopur", notes: "5 hours + park transfer" },
            { mode: "car", from: "Jaipur", to: "Ranthambore", notes: "3 hours drive" }
        ],
        coordinates: { lat: 26.0173, lng: 76.5026 },
        popularity: 81,
        cost: 15000
    },
    {
        name: "Valley of Flowers",
        state: "Uttarakhand",
        type: "Nature",
        duration: "4-5 days",
        bestTime: "July to September",
        accommodation: "Mountain Base Camp - Trekking lodge and camping",
        activities: [
            "Trek through flower meadows",
            "Photography of rare Himalayan flowers",
            "Visit Hemkund Sahib",
            "Camping under stars",
            "Guided nature walks"
        ],
        transportation: [
            { mode: "train", from: "Delhi", to: "Haridwar", notes: "5 hours + drive to Govindghat" },
            { mode: "car", from: "Dehradun", to: "Govindghat", notes: "10 hours mountain drive" }
        ],
        coordinates: { lat: 30.7268, lng: 79.6056 },
        popularity: 76,
        cost: 12000
    },

    // HILL STATIONS
    {
        name: "Manali",
        state: "Himachal Pradesh",
        type: "Hill Station",
        duration: "4-6 days",
        bestTime: "March to June, September to December", 
        accommodation: "Mountain Resort Manali - Valley view rooms with mountain activities",
        activities: [
            "Visit Rohtang Pass for snow activities",
            "Explore Solang Valley for paragliding",
            "Trek to Jogini Falls",
            "Visit Hadimba Temple",
            "Experience river rafting in Beas River"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Kullu Airport", notes: "1.5 hour flight + 1 hour drive" },
            { mode: "bus", from: "Delhi", to: "Manali", notes: "Volvo bus, 12-14 hours overnight journey" },
            { mode: "car", from: "Chandigarh", to: "Manali", notes: "8 hours scenic drive" }
        ],
        coordinates: { lat: 32.2396, lng: 77.1887 },
        popularity: 85,
        cost: 14000
    },
    {
        name: "Shimla",
        state: "Himachal Pradesh",
        type: "Hill Station",
        duration: "3-4 days", 
        bestTime: "March to June, September to December",
        accommodation: "Colonial Heritage Hotel - British-era architecture with modern amenities",
        activities: [
            "Walk on Mall Road and Ridge",
            "Take toy train ride to Kalka",
            "Visit Jakhu Temple",
            "Explore Kufri for skiing (winter)",
            "Visit Christ Church and Scandal Point"
        ],
        transportation: [
            { mode: "train", from: "Delhi", to: "Kalka", notes: "Shatabdi + Toy train to Shimla, 8 hours total" },
            { mode: "car", from: "Chandigarh", to: "Shimla", notes: "4 hours scenic mountain drive" }
        ],
        coordinates: { lat: 31.1048, lng: 77.1734 },
        popularity: 80,
        cost: 12000
    },
    {
        name: "Darjeeling",
        state: "West Bengal",
        type: "Hill Station",
        duration: "3-4 days",
        bestTime: "March to May, September to November",
        accommodation: "Tea Garden Resort - Colonial-style hotel with mountain views",
        activities: [
            "Ride the Darjeeling Himalayan Railway",
            "Watch sunrise from Tiger Hill",
            "Visit tea plantations and factories",
            "Explore Darjeeling Zoo",
            "Trek to nearby monasteries"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Bagdogra Airport", notes: "2 hours + 3 hours drive" },
            { mode: "train", from: "Kolkata", to: "New Jalpaiguri", notes: "12 hours + toy train" }
        ],
        coordinates: { lat: 27.0360, lng: 88.2627 },
        popularity: 82,
        cost: 11000
    },
    {
        name: "Ooty",
        state: "Tamil Nadu",
        type: "Hill Station",
        duration: "3-4 days",
        bestTime: "March to June, September to November",
        accommodation: "Hill Station Resort Ooty - Heritage property with garden views",
        activities: [
            "Ride the Nilgiri Mountain Railway",
            "Visit Ooty Lake for boating",
            "Explore Botanical Gardens",
            "Visit tea museums and plantations",
            "Trek in Nilgiri Hills"
        ],
        transportation: [
            { mode: "train", from: "Chennai", to: "Mettupalayam", notes: "7 hours + toy train to Ooty" },
            { mode: "car", from: "Bangalore", to: "Ooty", notes: "5 hours scenic drive" }
        ],
        coordinates: { lat: 11.4064, lng: 76.6932 },
        popularity: 79,
        cost: 10000
    },
    {
        name: "Munnar",
        state: "Kerala",
        type: "Hill Station",
        duration: "3-4 days",
        bestTime: "September to March",
        accommodation: "Tea Plantation Resort - Luxury resort amidst tea gardens",
        activities: [
            "Visit tea plantations and factories",
            "Trek to Anamudi Peak",
            "Explore Eravikulam National Park",
            "Visit spice gardens",
            "Boating in Kundala Lake"
        ],
        transportation: [
            { mode: "flight", from: "Mumbai", to: "Kochi Airport", notes: "2 hours + 4 hours drive" },
            { mode: "car", from: "Kochi", to: "Munnar", notes: "4 hours scenic mountain drive" }
        ],
        coordinates: { lat: 10.0889, lng: 77.0595 },
        popularity: 84,
        cost: 13000
    },
    {
        name: "Nainital",
        state: "Uttarakhand",
        type: "Hill Station",
        duration: "2-3 days",
        bestTime: "March to June, September to November",
        accommodation: "Lake View Hotel - Traditional hill station hotel",
        activities: [
            "Boating in Naini Lake",
            "Cable car ride to Snow View Point",
            "Visit Naina Devi Temple",
            "Explore Mall Road",
            "Trek to nearby peaks"
        ],
        transportation: [
            { mode: "train", from: "Delhi", to: "Kathgodam", notes: "6 hours + 1 hour drive" },
            { mode: "car", from: "Delhi", to: "Nainital", notes: "7 hours drive" }
        ],
        coordinates: { lat: 29.3803, lng: 79.4636 },
        popularity: 77,
        cost: 9000
    },
    
    // METROPOLITAN CITIES
    {
        name: "Mumbai",
        state: "Maharashtra",
        type: "Metropolitan",
        duration: "3-5 days",
        bestTime: "November to February",
        accommodation: "Business Hotel Mumbai - Modern hotel in business district",
        activities: [
            "Visit Gateway of India and Marine Drive",
            "Explore Bollywood studios",
            "Shop at Colaba Causeway",
            "Visit Elephanta Caves",
            "Experience Mumbai street food"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Mumbai Airport", notes: "2 hour flight" },
            { mode: "train", from: "Delhi", to: "Mumbai Central", notes: "Rajdhani Express, 16 hours" }
        ],
        coordinates: { lat: 19.0760, lng: 72.8777 },
        popularity: 92,
        cost: 18000
    },
    {
        name: "Delhi",
        state: "Delhi",
        type: "Metropolitan",
        duration: "3-4 days",
        bestTime: "October to March",
        accommodation: "Heritage Hotel Delhi - Central location near monuments",
        activities: [
            "Visit Red Fort and India Gate",
            "Explore Chandni Chowk markets",
            "Tour government buildings in Lutyens Delhi",
            "Visit Lotus Temple and Akshardham",
            "Experience diverse cuisine"
        ],
        transportation: [
            { mode: "flight", from: "Mumbai", to: "Delhi Airport", notes: "2 hour flight" },
            { mode: "train", from: "Kolkata", to: "New Delhi", notes: "Rajdhani Express, 17 hours" }
        ],
        coordinates: { lat: 28.7041, lng: 77.1025 },
        popularity: 94,
        cost: 16000
    },
    {
        name: "Bangalore",
        state: "Karnataka",
        type: "Metropolitan",
        duration: "2-3 days",
        bestTime: "September to February",
        accommodation: "Tech City Hotel - Modern accommodation in IT hub",
        activities: [
            "Explore Lalbagh Botanical Garden",
            "Visit Bangalore Palace",
            "Experience pub culture on Brigade Road",
            "Shop at Commercial Street",
            "Day trip to Nandi Hills"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Bangalore Airport", notes: "2.5 hour flight" },
            { mode: "train", from: "Chennai", to: "Bangalore", notes: "5 hours journey" }
        ],
        coordinates: { lat: 12.9716, lng: 77.5946 },
        popularity: 87,
        cost: 14000
    },
    {
        name: "Chennai",
        state: "Tamil Nadu",
        type: "Metropolitan",
        duration: "2-3 days",
        bestTime: "November to February",
        accommodation: "Marina Beach Hotel - Coastal city accommodation",
        activities: [
            "Visit Marina Beach",
            "Explore Kapaleeshwarar Temple",
            "Tour Fort St. George",
            "Experience classical music and dance",
            "Visit Government Museum"
        ],
        transportation: [
            { mode: "flight", from: "Mumbai", to: "Chennai Airport", notes: "2 hour flight" },
            { mode: "train", from: "Delhi", to: "Chennai Central", notes: "Tamil Nadu Express, 28 hours" }
        ],
        coordinates: { lat: 13.0827, lng: 80.2707 },
        popularity: 83,
        cost: 13000
    },
    {
        name: "Kolkata",
        state: "West Bengal",
        type: "Metropolitan",
        duration: "3-4 days",
        bestTime: "October to March",
        accommodation: "Cultural Heritage Hotel - Traditional Bengali hospitality",
        activities: [
            "Visit Victoria Memorial and Howrah Bridge",
            "Explore Park Street and New Market",
            "Experience Durga Puja celebrations",
            "Visit Kalighat Temple",
            "Enjoy Bengali cuisine and sweets"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Kolkata Airport", notes: "2.5 hour flight" },
            { mode: "train", from: "Mumbai", to: "Kolkata", notes: "Gitanjali Express, 33 hours" }
        ],
        coordinates: { lat: 22.5726, lng: 88.3639 },
        popularity: 85,
        cost: 12000
    },

    // SPIRITUAL DESTINATIONS
    {
        name: "Rishikesh",
        state: "Uttarakhand", 
        type: "Spiritual",
        duration: "3-5 days",
        bestTime: "February to May, September to November",
        accommodation: "Riverside Ashram - Spiritual retreat with yoga sessions",
        activities: [
            "Attend Ganga Aarti at Triveni Ghat",
            "Experience white water rafting",
            "Take yoga and meditation classes",
            "Visit Beatles Ashram",
            "Bungee jumping and zip-lining"
        ],
        transportation: [
            { mode: "train", from: "Delhi", to: "Haridwar", notes: "Shatabdi Express 4.5 hours + 1 hour taxi" },
            { mode: "car", from: "Delhi", to: "Rishikesh", notes: "6 hours drive via NH334" }
        ],
        coordinates: { lat: 30.0869, lng: 78.2676 },
        popularity: 82,
        cost: 10000
    },
    {
        name: "Haridwar",
        state: "Uttarakhand",
        type: "Spiritual",
        duration: "1-2 days",
        bestTime: "September to April",
        accommodation: "Ganga View Ashram - Traditional accommodation near ghats",
        activities: [
            "Attend Ganga Aarti at Har Ki Pauri",
            "Take holy dip in Ganges",
            "Visit Mansa Devi Temple",
            "Explore local markets",
            "Experience spiritual discourses"
        ],
        transportation: [
            { mode: "train", from: "Delhi", to: "Haridwar", notes: "Shatabdi Express, 4.5 hours" },
            { mode: "car", from: "Delhi", to: "Haridwar", notes: "5 hours drive" }
        ],
        coordinates: { lat: 29.9457, lng: 78.1642 },
        popularity: 86,
        cost: 6000
    },
    {
        name: "Bodh Gaya",
        state: "Bihar",
        type: "Spiritual",
        duration: "2-3 days",
        bestTime: "October to March",
        accommodation: "Buddhist Monastery Guest House - Simple, peaceful accommodation",
        activities: [
            "Visit Mahabodhi Temple",
            "Meditate under Bodhi Tree",
            "Explore international monasteries",
            "Attend Buddhist ceremonies",
            "Visit Bodh Gaya Archaeological Museum"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Gaya Airport", notes: "1.5 hours + 30 min drive" },
            { mode: "train", from: "Kolkata", to: "Gaya Junction", notes: "8 hours + drive" }
        ],
        coordinates: { lat: 24.6986, lng: 84.9917 },
        popularity: 74,
        cost: 7000
    },
    {
        name: "Pushkar",
        state: "Rajasthan",
        type: "Spiritual",
        duration: "2-3 days",
        bestTime: "October to March",
        accommodation: "Desert Camp Pushkar - Traditional Rajasthani accommodation",
        activities: [
            "Visit Brahma Temple",
            "Take holy dip in Pushkar Lake",
            "Explore vibrant local markets",
            "Attend camel fair (November)",
            "Experience desert camping"
        ],
        transportation: [
            { mode: "car", from: "Jaipur", to: "Pushkar", notes: "3 hours drive" },
            { mode: "bus", from: "Delhi", to: "Pushkar", notes: "8 hours overnight journey" }
        ],
        coordinates: { lat: 26.4899, lng: 74.5511 },
        popularity: 78,
        cost: 8500
    },
    {
        name: "Tirupati",
        state: "Andhra Pradesh",
        type: "Spiritual",
        duration: "1-2 days",
        bestTime: "September to March",
        accommodation: "Pilgrim Rest House - Simple accommodation near temple",
        activities: [
            "Visit Tirumala Venkateswara Temple",
            "Take darshan of Lord Balaji",
            "Explore temple architecture",
            "Visit local religious sites",
            "Shop for religious souvenirs"
        ],
        transportation: [
            { mode: "train", from: "Chennai", to: "Tirupati", notes: "3 hours journey" },
            { mode: "car", from: "Bangalore", to: "Tirupati", notes: "4 hours drive" }
        ],
        coordinates: { lat: 13.6288, lng: 79.4192 },
        popularity: 89,
        cost: 7500
    },

    // ADVENTURE DESTINATIONS  
    {
        name: "Leh Ladakh",
        state: "Ladakh",
        type: "Adventure",
        duration: "7-10 days",
        bestTime: "May to September",
        accommodation: "Mountain Guest House - High-altitude accommodation with oxygen support",
        activities: [
            "Bike ride on highest motorable roads",
            "Visit Pangong Tso and Tso Moriri lakes",
            "Explore Buddhist monasteries",
            "River rafting in Zanskar River",
            "Trekking in Markha Valley"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Leh Airport", notes: "1.5 hours (subject to weather)" },
            { mode: "car", from: "Manali", to: "Leh", notes: "2-day drive via Rohtang Pass" }
        ],
        coordinates: { lat: 34.1526, lng: 77.5771 },
        popularity: 91,
        cost: 25000
    },
    {
        name: "Spiti Valley",
        state: "Himachal Pradesh",
        type: "Adventure",
        duration: "6-8 days",
        bestTime: "May to October",
        accommodation: "High Altitude Camp - Camping and homestays",
        activities: [
            "Visit ancient monasteries like Ki and Tashigang",
            "Trek to Chandratal Lake",
            "Experience homestays in local villages",
            "Photography of stark landscapes",
            "Visit highest post office at Hikkim"
        ],
        transportation: [
            { mode: "car", from: "Manali", to: "Spiti", notes: "8-10 hours mountain drive" },
            { mode: "bus", from: "Shimla", to: "Kaza", notes: "12 hours via Kinnaur" }
        ],
        coordinates: { lat: 32.2432, lng: 78.0339 },
        popularity: 79,
        cost: 18000
    },
    {
        name: "Gokarna",
        state: "Karnataka",
        type: "Adventure",
        duration: "3-4 days",
        bestTime: "October to March",
        accommodation: "Beach Shacks - Rustic beachfront accommodation",
        activities: [
            "Beach trekking from Om Beach to Half Moon Beach",
            "Rock climbing and rappelling",
            "Water sports and surfing",
            "Visit Mahabaleshwar Temple",
            "Sunset watching from clifftops"
        ],
        transportation: [
            { mode: "train", from: "Bangalore", to: "Gokarna Road", notes: "10 hours + bus to beach" },
            { mode: "car", from: "Goa", to: "Gokarna", notes: "4 hours coastal drive" }
        ],
        coordinates: { lat: 14.5492, lng: 74.3200 },
        popularity: 76,
        cost: 11000
    },
    
    // JAMMU & KASHMIR DESTINATIONS
    {
        name: "Srinagar",
        state: "Jammu & Kashmir",
        type: "Nature",
        duration: "3-5 days",
        bestTime: "April to October",
        accommodation: "Deluxe Houseboat on Dal Lake or Boulevard hotels",
        activities: [
            "Shikara ride on Dal Lake",
            "Stay on a traditional houseboat",
            "Visit Mughal Gardens (Shalimar, Nishat, Chashme Shahi)",
            "Explore old Srinagar and Hazratbal Shrine",
            "Shopping for Pashmina and dry fruits"
        ],
        transportation: [
            { mode: "flight", from: "Delhi", to: "Srinagar Airport", notes: "1.5 hour flight" },
            { mode: "car", from: "Jammu", to: "Srinagar", notes: "8-9 hours via NH44 (seasonal)" }
        ],
        coordinates: { lat: 34.0837, lng: 74.7973 },
        popularity: 89,
        cost: 17000
    },
    {
        name: "Gulmarg",
        state: "Jammu & Kashmir",
        type: "Adventure",
        duration: "2-3 days",
        bestTime: "December to March (snow), April to June (meadows)",
        accommodation: "Ski resorts and hill hotels",
        activities: [
            "Ride the Gulmarg Gondola (Phase 1 & 2)",
            "Skiing and snowboarding (winter)",
            "Meadow walks and pony rides (summer)",
            "Golf at Gulmarg Golf Course",
            "Visit Apharwat Peak"
        ],
        transportation: [
            { mode: "car", from: "Srinagar", to: "Gulmarg", notes: "1.5-2 hours hill drive" }
        ],
        coordinates: { lat: 34.0484, lng: 74.3805 },
        popularity: 86,
        cost: 15000
    },
    {
        name: "Pahalgam",
        state: "Jammu & Kashmir",
        type: "Nature",
        duration: "2-3 days",
        bestTime: "April to October",
        accommodation: "Riverside resorts and cottages",
        activities: [
            "Visit Betaab Valley and Aru Valley",
            "Lidder River walks",
            "Chandanwari (Amarnath route)",
            "Local treks and pony rides",
            "Trout fishing (seasonal)"
        ],
        transportation: [
            { mode: "car", from: "Srinagar", to: "Pahalgam", notes: "2-3 hours scenic drive" }
        ],
        coordinates: { lat: 34.0150, lng: 75.3150 },
        popularity: 84,
        cost: 14000
    }
];

// Add more Indian cities (lightweight entries to improve search/suggestions)
const additionalCities = [
    { name: "Ahmedabad", state: "Gujarat", type: "Metropolitan", duration: "2-3 days", bestTime: "Nov to Feb", accommodation: "City Hotel", activities: ["Sabarmati Ashram", "Kankaria Lake"], transportation: [], coordinates: { lat: 23.0225, lng: 72.5714 }, popularity: 82, cost: 12000 },
    { name: "Pune", state: "Maharashtra", type: "Metropolitan", duration: "2-3 days", bestTime: "Oct to Feb", accommodation: "Business Hotel", activities: ["Shaniwar Wada", "Aga Khan Palace"], transportation: [], coordinates: { lat: 18.5204, lng: 73.8567 }, popularity: 85, cost: 13000 },
    { name: "Hyderabad", state: "Telangana", type: "Metropolitan", duration: "2-3 days", bestTime: "Oct to Feb", accommodation: "City Hotel", activities: ["Charminar", "Golconda Fort"], transportation: [], coordinates: { lat: 17.3850, lng: 78.4867 }, popularity: 90, cost: 14000 },
    { name: "Surat", state: "Gujarat", type: "Metropolitan", duration: "1-2 days", bestTime: "Nov to Feb", accommodation: "City Hotel", activities: ["Dumas Beach"], transportation: [], coordinates: { lat: 21.1702, lng: 72.8311 }, popularity: 70, cost: 9000 },
    { name: "Lucknow", state: "Uttar Pradesh", type: "Metropolitan", duration: "2-3 days", bestTime: "Oct to Mar", accommodation: "City Hotel", activities: ["Bara Imambara", "Hazratganj"], transportation: [], coordinates: { lat: 26.8467, lng: 80.9462 }, popularity: 80, cost: 12000 },
    { name: "Kanpur", state: "Uttar Pradesh", type: "Metropolitan", duration: "1-2 days", bestTime: "Oct to Mar", accommodation: "City Hotel", activities: ["Bithoor"], transportation: [], coordinates: { lat: 26.4499, lng: 80.3319 }, popularity: 68, cost: 9000 },
    { name: "Chandigarh", state: "Chandigarh", type: "Metropolitan", duration: "1-2 days", bestTime: "Oct to Mar", accommodation: "City Hotel", activities: ["Rock Garden", "Sukhna Lake"], transportation: [], coordinates: { lat: 30.7333, lng: 76.7794 }, popularity: 78, cost: 11000 },
    { name: "Bhopal", state: "Madhya Pradesh", type: "Metropolitan", duration: "1-2 days", bestTime: "Oct to Mar", accommodation: "City Hotel", activities: ["Upper Lake", "Sanchi (nearby)"], transportation: [], coordinates: { lat: 23.2599, lng: 77.4126 }, popularity: 74, cost: 10000 },
    { name: "Indore", state: "Madhya Pradesh", type: "Metropolitan", duration: "1-2 days", bestTime: "Oct to Mar", accommodation: "City Hotel", activities: ["Rajwada", "Sarafa Night Market"], transportation: [], coordinates: { lat: 22.7196, lng: 75.8577 }, popularity: 79, cost: 11000 },
    { name: "Patna", state: "Bihar", type: "Metropolitan", duration: "1-2 days", bestTime: "Nov to Feb", accommodation: "City Hotel", activities: ["Golghar", "Gandhi Maidan"], transportation: [], coordinates: { lat: 25.5941, lng: 85.1376 }, popularity: 66, cost: 9000 },
    { name: "Vadodara", state: "Gujarat", type: "Metropolitan", duration: "1-2 days", bestTime: "Nov to Feb", accommodation: "City Hotel", activities: ["Laxmi Vilas Palace"], transportation: [], coordinates: { lat: 22.3072, lng: 73.1812 }, popularity: 72, cost: 9500 },
    { name: "Coimbatore", state: "Tamil Nadu", type: "Metropolitan", duration: "1-2 days", bestTime: "Nov to Feb", accommodation: "City Hotel", activities: ["Marudamalai", "Isha Yoga Center"], transportation: [], coordinates: { lat: 11.0168, lng: 76.9558 }, popularity: 73, cost: 10000 },
    { name: "Nagpur", state: "Maharashtra", type: "Metropolitan", duration: "1-2 days", bestTime: "Nov to Feb", accommodation: "City Hotel", activities: ["Deekshabhoomi"], transportation: [], coordinates: { lat: 21.1458, lng: 79.0882 }, popularity: 71, cost: 9500 },
    { name: "Visakhapatnam", state: "Andhra Pradesh", type: "Metropolitan", duration: "2-3 days", bestTime: "Nov to Feb", accommodation: "Beach Hotel", activities: ["RK Beach", "Kailasagiri"], transportation: [], coordinates: { lat: 17.6868, lng: 83.2185 }, popularity: 80, cost: 12000 }
];

destinationsData.push(...additionalCities);

// ============= INITIALIZATION =============

// Initialize data structures
const destinationTrie = new Trie();
const destinationHashMap = new DestinationHashMap();
const routeGraph = new Graph();
const activityPriorityQueue = new PriorityQueue((a, b) => b.priority - a.priority);

// Populate data structures
function initializeDataStructures() {
    destinationsData.forEach(destination => {
        // Add to Trie for prefix search
        destinationTrie.insert(destination.name, destination);
        
        // Add to HashMap for O(1) lookup
        destinationHashMap.set(destination.name, destination);
        
        // Add to graph for route optimization
        routeGraph.addVertex(destination.name);
        
        // Add activities to priority queue based on popularity
        destination.activities.forEach((activity, index) => {
            activityPriorityQueue.enqueue({
                activity,
                destination: destination.name,
                priority: destination.popularity + (destination.activities.length - index) * 2
            });
        });
    });

    // Create connections between destinations for route planning
    const destinations = destinationsData.map(d => d.name);
    for (let i = 0; i < destinations.length; i++) {
        for (let j = i + 1; j < destinations.length; j++) {
            const dist1 = destinationsData[i];
            const dist2 = destinationsData[j];
            
            // Calculate approximate distance using coordinates
            const distance = calculateDistance(
                dist1.coordinates.lat, dist1.coordinates.lng,
                dist2.coordinates.lat, dist2.coordinates.lng
            );
            
            // Add edges for different transportation modes
            routeGraph.addEdge(destinations[i], destinations[j], distance, 'flight');
            routeGraph.addEdge(destinations[i], destinations[j], distance * 1.5, 'train');
            routeGraph.addEdge(destinations[i], destinations[j], distance * 2, 'car');
        }
    }
}

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ============= PUBLIC API FUNCTIONS =============

// Enhanced search with multiple algorithms
function searchDestinations(query, limit = 10) {
    if (!query || query.length < 1) return [];
    
    const results = new Set();
    
    // 1. Exact match using HashMap - O(1)
    const exactMatch = destinationHashMap.get(query);
    if (exactMatch) {
        results.add(exactMatch);
    }
    
    // 2. Prefix search using Trie - O(p + n)
    const prefixMatches = destinationTrie.searchWithPrefix(query);
    prefixMatches.forEach(match => results.add(match.data));
    
    // 3. Fuzzy search using simple string matching
    const fuzzyMatches = destinationsData.filter(dest => {
        const similarity = simpleStringMatch(query.toLowerCase(), dest.name.toLowerCase());
        return similarity >= 2; // At least 2 characters match from start
    });
    fuzzyMatches.forEach(match => results.add(match));
    
    // Convert Set to Array and sort by popularity
    const finalResults = Array.from(results);
    return mergeSort(finalResults, (a, b) => b.popularity - a.popularity).slice(0, limit);
}

// Get popular destinations by popularity score
function getPopularDestinations(limit = 8) {
    const sorted = mergeSort([...destinationsData], (a, b) => b.popularity - a.popularity);
    return sorted.slice(0, limit).map(d => d.name);
}

// Get all destination names for autocomplete
function getAllDestinationNames() {
    return destinationsData.map(dest => dest.name);
}

// Search specific destination - O(1) with HashMap
function searchDestination(name) {
    return destinationHashMap.get(name);
}

// Get optimized route between destinations
function getOptimizedRoute(start, end, preferredMode = null) {
    return routeGraph.findShortestPath(start, end, preferredMode);
}

// Get top activities using priority queue
function getTopActivities(count = 5) {
    const activities = [];
    const tempQueue = new PriorityQueue((a, b) => b.priority - a.priority);
    
    // Copy activities to temp queue
    while (activityPriorityQueue.size() > 0) {
        const activity = activityPriorityQueue.dequeue();
        activities.push(activity);
        tempQueue.enqueue(activity);
    }
    
    // Restore original queue
    while (tempQueue.size() > 0) {
        activityPriorityQueue.enqueue(tempQueue.dequeue());
    }
    
    return activities.slice(0, count);
}

// Advanced filtering with multiple criteria
function filterDestinations(criteria) {
    let filtered = [...destinationsData];
    
    if (criteria.type) {
        filtered = filtered.filter(dest => dest.type.toLowerCase() === criteria.type.toLowerCase());
    }
    
    if (criteria.state) {
        filtered = filtered.filter(dest => dest.state.toLowerCase() === criteria.state.toLowerCase());
    }
    
    if (criteria.maxCost) {
        filtered = filtered.filter(dest => dest.cost <= criteria.maxCost);
    }
    
    if (criteria.minPopularity) {
        filtered = filtered.filter(dest => dest.popularity >= criteria.minPopularity);
    }
    
    // Sort results based on criteria
    if (criteria.sortBy) {
        const compareFunction = (a, b) => {
            switch (criteria.sortBy) {
                case 'popularity': return b.popularity - a.popularity;
                case 'cost': return a.cost - b.cost;
                case 'name': return a.name.localeCompare(b.name);
                default: return 0;
            }
        };
        filtered = mergeSort(filtered, compareFunction);
    }
    
    return filtered;
}

// Initialize everything when the script loads
initializeDataStructures();

// Export functions for use in main script
window.searchDestinations = searchDestinations;
window.getPopularDestinations = getPopularDestinations;
window.getAllDestinationNames = getAllDestinationNames;
window.searchDestination = searchDestination;
window.getOptimizedRoute = getOptimizedRoute;
window.getTopActivities = getTopActivities;
window.filterDestinations = filterDestinations;
