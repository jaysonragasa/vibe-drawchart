# Flowchart Tool - Code Organization

## File Structure

### Core Files
- **index-new.html** - Main HTML file with UI structure
- **app.js** - Main application logic (to be created)

### Module Files
- **state.js** - Application state and configuration
- **utils.js** - Utility functions (rotation, distance, cursor, etc.)
- **shapes.js** - Shape management (create, find, handles, etc.)
- **connectors.js** - Connector management (paths, waypoints, etc.)
- **drawing.js** - Canvas drawing functions (shapes, connectors, grid, etc.)

## Architecture

The code is now organized into separate modules for better maintainability:

1. **State Management** (`state.js`)
   - Centralized state object
   - Configuration constants

2. **Utilities** (`utils.js`)
   - Event position calculation
   - Point rotation
   - Geometry helpers
   - Touch helpers

3. **Shape Operations** (`shapes.js`)
   - Shape creation and manipulation
   - Handle detection
   - Connection points

4. **Connector Operations** (`connectors.js`)
   - Connector path calculation
   - Waypoint management
   - Hit detection

5. **Drawing** (`drawing.js`)
   - Canvas rendering
   - Shape drawing
   - Connector drawing
   - Grid drawing

6. **Main App** (`app.js` - needs creation)
   - Event handlers
   - Mouse/touch interactions
   - Resize logic
   - Properties panel
   - Import/Export

## Next Steps

To complete the reorganization, create `app.js` with:
- Event listeners setup
- Mouse/touch handlers
- Resize logic with proper anchoring
- Properties panel management
- Import/Export functionality

## Benefits

- **Modularity**: Each file has a single responsibility
- **Maintainability**: Easier to find and fix bugs
- **Scalability**: Easy to add new features
- **Readability**: Cleaner, more organized code
