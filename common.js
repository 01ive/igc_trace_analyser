/* =========================================================================================================== */
/* ============================================ Actions commandes ============================================ */
/* =========================================================================================================== */
// Manage items visibility
function visibility_checkbox_action(item) {
    if(item.checked) {
        document.getElementById(item.value).style.visibility = 'visible';
        document.getElementById(item.value).style.zIndex = 5;
    } else {
        document.getElementById(item.value).style.visibility = 'hidden';
        document.getElementById(item.value).style.zIndex = -5;
    }
}

// Manage draggable items
var drag_offset_X;
var drag_offset_Y;
function dragstart(elem) {
    evt = window.event;
    drag_offset_X = elem.offsetLeft - evt.x;
    drag_offset_Y = elem.offsetTop - evt.y;
    elem.style.bottom = 'unset';
}
function dragend(elem) {
    evt = window.event;
    let pos_x = evt.x + drag_offset_X;
    let pos_y = evt.y + drag_offset_Y;
    elem.style.left = pos_x + 'px';
    elem.style.top = pos_y + 'px';
}

// Keyboard commands
function key_commands(k) {
    if(k.key.toLowerCase() == 'p') {
        play_cmd();
    } else if(k.key.toLowerCase() == 'v') {
        document.getElementById("control_buttons").style.visibility='visible';
        document.getElementById("chkbx_control_buttons").checked = true;
    }
}
/* =========================================================================================================== */
/* =========================================== Auto play functions =========================================== */
/* =========================================================================================================== */
var play_index = 0;
var auto_play_timer = 0;
var play_time_period;
var max_nb_points = 0;

function play_cmd() {
    if (typeof paragliding_stats !== 'undefined') {
        try {
            max_nb_points = paragliding_stats.length();
        } catch {
            max_nb_points = flight.flight_info.number_of_point;
        }
        if(auto_play_timer == 0) {
            document.getElementById("play_picture").style.backgroundImage="url(ressources/pause.png)";
            play();
        } else {
            document.getElementById("play_picture").style.backgroundImage="url(ressources/play.png)";
            stop();
        }
    }
}

function speed_cmd() {
    if ( (typeof paragliding_stats !== 'undefined') && (auto_play_timer != 0) ) {
        play_time_period /= 2;
        clearInterval(auto_play_timer);
        auto_play_timer = setInterval(play_period, play_time_period);
    }
}

function play() {
    play_time_period = paragliding_stats[1].timestamp - paragliding_stats[0].timestamp;
    auto_play_timer = setInterval(play_period, play_time_period);
}

function play_period() {
    play_index++;
    if(play_index >= max_nb_points) {
        play_cmd();
    } else {
        update_position(play_index);
    }
}

function stop() {
    clearInterval(auto_play_timer);
    auto_play_timer = 0;
}

/* =========================================================================================================== */
/* ============================================ Dynamic functions ============================================ */
/* =========================================================================================================== */
function closest_point(lat, lon) {
    let best_delta = 999999999999;
    let best_point = 0;
    for(point in paragliding_stats) {
        delta_lat = Math.abs(paragliding_stats[point].latitude - lat);
        delta_lon = Math.abs(paragliding_stats[point].longitude - lon);
        delta = delta_lat**2 + delta_lon**2;
        if(best_delta > delta) {
            best_delta = delta;
            best_point = point;
        }
    }
    return best_point;
}
function update_position(position_index) {
    latlng = new leaflet.LatLng(0, 0);
    // Update cursor
    latlng.lat = paragliding_stats[position_index].latitude;
    latlng.lng = paragliding_stats[position_index].longitude;
    cursor.setLatLng(latlng);
    // Update info
    display_stats(paragliding_stats[position_index]);
    // Update elevation
    let updt = {color: 'red'};
    elevation_graph.layout.shapes[0].x0=paragliding_stats[position_index].distance_total;
    elevation_graph.layout.shapes[0].x1=paragliding_stats[position_index].distance_total;
    elevation_graph.layout.shapes[0].label.text=paragliding_stats[position_index].gpsAltitude.toPrecision(4) + 'm<br>' 
        + (paragliding_stats[position_index].distance_total/1000).toPrecision(4) + 'km';
    Plotly.restyle('elevation', updt);
    // Update auto play index
    play_index = position_index;
}

// Return elevation points, min, max and terrain elevation
function get_elevation(paragliding_data) {
    let elevation = Object.values(paragliding_data).map( item => item.gpsAltitude);
    let terrain_elevation = Object.values(paragliding_data).map( item => item.terrain_elevation);
    let min = Math.min(...terrain_elevation);
    let max = Math.max(...elevation);
    
    return [elevation, min, max, terrain_elevation];
}

function get_distance(paragliding_data) {
    let distance = Object.values(paragliding_data).map( item => item.distance_total);
    let min = distance[0];
    let max = distance[distance.length-1];
    
    return [distance, min, max];
}

function get_speed(paragliding_data) {
    let speed_data = Object.values(paragliding_data).map( item => item.speed);
    let min = Math.min(...speed_data);
    let max = Math.max(...speed_data);
    
    return [speed_data, min, max];
}

function get_vertical_speed(paragliding_data) {
    let vertical_speed_data = Object.values(paragliding_data).map( item => item.vertical_speed);
    let min = Math.min(...vertical_speed_data);
    let max = Math.max(...vertical_speed_data);
    
    return [vertical_speed_data, min, max];
}

// Refresh point stats
function display_stats(point) {
    document.getElementById("point_info_time").innerHTML = point.duration;
    document.getElementById("point_info_elevation_gps").innerHTML = point.gpsAltitude.toPrecision(4) + "m";
    document.getElementById("point_info_terrain").innerHTML = point.terrain_elevation.toPrecision(4) + "m";
    document.getElementById("point_info_speed").innerHTML = point.speed.toPrecision(3) + "km/h";
    document.getElementById("point_info_vario").innerHTML = point.vertical_speed.toPrecision(2) + "m/s";
    document.getElementById("point_info_distance").innerHTML = point.distance_total.toPrecision(4) + "m";
    document.getElementById("point_info_finesse").innerHTML = point.finesse.toPrecision(4);
    document.getElementById("point_info_bearing").innerHTML = point.bearing.toPrecision(4) + "°N";
}

// Update globals infos
function update_globals_infos(flight) {
    document.getElementById('flight_date').innerHTML = flight.flight_info.date;
    document.getElementById('flight_time').innerHTML = flight.flight_info.start_time;
    document.getElementById('logger').innerHTML = flight.flight_info.loggerType;
    document.getElementById('flight_duration').innerHTML = flight.flight_info.duration;
    document.getElementById('flight_high').innerHTML = flight.flight_info.high.toFixed(0) + "m";
    document.getElementById('flight_elevation').innerHTML = flight.flight_info.elevation_total.toFixed(0) + "m";
    
    document.getElementById('takeoff_time').innerHTML = flight.flight_info.start_time;
    document.getElementById('takeoff_elevation').innerHTML = flight.flight_info.elevation_start.toFixed(0) + "m";
    document.getElementById('takeoff_position').innerHTML = flight.paragliding_info[0].latitude.toFixed(6) + ", " + flight.paragliding_info[0].longitude.toFixed(6);

    document.getElementById('landing_time').innerHTML = flight.flight_info.stop_time;
    document.getElementById('landing_elevation').innerHTML = flight.flight_info.elevation_stop.toFixed(0) + "m";
    document.getElementById('landing_position').innerHTML = flight.paragliding_info[flight.flight_info.number_of_point-1].latitude.toFixed(6) + ", " + flight.paragliding_info[flight.flight_info.number_of_point-1].longitude.toFixed(6);
    
    document.getElementById('distance').innerHTML = flight.flight_info.distance_total.toFixed(0) + "m";
    document.getElementById('distance_takeoff_landing').innerHTML = flight.flight_info.distance_start_stop.toFixed(0) + "m";
    document.getElementById('distance_max_takeoff').innerHTML = flight.flight_info.distance_max_from_start.toFixed(0) + "m";
    document.getElementById('average_speed').innerHTML = flight.flight_info.average_speed.toPrecision(2) + "km/h";
    document.getElementById('max_speed').innerHTML = flight.flight_info.max_speed.toPrecision(2) + "km/h";
    document.getElementById('average_vertical_speed').innerHTML = flight.flight_info.average_vertical_speed.toPrecision(2) + "m/s";
    document.getElementById('min_vertical_speed').innerHTML = flight.flight_info.min_vertical_speed.toPrecision(2) + "m/s";
    document.getElementById('max_vertical_speed').innerHTML = flight.flight_info.max_vertical_speed.toPrecision(2) + "m/s";
    document.getElementById('elevation_max').innerHTML = flight.flight_info.elevation_max.toFixed(0) + "m";
    document.getElementById('over_takeoff_elevation').innerHTML = flight.flight_info.elevation_over_start.toFixed(0) + "m";
}

/* =========================================================================================================== */
/* ======================================== User Interface parameters ======================================== */
/* =========================================================================================================== */
// Create map layers
var GeoportailFrance_plan = L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
    attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
    bounds: [[-75, -180], [81, 180]],
    minZoom: 2,
    maxZoom: 18,
    apikey: 'choisirgeoportail',
    format: 'image/png',
    style: 'normal'
});
var GeoportailFrance_orthos = L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
    attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
    bounds: [[-75, -180], [81, 180]],
    minZoom: 2,
    maxZoom: 19,
    apikey: 'choisirgeoportail',
    format: 'image/jpeg',
    style: 'normal'
});
var osm_fr = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});
var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});
var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});
var Green_background = L.tileLayer('ressources/green.png', {
    attribution: 'Green'
});

// Create layer control for map
var baseMaps = {
    "GeoportailFrance_plan": GeoportailFrance_plan,
    "GeoportailFrance_orthos": GeoportailFrance_orthos,
    "OpenStreetMap_Fr": osm_fr,
    "OpenTopoMap": OpenTopoMap,
    "Esri_WorldImagery": Esri_WorldImagery,
    "Green background": Green_background
};

/* =========================================================================================================== */
/* ========================================== Refresh and update Map ========================================= */
/* =========================================================================================================== */
// Calculate data and refresh map
async function update_map(flight) {
    flight.process_flight_info();
    
    // Process terrain elevation
    let locations = flight.paragliding_info.get_positions_by_group(200);
    let elevations = await get_terrain_elevation(locations);
    flight.paragliding_info.set_terrain_elevation(elevations);
    
    refresh_map(flight);
}

// Refresh map
function refresh_map(flight) {
    paragliding_stats = flight.paragliding_info;

    // Update globals infos
    update_globals_infos(flight);
    
    // Delete existing map
    if (map && map.remove) {
        map.off();
        map.remove();
    }

    // Create map
    map = L.map('map', {
        center: [flight.center_lat, flight.center_lon],
        zoom: 13,
        layers: [GeoportailFrance_plan],
        zoomControl: false
    });

    var zoom_control = L.control.zoom({
        position: 'topright'
    }).addTo(map);
    var zoom_control_container = zoom_control.getContainer();
    zoom_control_container.id = "zoom_control";

    var layer_control = L.control.layers(baseMaps).addTo(map);
    var layerControl_container = layer_control.getContainer();
    layerControl_container.id = "layer_control";

    // Display all elements
    document.getElementById('title').style.visibility = 'unset';
    document.getElementById('elevation').style.visibility = 'unset';
    document.getElementById('point_info').style.visibility = 'unset';
    document.getElementById('zoom_control').style.visibility = 'unset';
    document.getElementById('layer_control').style.visibility = 'unset';
    document.getElementById('control_buttons').style.visibility = 'unset';
    document.getElementById('visibility_button').style.visibility = 'unset';
    document.getElementById('play_stop_button').style.visibility = 'unset';
    document.getElementById('speed_button').style.visibility = 'unset';
    
    
    // Create events for key press
    window.addEventListener("keypress", (k) => key_commands(k));
    
    // Add icons
    var last_item = Object.keys(paragliding_stats).length-1 ;
    var start_icon = L.icon({iconUrl: 'ressources/marker-icon-g.png', iconSize: [25, 41], iconAnchor: [12, 41]});
    var end_icon = L.icon({iconUrl: 'ressources/marker-icon-r.png', iconSize: [25, 41], iconAnchor: [12, 41]});
    L.marker([paragliding_stats[0].latitude, paragliding_stats[0].longitude], {icon: start_icon}).addTo(map);
    L.marker([paragliding_stats[last_item].latitude, paragliding_stats[last_item].longitude], {icon: end_icon}).addTo(map);			
    var paraglider_icon = L.icon({iconUrl: 'ressources/paraglider.png', iconSize: [25, 23], iconAnchor: [12, 20]});
    cursor = L.marker([paragliding_stats[0].latitude, paragliding_stats[0].longitude], {icon: paraglider_icon});
    cursor.addTo(map);
    
    // Create trace
    var latlngs = [];
    for(let point in paragliding_stats) {
        latlngs.push([paragliding_stats[point].latitude, paragliding_stats[point].longitude]);
    }
    geo = L.polyline(latlngs, {color: 'red'});
    var autorize_map_mousemove = true;
    map.on('mousemove', function(ev) {
            if( (auto_play_timer == 0) && (autorize_map_mousemove) ) {
                var latlng = map.mouseEventToLatLng(ev.originalEvent);
                closest_point_index = closest_point(latlng.lat, latlng.lng);
                update_position(closest_point_index);
            }
        });
    map.on('click', function(ev) {
        if(autorize_map_mousemove) {
            autorize_map_mousemove = false;
        } else {
            autorize_map_mousemove = true;
        }
        var latlng = map.mouseEventToLatLng(ev.originalEvent);
        closest_point_index = closest_point(latlng.lat, latlng.lng);
        update_position(closest_point_index);
    });
    geo.addTo(map);

    // zoom the map to the polyline
    map.fitBounds(geo.getBounds());

    // Create elevation graph
    let [elevation_data, elevation_min, elevation_max, terrain_elevation] = get_elevation(paragliding_stats);
    let [distance_data, distance_min, distance_max] = get_distance(paragliding_stats);

    let [speed_data, speed_data_min, speed_data_max] = get_speed(paragliding_stats);
    let [vertical_speed_data, vertical_speed_data_min, vertical_speed_data_max] = get_vertical_speed(paragliding_stats);

    elevation_graph = document.getElementById('elevation');
    Plotly.newPlot( elevation_graph, 
                    [{x: distance_data, y: elevation_data, name: "elevation", hoverinfo: "none", yaxis: 'y4'}, // Defining y4 axis allows to have mouse hover linked to elevation_data
                    {x: distance_data, y: terrain_elevation, name: "terrain", hoverinfo: "none"},
                    {x: distance_data, y: speed_data, name: "speed", hoverinfo: "none", yaxis: 'y2', visible: 'legendonly'},
                    {x: distance_data, y: vertical_speed_data, name: "vario", hoverinfo: "none", yaxis: 'y3', visible: 'legendonly'}
                    ], 
                    {	hovermode: "x",	// Allow to have smooth over
                        shapes: [{
                            type: 'line',
                            x0: 0,
                            y0: elevation_min-50,
                            x1: 0,
                            y1: elevation_max+50,
                            line: {
                                color: 'black',
                                width: 1,
                                dash: 'dot'
                            },
                            label: {
                                text: elevation_data[0].toPrecision(4) + 'm<br>' 
                                        + (paragliding_stats[0].distance_total/1000).toPrecision(4) + 'km',
                                font: { size: 10, color: 'black' },
                                textposition: 'end',
                                textangle: 0,
                                xanchor: "right",
                                yanchor: "top"
                                },
                        }],
                        xaxis: {
                            range: [-(distance_max/10), distance_max+(distance_max/10)],
                            showgrid: false
                        },
                        yaxis: {
                            range: [elevation_min-50, elevation_max+50],
                            showgrid: false,
                        },
                        yaxis2: {
                            range: [speed_data_min-5, speed_data_max+5],
                            showgrid: false
                        },
                        yaxis3: {
                            range: [vertical_speed_data_min-1, vertical_speed_data_max+1],
                            showgrid: false,
                            visible: false,
                            showline: false,
                            linewidth: 0
                        },
                        yaxis4: {
                            range: [elevation_min-50, elevation_max+50],
                            showgrid: false
                        },
                        margin: {
                            autoexpand: 0,
                            b: 0,
                            l: 10,
                            pad: 100,
                            r: 0,
                            t: 0
                        },
                        paper_bgcolor:"rgba(0, 0, 0, 0)",
                        plot_bgcolor:"rgba(0, 0, 0, 0)",
                        legend: {
                            x: 0,
                            y: 1
                        }
                    },
                    {   // config
                        displayModeBar: false
                    }
                );
    elevation_graph.on('plotly_hover', function(data){
        update_position(data.points[0].pointIndex);
        });
}