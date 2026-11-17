function convert_gps_coordinates(lat, lon) {
    let lat_deg = Math.floor(lat);
    let lat_min_float = (lat - lat_deg) * 60;
    let lat_min = Math.floor(lat_min_float);
    let lat_sec = Math.floor( (lat_min_float - lat_min) * 1000 );
    let latitude = lat_deg.toString().padStart(2, '0') + lat_min.toString().padStart(2, '0') + lat_sec.toString().padStart(3, '0'); 
    latitude += lat_deg >= 0 ? 'N' : 'S';

    let lon_deg = Math.floor(lon);
    let lon_min_float = (lon - lon_deg) * 60;
    let lon_min = Math.floor(lon_min_float);
    let lon_sec = Math.floor( (lon_min_float - lon_min) * 1000 );
    let longitude = lon_deg.toString().padStart(3, '0') + lon_min.toString().padStart(2, '0') + lon_sec.toString().padStart(3, '0');
    longitude += lon_deg >= 0 ? 'E' : 'W';
    
    return latitude + longitude;
}

function convert_time(time) {
    // Convert time from HH:MM:SS to HHMMSS
    let time_list = time.split(':');
    for(let i in time_list) {
        time_list[i] = time_list[i].padStart(2, '0');
    }
    return time_list.join('');
}

class Flight {
    constructor(name) {
        this.file_name = null;
        this.file_format = null;
        this.file_content = null;
        this.name = name;
        this.middle_index = 0;
        this.center_lon = 0;
        this.center_lat = 0;
        this.flight_info = {};
        this.flight_info.file_name = null;
        this.flight_info.nbr = 0;
        this.flight_info.gliderType = 0;
        this.flight_info.pilot = 0;
        this.flight_info.date = 0;
        this.flight_info.loggerType = 0;
        
        this.flight_info.number_of_point = 0;
                
        this.flight_info.start_time = 0;
        this.flight_info.stop_time = 0;
        this.flight_info.duration = 0;

        this.flight_info.distance_total = 0;
        this.flight_info.distance_start_stop = 0;
        this.flight_info.distance_max_from_start = 0;

        this.flight_info.average_speed = 0;
        this.flight_info.max_speed = 0;

        this.flight_info.average_vertical_speed = 0;
        this.flight_info.max_vertical_speed = 0;
        this.flight_info.min_vertical_speed = 0;

        this.flight_info.high = 0;
        this.flight_info.elevation_total = 0;
        this.flight_info.elevation_max = 0;
        this.flight_info.elevation_over_start = 0;
        this.flight_info.elevation_start = 0;
        this.flight_info.elevation_stop = 0;
        this.comment = '';
    }

    load_file(file_content, file_name) {
        this.file_name = file_name;
        this.file_content = file_content;
        this.file_format = file_name.split('.').pop().toLowerCase();
        if(this.file_format == "igc") {
            this.load_igc_file(file_content);
        } else if (this.file_format == "gpx") {
            this.load_gpx_file(file_content);
        } else {
            console.log("ERROR: Incompatible file format");
        }
    }

    read_comment(igc_comments) {
        for(let i in igc_comments) {
            // If igc_comments are from pilote
            if(igc_comments[i].code === "PLT") {
                this.comment += igc_comments[i].message + '\n';
            }
        }
        this.comment = this.comment.slice(0, -1); // Remove last \n
    }

    add_comment_to_file_content(igc_comments) {
        // Only IGC file are supported
        if(this.file_format != "igc") {
            return
        }

        let file_content_lines = this.file_content.split('\r\n');

        // Remove the existing LPLT lines
        let index = 0;
        while(index !== -1) {
            index = file_content_lines.findIndex(file_content_lines => file_content_lines.startsWith('LPLT'));
            if (index !== -1) {
                file_content_lines.splice(index, 1);
            }
        }

        // Prepare the comments to be added
        let comments_lines = igc_comments.split('\n');
        for(let l in comments_lines) {
            if(comments_lines[l].length > 0) {
                comments_lines[l] = 'LPLT' + comments_lines[l];
            } else { // Manage empty lines
                comments_lines[l] = 'LPLT_';
            }
        }

        // Add the new LPLT lines with comments
        file_content_lines.splice(file_content_lines.length - 2, 0, ...comments_lines);

        // Save update file content
        this.file_content = file_content_lines.join('\r\n');						
    }

    // Add terrain elevation to IGC file
    add_terrain_elevation_to_file_content() {
        // Only IGC file are supported
        if(this.file_format != "igc") {
            return
        }
        let file_content_lines = this.file_content.split('\r\n');
        
        // Test if terrain elevation exists
        if(! this.paragliding_info[0].terrain_elevation) {
            return;
        }

        // Add extension to coding format I NN SS FF CCC ...
        let index = file_content_lines.findIndex(file_content_lines => file_content_lines.startsWith('I'));
        // If no extension definition found
        if(index != -1) {
            let nb_rec_ext = file_content_lines[index].match(/I(\d{2}).*/); // Find how many extensions already exist
            const rec_size = 7;     // Size of each record SS FF CCC = 7
            const first_rec = 3;    // First extension position after I NN = 3
            
            for(let i=first_rec; i<(file_content_lines[index].length-1); i+=rec_size) {
                let rec_data = file_content_lines[index].substring(i, i+rec_size).match(/(\d{2})(\d{2})(\w{3})/);
                let rec_start = parseInt(rec_data[1]);
                var rec_end = parseInt(rec_data[2]);
                let rec_type = rec_data[3];
                if(rec_type === 'XXT') {
                    // If terrain elevation already exists in file, return
                    return
                }
            }
            let terrain_rec_start = rec_end + 1;
            let terrain_rec_end = terrain_rec_start + 4;
            terrain_rec_start = terrain_rec_start.toString().padStart(2, '0');
            terrain_rec_end = terrain_rec_end.toString().padStart(2, '0');
            let terrain_rec_type = 'XXT';
            let nb_rec = parseInt(nb_rec_ext[1]) + 1
            nb_rec = nb_rec.toString().padStart(2, '0');

            file_content_lines[index] = file_content_lines[index].slice(0, 1) + nb_rec + file_content_lines[index].slice(3) + terrain_rec_start + terrain_rec_end + terrain_rec_type;
        } else {    // Create extention definition
            index = file_content_lines.findIndex(file_content_lines => file_content_lines.startsWith('B'));
            file_content_lines.splice(index, 0, 'I' + '01' + '36' + '39' + 'XXT');
        }

        // Add terrain elevation for each point
        let point_index = 0;
        for(let line in file_content_lines) {
            if(file_content_lines[line].startsWith('B')) {
                file_content_lines[line] += Math.floor(this.paragliding_info[point_index].terrain_elevation).toString().padStart(4, '0');
                point_index++;
            }
        }

        // Save update file content
        this.file_content = file_content_lines.join('\r\n');
    }

    load_igc_file(file_content) {
        let igc_obj = IGCParser.parse(file_content, {parseComments: true});
        
        this.read_comment(igc_obj.commentRecords);
        // Calculate center of map coordinates
        this.middle_index = Math.floor(igc_obj.fixes.length/2);
        this.center_lon   = igc_obj.fixes[this.middle_index]['longitude'];
        this.center_lat   = igc_obj.fixes[this.middle_index]['latitude'];

        // Get flights info from file
        this.flight_info.gliderType = igc_obj.gliderType;
        this.flight_info.pilot      = igc_obj.pilot;
        this.flight_info.date       = igc_obj.date;
        this.flight_info.loggerType = igc_obj.loggerType;

        // Create paragliding_info object
        this.paragliding_info = new geoparagliding.ParaglidingPoint(igc_obj.fixes);

        // Process terrain elevation if extension XXT exists
        if( this.paragliding_info[0].extensions['XXT'] ) {
            for(let i in this.paragliding_info) {
                this.paragliding_info[i].terrain_elevation = parseInt(this.paragliding_info[i].extensions['XXT']);
            }
        }
    }

    load_gpx_file(file_content) {
        var gpx = new gpxParser();
        gpx.parse(file_content);

        // Calculate center of map coordinates
        this.middle_index = Math.floor(gpx.tracks[0].points.length/2);
        this.center_lon   = gpx.tracks[0].points[this.middle_index]['lon'];
        this.center_lat   = gpx.tracks[0].points[this.middle_index]['lat'];

        // Get flights info from file
        let flight_date = new Date(gpx.tracks[0].points[0].time);
        this.flight_info.gliderType = "None";
        this.flight_info.pilot      = "None";
        this.flight_info.date       = flight_date.toLocaleDateString('fr-CA');
        this.flight_info.loggerType = "gpx";

        // Create paragliding_info object
        let igc_obj = [];
        for(let i in gpx.tracks[0].points) {
            igc_obj[i] = {};
            flight_date = gpx.tracks[0].points[i].time;
            igc_obj[i].time = flight_date.toLocaleTimeString();
            igc_obj[i].timestamp = flight_date.getTime();
            igc_obj[i].latitude = gpx.tracks[0].points[i].lat;
            igc_obj[i].longitude = gpx.tracks[0].points[i].lon;
            igc_obj[i].pressureAltitude = gpx.tracks[0].points[i].ele;
            igc_obj[i].gpsAltitude = igc_obj[i].pressureAltitude;
        }
        this.paragliding_info = new geoparagliding.ParaglidingPoint(igc_obj);
    }

    convert_gpx_to_igc() {
        if(this.file_format != "gpx") {
            return
        }
        // Create file header
        let igc_header = ['AXXXZZZIGCfileconverter'];
        let d = new Date(this.flight_info.date);
        d = d.getDay().toString().padStart(2, '0') + d.getMonth().toString().padStart(2, '0') + d.getFullYear().toString().slice(2);
        igc_header.push('HFDTE' + d);
        igc_header.push('HFFTYFRTYPE:gpx');
                
        // Create file reccords
        let line;
        for (let i in this.paragliding_info) {
            line ='B';
            line += convert_time(this.paragliding_info[i].time);
            line += convert_gps_coordinates(this.paragliding_info[i].latitude, this.paragliding_info[i].longitude);
            
            line += 'A';
            line += this.paragliding_info[i].pressureAltitude.toFixed(0).padStart(5, '0');
            line += this.paragliding_info[i].gpsAltitude.toFixed(0).padStart(5, '0');
            igc_header.push(line);
        }
        // Create file footer
        igc_header.push('GNOSECURITYCHECK');
        
        // Update file content, format and name
        this.file_content = igc_header.join('\r\n');
        this.file_format = 'igc';
        //this.file_name = path.parse(this.file_name).name + '.igc';
        this.file_name = this.file_name.replace(/\.[^/.]+$/, "") + '.igc';
    }

    async process_flight_info() {
        this.flight_info.file_name = this.file_name;
        // Process points info
        this.paragliding_info.calculate_elevation();
        this.paragliding_info.calculate_distances();
        this.paragliding_info.calculate_speeds();
        this.paragliding_info.calculate_bearing();
        this.paragliding_info.calculate_finesse();
        this.paragliding_info.calculate_duration();
        // Process flight info
        this.flight_info.number_of_point = this.paragliding_info.length();
        
        this.flight_info.start_time = this.paragliding_info.start_time();
        this.flight_info.stop_time = this.paragliding_info.stop_time();
        this.flight_info.duration = this.paragliding_info.duration();

        this.flight_info.distance_total = this.paragliding_info.distance_total();
        this.flight_info.distance_start_stop = this.paragliding_info.distance_start_stop();
        this.flight_info.distance_max_from_start = this.paragliding_info.distance_max_from_start();
        
        this.flight_info.average_speed = this.paragliding_info.average_speed();
        this.flight_info.max_speed = this.paragliding_info.max_speed();
        
        this.flight_info.average_vertical_speed = this.paragliding_info.average_vertical_speed();
        this.flight_info.max_vertical_speed = this.paragliding_info.max_vertical_speed();
        this.flight_info.min_vertical_speed = this.paragliding_info.min_vertical_speed();
                
        this.flight_info.high = this.paragliding_info.high();
        this.flight_info.elevation_total = this.paragliding_info.elevation_total();
        this.flight_info.elevation_max = this.paragliding_info.elevation_max();
        this.flight_info.elevation_over_start = this.paragliding_info.elevation_over_start();

        this.flight_info.elevation_start = this.paragliding_info[0].gpsAltitude;
        this.flight_info.elevation_stop = this.paragliding_info[this.flight_info.number_of_point-1].gpsAltitude;
    }
}

window.Flight = Flight;
