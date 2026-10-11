# Campus directory and map

## Map asset and network requirements

The Dashboard's **Campus request forecast** panel displays the bundled image at `client/public/heatmap.jpg`, loaded locally from `/heatmap.jpg`. Its heat zones and priority markers are part of the static image; the panel's zoom controls do not require online map tiles or a geocoding service. The campus layout image remains at `client/public/schoolmap.png` for campus reference and the page backdrop. The repository does not identify the original creator or source of these images. Confirm and record their attribution/licensing separately before redistributing them outside this application.

## Coordinate format

Department marker coordinates are stored on each department record as `map_x` and `map_y`, percentages from 0 through 100, relative to the displayed map image:

- `map_x`: horizontal percentage from the image's left edge.
- `map_y`: vertical percentage from the image's top edge.
- For example, `map_x = 50`, `map_y = 50` places the marker at the center.
- If either coordinate is blank, no office marker or map ticket/heat position is shown for that department; the dashboard does not guess a location from the department name.

Initial percentages are image-based starting estimates for recognizable labeled buildings. An authorized admin should verify and adjust each coordinate against the official campus map. The server fills coordinates only when they are currently blank and never overwrites admin-maintained map values, except for fixed campus locations: Maintenance is pinned to the Workshop (85.5%, 54%); Library is placed at the lower right (47%, 65.5%), Registrar at the upper left (43%, 61.5%), Guidance at the upper right (47%, 61.5%), and Accounting at the lower left (43%, 65.5%) of the J.B. Angeles (Administration) Building. Their saved physical location is normalized to “Administration Building (J.B. Angeles Building)”. CS is pinned inside the right-hand Information & Technology Building (54.5%, 31%), and IT is pinned inside the left-hand Information & Technology Building below D.H. Soriano Hall (39%, 32%).

## Updating office information and coordinates

Admins maintain department name, description/services, contact person, contact number, physical location, office hours, and map percentages in **Catalog → Edit Department**. Saving updates the database-backed directory and dashboard map data. When replacing `schoolmap.png` with a differently cropped or sized map, recalibrate all department percentages in Catalog because coordinates are relative to the image boundaries.

Department records without confirmed locations should keep map coordinates blank until verified. The directory's factual details must likewise be confirmed by the department before publication; seeded or legacy sample records may require review.

## Map capabilities and limitations

The forecast panel currently shows the heat zones and priority markers baked into its static heatmap image; those image markers do not update from live tickets or department coordinates. The map does not calculate walking routes, use GPS, locate a user's device, or provide real-time person tracking.
