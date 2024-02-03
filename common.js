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

function display_stats(point) {
    document.getElementById("point_info_time").innerHTML = point.time;
    document.getElementById("point_info_elevation_gps").innerHTML = point.gpsAltitude.toPrecision(4) + "m";
    document.getElementById("point_info_terrain").innerHTML = point.terrain_elevation.toPrecision(4) + "m";
    document.getElementById("point_info_elevation_pressure").innerHTML = point.pressureAltitude.toPrecision(4) + "m";
    document.getElementById("point_info_distance").innerHTML = point.distance_total.toPrecision(4) + "m";
    document.getElementById("point_info_finesse").innerHTML = point.finesse.toPrecision(4);
    document.getElementById("point_info_bearing").innerHTML = point.bearing.toPrecision(4) + "°N";
}

// Auto play fucntions
var play_index = 0;
var auto_play_timer = 0;
var play_time_period;

function play_cmd() {
    if (typeof paragliding_info !== 'undefined') {
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
    if ( (typeof paragliding_info !== 'undefined') && (auto_play_timer != 0) ) {
        play_time_period /= 2;
        clearInterval(auto_play_timer);
        auto_play_timer = setInterval(play_period, play_time_period);
    }
}

function play() {
    play_time_period = paragliding_info[1].timestamp - paragliding_info[0].timestamp;
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

// Create elevation data
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