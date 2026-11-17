// Converts degrees to radians
function to_rad(value) {
    return value * Math.PI / 180;
}
// Converts radians to degrees
function to_degrees(value) {
  var pi = Math.PI;
  return value * (180/pi);
}

// This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in m)
function calc_crow(lat1, lon1, lat2, lon2) {
  var R = 6371000; // m
  var dLat = to_rad(lat2-lat1);
  var dLon = to_rad(lon2-lon1);
  var lat1 = to_rad(lat1);
  var lat2 = to_rad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

function ms_to_kmh(s) {
  return s*3600/1000;
}

function ms_to_s(t) {
  return t/1000;
}

function s_to_time(s) {
  let date = new Date(null);
  date.setSeconds(s);
  return date.toISOString().substring(11, 19);
}

// Main class
class ParaglidingPoint {  
  constructor(object) {
    for(let item in object) {
      this[item] = object[item];
    }
  }

  length() {
    return Object.keys(this).length;
  }

  // Points attributes methods
  calculate_distances() {
    this[0].distance = 0;
    this[0].distance_total = 0;
    for(let i=1; i<this.length(); i++) {
      this[i].distance = calc_crow(this[i-1].latitude, this[i-1].longitude, this[i].latitude, this[i].longitude);
      this[i].distance_total = this[i-1].distance_total + this[i].distance;
    }
  }

  calculate_elevation() {
    this[0].elevation = 0;
    for(let i=1; i<this.length(); i++) {
      this[i].elevation = this[i].gpsAltitude - this[i-1].gpsAltitude;
    }
  }

  calculate_speeds() {
    this[0].speed = 0;
    this[0].vertical_speed = 0;
    for(let i=1; i<this.length(); i++) {
      this[i].speed = ms_to_kmh(this[i].distance / ms_to_s(this[i].timestamp - this[i-1].timestamp));
      this[i].vertical_speed = this[i].elevation / ms_to_s(this[i].timestamp - this[i-1].timestamp);
      // Protections against timestamp equal or close
      if(! isFinite(this[i].speed)) { 
        this[i].speed = this[i-1].speed;
      }
      if(! isFinite(this[i].vertical_speed)) {
        this[i].vertical_speed = this[i-1].vertical_speed;
      }
    }
  }

  calculate_bearing() {
    this[0].bearing = 0;
    for(let i=1; i<this.length(); i++) {
      let bearing = Math.atan2( Math.sin(this[i].longitude - this[i-1].longitude) * Math.cos(this[i].latitude),
                            Math.cos(this[i-1].latitude) * Math.sin(this[i].latitude) - 
                            Math.sin(this[i-1].latitude) * Math.cos(this[i].latitude) * Math.cos(this[i].longitude - this[i-1].longitude)
                          );
      this[i].bearing = to_degrees(bearing);
    }
  }

  calculate_finesse() {
    this[0].finesse = 0;
    for(let i=1; i<this.length(); i++) {
      if(this[i].gpsAltitude == this[i-1].gpsAltitude) {
        this[i].finesse = 9;
      } else {
        this[i].finesse = this[i].distance / (this[i].gpsAltitude - this[i-1].gpsAltitude);
      }
    }
  }

  calculate_duration() {
    this[0].duration = 0;
    for(let i=1; i<this.length(); i++) {
      this[i].duration = s_to_time(ms_to_s(this[i].timestamp - this[0].timestamp));
    }
  }

  // Multipoints method

  // Time stats    
  start_time() {
    return this[0].time;
  }

  stop_time() {
    return this[this.length()-1].time;
  }

  duration() {
    return s_to_time(ms_to_s(this[this.length()-1].timestamp - this[0].timestamp));
  }

  // distance stats
  distance_total() {
    return this[this.length()-1].distance_total;
  }

  distance_start_stop() {
    return calc_crow(this[0].latitude, this[0].longitude, this[this.length()-1].latitude, this[this.length()-1].longitude);
  }

  distance_max_from_start() {
    let distance_max = 0;
    let distance = 0;
    for(let i=1; i<this.length(); i++) {
      distance = calc_crow(this[0].latitude, this[0].longitude, this[i].latitude, this[i].longitude);
      if( distance > distance_max) {
        distance_max = distance;
      }
    }
    return distance_max;
  }

  // Horizontal speed stats
  average_speed() {
    let sum = 0;
    let count = 0;
    for(let i=0; i<this.length(); i++) {
      if( (this[i].speed > 0) || (count != 0) ) {
        count ++;
        sum += this[i].speed;
      }
    }
    return sum / count;
  }

  max_speed() {
    let speed = Object.values(this).map( point => point.speed);      
    return Math.max(...speed);
  }

  // Vertical speed stats
  average_vertical_speed() {
    let sum = 0;
    let count = 0;
    for(let i=0; i<this.length(); i++) {
      if( (this[i].vertical_speed > 0) || (count != 0) ) {
        count ++;
        sum += this[i].vertical_speed;
      }
    }
    return sum / count;
  }

  max_vertical_speed() {
    let vertical_speed = Object.values(this).map( point => point.vertical_speed);      
    return Math.max(...vertical_speed);
  }

  min_vertical_speed() {
    let vertical_speed = Object.values(this).map( point => point.vertical_speed);      
    return Math.min(...vertical_speed);
  }

  // Finesse moyenne

  // Elevation stats
  high() {
    return this[0].gpsAltitude - this[this.length()-1].gpsAltitude;
  }

  elevation_total() {
    let elevation_total = 0
    for(let i=1; i<this.length(); i++) {
      if(this[i].elevation > 0) {
        elevation_total += this[i].elevation;
      }
    }
    return elevation_total;
  }

  elevation_max() {
    let elevation = Object.values(this).map( point => point.gpsAltitude);      
    return Math.max(...elevation);
  }

  elevation_over_start() {
    let elevation_max = this.elevation_max();
    return(elevation_max - this[0].gpsAltitude);
  }

  // Position method
  get_positions_by_group(max_size) {
    let lon;
    let lat;
    let grp = -1;
    let ret = [];
    
    let i;
    for(i=0; i<this.length(); i++) {
      if(i%max_size == 0) {
        if(grp >= 0) {
          ret[grp] = lon + "&" + lat;
        }
        grp += 1;
        lon = "lon=" + this[i].longitude;
        lat = "lat=" + this[i].latitude;
      } else {
        lon += "|" + this[i].longitude;
        lat += "|" + this[i].latitude;
      }
    }
    if( ((i-1) % max_size) != 0 ) {
      ret[grp] = lon + "&" + lat;
    }
    return ret;
  }

  set_terrain_elevation(elevation_list) {
    for(let i=0; i<this.length(); i++) {
      this[i].terrain_elevation = elevation_list[i];
    }
  }
}

window.ParaglidingPoint = ParaglidingPoint;