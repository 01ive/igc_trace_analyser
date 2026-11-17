(function(window) {
    "use strict";

    const MANUFACTURERS = [
        { "name": "Aircotec", "long": "ACT", "short": "I" },
        { "name": "Cambridge Aero Instruments", "long": "CAM", "short": "C" },
        { "name": "ClearNav Instruments", "long": "CNI", "short": null },
        { "name": "Data Swan/DSX", "long": "DSX", "short": "D" },
        { "name": "EW Avionics", "long": "EWA", "short": "E" },
        { "name": "Filser", "long": "FIL", "short": "F" },
        { "name": "Flarm", "long": "FLA", "short": "G" },
        { "name": "Flytech", "long": "FLY", "short": null },
        { "name": "Garrecht", "long": "GCS", "short": "A" },
        { "name": "IMI Gliding Equipment", "long": "IMI", "short": "M" },
        { "name": "Logstream", "long": "LGS", "short": null },
        { "name": "LX Navigation", "long": "LXN", "short": "L" },
        { "name": "LXNAV", "long": "LXV", "short": "V" },
        { "name": "Naviter", "long": "NAV", "short": null },
        { "name": "New Technologies", "long": "NTE", "short": "N" },
        { "name": "Nielsen Kellerman", "long": "NKL", "short": "K" },
        { "name": "Peschges", "long": "PES", "short": "P" },
        { "name": "PressFinish Electronics", "long": "PFE", "short": null },
        { "name": "Print Technik", "long": "PRT", "short": "R" },
        { "name": "Scheffel", "long": "SCH", "short": "H" },
        { "name": "Streamline Data Instruments", "long": "SDI", "short": "S" },
        { "name": "Triadis Engineering GmbH", "long": "TRI", "short": "T" },
        { "name": "Zander", "long": "ZAN", "short": "Z" },
        { "name": "XCSoar", "long": "XCS", "short": null },
        { "name": "LK8000", "long": "XLK", "short": null },
        { "name": "GpsDump", "long": "XGD", "short": null },
        { "name": "SeeYou Recorder", "long": "XCM", "short": null },
        { "name": "Flyskyhy", "long": "XFH", "short": null },
        { "name": "XCTrack", "long": "XCT", "short": null },
        { "name": "Flymaster Live", "long": "XFM", "short": null },
        { "name": "XCTracer", "long": "XTR", "short": null },
        { "name": "SkyBean", "long": "XSB", "short": null },
        { "name": "leGPSBip", "long": "XSD", "short": null },
        { "name": "Logfly", "long": "XLF", "short": null },
        { "name": "Loctome", "long": "XLM", "short": null }
    ];

    function lookupManufacturer(id) {
        let short = id.length === 1;
        id = id.toUpperCase();
        let manufacturers = MANUFACTURERS.filter(it => it[short ? 'short' : 'long'] === id);
        return manufacturers.length !== 0 ? manufacturers[0].name : id;
    }

    var ONE_HOUR = 60 * 60 * 1000;
    var ONE_DAY = 24 * 60 * 60 * 1000;
    var RE_A = /^A(\w{3})(\w{3,}?)(?:FLIGHT:(\d+)|\:(.+))?$/;
    var RE_HFDTE = /^HFDTE(?:DATE:)?(\d{2})(\d{2})(\d{2})(?:,?(\d{2}))?/;
    var RE_PLT_HEADER = /^H(\w)PLT(?:.{0,}?:(.*)|(.*))$/;
    var RE_CM2_HEADER = /^H(\w)CM2(?:.{0,}?:(.*)|(.*))$/;
    var RE_GTY_HEADER = /^H(\w)GTY(?:.{0,}?:(.*)|(.*))$/;
    var RE_GID_HEADER = /^H(\w)GID(?:.{0,}?:(.*)|(.*))$/;
    var RE_CID_HEADER = /^H(\w)CID(?:.{0,}?:(.*)|(.*))$/;
    var RE_CCL_HEADER = /^H(\w)CCL(?:.{0,}?:(.*)|(.*))$/;
    var RE_SIT_HEADER = /^H(\w)SIT(?:.{0,}?:(.*)|(.*))$/;
    var RE_FTY_HEADER = /^H(\w)FTY(?:.{0,}?:(.*)|(.*))$/;
    var RE_RFW_HEADER = /^H(\w)RFW(?:.{0,}?:(.*)|(.*))$/;
    var RE_RHW_HEADER = /^H(\w)RHW(?:.{0,}?:(.*)|(.*))$/;
    var RE_TZN_HEADER = /^H(\w)TZN(?:.{0,}?:([-+]?[\d.]+))$/;
    var RE_DTM_HEADER = /^H(\w)DTM(?:.{0,}?:(.*)|(.*))$/;
    var RE_ALG_HEADER = /^H(\w)ALG(?:.{0,}?:(.*)|(.*))$/;
    var RE_ALP_HEADER = /^H(\w)ALP(?:.{0,}?:(.*)|(.*))$/;
    var RE_B = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})([NS])(\d{3})(\d{2})(\d{3})([EW])([AV])(-\d{4}|\d{5})(-\d{4}|\d{5})/;
    var RE_K = /^K(\d{2})(\d{2})(\d{2})/;
    var RE_IJ = /^[IJ](\d{2})(?:\d{2}\d{2}[A-Z]{3})+/;
    var RE_L = /^[L]([A-Z]{3})(.+)/;
    var RE_TASK = /^C(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{4})([-\d]{2})(.*)/;
    var RE_TASKPOINT = /^C(\d{2})(\d{2})(\d{3})([NS])(\d{3})(\d{2})(\d{3})([EW])(.*)/;
    var RE_INT = /^\d*$/;
    var VALID_DATA_SOURCES = ['F', 'O', 'P'];

    var IGCParser = (function () {
        function IGCParser(options) {
            if (options === void 0) { options = {}; }
            this._result = {
                numFlight: null,
                pilot: null,
                copilot: null,
                gliderType: null,
                registration: null,
                callsign: null,
                competitionClass: null,
                loggerType: null,
                firmwareVersion: null,
                hardwareVersion: null,
                geoDatum: null,
                geoDatumAlgorithm: null,
                geoPressureAlgorithm: null,
                task: null,
                fixes: [],
                dataRecords: [],
                commentRecords: [],
                security: null,
                errors: [],
            };
            this.fixExtensions = [];
            this.dataExtensions = [];
            this.lineNumber = 0;
            this.prevTimestamp = null;
            this.options = options;
        }
        IGCParser.parse = function (str, options) {
            if (options === void 0) { options = {}; }
            var parser = new IGCParser(options);
            var errors = [];
            for (var _i = 0, _a = str.split('\n'); _i < _a.length; _i++) {
                var line = _a[_i];
                try {
                    parser.processLine(line.trim());
                }
                catch (error) {
                    if (options.lenient) {
                        errors.push(error);
                    }
                    else {
                        throw error;
                    }
                }
            }
            var result = parser.result;
            result.errors = errors;
            return result;
        };
        Object.defineProperty(IGCParser.prototype, "result", {
            get: function () {
                if (!this._result.loggerManufacturer) {
                    throw new Error("Missing A record");
                }
                if (!this._result.date) {
                    throw new Error("Missing HFDTE record");
                }
                return this._result;
            },
            enumerable: false,
            configurable: true
        });
        IGCParser.prototype.processLine = function (line) {
            this.lineNumber += 1;
            var recordType = line[0];
            if (recordType === 'B') {
                var fix = this.parseBRecord(line);
                this.prevTimestamp = fix.timestamp;
                this._result.fixes.push(fix);
            }
            else if (recordType === 'K') {
                var data = this.parseKRecord(line);
                this.prevTimestamp = data.timestamp;
                this._result.dataRecords.push(data);
            }
            else if (recordType === 'H') {
                this.processHeader(line);
            }
            else if (recordType === 'C') {
                this.processTaskLine(line);
            }
            else if (recordType === 'A') {
                var record = this.parseARecord(line);
                this._result.loggerId = record.loggerId;
                this._result.loggerManufacturer = record.manufacturer;
                if (record.numFlight !== null) {
                    this._result.numFlight = record.numFlight;
                }
            }
            else if (recordType === 'I') {
                this.fixExtensions = this.parseIJRecord(line);
            }
            else if (recordType === 'J') {
                this.dataExtensions = this.parseIJRecord(line);
            }
            else if (recordType === 'L' && this.options.parseComments) {
                this._result.commentRecords.push(this.parseLRecord(line));
            }
            else if (recordType === 'G') {
                this._result.security = (this._result.security || '') + line.slice(1);
            }
        };
        IGCParser.prototype.processHeader = function (line) {
            var headerType = line.slice(2, 5);
            if (headerType === 'DTE') {
                var record = this.parseDateHeader(line);
                this._result.date = record.date;
                if (record.numFlight !== null) {
                    this._result.numFlight = record.numFlight;
                }
            }
            else if (headerType === 'PLT') {
                this._result.pilot = this.parsePilot(line);
            }
            else if (headerType === 'CM2') {
                this._result.copilot = this.parseCopilot(line);
            }
            else if (headerType === 'GTY') {
                this._result.gliderType = this.parseGliderType(line);
            }
            else if (headerType === 'GID') {
                this._result.registration = this.parseRegistration(line);
            }
            else if (headerType === 'CID') {
                this._result.callsign = this.parseCallsign(line);
            }
            else if (headerType === 'CCL') {
                this._result.competitionClass = this.parseCompetitionClass(line);
            }
            else if (headerType === 'SIT') {
                this._result.site = this.parseSite(line);
            }
            else if (headerType === 'TZN') {
                this._result.timezone = this.parseTimezone(line);
            }
            else if (headerType === 'FTY') {
                this._result.loggerType = this.parseLoggerType(line);
            }
            else if (headerType === 'RFW') {
                this._result.firmwareVersion = this.parseFirmwareVersion(line);
            }
            else if (headerType === 'RHW') {
                this._result.hardwareVersion = this.parseHardwareVersion(line);
            }
            else if (headerType === 'DTM') {
                this._result.geoDatum = this.parseGeoDatum(line);
            }
            else if (headerType === 'ALG') {
                this._result.geoDatumAlgorithm = this.parseGeoDatumAlgorithm(line);
            }
            else if (headerType === 'ALP') {
                this._result.geoPressureAlgorithm = this.parseGeoPressureAlgorithm(line);
            }
        };
        IGCParser.prototype.parseARecord = function (line) {
            var match = line.match(RE_A);
            if (match) {
                var manufacturer = lookupManufacturer(match[1]);
                var loggerId = match[2];
                var numFlight = match[3] ? parseInt(match[3], 10) : null;
                var additionalData = match[4] || null;
                return { manufacturer: manufacturer, loggerId: loggerId, numFlight: numFlight, additionalData: additionalData };
            }
            match = line.match(/^A(\w{3})(.+)?$/);
            if (match) {
                var manufacturer = lookupManufacturer(match[1]);
                var additionalData = match[2] ? match[2].trim() : null;
                return { manufacturer: manufacturer, loggerId: null, numFlight: null, additionalData: additionalData };
            }
            throw new Error("Invalid A record at line ".concat(this.lineNumber, ": ").concat(line));
        };
        IGCParser.prototype.parseDateHeader = function (line) {
            var match = line.match(RE_HFDTE);
            if (!match) {
                throw new Error("Invalid DTE header at line ".concat(this.lineNumber, ": ").concat(line));
            }
            var lastCentury = match[3][0] === '8' || match[3][0] === '9';
            var date = "".concat(lastCentury ? '19' : '20').concat(match[3], "-").concat(match[2], "-").concat(match[1]);
            var numFlight = match[4] ? parseInt(match[4], 10) : null;
            return { date: date, numFlight: numFlight };
        };
        IGCParser.prototype.parseTextHeader = function (headerType, regex, line, underscoreReplacement) {
            if (underscoreReplacement === void 0) { underscoreReplacement = ' '; }
            var match = line.match(regex);
            if (!match) {
                throw new Error("Invalid ".concat(headerType, " header at line ").concat(this.lineNumber, ": ").concat(line));
            }
            var dataSource = match[1];
            if (VALID_DATA_SOURCES.indexOf(dataSource) === -1 && !this.options.lenient) {
                throw new Error("Invalid data source at line ".concat(this.lineNumber, ": ").concat(dataSource));
            }
            return (match[2] || match[3] || '').replace(/_/g, underscoreReplacement).trim();
        };
        IGCParser.prototype.parsePilot = function (line) {
            return this.parseTextHeader('PLT', RE_PLT_HEADER, line);
        };
        IGCParser.prototype.parseCopilot = function (line) {
            return this.parseTextHeader('CM2', RE_CM2_HEADER, line);
        };
        IGCParser.prototype.parseGliderType = function (line) {
            return this.parseTextHeader('GTY', RE_GTY_HEADER, line);
        };
        IGCParser.prototype.parseRegistration = function (line) {
            return this.parseTextHeader('GID', RE_GID_HEADER, line, '-');
        };
        IGCParser.prototype.parseCallsign = function (line) {
            return this.parseTextHeader('GTY', RE_CID_HEADER, line);
        };
        IGCParser.prototype.parseCompetitionClass = function (line) {
            return this.parseTextHeader('GID', RE_CCL_HEADER, line);
        };
        IGCParser.prototype.parseSite = function (line) {
            return this.parseTextHeader('SIT', RE_SIT_HEADER, line);
        };
        IGCParser.prototype.parseTimezone = function (line) {
            var result = this.parseTextHeader('TZN', RE_TZN_HEADER, line);
            var hours = parseFloat(result);
            if (isNaN(hours))
                throw new Error("Invalid TZN header at line ".concat(this.lineNumber, ": ").concat(line));
            return hours;
        };
        IGCParser.prototype.parseLoggerType = function (line) {
            return this.parseTextHeader('FTY', RE_FTY_HEADER, line);
        };
        IGCParser.prototype.parseFirmwareVersion = function (line) {
            return this.parseTextHeader('RFW', RE_RFW_HEADER, line);
        };
        IGCParser.prototype.parseHardwareVersion = function (line) {
            return this.parseTextHeader('RHW', RE_RHW_HEADER, line);
        };
        IGCParser.prototype.parseGeoDatum = function (line) {
            return this.parseTextHeader('FDT', RE_DTM_HEADER, line);
        };
        IGCParser.prototype.parseGeoDatumAlgorithm = function (line) {
            return this.parseTextHeader('ALG', RE_ALG_HEADER, line);
        };
        IGCParser.prototype.parseGeoPressureAlgorithm = function (line) {
            return this.parseTextHeader('ALP', RE_ALP_HEADER, line);
        };
        IGCParser.prototype.processTaskLine = function (line) {
            if (!this._result.task) {
                this._result.task = this.parseTask(line);
            }
            else {
                this._result.task.points.push(this.parseTaskPoint(line));
            }
        };
        IGCParser.prototype.parseTask = function (line) {
            var match = line.match(RE_TASK);
            if (!match) {
                throw new Error("Invalid task declaration at line ".concat(this.lineNumber, ": ").concat(line));
            }
            var lastCentury = match[3][0] === '8' || match[3][0] === '9';
            var declarationDate = "".concat(lastCentury ? '19' : '20').concat(match[3], "-").concat(match[2], "-").concat(match[1]);
            var declarationTime = "".concat(match[4], ":").concat(match[5], ":").concat(match[6]);
            var declarationTimestamp = Date.parse("".concat(declarationDate, "T").concat(declarationTime, "Z"));
            var flightDate = null;
            if (match[7] !== '00' || match[8] !== '00' || match[9] !== '00') {
                lastCentury = match[9][0] === '8' || match[9][0] === '9';
                flightDate = "".concat(lastCentury ? '19' : '20').concat(match[9], "-").concat(match[8], "-").concat(match[7]);
            }
            var taskNumber = (match[10] !== '0000') ? parseInt(match[10], 10) : null;
            var numTurnpoints = parseInt(match[11], 10);
            var comment = match[12] || null;
            return {
                declarationDate: declarationDate,
                declarationTime: declarationTime,
                declarationTimestamp: declarationTimestamp,
                flightDate: flightDate,
                taskNumber: taskNumber,
                numTurnpoints: numTurnpoints,
                comment: comment,
                points: [],
            };
        };
        IGCParser.prototype.parseTaskPoint = function (line) {
            var match = line.match(RE_TASKPOINT);
            if (!match) {
                throw new Error("Invalid task point declaration at line ".concat(this.lineNumber, ": ").concat(line));
            }
            var latitude = IGCParser.parseLatitude(match[1], match[2], match[3], match[4]);
            var longitude = IGCParser.parseLongitude(match[5], match[6], match[7], match[8]);
            var name = match[9] || null;
            return { latitude: latitude, longitude: longitude, name: name };
        };
        IGCParser.prototype.parseBRecord = function (line) {
            if (!this._result.date) {
                throw new Error("Missing HFDTE record before first B record");
            }
            var match = line.match(RE_B);
            if (!match) {
                throw new Error("Invalid B record at line ".concat(this.lineNumber, ": ").concat(line));
            }
            var extensions = {};
            if (this.fixExtensions) {
                for (var _i = 0, _a = this.fixExtensions; _i < _a.length; _i++) {
                    var _b = _a[_i], code = _b.code, start = _b.start, length = _b.length;
                    extensions[code] = line.slice(start, start + length);
                }
            }
            var time = "".concat(match[1], ":").concat(match[2], ":").concat(match[3]);
            var timestamp = this.calcTimestamp(time);
            var mmmext = (RE_INT.test(extensions['LAD'])) ? extensions['LAD'] : '';
            var latitude = IGCParser.parseLatitude(match[4], match[5], match[6] + mmmext, match[7]);
            mmmext = (RE_INT.test(extensions['LOD'])) ? extensions['LOD'] : '';
            var longitude = IGCParser.parseLongitude(match[8], match[9], match[10] + mmmext, match[11]);
            var valid = match[12] === 'A';
            var pressureAltitude = match[13] === '00000' ? null : parseInt(match[13], 10);
            var gpsAltitude = match[14] === '00000' ? null : parseInt(match[14], 10);
            var enl = null;
            if (extensions['ENL']) {
                var enlLength = this.fixExtensions.filter(function (it) { return it.code === 'ENL'; })[0].length;
                var enlMax = Math.pow(10, enlLength);
                enl = parseInt(extensions['ENL'], 10) / enlMax;
            }
            var fixAccuracy = extensions['FXA'] ? parseInt(extensions['FXA'], 10) : null;
            return {
                timestamp: timestamp,
                time: time,
                latitude: latitude,
                longitude: longitude,
                valid: valid,
                pressureAltitude: pressureAltitude,
                gpsAltitude: gpsAltitude,
                extensions: extensions,
                enl: enl,
                fixAccuracy: fixAccuracy,
            };
        };
        IGCParser.prototype.parseKRecord = function (line) {
            if (!this._result.date) {
                throw new Error("Missing HFDTE record before first K record");
            }
            if (!this.dataExtensions) {
                throw new Error("Missing J record before first K record");
            }
            var match = line.match(RE_K);
            if (!match) {
                throw new Error("Invalid K record at line ".concat(this.lineNumber, ": ").concat(line));
            }
            var time = "".concat(match[1], ":").concat(match[2], ":").concat(match[3]);
            var timestamp = this.calcTimestamp(time);
            var extensions = {};
            if (this.dataExtensions) {
                for (var _i = 0, _a = this.dataExtensions; _i < _a.length; _i++) {
                    var _b = _a[_i], code = _b.code, start = _b.start, length = _b.length;
                    extensions[code] = line.slice(start, start + length);
                }
            }
            return { timestamp: timestamp, time: time, extensions: extensions };
        };
        IGCParser.prototype.parseIJRecord = function (line) {
            var match = line.match(RE_IJ);
            if (!match) {
                throw new Error("Invalid ".concat(line[0], " record at line ").concat(this.lineNumber, ": ").concat(line));
            }
            var num = parseInt(match[1], 10);
            if (line.length < 3 + num * 7) {
                throw new Error("Invalid ".concat(line[0], " record at line ").concat(this.lineNumber, ": ").concat(line));
            }
            var extensions = new Array(num);
            for (var i = 0; i < num; i++) {
                var offset = 3 + i * 7;
                var start = parseInt(line.slice(offset, offset + 2), 10) - 1;
                var end = parseInt(line.slice(offset + 2, offset + 4), 10) - 1;
                var length = end - start + 1;
                var code = line.slice(offset + 4, offset + 7);
                extensions[i] = { start: start, length: length, code: code };
            }
            return extensions;
        };
        IGCParser.prototype.parseLRecord = function (line) {
            var match = line.match(RE_L);
            if (!match) {
                throw new Error("Invalid L record at line ".concat(this.lineNumber, ": ").concat(line));
            }
            return {
                code: match[1],
                message: match[2].trim()
            };
        };
        IGCParser.parseLatitude = function (dd, mm, mmm, ns) {
            var degrees = parseInt(dd, 10) + parseFloat("".concat(mm, ".").concat(mmm)) / 60;
            return (ns === 'S') ? -degrees : degrees;
        };
        IGCParser.parseLongitude = function (ddd, mm, mmm, ew) {
            var degrees = parseInt(ddd, 10) + parseFloat("".concat(mm, ".").concat(mmm)) / 60;
            return (ew === 'W') ? -degrees : degrees;
        };
        IGCParser.prototype.calcTimestamp = function (time) {
            var timestamp = Date.parse("".concat(this._result.date, "T").concat(time, "Z"));
            while (this.prevTimestamp && timestamp < this.prevTimestamp - ONE_HOUR) {
                timestamp += ONE_DAY;
            }
            return timestamp;
        };
        return IGCParser;
    }());

    // Expose l'objet complet (avec .parse) sur window.IGCParser
    window.IGCParser = IGCParser;
})(window);