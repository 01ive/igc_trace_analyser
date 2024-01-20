# IGC file analyser

This project allows to read *.IGC files and to analyse flight data such as speed and finesse.

## Usage

Just download this project and open **index.html** with your webbrowser.

## Screenshot

![Screen example](screen.jpg)

## User manual

Use the folder icon at the top left of the screen to select your igc file to analyse.
Move mous cursor on top of graph or carto to analyse the trace.

## Dependencies

This application relies mainly on
* [leaflet](https://leafletjs.com/) for interactive map.
* [plotly](https://plotly.com/) for graphs.

Thanks to [browserify](https://browserify.org/), it embeddeds nodejs modules:
* flight-recorder-manufacturers 
* [igc-parser](https://github.com/Turbo87/igc-parser#readme)
* [flight-recorder-manufacturers](https://github.com/Turbo87/flight-recorder-manufacturers)

## Licences

Please refer to **LICENCE** file.
Third party components licences are located in **licences** local folder.
