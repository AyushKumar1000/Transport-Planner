# Multi-Model Travel Planner

A beautiful, responsive travel planning application for India destinations, converted from Next.js to vanilla HTML, CSS, and JavaScript.

## Features

- **Auto-Generated Trip Plans**: Enter any Indian destination and get instant trip suggestions with transportation and activities
- **Complete Itinerary Management**: Track accommodations, activities, and important notes for your entire trip
- **Multi-Modal Transportation**: Plan flights, trains, cars, and bus journeys with detailed segments
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Automatically adapts to system preferences
- **Keyboard Navigation**: Full keyboard support for accessibility

## Getting Started

### Option 1: Open Directly in Browser
Simply open `index.html` in your web browser to start using the application.

### Option 2: Local Server (Recommended)
For the best experience, serve the files through a local HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## File Structure

```
multi-model-travel-planner/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── script.js           # Main JavaScript functionality
├── destinations.js     # India destinations data
└── README.md          # This file
```

## How to Use

1. **Enter Destination**: Start typing an Indian destination in the search box
2. **Auto-Complete**: Select from the dropdown suggestions to auto-populate trip details
3. **Customize Dates**: Set your travel start and end dates
4. **Plan Transportation**: Add multiple transportation segments (flights, trains, cars, buses)
5. **Add Activities**: List your planned activities and notes
6. **Review Summary**: Check the automatically generated trip summary

## Supported Destinations

The application includes detailed information for popular Indian destinations:

- **Goa** - Beach paradise with Portuguese heritage
- **Jaipur** - The Pink City with royal palaces and forts
- **Kerala** - God's Own Country with serene backwaters
- **Varanasi** - Ancient spiritual city on the Ganges
- **Manali** - Himalayan hill station and adventure hub
- **Udaipur** - City of Lakes with romantic palaces
- **Rishikesh** - Yoga capital and adventure sports destination
- **Agra** - Home to the iconic Taj Mahal
- **Mumbai** - The City of Dreams and financial capital
- **Ladakh** - Land of high passes with stunning landscapes

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - No frameworks or libraries
- **CSS Custom Properties** - For theming and dark mode
- **SVG Icons** - Scalable vector graphics for icons

## Features in Detail

### Auto-Generated Plans
When you select a destination, the app automatically fills in:
- Recommended accommodation options
- Popular activities and attractions
- Transportation options with routes and notes
- Suggested trip duration and dates

### Transportation Planning
- Add multiple transportation segments
- Support for flights, trains, cars, and buses
- Track departure/arrival locations, dates, and times
- Add notes for booking references and details

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interface
- Optimized for all screen sizes

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios
- Focus indicators

## Customization

### Adding New Destinations
Edit `destinations.js` to add new destinations:

```javascript
newDestination: {
    name: "Destination Name",
    state: "State Name",
    description: "Brief description",
    bestTimeToVisit: "Best months",
    duration: "X-Y days",
    transportation: [
        {
            mode: "flight", // or "train", "car", "bus"
            from: "Origin",
            to: "Destination",
            notes: "Additional details"
        }
    ],
    accommodation: "Recommended hotels/areas",
    activities: [
        "Activity 1",
        "Activity 2"
    ]
}
```

### Styling
Modify CSS custom properties in `styles.css` to change colors and themes:

```css
:root {
    --primary: #6366f1;
    --background: #fefefe;
    --foreground: #0a0a0a;
    /* ... other variables */
}
```

## Performance

- **Lightweight**: No external dependencies
- **Fast Loading**: Optimized CSS and JavaScript
- **Efficient**: Minimal DOM manipulation
- **Cached**: Browser caching for repeat visits

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).

