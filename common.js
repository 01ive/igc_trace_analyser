/* =========================================================================================================== */
/* ============================================ Actions commandes ============================================ */
/* =========================================================================================================== */
function click_info() {
    element = document.getElementById("title");
    if(element.style.height != '') {	
        element.style.removeProperty("height");
        element.style.removeProperty("overflow");
    } else {
        element.style.height = '20px';
        element.style.overflow = 'hidden';
    }
}

/* =========================================================================================================== */
/* =========================================== Auto play functions =========================================== */
/* =========================================================================================================== */
var play_index = 0;
var auto_play_timer = 0;
var play_time_period;

function play_cmd() {
    if (typeof paragliding_stats !== 'undefined') {
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
    if(play_index >= paragliding_stats.length()) {
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
    // Update speed
    gauge_data[0].value = paragliding_stats[position_index].speed;
    Plotly.update('speed_gauge', gauge_data[0]);
    // Update vario
    vario_data[0].value = paragliding_stats[position_index].vertical_speed;
    vario_data[0].delta.reference = paragliding_stats[(position_index==0 ? 0 : position_index-1)].vertical_speed;
    Plotly.update('vario', vario_data[0]);
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

// Refresh point stats
function display_stats(point) {
    document.getElementById("point_info_time").innerHTML = point.time;
    document.getElementById("point_info_elevation_gps").innerHTML = point.gpsAltitude.toPrecision(4) + "m";
    document.getElementById("point_info_terrain").innerHTML = point.terrain_elevation.toPrecision(4) + "m";
    document.getElementById("point_info_elevation_pressure").innerHTML = point.pressureAltitude.toPrecision(4) + "m";
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
    document.getElementById('flight_high').innerHTML = flight.flight_info.high + "m";
    document.getElementById('flight_elevation').innerHTML = flight.flight_info.elevation_total + "m";
    
    document.getElementById('takeoff_time').innerHTML = flight.flight_info.start_time;
    document.getElementById('takeoff_elevation').innerHTML = flight.flight_info.elevation_start + "m";
    document.getElementById('takeoff_position').innerHTML = flight.paragliding_info[0].latitude.toFixed(6) + ", " + flight.paragliding_info[0].longitude.toFixed(6);

    document.getElementById('landing_time').innerHTML = flight.flight_info.stop_time;
    document.getElementById('landing_elevation').innerHTML = flight.flight_info.elevation_stop + "m";
    document.getElementById('landing_position').innerHTML = flight.paragliding_info[flight.flight_info.number_of_point-1].latitude.toFixed(6) + ", " + flight.paragliding_info[flight.flight_info.number_of_point-1].longitude.toFixed(6);
    
    document.getElementById('distance').innerHTML = flight.flight_info.distance_total.toFixed(0) + "m";
    document.getElementById('distance_takeoff_landing').innerHTML = flight.flight_info.distance_start_stop.toFixed(0) + "m";
    document.getElementById('distance_max_takeoff').innerHTML = flight.flight_info.distance_max_from_start.toFixed(0) + "m";
    document.getElementById('average_speed').innerHTML = flight.flight_info.average_speed.toPrecision(2) + "km/h";
    document.getElementById('max_speed').innerHTML = flight.flight_info.max_speed.toPrecision(2) + "km/h";
    document.getElementById('average_vertical_speed').innerHTML = flight.flight_info.average_vertical_speed.toPrecision(2) + "m/s";
    document.getElementById('min_vertical_speed').innerHTML = flight.flight_info.min_vertical_speed.toPrecision(2) + "m/s";
    document.getElementById('max_vertical_speed').innerHTML = flight.flight_info.max_vertical_speed.toPrecision(2) + "m/s";
    document.getElementById('elevation_max').innerHTML = flight.flight_info.elevation_max + "m";
    document.getElementById('over_takeoff_elevation').innerHTML = flight.flight_info.elevation_over_start + "m";
}

/* =========================================================================================================== */
/* ======================================== User Interface parameters ======================================== */
/* =========================================================================================================== */
// Speed gauge
let gauge_data = [
    {
        domain: { x: [0, 1], y: [0, 1] },
        value: 0,
        title: { text: "Speed km/h", font: {size: 14} },
        type: "indicator",
        mode: "gauge+number",
        gauge: {
              axis: { range: [null, 60, 10] }
        }
    }
];
let gauge_layout = { width: 150, height: 150,
                        margin: {
                            autoexpand: true,
                            b: 0,
                            l: 25,
                            pad: 500,
                            r: 25,
                            t: 0 
                        },
                        paper_bgcolor:"rgba(0, 0, 0, 0)",
                        plot_bgcolor:"rgba(0, 0, 0, 0)",
                    };
// Vario digital display
let vario_data = [
    {
        title: { text: "Vario", font: { size: 14 } },
        type: "indicator",
        mode: "number+delta",
        value: 300,
        number: { suffix: " m/s", font: { size: 20 } },
        delta: { position: "down", reference: 320, font: { size: 20 } },
        domain: { x: [0, 1], y: [0, 1] }
    }
];
let vario_layout = {
    width: 120,
    height: 120,
    margin: { 
                autoexpand: 0,
                b: 0,
                l: 25,
                pad: 500,
                r: 25,
                t: 0 
            },
    paper_bgcolor:"rgba(0, 0, 0, 0)",
    plot_bgcolor:"rgba(0, 0, 0, 0)",
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

    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Create layer control
    var baseMaps = {
        "GeoportailFrance_plan": GeoportailFrance_plan,
        "GeoportailFrance_orthos": GeoportailFrance_orthos,
        "OpenStreetMap_Fr": osm_fr,
        "OpenTopoMap": OpenTopoMap,
        "Esri_WorldImagery": Esri_WorldImagery
    };
    var layerControl = L.control.layers(baseMaps).addTo(map);

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
    let speed_data = Object.values(paragliding_stats).map( item => item.speed);
    let vertical_speed_data = Object.values(paragliding_stats).map( item => item.vertical_speed);
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
                            range: [0, 60],
                            showgrid: false
                        },
                        yaxis3: {
                            range: [-5, 5],
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
                    }
                );
    elevation_graph.on('plotly_hover', function(data){
        update_position(data.points[0].pointIndex);
        });
    // Create speed graph
    Plotly.newPlot('speed_gauge', gauge_data, gauge_layout);
    // Create Vario
    Plotly.newPlot('vario', vario_data, vario_layout);
}