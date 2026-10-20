/* =============================================================================
 *  EV CHARGING STATION SLOT OPTIMIZER
 *  Greedy Algorithm Based Smart Charging Scheduler  |  DSA Capstone, CIA 2
 *
 *  Vanilla ES6+ JavaScript. No frameworks, no backend, no build step.
 *
 *  -----------------------------------------------------------------------------
 *  LAYER MAP  (read top to bottom; each layer only talks to the ones above it)
 *
 *    L1  Constants .............. weights, presets, phase definitions, dataset
 *    L2  Utils .................. time math, formatting, escaping, DOM helpers
 *    L3  DataLayer .............. vehicle model, curated fleet, random generator
 *    L4  PriorityEngine ......... the 5 sub-scores + weighted total   O(N)
 *    L5  GreedyScheduler ........ THE ALGORITHM                       O(N log N)
 *    L6  Metrics ................ before/after statistics              O(N)
 *    L7  SimulationEngine ....... arrival + allocation animation
 *    L8  ChartFactory ........... dependency-free HTML/CSS/SVG charts
 *    L9  Renderer ............... pure DOM painting (no decisions here)
 *    L10 Visualizer ............. step-by-step trace playback
 *    L11 App .................... state, validation, event wiring, boot
 *
 *  The algorithm (L4 + L5 + L6) never touches the DOM, so it can be unit tested
 *  in Node. It is exposed on window.EVOptimizer for exactly that reason.
 * ========================================================================== */
(function () {
  'use strict';

  /* ===========================================================================
   * L1. CONSTANTS
   * ======================================================================== */

  /**
   * Station defaults shown in the configuration panel.
   */
  var DEFAULT_STATION = {
    chargingSlots: 5,
    electricityCapacity: 50,
    availablePower: 40,
    sessionDuration: 60,
    currentTime: '09:00'
  };

  var STATION_PRESETS = {
    peak:   { chargingSlots: 5,  electricityCapacity: 50, availablePower: 40, sessionDuration: 60, currentTime: '09:00' },
    night:  { chargingSlots: 8,  electricityCapacity: 75, availablePower: 60, sessionDuration: 90, currentTime: '22:30' },
    scarce: { chargingSlots: 3,  electricityCapacity: 30, availablePower: 20, sessionDuration: 45, currentTime: '13:00' },
    wide:   { chargingSlots: 12, electricityCapacity: 100, availablePower: 90, sessionDuration: 75, currentTime: '08:00' }
  };

  /**
   * Weights of the final priority score. They add up to exactly 1.00 so the
   * total stays a 0-100 number and is directly comparable with the parts.
   *   30% urgency  + 25% low battery + 20% deadline + 15% distance + 10% priority
   */
  var WEIGHTS = {
    urgency: 0.30,
    battery: 0.25,
    deadline: 0.20,
    distance: 0.15,
    priority: 0.10
  };

  /** Points awarded by the categorical vehicle priority (Emergency wins). */
  var PRIORITY_POINTS = { Emergency: 100, VIP: 70, Normal: 40 };

  /** Score bands used for badges / "Critical" filtering. */
  var BANDS = [
    { min: 80, key: 'critical', label: 'CRITICAL', color: 'var(--red)' },
    { min: 65, key: 'high', label: 'HIGH', color: 'var(--amber)' },
    { min: 50, key: 'medium', label: 'MEDIUM', color: 'var(--blue)' },
    { min: -Infinity, key: 'low', label: 'LOW', color: '#6f93a8' }
  ];

  /** The four outcomes an EV can have after the greedy pass. */
  var STATUS = {
    CHARGING: 'Charging',
    AT_RISK: 'Charging (At Risk)',
    WAITING: 'Waiting',
    DEFERRED: 'Deferred'
  };

  /**
   * The 8 phases of the greedy algorithm, shown as the animation strip.
   * Phases 3-8 repeat once per candidate EV - that loop IS the greedy loop.
   */
  var PHASES = [
    { id: 1, title: 'Calculate Priority Scores', hint: 'O(N) - score every EV' },
    { id: 2, title: 'Sort by Priority', hint: 'O(N log N) - descending' },
    { id: 3, title: 'Select Highest-Priority EV', hint: 'the greedy choice' },
    { id: 4, title: 'Check Charging Slot', hint: 'free bay available?' },
    { id: 5, title: 'Check Electricity', hint: 'requiredPower <= available?' },
    { id: 6, title: 'Allocate EV to Slot', hint: 'commit the decision' },
    { id: 7, title: 'Update Capacity', hint: 'consume slot + kW' },
    { id: 8, title: 'Select Next EV', hint: 'loop until resources end' }
  ];

  /* --------------------------- vehicle catalogue --------------------------- */
  var MODELS = [
    { name: 'Tata Nexon EV',        batteryCapacity: 40,  maxDc: 40 },
    { name: 'Tata Tigor EV',       batteryCapacity: 26,  maxDc: 25 },
    { name: 'Tata Curvv EV',       batteryCapacity: 45,  maxDc: 45 },
    { name: 'Tata Punch EV',       batteryCapacity: 30,  maxDc: 35 },
    { name: 'Mahindra XUV400 EV',  batteryCapacity: 49,  maxDc: 70 },
    { name: 'Mahindra eVerito',    batteryCapacity: 29,  maxDc: 30 },
    { name: 'MG Comet EV',         batteryCapacity: 22,  maxDc: 30 },
    { name: 'BYD e6',              batteryCapacity: 61,  maxDc: 60 },
    { name: 'Hyundai Inster',      batteryCapacity: 49,  maxDc: 70 },
    { name: 'Hyundai Kona Electric', batteryCapacity: 64, maxDc: 100 },
    { name: 'Kia EV6',             batteryCapacity: 77,  maxDc: 100 },
    { name: 'Citroen eC3',         batteryCapacity: 29,  maxDc: 30 },
    { name: 'Renault Kiger EV',    batteryCapacity: 26,  maxDc: 30 },
    { name: 'Maruti eVitara',      batteryCapacity: 61,  maxDc: 60 },
    { name: 'Lohum R744',          batteryCapacity: 50,  maxDc: 50 },
    { name: 'Ola S1 Pro',          batteryCapacity: 4,   maxDc: 8 },
    { name: 'Ather 450X',          batteryCapacity: 3.7, maxDc: 7 },
    { name: 'Hero eMoto',          batteryCapacity: 3.4, maxDc: 5 }
  ];

  /**
   * Curated 20-EV fleet. Hand-tuned so the default run produces an interesting
   * mix: 2 emergency EVs, 5 VIPs, 13 normal, and a realistic spread of
   * battery levels, distances, charging times and departure times.
   * EV-001 matches the sample record given in the assignment brief.
   */
  var CURATED_FLEET = [
    { vehicleNumber: 'EV-001', model: 'Tata Nexon EV',        batteryPercentage: 18, batteryCapacity: 40,  remainingDistance: 85,  chargingTime: 45,  requiredPower: 7,   departureTime: '10:30', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-002', model: 'Hyundai Inster',       batteryPercentage: 11, batteryCapacity: 49,  remainingDistance: 55,  chargingTime: 35,  requiredPower: 11,  departureTime: '10:00', vehiclePriority: 'Emergency' },
    { vehicleNumber: 'EV-003', model: 'MG Comet EV',          batteryPercentage: 21, batteryCapacity: 22,  remainingDistance: 40,  chargingTime: 60,  requiredPower: 6.5, departureTime: '10:15', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-004', model: 'Mahindra XUV400 EV',   batteryPercentage: 14, batteryCapacity: 49,  remainingDistance: 185, chargingTime: 50,  requiredPower: 12,  departureTime: '11:00', vehiclePriority: 'VIP' },
    { vehicleNumber: 'EV-005', model: 'BYD e6',               batteryPercentage: 7,  batteryCapacity: 61,  remainingDistance: 240, chargingTime: 75,  requiredPower: 14,  departureTime: '10:45', vehiclePriority: 'Emergency' },
    { vehicleNumber: 'EV-006', model: 'Tata Nexon EV',        batteryPercentage: 44, batteryCapacity: 40,  remainingDistance: 95,  chargingTime: 40,  requiredPower: 7,   departureTime: '13:30', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-007', model: 'Ola S1 Pro',           batteryPercentage: 23, batteryCapacity: 4,   remainingDistance: 35,  chargingTime: 40,  requiredPower: 6.5, departureTime: '10:20', vehiclePriority: 'Emergency' },
    { vehicleNumber: 'EV-008', model: 'Tata Tigor EV',        batteryPercentage: 31, batteryCapacity: 26,  remainingDistance: 70,  chargingTime: 30,  requiredPower: 6,   departureTime: '12:00', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-009', model: 'Citroen eC3',          batteryPercentage: 26, batteryCapacity: 29,  remainingDistance: 110, chargingTime: 45,  requiredPower: 9,   departureTime: '11:30', vehiclePriority: 'VIP' },
    { vehicleNumber: 'EV-010', model: 'Ather 450X',           batteryPercentage: 38, batteryCapacity: 3.7, remainingDistance: 25,  chargingTime: 55,  requiredPower: 6.5, departureTime: '12:45', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-011', model: 'Lohum R744',           batteryPercentage: 19, batteryCapacity: 50,  remainingDistance: 300, chargingTime: 90,  requiredPower: 18,  departureTime: '11:15', vehiclePriority: 'VIP' },
    { vehicleNumber: 'EV-012', model: 'Tata Curvv EV',        batteryPercentage: 33, batteryCapacity: 45,  remainingDistance: 150, chargingTime: 55,  requiredPower: 13,  departureTime: '12:15', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-013', model: 'Renault Kiger EV',     batteryPercentage: 52, batteryCapacity: 26,  remainingDistance: 60,  chargingTime: 30,  requiredPower: 6,   departureTime: '14:00', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-014', model: 'Hyundai Kona Electric', batteryPercentage: 16, batteryCapacity: 64, remainingDistance: 210, chargingTime: 65, requiredPower: 15,  departureTime: '10:40', vehiclePriority: 'VIP' },
    { vehicleNumber: 'EV-015', model: 'Mahindra eVerito',     batteryPercentage: 29, batteryCapacity: 29,  remainingDistance: 130, chargingTime: 40,  requiredPower: 8,   departureTime: '13:00', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-016', model: 'Tata Punch EV',        batteryPercentage: 9,  batteryCapacity: 30,  remainingDistance: 175, chargingTime: 60,  requiredPower: 10,  departureTime: '10:05', vehiclePriority: 'Emergency' },
    { vehicleNumber: 'EV-017', model: 'Maruti eVitara',       batteryPercentage: 63, batteryCapacity: 61,  remainingDistance: 190, chargingTime: 50,  requiredPower: 11,  departureTime: '15:00', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-018', model: 'Hero eMoto',           batteryPercentage: 25, batteryCapacity: 3.4, remainingDistance: 20,  chargingTime: 45,  requiredPower: 5,   departureTime: '11:45', vehiclePriority: 'Normal' },
    { vehicleNumber: 'EV-019', model: 'Kia EV6',              batteryPercentage: 47, batteryCapacity: 77,  remainingDistance: 260, chargingTime: 70,  requiredPower: 20,  departureTime: '13:45', vehiclePriority: 'VIP' },
    { vehicleNumber: 'EV-020', model: 'Tata Nexon EV',        batteryPercentage: 58, batteryCapacity: 40,  remainingDistance: 145, chargingTime: 35,  requiredPower: 7,   departureTime: '16:00', vehiclePriority: 'Normal' }
  ];

  /* ===========================================================================
   * L2. UTILITIES
   * ======================================================================== */

  var Utils = (function () {
    /** Smallest / largest of an array in one pass each - O(N). */
    function extent(values) {
      var min = Infinity, max = -Infinity;
      for (var i = 0; i < values.length; i += 1) {
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
      }
      return { min: min, max: max };
    }

    function clamp(value, low, high) {
      if (value < low) return low;
      if (value > high) return high;
      return value;
    }

    function round(value, places) {
      var factor = Math.pow(10, places || 0);
      return Math.round(value * factor) / factor;
    }

    function pad2(value) {
      return value < 10 ? '0' + value : String(value);
    }

    /** "09:30" -> 570 (minutes since midnight). Returns null when unparseable. */
    function timeToMinutes(hhmm) {
      if (typeof hhmm !== 'string') return null;
      var match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
      if (!match) return null;
      var hours = parseInt(match[1], 10);
      var minutes = parseInt(match[2], 10);
      if (hours > 23 || minutes > 59) return null;
      return hours * 60 + minutes;
    }

    /** 570 -> "09:30". Wraps past midnight instead of overflowing. */
    function minutesToTime(totalMinutes) {
      var wrapped = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
      return pad2(Math.floor(wrapped / 60)) + ':' + pad2(wrapped % 60);
    }

    /** 570 + 45s -> "09:30:45" for the algorithm log stamps. */
    function clockStamp(baseMinutes, seconds) {
      return minutesToTime(baseMinutes) + ':' + pad2(seconds % 60);
    }

    function formatNumber(value, places) {
      return Number(value).toFixed(places === undefined ? 2 : places);
    }

    /** Escapes every dynamic string before it is injected with innerHTML. */
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (character) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
      });
    }

    function bandFor(score) {
      for (var i = 0; i < BANDS.length; i += 1) {
        if (score >= BANDS[i].min) return BANDS[i];
      }
      return BANDS[BANDS.length - 1];
    }

    function sleep(ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    return {
      extent: extent, clamp: clamp, round: round, pad2: pad2,
      timeToMinutes: timeToMinutes, minutesToTime: minutesToTime, clockStamp: clockStamp,
      formatNumber: formatNumber, escapeHtml: escapeHtml, bandFor: bandFor, sleep: sleep
    };
  })();

  /* ===========================================================================
   * L3. DATA LAYER
   * Vehicle model + fleet sources. No logic beyond "produce valid EV records".
   * ======================================================================== */

  var DataLayer = (function () {
    var nextId = 1;

    /**
     * Builds one valid EV record. Everything is normalised here so the
     * algorithm can assume clean input.
     */
    function createVehicle(input) {
      var id = input.id !== undefined ? input.id : nextId;
      nextId = Math.max(nextId, id) + 1;
      return {
        id: id,
        vehicleNumber: input.vehicleNumber || ('EV-' + Utils.pad2(id)),
        model: input.model,
        batteryPercentage: Utils.clamp(Number(input.batteryPercentage), 0, 100),
        batteryCapacity: Number(input.batteryCapacity),
        remainingDistance: Math.max(0, Number(input.remainingDistance)),
        chargingTime: Math.max(1, Number(input.chargingTime)),
        requiredPower: Math.max(0.5, Number(input.requiredPower)),
        departureTime: input.departureTime,
        vehiclePriority: PRIORITY_POINTS[input.vehiclePriority] ? input.vehiclePriority : 'Normal',
        status: input.status || 'Waiting'
      };
    }

    /** The curated 20-EV fleet used on first load and on Reset. */
    function curatedFleet() {
      nextId = 1;
      return CURATED_FLEET.map(function (raw) {
        return createVehicle(raw);
      });
    }

    /* --------------------- randomised fleet generator --------------------- */
    /* Ranges taken from the assignment brief:
       battery 10-90%, distance 10-300 km, charging 15-120 min, power 3-22 kW. */
    var GEN = {
      battery:   [10, 90],
      distance:  [10, 300],
      charging:  [15, 120],
      power:     [3, 22],
      capacity:  [22, 77],
      departFrom: 30,   // minutes after station time
      departSpread: 420
    };

    function randomInt(range) {
      return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    }

    function randomPower(capacity) {
      // A DC charger is never asked for more than the pack can take.
      return Utils.round(Math.min(GEN.power[1], Math.max(GEN.power[0], randomInt(GEN.power) * 0.75)), 1);
    }

    /**
     * Generates `count` random but realistic EVs. Battery level is
     * correlated with distance so "flat battery + long trip" EVs appear often -
     * those are exactly the ones the greedy algorithm must pick first.
     */
    function generateFleet(count, station) {
      var base = Utils.timeToMinutes(station && station.currentTime) || 540;
      var fleet = [];
      for (var i = 0; i < count; i += 1) {
        var model = MODELS[randomInt([0, MODELS.length - 1])];
        var battery = randomInt(GEN.battery);
        var distance = randomInt(GEN.distance);
        var capacity = model.batteryCapacity;
        // low battery + long trip happens more often than by pure chance
        if (battery < 30 && Math.random() < 0.45) distance = randomInt([180, GEN.distance[1]]);
        var roll = Math.random();
        var priority = roll < 0.14 ? 'Emergency' : (roll < 0.38 ? 'VIP' : 'Normal');
        var departure = base + GEN.departFrom + randomInt([0, GEN.departSpread]);
        fleet.push(createVehicle({
          model: model.name,
          batteryPercentage: battery,
          batteryCapacity: capacity,
          remainingDistance: distance,
          chargingTime: randomInt(GEN.charging),
          requiredPower: randomPower(capacity),
          departureTime: Utils.minutesToTime(departure),
          vehiclePriority: priority
        }));
      }
      return fleet;
    }

    return { createVehicle: createVehicle, curatedFleet: curatedFleet, generateFleet: generateFleet, MODELS: MODELS };
  })();

  /* ===========================================================================
   * L4. PRIORITY ENGINE   ->   O(N) time, O(N) space
   *
   * Every component is normalised to 0-100 so the weighted sum is comparable
   * and explainable in the UI. Nothing here is random or hidden.
   * ======================================================================== */

  var PriorityEngine = (function () {
    /**
     * One O(N) pass builds the fleet-wide context needed by the normalised
     * scores (earliest/latest departure, shortest/longest trip).
     */
    function buildContext(vehicles, station) {
      var departures = new Array(vehicles.length);
      var distances = new Array(vehicles.length);
      for (var i = 0; i < vehicles.length; i += 1) {
        departures[i] = Utils.timeToMinutes(vehicles[i].departureTime);
        distances[i] = vehicles[i].remainingDistance;
      }
      var dRange = Utils.extent(departures);
      var xRange = Utils.extent(distances);
      return {
        currentTimeMin: Utils.timeToMinutes(station.currentTime),
        departureRange: dRange,
        distanceRange: xRange,
        count: vehicles.length
      };
    }

    /**
     * Min-max normalisation into 0-100.
     * When every EV has the same value the dimension cannot separate anyone,
     * so it contributes a neutral 50 instead of an arbitrary 0 or 100.
     */
    function normalise(value, range) {
      if (range.max === range.min) return 50;
      return ((value - range.min) / (range.max - range.min)) * 100;
    }

    /**
     * URGENCY (30%) - how much of the remaining time window the charge needs.
     *   timeAvailable = departure - station time
     *   ratio = chargingTime / timeAvailable  ->  0..100
     * A full 100 means the charge cannot even finish before departure, so the
     * EV must be picked immediately. Absolute earliness is handled separately
     * by the deadline score, so the two components do not overlap.
     */
    function calculateUrgencyScore(ev, context) {
      var departureMin = Utils.timeToMinutes(ev.departureTime);
      var timeAvailable = departureMin - context.currentTimeMin;
      if (timeAvailable <= 0) return 100;
      if (ev.chargingTime >= timeAvailable) return 100;
      return Utils.clamp((ev.chargingTime / timeAvailable) * 100, 0, 100);
    }

    /** LOW BATTERY (25%) - the flatter the pack, the higher the score. */
    function calculateLowBatteryScore(ev) {
      return Utils.clamp(100 - Number(ev.batteryPercentage), 0, 100);
    }

    /**
     * DEADLINE (20%) - min-max normalised departure time over the whole fleet.
     * The earliest departure always scores 100, the latest 0.
     */
    function calculateDeadlineScore(ev, context) {
      return normalise(Utils.timeToMinutes(ev.departureTime), context.departureRange);
    }

    /**
     * DISTANCE (15%) - min-max normalised remaining distance.
     * A longer remaining trip needs more energy, so it has to start charging
     * earlier. (Battery depletion itself is already covered by the low battery
     * score, so this stays a pure "how much energy is still needed".)
     */
    function calculateDistanceScore(ev, context) {
      return normalise(Number(ev.remainingDistance), context.distanceRange);
    }

    /** VEHICLE PRIORITY (10%) - Emergency 100, VIP 70, Normal 40. */
    function calculateVehiclePriorityScore(ev) {
      return PRIORITY_POINTS[ev.vehiclePriority] !== undefined
        ? PRIORITY_POINTS[ev.vehiclePriority]
        : PRIORITY_POINTS.Normal;
    }

    /**
     * The weighted total plus every intermediate value, so the UI can show
     * exactly why an EV ranked where it did.
     */
    function calculatePriorityScore(ev, context) {
      var urgency = calculateUrgencyScore(ev, context);
      var battery = calculateLowBatteryScore(ev);
      var deadline = calculateDeadlineScore(ev, context);
      var distance = calculateDistanceScore(ev, context);
      var priorityPoints = calculateVehiclePriorityScore(ev);

      var total = urgency * WEIGHTS.urgency
        + battery * WEIGHTS.battery
        + deadline * WEIGHTS.deadline
        + distance * WEIGHTS.distance
        + priorityPoints * WEIGHTS.priority;

      var departureMin = Utils.timeToMinutes(ev.departureTime);
      var timeAvailable = departureMin - context.currentTimeMin;
      var band = Utils.bandFor(total);

      // energy delivered by one full charge: kW * h = kWh
      var energyKwh = (ev.requiredPower * ev.chargingTime) / 60;
      var gainPct = ev.batteryCapacity > 0 ? (energyKwh / ev.batteryCapacity) * 100 : 0;
      var batteryAfter = Utils.clamp(ev.batteryPercentage + gainPct, 0, 100);

      return {
        ev: ev,
        id: ev.id,
        vehicleNumber: ev.vehicleNumber,
        model: ev.model,
        batteryPercentage: ev.batteryPercentage,
        batteryCapacity: ev.batteryCapacity,
        remainingDistance: ev.remainingDistance,
        chargingTime: ev.chargingTime,
        requiredPower: ev.requiredPower,
        departureTime: ev.departureTime,
        vehiclePriority: ev.vehiclePriority,
        urgency: Utils.round(urgency, 2),
        battery: Utils.round(battery, 2),
        deadline: Utils.round(deadline, 2),
        distance: Utils.round(distance, 2),
        priorityPoints: priorityPoints,
        total: Utils.round(total, 2),
        band: band.key,
        bandLabel: band.label,
        departureMin: departureMin,
        timeAvailable: timeAvailable,
        // constraint facts reused by the scheduler
        deadlineFeasible: timeAvailable >= ev.chargingTime && timeAvailable > 0,
        energyKwh: Utils.round(energyKwh, 2),
        batteryAfter: Utils.round(batteryAfter, 1),
        chargeGain: Utils.round(Math.max(0, batteryAfter - ev.batteryPercentage), 1),
        chargeProgress: (function () {
          var gap = 100 - ev.batteryPercentage;
          return gap <= 0 ? 100 : Utils.round(Utils.clamp((batteryAfter - ev.batteryPercentage) / gap, 0, 1) * 100, 1);
        })(),
        status: STATUS.WAITING,
        slotIndex: null,
        reason: '',
        waitMinutes: 0,
        sessionIndex: 1,
        startMin: null
      };
    }

    /** O(N): score every vehicle using one shared context. */
    function scoreFleet(vehicles, station) {
      var context = buildContext(vehicles, station);
      var scored = new Array(vehicles.length);
      for (var i = 0; i < vehicles.length; i += 1) {
        scored[i] = calculatePriorityScore(vehicles[i], context);
      }
      return scored;
    }

    return {
      buildContext: buildContext,
      calculateUrgencyScore: calculateUrgencyScore,
      calculateLowBatteryScore: calculateLowBatteryScore,
      calculateDeadlineScore: calculateDeadlineScore,
      calculateDistanceScore: calculateDistanceScore,
      calculateVehiclePriorityScore: calculateVehiclePriorityScore,
      calculatePriorityScore: calculatePriorityScore,
      scoreFleet: scoreFleet
    };
  })();

  /* ===========================================================================
   * L5. GREEDY SCHEDULER   ->   THE ALGORITHM
   *
   *   greedySchedule(vehicles, stationConfig)
   *
   *   1. score every EV                          O(N)
   *   2. sort EVs by descending priority score   O(N log N)
   *   3. initialise free slots + power budget     O(1)
   *   4. iterate the sorted list                 O(N)  <- the greedy loop
   *   5. check feasibility (slot, power, deadline)
   *   6. allocate the highest-priority feasible EV
   *   7. consume one slot + its kW
   *   8. stop when no EV can be allocated
   *   9. return schedule + trace + log + metrics
   *
   * GREEDY CHOICE PROPERTY
   *   At every iteration the algorithm commits the slot to the highest-priority
   *   EV that is currently feasible. Feasibility is checked in a fixed order:
   *     (1) a free slot must exist,
   *     (2) requiredPower must fit in the remaining power,
   *     (3) the charge should still finish before the departure deadline.
   *   An EV that fails only (3) cannot be fully satisfied even with the slot,
   *   so it is held in a reserve pool and only consumes leftover capacity after
   *   every deadline-satisfying EV has been considered - an empty slot would
   *   waste capacity, but a satisfied deadline is worth more.
   *
   * NOTE: greedy is NOT guaranteed to be globally optimal. It is chosen here
   * because the objective is fast, explainable, priority-driven decisions.
   * ======================================================================== */

  var GreedyScheduler = (function () {

    /**
     * The single greedy pass. Both the main run and the "what would happen in
     * the next session" projection call this same function, so the rule can
     * never drift between the two.
     *
     * candidates : records already sorted into the order the scheduler should
     *              consider them (priority order for greedy, arrival order for
     *              the FCFS baseline).
     * env        : { station, context, mode }
     *              mode 'primary'    -> writes the live schedule fields
     *              mode 'projection' -> writes only projected* fields, so a
     *                                   queued EV never looks like it is
     *                                   charging in the current session.
     * onEvent    : optional callback used to record the algorithm trace.
     */
    function runPass(candidates, env, onEvent) {
      var station = env.station;
      var context = env.context;
      var primary = env.mode !== 'projection';
      var emit = typeof onEvent === 'function' ? onEvent : function () {};

      var resources = {
        freeSlots: station.chargingSlots,
        powerLeft: station.availablePower,
        nextSlot: 0
      };

      var allocated = [];
      var reserve = [];
      var waiting = [];
      var deferred = [];

      function allocate(record, status) {
        var slot = resources.nextSlot;
        resources.nextSlot += 1;
        resources.freeSlots -= 1;
        resources.powerLeft = Utils.round(resources.powerLeft - record.requiredPower, 2);
        record.startMin = context.currentTimeMin;
        record.finishMin = context.currentTimeMin + record.chargingTime;
        record.deadlineViolation = record.finishMin > record.departureMin;
        if (primary) {
          record.slotIndex = slot;
          record.status = status;
          record.served = true;
          record.projected = false;
          record.reason = status === STATUS.AT_RISK
            ? 'Leftover capacity used - the charge will finish after the departure time'
            : 'Allocated by greedy choice (highest priority score)';
        } else {
          // projection: keep the live fields untouched
          record.projected = true;
          record.projectedSlot = slot;
          record.projectedStatus = status;
        }
        allocated.push(record);
        emit('allocate', { record: record, slot: slot, status: status, resources: resources });
        emit('update', { record: record, slot: slot, resources: resources });
        return record;
      }

      function queue(record, reason) {
        record.queuePosition = waiting.length;
        if (primary) {
          record.status = STATUS.WAITING;
          record.served = false;
          record.reason = reason;
        }
        waiting.push(record);
        emit('queue', { record: record, reason: reason, resources: resources });
      }

      function defer(record, reason) {
        record.queuePosition = waiting.length + deferred.length;
        if (primary) {
          record.status = STATUS.DEFERRED;
          record.served = false;
          record.reason = reason;
        }
        deferred.push(record);
        emit('defer', { record: record, reason: reason, resources: resources });
      }

      function processCandidate(record) {
        // --- Constraint pre-filter: impossible for this session, so it must
        //     never take a slot away from an EV that can be served.
        if (record.departureMin <= context.currentTimeMin) {
          defer(record, 'Departure deadline has already passed at station time ' + station.currentTime);
          return;
        }
        if (record.requiredPower > station.availablePower) {
          defer(record, 'Required power ' + record.requiredPower + ' kW exceeds the whole session power budget of ' + station.availablePower + ' kW');
          return;
        }

        // --- Greedy loop body ------------------------------------------------
        emit('select', { record: record, resources: resources });

        if (resources.freeSlots === 0) {
          queue(record, 'All ' + station.chargingSlots + ' charging slots are already occupied');
          return;
        }

        emit('slot-check', { record: record, resources: resources });

        if (record.requiredPower > resources.powerLeft) {
          emit('power-fail', { record: record, resources: resources });
          queue(record, 'Needs ' + record.requiredPower + ' kW but only ' + resources.powerLeft + ' kW of power is left this session');
          return;
        }

        emit('power-check', { record: record, resources: resources });

        if (!record.deadlineFeasible) {
          reserve.push(record);
          emit('hold', { record: record, resources: resources });
          return;
        }

        allocate(record, STATUS.CHARGING);
      }

      for (var i = 0; i < candidates.length; i += 1) {
        processCandidate(candidates[i]);
        if (i < candidates.length - 1) {
          emit('next', { next: candidates[i + 1], position: i + 1, resources: resources });
        }
      }

      // --- Reserve pass: leftover capacity goes to deadline-at-risk EVs ------
      for (var r = 0; r < reserve.length; r += 1) {
        var held = reserve[r];
        emit('select', { record: held, resources: resources, reserve: true });
        if (resources.freeSlots === 0) {
          queue(held, 'Reserved in the at-risk pool, but all charging slots are now occupied');
          continue;
        }
        if (held.requiredPower > resources.powerLeft) {
          emit('power-fail', { record: held, resources: resources });
          queue(held, 'Needs ' + held.requiredPower + ' kW but only ' + resources.powerLeft + ' kW of leftover power is left');
          continue;
        }
        allocate(held, STATUS.AT_RISK);
      }

      return {
        allocated: allocated,
        waiting: waiting,
        deferred: deferred,
        reserve: reserve,
        resources: resources,
        powerUsed: Utils.round(station.availablePower - resources.powerLeft, 2),
        slotsUsed: station.chargingSlots - resources.freeSlots
      };
    }

    /**
     * Sorts records by descending priority score.
     * Ties are broken by lower battery, then earlier departure, then lower id -
     * so the ordering is always deterministic and explainable.
     * O(N log N) comparison sort; each comparison is O(1).
     */
    function sortVehiclesByPriority(records) {
      return records.slice().sort(function (a, b) {
        if (b.total !== a.total) return b.total - a.total;                 // primary key
        if (a.batteryPercentage !== b.batteryPercentage) {
          return a.batteryPercentage - b.batteryPercentage;                // flatter battery first
        }
        if (a.departureMin !== b.departureMin) return a.departureMin - b.departureMin; // earlier departure first
        return a.id - b.id;
      });
    }

    /**
     * Projects the greedy rule forward for the vehicles that could not be
     * served this session, so the timeline can show a realistic next session
     * and the waiting-time metric has a real number instead of a guess.
     * Same pass, same constraints - only the clock and budget move on.
     */
    function projectRemaining(pending, station, context, startMin, maxSessions) {
      var scheduled = [];
      var queue = pending.slice();
      var clock = startMin;
      var limit = maxSessions || 2;
      for (var session = 1; session <= limit && queue.length; session += 1) {
        var passEnv = {
          station: station,
          context: {
            currentTimeMin: clock,
            departureRange: context.departureRange,
            distanceRange: context.distanceRange,
            count: context.count
          },
          mode: 'projection'
        };
        var pass = runPass(queue, passEnv, null);
        if (!pass.allocated.length) break;
        var longest = 0;
        for (var i = 0; i < pass.allocated.length; i += 1) {
          var record = pass.allocated[i];
          record.sessionIndex = session + 1;
          longest = Math.max(longest, record.chargingTime);
          scheduled.push(record);
        }
        clock += Math.max(station.sessionDuration, longest);
        queue = pass.waiting.concat(pass.deferred);
      }
      return { scheduled: scheduled, unscheduled: queue, endMin: clock };
    }

    /**
     * FIRST-COME-FIRST-SERVED BASELINE.
     * Identical constraints, identical pass - the ONLY difference is that
     * candidates are considered in arrival order instead of priority order.
     * That isolates the greedy choice as the reason for every improvement.
     */
    function firstComeFirstServed(vehicles, station) {
      var context = PriorityEngine.buildContext(vehicles, station);
      var scored = PriorityEngine.scoreFleet(vehicles, station);
      var byArrival = scored.slice().sort(function (a, b) { return a.id - b.id; });
      return runPass(byArrival, { station: station, context: context, mode: 'primary' }, null);
    }

    /**
     * MAIN ENTRY POINT - runs the complete greedy algorithm and returns
     * everything the UI needs: the schedule, the teaching trace, the log
     * lines and the before/after metrics.
     */
    function greedySchedule(vehicles, stationConfig) {
      var log = [];
      var trace = [];
      var context = PriorityEngine.buildContext(vehicles, stationConfig);
      var scored = PriorityEngine.scoreFleet(vehicles, stationConfig);
      var sorted = sortVehiclesByPriority(scored);

      var numberToVehicle = {};
      sorted.forEach(function (item) { numberToVehicle[item.id] = item.vehicleNumber; });

      var second = 0;
      function logIt(level, message) {
        log.push({ time: Utils.clockStamp(context.currentTimeMin, second), level: level, message: message });
        second += 1;
      }
      function step(phase, title, detail, extra) {
        var entry = { phase: phase, title: title, detail: detail, logUpTo: log.length };
        if (extra) {
          for (var key in extra) { if (Object.prototype.hasOwnProperty.call(extra, key)) entry[key] = extra[key]; }
        }
        // attach the readable vehicle number so the UI never has to look it up
        if (entry.evId !== undefined && numberToVehicle[entry.evId]) {
          entry.evNumber = numberToVehicle[entry.evId];
        }
        trace.push(entry);
        return entry;
      }

      // ---------------------------- PHASE 1 ----------------------------
      logIt('info', 'Starting greedy optimization...');
      logIt('info', 'Station clock ' + stationConfig.currentTime + ' | ' + stationConfig.chargingSlots
        + ' slots | ' + stationConfig.availablePower + ' kW of ' + stationConfig.electricityCapacity + ' kW available.');
      logIt('info', 'Calculating priority scores for ' + vehicles.length + ' EVs...');
      step(1, 'Calculate priority scores for every EV', [
        'Each EV is scored on 5 normalised components (0-100).',
        'Weights: Urgency 30% | Low Battery 25% | Deadline 20% | Distance 15% | Vehicle Priority 10%.',
        'This pass is O(N) - one fleet scan for the min/max context, then one pass to score.'
      ], { emphasis: true, resources: { freeSlots: stationConfig.chargingSlots, powerLeft: stationConfig.availablePower } });

      for (var s = 0; s < sorted.length; s += 1) {
        var r = sorted[s];
        logIt('hl', r.vehicleNumber + ' -> Priority ' + Utils.formatNumber(r.total, 2)
          + '  (urgency ' + Utils.formatNumber(r.urgency, 1)
          + ', battery ' + Utils.formatNumber(r.battery, 1)
          + ', deadline ' + Utils.formatNumber(r.deadline, 1)
          + ', distance ' + Utils.formatNumber(r.distance, 1)
          + ', vehicle ' + r.priorityPoints + ')');
        step(1, r.vehicleNumber + ' scored ' + Utils.formatNumber(r.total, 2), [
          'Urgency <b>' + Utils.formatNumber(r.urgency, 1) + '</b> &times; 0.30 = <b>' + Utils.formatNumber(r.urgency * WEIGHTS.urgency, 2) + '</b> &nbsp;|&nbsp; '
            + r.chargingTime + ' min charge, ' + r.timeAvailable + ' min until it leaves at ' + r.departureTime,
          'Low Battery <b>' + Utils.formatNumber(r.battery, 1) + '</b> &times; 0.25 = <b>' + Utils.formatNumber(r.battery * WEIGHTS.battery, 2) + '</b> &nbsp;|&nbsp; '
            + 'pack at ' + r.batteryPercentage + '% (100 - ' + r.batteryPercentage + ')',
          'Deadline <b>' + Utils.formatNumber(r.deadline, 1) + '</b> &times; 0.20 = <b>' + Utils.formatNumber(r.deadline * WEIGHTS.deadline, 2) + '</b> &nbsp;|&nbsp; '
            + 'leaves at ' + r.departureTime + (r.deadlineFeasible ? ' - can finish in time' : ' - cannot finish in time'),
          'Distance <b>' + Utils.formatNumber(r.distance, 1) + '</b> &times; 0.15 = <b>' + Utils.formatNumber(r.distance * WEIGHTS.distance, 2) + '</b> &nbsp;|&nbsp; '
            + r.remainingDistance + ' km still to cover',
          'Vehicle Priority <b>' + r.priorityPoints + '</b> &times; 0.10 = <b>' + Utils.formatNumber(r.priorityPoints * WEIGHTS.priority, 2) + '</b> &nbsp;|&nbsp; '
            + r.vehiclePriority,
          'Total priority score: <b>' + Utils.formatNumber(r.total, 2) + '</b> / 100'
        ], { evId: r.id, queuePosition: s, resources: { freeSlots: stationConfig.chargingSlots, powerLeft: stationConfig.availablePower } });
      }

      // ---------------------------- PHASE 2 ----------------------------
      logIt('info', 'Sorting ' + sorted.length + ' EVs by descending priority score...');
      step(2, 'Sort EVs by descending priority score', [
        'Comparison sort, O(N log N) - this is the dominant cost of the whole algorithm.',
        'Ties are broken by lower battery %, then earlier departure, then lower id.',
        'Order: ' + sorted.slice(0, 6).map(function (item) { return item.vehicleNumber + '(' + Utils.formatNumber(item.total, 1) + ')'; }).join('  >  ')
          + (sorted.length > 6 ? '  >  ...' : '')
      ], { emphasis: true });

      // ---------------------- PHASES 3-8: greedy loop ----------------------
      logIt('info', 'Entering the greedy allocation loop.');

      var onEvent = function (type, data) {
        var record = data.record;
        var res = data.resources || { freeSlots: stationConfig.chargingSlots, powerLeft: stationConfig.availablePower };

        if (type === 'select') {
          logIt('hl', 'Selecting ' + record.vehicleNumber + ' (priority ' + Utils.formatNumber(record.total, 2) + ')'
            + (data.reserve ? ' from the at-risk reserve pool' : '') + '...');
          step(3, 'Select ' + record.vehicleNumber + ' - highest priority score', [
            record.vehicleNumber + ' is next in the sorted priority list with score <b>' + Utils.formatNumber(record.total, 2) + '</b>.',
            'Battery ' + record.batteryPercentage + '% | needs ' + record.requiredPower + ' kW for ' + record.chargingTime + ' min | leaves at ' + record.departureTime + '.',
            data.reserve
              ? 'This EV could not meet its deadline, so it only gets capacity left over after every deadline-satisfying EV.'
              : 'It is the local optimum right now: no unprocessed EV has a higher score.'
          ], { evId: record.id, queuePosition: data.position, resources: res, emphasis: !!data.reserve });
        }

        if (type === 'slot-check') {
          logIt('info', 'Checking slot availability...');
          step(4, 'Check charging slot availability', [
            'Free slots: <b>' + res.freeSlots + '</b> of ' + stationConfig.chargingSlots + '.',
            res.freeSlots > 0
              ? 'Slot ' + (res.nextSlot + 1) + ' is free, so the slot constraint passes.'
              : 'No free slot, so this EV cannot be started.'
          ], { evId: record.id, resources: res });
        }

        if (type === 'power-check') {
          logIt('info', 'Checking power availability...');
          step(5, 'Check electricity availability', [
            'Required power: <span class="mono">' + record.requiredPower + ' kW</span>.',
            'Available power: <span class="mono">' + Utils.formatNumber(res.powerLeft, 2) + ' kW</span>.',
            'Feasible: ' + record.requiredPower + ' &le; ' + Utils.formatNumber(res.powerLeft, 2) + ' - the power constraint passes.',
            'Session capacity: ' + stationConfig.electricityCapacity + ' kW, ' + Utils.formatNumber(stationConfig.availablePower, 2) + ' kW was free at the start.'
          ], { evId: record.id, resources: res });
        }

        if (type === 'power-fail') {
          logIt('warn', 'Insufficient power for ' + record.vehicleNumber + ': needs ' + record.requiredPower
            + ' kW but only ' + Utils.formatNumber(res.powerLeft, 2) + ' kW is left. Moving it to the waiting queue.');
          step(5, 'Insufficient power for ' + record.vehicleNumber, [
            'Required power <span class="mono">' + record.requiredPower + ' kW</span> but only <span class="mono">'
              + Utils.formatNumber(res.powerLeft, 2) + ' kW</span> is left.',
            'The greedy choice must be feasible, so this EV is skipped and queued instead.',
            'Its priority score of <b>' + Utils.formatNumber(record.total, 2) + '</b> does not override the power constraint.'
          ], { evId: record.id, resources: res, emphasis: true });
        }

        if (type === 'hold') {
          logIt('warn', record.vehicleNumber + ' cannot finish before its ' + record.departureTime
            + ' deadline (' + record.chargingTime + ' min needed, ' + record.timeAvailable + ' min left). Held in the at-risk pool.');
          step(6, 'Hold ' + record.vehicleNumber + ' - deadline cannot be met', [
            'A full charge needs ' + record.chargingTime + ' min but only ' + record.timeAvailable + ' min remain before ' + record.departureTime + '.',
            'Allocating now would still make it late, so the slot is held for an EV that can meet its deadline.',
            'If capacity is left at the end, ' + record.vehicleNumber + ' gets it as a partial (at-risk) charge.'
          ], { evId: record.id, resources: res });
        }

        if (type === 'allocate') {
          logIt('ok', record.vehicleNumber + ' allocated to Slot ' + (data.slot + 1) + ' [' + data.status + '].');
          step(6, 'Allocate ' + record.vehicleNumber + ' to Slot ' + (data.slot + 1), [
            'Allocation successful: <b>' + record.vehicleNumber + '</b> took Slot ' + (data.slot + 1)
              + ' because it had the highest feasible priority score of <b>' + Utils.formatNumber(record.total, 2) + '</b>.',
            'Status: <b>' + data.status + '</b> | charge ' + record.chargingTime + ' min at ' + record.requiredPower
              + ' kW delivers ' + record.energyKwh + ' kWh (' + record.batteryPercentage + '% &rarr; ' + record.batteryAfter + '%).',
            'Finishes at <b>' + Utils.minutesToTime(record.finishMin) + '</b>'
              + (record.deadlineViolation ? ' - after its ' + record.departureTime + ' departure, flagged as at-risk.' : ', before its ' + record.departureTime + ' departure.')
          ], { evId: record.id, slotIndex: data.slot, resources: res, emphasis: true });
        }

        if (type === 'update') {
          logIt('info', 'Remaining power: ' + Utils.formatNumber(res.powerLeft, 2) + ' kW. Free slots: ' + res.freeSlots + '.');
          step(7, 'Update remaining capacity', [
            'Power left: <b>' + Utils.formatNumber(res.powerLeft, 2) + ' kW</b> (was ' + Utils.formatNumber(stationConfig.availablePower, 2) + ' kW, spent ' + record.requiredPower + ' kW on ' + record.vehicleNumber + ').',
            'Free slots: <b>' + res.freeSlots + '</b> of ' + stationConfig.chargingSlots + '.',
            'This is the O(1) greedy state update - the next iteration uses these numbers.'
          ], { evId: record.id, resources: res });
        }

        if (type === 'next') {
          step(8, 'Select the next EV', [
            'Back to step 3 for the next candidate: <b>' + data.next.vehicleNumber + '</b> with priority score <b>'
              + Utils.formatNumber(data.next.total, 2) + '</b>.',
            'Position ' + data.position + ' of ' + sorted.length + ' processed. Free slots: ' + res.freeSlots
              + ', power left: ' + Utils.formatNumber(res.powerLeft, 2) + ' kW.'
          ], { evId: data.next.id, queuePosition: data.position, resources: res });
        }

        if (type === 'queue') {
          logIt('warn', record.vehicleNumber + ' placed in the waiting queue - ' + data.reason + '.');
          step(8, record.vehicleNumber + ' joins the waiting queue', [
            'Not served this session: ' + data.reason + '.',
            'The greedy loop moves on to the next-highest priority score.',
            'Remaining resources: ' + res.freeSlots + ' free slots, ' + Utils.formatNumber(res.powerLeft, 2) + ' kW left.'
          ], { evId: record.id, resources: res });
        }

        if (type === 'defer') {
          logIt('bad', record.vehicleNumber + ' deferred (rejected) - ' + data.reason + '.');
          step(8, record.vehicleNumber + ' deferred (rejected)', [
            'This EV cannot be charged in this session: ' + data.reason + '.',
            'The pre-filter removes it before the greedy loop so it never wastes a slot.'
          ], { evId: record.id, resources: res, emphasis: true });
        }
      };

      var result = runPass(sorted, { station: stationConfig, context: context, mode: 'primary' }, onEvent);

      // ----------------- projection for the waiting queue -----------------
      var pending = result.waiting.concat(result.deferred);
      var projection = projectRemaining(pending, stationConfig, context, context.currentTimeMin, 2);
      for (var p = 0; p < projection.scheduled.length; p += 1) {
        projection.scheduled[p].waitMinutes = projection.scheduled[p].startMin - context.currentTimeMin;
      }
      for (var u = 0; u < projection.unscheduled.length; u += 1) {
        // still not scheduled inside the projection window: assume two sessions
        projection.unscheduled[u].waitMinutes = stationConfig.sessionDuration * 2;
        projection.unscheduled[u].sessionIndex = 3;
      }

      // ---------------------------- summary ----------------------------
      var avgTotal = 0;
      for (var a = 0; a < sorted.length; a += 1) avgTotal += sorted[a].total;
      avgTotal = sorted.length ? avgTotal / sorted.length : 0;

      logIt('info', 'Greedy allocation complete. Selected ' + result.allocated.length + ', waiting '
        + result.waiting.length + ', deferred ' + result.deferred.length + '.');
      logIt('info', 'Slots used: ' + result.slotsUsed + '/' + stationConfig.chargingSlots
        + '. Power used: ' + Utils.formatNumber(result.powerUsed, 2) + ' of ' + stationConfig.availablePower + ' kW.');
      logIt('info', 'Overall complexity O(N log N) (dominated by the sort), space O(N).');

      step(8, 'Greedy allocation complete', [
        'Selected (charging now): <b>' + result.allocated.length + '</b> - ' + result.allocated.map(function (item) { return item.vehicleNumber; }).join(', ') || 'none',
        'Waiting for a later session: <b>' + result.waiting.length + '</b> - ' + result.waiting.map(function (item) { return item.vehicleNumber; }).slice(0, 8).join(', ') + (result.waiting.length > 8 ? ', ...' : ''),
        'Deferred / rejected: <b>' + result.deferred.length + '</b> - ' + result.deferred.map(function (item) { return item.vehicleNumber; }).join(', '),
        'Slots used <b>' + result.slotsUsed + '/' + stationConfig.chargingSlots + '</b>, power used <b>'
          + Utils.formatNumber(result.powerUsed, 2) + '/' + Utils.formatNumber(stationConfig.availablePower, 2) + ' kW</b>, average priority '
          + Utils.formatNumber(avgTotal, 2) + '.',
        'Stop condition reached: no remaining EV can be charged with the slots or power that are left.'
      ], { emphasis: true, isSummary: true, resources: result.resources });

      return {
        station: stationConfig,
        context: context,
        ranked: sorted,
        allocated: result.allocated,
        waiting: result.waiting,
        deferred: result.deferred,
        reserve: result.reserve,
        resources: result.resources,
        powerUsed: result.powerUsed,
        slotsUsed: result.slotsUsed,
        trace: trace,
        log: log,
        projection: projection,
        averageScore: Utils.round(avgTotal, 2)
      };
    }

    return {
      greedySchedule: greedySchedule,
      runPass: runPass,
      sortVehiclesByPriority: sortVehiclesByPriority,
      projectRemaining: projectRemaining,
      firstComeFirstServed: firstComeFirstServed
    };
  })();

  /* ===========================================================================
   * L6. METRICS  ->  O(N)
   * Produces the "before / after" comparison numbers. Both sides are measured
   * with the exact same function so the difference is meaningful.
   * ======================================================================== */

  var Metrics = (function () {
    function isUrgent(record) {
      return record.band === 'critical' || record.vehiclePriority === 'Emergency';
    }

    /**
     * Single O(N) pass over every EV of the run. The same function measures the
     * greedy schedule and the FCFS baseline, so the comparison is fair.
     */
    function compute(pass, station) {
      var allocated = pass.allocated || [];
      var waiting = pass.waiting || [];
      var deferred = pass.deferred || [];
      var everyone = allocated.concat(waiting, deferred);
      var activeSlots = allocated.length || 1;
      var sessionDuration = station.sessionDuration || 60;

      var sumPriority = 0;
      var sumServedPriority = 0;
      var waitTotal = 0;
      var urgentTotal = 0;
      var urgentServed = 0;
      var violations = 0;
      var i;

      for (i = 0; i < allocated.length; i += 1) {
        sumPriority += allocated[i].total;
        sumServedPriority += allocated[i].total;
        if (allocated[i].deadlineViolation) violations += 1;
        if (isUrgent(allocated[i])) { urgentTotal += 1; urgentServed += 1; }
      }

      for (i = 0; i < waiting.length + deferred.length; i += 1) {
        var record = everyone[allocated.length + i];
        sumPriority += record.total;
        if (isUrgent(record)) urgentTotal += 1;
        // queue position -> how many whole sessions it must sit out
        var rounds = Math.floor(i / activeSlots) + 1;
        waitTotal += rounds * sessionDuration;
      }

      var powerUsed = pass.powerUsed || 0;
      var slotsUsed = pass.slotsUsed || 0;

      return {
        total: everyone.length,
        served: allocated.length,
        waiting: waiting.length,
        deferred: deferred.length,
        powerUsed: Utils.round(powerUsed, 2),
        powerBudget: station.availablePower,
        powerUtil: station.availablePower > 0 ? Utils.round((powerUsed / station.availablePower) * 100, 1) : 0,
        slotsUsed: slotsUsed,
        slotsTotal: station.chargingSlots,
        slotsUtil: station.chargingSlots > 0 ? Utils.round((slotsUsed / station.chargingSlots) * 100, 1) : 0,
        averagePriority: everyone.length ? Utils.round(sumPriority / everyone.length, 2) : 0,
        averagePriorityServed: allocated.length ? Utils.round(sumServedPriority / allocated.length, 2) : 0,
        urgentTotal: urgentTotal,
        urgentServed: urgentServed,
        urgentRate: urgentTotal > 0 ? Utils.round((urgentServed / urgentTotal) * 100, 1) : 0,
        deadlineViolations: violations,
        averageWait: everyone.length ? Utils.round(waitTotal / everyone.length, 1) : 0
      };
    }

    /** The FCFS "before optimization" baseline. */
    function baseline(vehicles, station) {
      var pass = GreedyScheduler.firstComeFirstServed(vehicles, station);
      return { pass: pass, metrics: compute(pass, station) };
    }

    return { compute: compute, baseline: baseline, isUrgent: isUrgent };
  })();

  /* ===========================================================================
   * L7. SIMULATION ENGINE
   * Animates EV arrivals, then the slot filling. Purely presentational timing;
   * it never decides anything.
   * ======================================================================== */

  var SimulationEngine = (function () {
    function isCancelled(token) {
      return token !== App.token;
    }

    /** One EV arriving at a time, chip by chip. */
    async function playArrivals(vehicles, token) {
      for (var i = 0; i < vehicles.length; i += 1) {
        if (isCancelled(token)) return false;
        Renderer.pushArrival(vehicles[i], i);
        await Utils.sleep(95);
      }
      return !isCancelled(token);
    }

    /** Highlights each occupied slot one after another. */
    async function playAllocation(result, token) {
      for (var i = 0; i < result.allocated.length; i += 1) {
        if (isCancelled(token)) return false;
        Renderer.highlightSlot(result.allocated[i].slotIndex);
        await Utils.sleep(190);
      }
      return !isCancelled(token);
    }

    return { playArrivals: playArrivals, playAllocation: playAllocation };
  })();

  /* ===========================================================================
   * L8. CHART FACTORY  (HTML / CSS / SVG only - no library)
   * ======================================================================== */

  var ChartFactory = (function () {
    var SVG_NS = 'http://www.w3.org/2000/svg';

    function svgEl(name, attributes) {
      var node = document.createElementNS(SVG_NS, name);
      for (var key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
          node.setAttribute(key, attributes[key]);
        }
      }
      return node;
    }

    /** Horizontal bar chart of the priority score of every EV. */
    function renderPriorityBars(container, ranked, allocatedIds) {
      if (!container) return;
      var max = ranked.length ? ranked[0].total : 1;
      var html = ranked.map(function (record, index) {
        var width = max > 0 ? (record.total / max) * 100 : 0;
        var colour = index === 0
          ? 'linear-gradient(90deg,#25f5a0,#35d6f5)'
          : 'linear-gradient(90deg,#1d6f8c,#4d8dff)';
        return '<div class="bar-row' + (index === 0 ? ' is-top' : '')
          + (allocatedIds && allocatedIds.indexOf(record.id) !== -1 ? ' is-alloc' : '') + '">'
          + '<span class="lbl">' + Utils.escapeHtml(record.vehicleNumber) + '</span>'
          + '<span class="bar-track"><i style="width:' + width.toFixed(1) + '%;background:' + colour + '"></i></span>'
          + '<span class="val">' + Utils.formatNumber(record.total, 1) + '</span>'
          + '</div>';
      }).join('');
      container.innerHTML = html || '<p class="empty-note">No data.</p>';
    }

    /** Battery level heat-grid. */
    function renderBatteryGrid(container, records) {
      if (!container) return;
      var ordered = records.slice().sort(function (a, b) { return a.batteryPercentage - b.batteryPercentage; });
      container.innerHTML = ordered.map(function (record) {
        var level = record.batteryPercentage < 20 ? 'low' : (record.batteryPercentage < 45 ? 'mid' : 'ok');
        return '<div class="batt-cell lvl-' + level + '" title="' + Utils.escapeHtml(record.model) + '">'
          + '<div class="b-id">' + Utils.escapeHtml(record.vehicleNumber) + '</div>'
          + '<div class="b-pct">' + record.batteryPercentage + '%</div>'
          + '<div class="b-bar"><i style="width:' + record.batteryPercentage + '%"></i></div>'
          + '</div>';
      }).join('');
    }

    /** Progress ring for slot utilisation. */
    function renderRing(container, percent, centerValue, centerLabel, color) {
      if (!container) return;
      var radius = 68;
      var circumference = 2 * Math.PI * radius;
      var filled = (Utils.clamp(percent, 0, 100) / 100) * circumference;
      var svg = svgEl('svg', { viewBox: '0 0 160 160', width: '160', height: '160' });
      svg.appendChild(svgEl('circle', { class: 'ring-bg', cx: 80, cy: 80, r: radius, fill: 'none', 'stroke-width': 14 }));
      svg.appendChild(svgEl('circle', {
        class: 'ring-fg', cx: 80, cy: 80, r: radius, fill: 'none', 'stroke-width': 14,
        stroke: color || 'var(--green)',
        'stroke-dasharray': filled.toFixed(2) + ' ' + (circumference - filled).toFixed(2)
      }));
      container.innerHTML = '';
      var ring = document.createElement('div');
      ring.className = 'ring';
      ring.appendChild(svg);
      var centre = document.createElement('div');
      centre.className = 'ring-center';
      centre.innerHTML = '<div class="big" style="color:' + (color || 'var(--green)') + '">' + centerValue + '</div>'
        + '<div class="small">' + Utils.escapeHtml(centerLabel) + '</div>';
      ring.appendChild(centre);
      container.appendChild(ring);
    }

    /** Multi-segment donut for the status distribution. */
    function renderDonut(container, segments) {
      if (!container) return;
      var radius = 68;
      var circumference = 2 * Math.PI * radius;
      var total = segments.reduce(function (a, b) { return a + b.value; }, 0);
      var svg = svgEl('svg', { viewBox: '0 0 160 160', width: '160', height: '160' });
      svg.appendChild(svgEl('circle', { class: 'ring-bg', cx: 80, cy: 80, r: radius, fill: 'none', 'stroke-width': 16 }));
      if (total > 0) {
        var offset = 0;
        segments.forEach(function (segment) {
          if (!segment.value) return;
          var length = (segment.value / total) * circumference;
          svg.appendChild(svgEl('circle', {
            class: 'ring-fg', cx: 80, cy: 80, r: radius, fill: 'none', 'stroke-width': 16,
            stroke: segment.color,
            'stroke-dasharray': Math.max(0, length - 2).toFixed(2) + ' ' + (circumference - Math.max(0, length - 2)).toFixed(2),
            'stroke-dashoffset': (-offset).toFixed(2)
          }));
          offset += length;
        });
      }
      container.innerHTML = '';
      var ring = document.createElement('div');
      ring.className = 'ring';
      ring.appendChild(svg);
      var centre = document.createElement('div');
      centre.className = 'ring-center';
      centre.innerHTML = '<div class="big" style="color:var(--text)">' + total + '</div><div class="small">EVs</div>';
      ring.appendChild(centre);
      container.appendChild(ring);
    }

    return {
      renderPriorityBars: renderPriorityBars,
      renderBatteryGrid: renderBatteryGrid,
      renderRing: renderRing,
      renderDonut: renderDonut
    };
  })();

  /* ===========================================================================
   * L9. RENDERER
   * Reads the scheduler output and paints it. Contains no decisions.
   * ======================================================================== */

  var Renderer = (function () {
    function byId(id) { return document.getElementById(id); }

    function priorityBadgeHtml(priority) {
      var key = String(priority).toLowerCase();
      return '<span class="badge badge-prio-' + key + '">' + Utils.escapeHtml(priority) + '</span>';
    }

    function bandBadgeHtml(record) {
      return '<span class="badge badge-' + record.band + '">' + record.bandLabel + '</span>';
    }

    function statusBadgeHtml(status) {
      var map = {};
      map[STATUS.CHARGING] = 'badge-charging';
      map[STATUS.AT_RISK] = 'badge-atrisk';
      map[STATUS.WAITING] = 'badge-waiting';
      map[STATUS.DEFERRED] = 'badge-deferred';
      return '<span class="badge ' + (map[status] || 'badge-waiting') + '">' + Utils.escapeHtml(status) + '</span>';
    }

    /* ------------------------------- KPIs ------------------------------- */
    function renderKPIs(result, metrics) {
      var station = result.station;
      byId('kpiTotal').textContent = result.ranked.length;
      byId('kpiSlotsFree').textContent = result.resources.freeSlots;
      byId('kpiSlotsTotal').textContent = 'of ' + station.chargingSlots + ' slots';
      byId('kpiSlotsUsed').textContent = result.slotsUsed;
      byId('kpiSlotsUsedPct').textContent = metrics.slotsUtil + '% utilisation';
      byId('kpiPower').innerHTML = Utils.formatNumber(result.resources.powerLeft, 1) + '<span class="kpi-unit">kW</span>';
      byId('kpiPowerTotal').textContent = 'of ' + station.electricityCapacity + ' kW capacity';
      byId('kpiCharging').textContent = result.allocated.length;
      byId('kpiChargingIds').textContent = result.allocated.length
        ? result.allocated.map(function (r) { return r.vehicleNumber; }).join(', ')
        : 'no EV charging';
      byId('kpiWaiting').textContent = result.waiting.length;
      byId('kpiDeferred').textContent = result.deferred.length + ' deferred';
      byId('kpiAvgScore').textContent = Utils.formatNumber(result.averageScore, 1);
      byId('kpiAvgAllocated').textContent = 'allocated avg ' + Utils.formatNumber(metrics.averagePriorityServed, 1);
      byId('kpiUtil').innerHTML = metrics.powerUtil + '<span class="kpi-unit">%</span>';
      byId('kpiViolations').textContent = metrics.deadlineViolations + ' deadline violations';
      byId('headerClock').textContent = station.currentTime;
    }

    /* --------------------------- slot cards --------------------------- */
    function renderSlots(result) {
      var grid = byId('slotGrid');
      var station = result.station;
      var bySlot = {};
      result.allocated.forEach(function (record) { bySlot[record.slotIndex] = record; });

      var html = '';
      for (var slot = 0; slot < station.chargingSlots; slot += 1) {
        var record = bySlot[slot];
        if (!record) {
          html += '<article class="slot is-free">'
            + '<div class="slot-head"><span class="slot-name">Slot ' + (slot + 1) + '</span><span class="slot-ev">AVAILABLE</span></div>'
            + '<div class="slot-empty">No EV assigned<br><small>greedy choice pending</small></div>'
            + '</article>';
          continue;
        }
        var critical = record.batteryPercentage < 20;
        var barClass = record.batteryPercentage < 20 ? 'is-low' : (record.batteryPercentage < 45 ? 'is-mid' : '');
        html += '<article class="slot ' + (record.status === STATUS.AT_RISK ? 'is-atrisk' : (critical ? 'is-critical' : 'is-charging'))
          + '" data-slot="' + slot + '" tabindex="0" aria-label="Slot ' + (slot + 1) + ': ' + Utils.escapeHtml(record.vehicleNumber) + ' charging">'
          + '<div class="slot-head"><span class="slot-name">Slot ' + (slot + 1) + '</span>' + statusBadgeHtml(record.status) + '</div>'
          + '<div class="slot-ev">' + Utils.escapeHtml(record.vehicleNumber) + '</div>'
          + '<div class="slot-model">' + Utils.escapeHtml(record.model) + ' &middot; ' + Utils.escapeHtml(record.vehiclePriority) + '</div>'
          + '<div class="bar"><i class="bar-fill ' + barClass + '" data-width="' + record.chargeProgress + '"></i></div>'
          + '<div class="slot-meta">'
          + '<span>&#128267; <b>' + record.batteryPercentage + '% &rarr; ' + record.batteryAfter + '%</b></span>'
          + '<span>&#9889; <b>' + record.requiredPower + ' kW</b></span>'
          + '<span>&#9201; <b>' + record.chargingTime + ' min</b></span>'
          + '</div>'
          + '<div class="slot-foot"><span>Charging progress ' + record.chargeProgress + '%</span>'
          + '<span>ETA <strong>' + Utils.minutesToTime(record.finishMin) + '</strong></span></div>'
          + '</article>';
      }
      grid.innerHTML = html;
      // animate the progress bars after they exist in the DOM
      requestAnimationFrame(function () {
        var fills = grid.querySelectorAll('.bar-fill');
        for (var i = 0; i < fills.length; i += 1) {
          fills[i].style.width = fills[i].getAttribute('data-width') + '%';
        }
      });
    }

    function highlightSlot(slotIndex) {
      var node = byId('slotGrid').querySelector('[data-slot="' + slotIndex + '"]');
      if (!node) return;
      node.classList.add('is-charging');
      node.animate
        ? node.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' })
        : null;
    }

    /* ---------------------------- ranking table ---------------------------- */
    function filteredRecords(result) {
      var query = App.state.search.trim().toLowerCase();
      var filter = App.state.filter;
      var rows = result.ranked.filter(function (record) {
        if (query && record.vehicleNumber.toLowerCase().indexOf(query) === -1
          && record.model.toLowerCase().indexOf(query) === -1) return false;
        if (filter === 'charging') return record.status === STATUS.CHARGING || record.status === STATUS.AT_RISK;
        if (filter === 'waiting') return record.status === STATUS.WAITING || record.status === STATUS.DEFERRED;
        if (filter === 'critical') return record.band === 'critical';
        if (filter === 'high') return record.band === 'high';
        if (filter === 'normal') return record.vehiclePriority === 'Normal';
        return true;
      });

      var key = App.state.sortKey;
      var sorted = rows.slice();
      if (key !== 'priority') {
        sorted.sort(function (a, b) {
          if (key === 'battery') return a.batteryPercentage - b.batteryPercentage;
          if (key === 'distance') return b.remainingDistance - a.remainingDistance;
          if (key === 'departure') return a.departureMin - b.departureMin;
          return b.total - a.total;
        });
      }
      return sorted;
    }

    function renderRanking(result, activeStepEvId) {
      var body = byId('rankingBody');
      var rows = filteredRecords(result);

      byId('rankingCount').textContent = rows.length + ' of ' + result.ranked.length + ' EVs shown';

      if (!rows.length) {
        body.innerHTML = '<tr class="empty-row"><td colspan="14">No EV matches the current search and filter.</td></tr>';
        return;
      }

      var rankById = {};
      result.ranked.forEach(function (record, index) { rankById[record.id] = index + 1; });

      body.innerHTML = rows.map(function (record) {
        var greedyRank = rankById[record.id];
        var isTop = greedyRank === 1;
        var classes = [];
        if (isTop) classes.push('is-top');
        if (activeStepEvId && record.id === activeStepEvId) classes.push('is-step');
        return '<tr class="' + classes.join(' ') + '">'
          + '<td><span class="rank-cell">' + greedyRank + '</span></td>'
          + '<td class="ev-cell">' + Utils.escapeHtml(record.vehicleNumber) + '</td>'
          + '<td class="model-cell">' + Utils.escapeHtml(record.model) + '</td>'
          + '<td class="num"><span class="batt-cell"><span class="mini-bar"><i style="width:' + record.batteryPercentage + '%"></i></span>'
            + record.batteryPercentage + '%</span></td>'
          + '<td class="num">' + record.remainingDistance + ' km</td>'
          + '<td class="num">' + record.chargingTime + ' min</td>'
          + '<td>' + record.departureTime + '</td>'
          + '<td>' + priorityBadgeHtml(record.vehiclePriority) + '</td>'
          + '<td class="num score-part">' + Utils.formatNumber(record.urgency, 1) + '</td>'
          + '<td class="num score-part">' + Utils.formatNumber(record.battery, 1) + '</td>'
          + '<td class="num score-part">' + Utils.formatNumber(record.deadline, 1) + '</td>'
          + '<td class="num score-part">' + Utils.formatNumber(record.distance, 1) + '</td>'
          + '<td class="num score-cell' + (isTop ? ' top' : '') + '">' + Utils.formatNumber(record.total, 2) + '</td>'
          + '<td>' + bandBadgeHtml(record) + ' ' + statusBadgeHtml(record.status) + '</td>'
          + '</tr>';
      }).join('');

      byId('tableHint').textContent = 'Final Priority Score = Urgency x 0.30 + Battery x 0.25 + Deadline x 0.20 + Distance x 0.15 + Vehicle Priority x 0.10.'
        + ' Rank column always shows the greedy rank (unaffected by the table sort).';
    }

    /* ------------------------------ timeline ------------------------------ */
    function renderTimeline(result) {
      var host = byId('timeline');
      var station = result.station;
      var start = result.context.currentTimeMin;

      var all = result.ranked;
      var latestFinish = start;
      result.allocated.forEach(function (r) { if (r.finishMin > latestFinish) latestFinish = r.finishMin; });

      var session2 = start + station.sessionDuration;
      var queueStart = session2;
      var queueSpan = 0;
      result.waiting.concat(result.deferred).forEach(function (r) {
        if (r.sessionIndex > 1 && r.startMin !== null) {
          queueStart = Math.min(queueStart, r.startMin);
          queueSpan = Math.max(queueSpan, r.startMin + r.chargingTime - queueStart);
        }
      });
      var end = Math.max(latestFinish, start + station.sessionDuration, queueStart + (queueSpan || 30));
      var span = Math.max(30, end - start);

      var ticks = [15, 30, 60, 90, 120, 180, 240];
      var tick = 60;
      for (var t = 0; t < ticks.length; t += 1) {
        if (span / ticks[t] <= 8) { tick = ticks[t]; break; }
        tick = ticks[t];
      }

      var rows = '';
      for (var slot = 0; slot < station.chargingSlots; slot += 1) {
        var record = null;
        for (var s = 0; s < result.allocated.length; s += 1) {
          if (result.allocated[s].slotIndex === slot) { record = result.allocated[s]; break; }
        }
        var left = 0;
        var width = 0;
        var block = '';
        if (record) {
          left = ((record.startMin - start) / span) * 100;
          width = (record.chargingTime / span) * 100;
          block = '<div class="tl-block' + (record.status === STATUS.AT_RISK ? ' at-risk' : '') + '" style="left:' + left.toFixed(2) + '%;width:' + width.toFixed(2) + '%"'
            + ' title="' + Utils.escapeHtml(record.vehicleNumber + ' - ' + record.requiredPower + ' kW - ' + record.chargingTime + ' min') + '">'
            + Utils.escapeHtml(record.vehicleNumber) + ' &#9889;' + record.requiredPower + 'kW</div>';
        }
        rows += '<div class="tl-row"><div class="tl-label">Slot ' + (slot + 1)
          + (record ? '<small>' + Utils.escapeHtml(record.vehicleNumber) + '</small>' : '<small>empty</small>') + '</div>'
          + '<div class="tl-track" style="--tick:' + ((tick / span) * 100).toFixed(2) + '%">' + block + '</div></div>';
      }

      // queue lane: same greedy rule projected into the next session(s)
      var pending = result.ranked.filter(function (r) { return r.status === STATUS.WAITING || r.status === STATUS.DEFERRED; })
        .sort(function (a, b) { return a.startMin - b.startMin; });
      if (pending.length) {
        var qLeft = ((queueStart - start) / span) * 100;
        var qBlocks = pending.map(function (r) {
          var from = r.startMin === null ? queueStart : r.startMin;
          var w = (r.chargingTime / span) * 100;
          return '<div class="tl-block queued" style="left:' + (((from - start) / span) * 100).toFixed(2) + '%;width:' + w.toFixed(2) + '%"'
            + ' title="' + Utils.escapeHtml(r.vehicleNumber + ' - queued, priority ' + Utils.formatNumber(r.total, 2)) + '">'
            + Utils.escapeHtml(r.vehicleNumber) + '</div>';
        }).join('');
        rows += '<div class="tl-row"><div class="tl-label">Queue<small>next session</small></div>'
          + '<div class="tl-track" style="--tick:' + ((tick / span) * 100).toFixed(2) + '%">' + qBlocks
          + '<div class="tl-now" style="left:' + qLeft.toFixed(2) + '%"></div></div></div>';
      }

      var axis = '<div class="tl-axis">';
      for (var m = 0; m <= span; m += tick) {
        axis += '<span class="tl-tick" style="left:' + ((m / span) * 100).toFixed(2) + '%">' + Utils.minutesToTime(start + m) + '</span>';
      }
      axis += '</div>';

      host.innerHTML = '<div class="tl-inner">'
        + '<div class="tl-row"><div class="tl-label">Station<small>session 1</small></div>'
        + '<div class="tl-track"><div class="tl-now" style="left:0%"></div></div></div>'
        + rows
        + axis
        + '<div class="tl-legend">'
        + '<span class="tl-key"><i class="g"></i>Charging (deadline met)</span>'
        + '<span class="tl-key"><i class="a"></i>Charging (at risk)</span>'
        + '<span class="tl-key"><i class="q"></i>Queued for the next session</span>'
        + '</div></div>';
    }

    /* --------------------------- comparison --------------------------- */
    function deltaCell(before, after, better, unit, decimals) {
      var diff = Utils.round(after - before, 2);
      var improved = better ? diff > 0 : diff < 0;
      var flat = Math.abs(diff) < 0.05;
      var cls = flat ? 'flat' : (improved ? 'up' : 'down');
      var arrow = flat ? '=' : (diff > 0 ? '&#9650;' : '&#9660;');
      return '<span class="delta ' + cls + '">' + arrow + ' ' + (flat ? 'no change' : Math.abs(diff).toFixed(decimals === undefined ? 1 : decimals) + (unit || '')) + '</span>';
    }

    function renderComparison(result, before, after) {
      var rows = [
        { label: 'Average Waiting Time (min)', b: before.averageWait, a: after.averageWait, better: false, unit: ' min', dec: 1 },
        { label: 'Critical / Emergency EVs Served', b: before.urgentServed + ' / ' + before.urgentTotal, a: after.urgentServed + ' / ' + after.urgentTotal, better: true, raw: true },
        { label: 'Power Utilisation (%)', b: before.powerUtil, a: after.powerUtil, better: true, unit: '%', dec: 1 },
        { label: 'Deadline Violations', b: before.deadlineViolations, a: after.deadlineViolations, better: false, unit: '', dec: 0 },
        { label: 'Slots Utilised (%)', b: before.slotsUtil, a: after.slotsUtil, better: true, unit: '%', dec: 1 },
        { label: 'EVs Served This Session', b: before.served, a: after.served, better: true, unit: '', dec: 0 },
        { label: 'Average Priority of EVs Served', b: before.averagePriorityServed, a: after.averagePriorityServed, better: true, unit: '', dec: 2 }
      ];
      byId('compareBody').innerHTML = rows.map(function (row) {
        return '<tr><td>' + row.label + '</td>'
          + '<td class="num">' + (row.raw ? row.b : Number(row.b).toFixed(row.dec) + row.unit) + '</td>'
          + '<td class="num">' + (row.raw ? row.a : Number(row.a).toFixed(row.dec) + row.unit) + '</td>'
          + '<td>' + (row.raw
            ? '<span class="delta ' + (row.a === row.b ? 'flat' : 'up') + '">' + (row.a === row.b ? '= identical' : '&#9650; ' + (parseInt(row.a, 10) - parseInt(row.b, 10))) + '</span>'
            : deltaCell(row.b, row.a, row.better, row.unit, row.dec)) + '</td></tr>';
      }).join('');

      byId('cmpBeforeList').innerHTML = [
        'Allocation order: <b>arrival order, no priority scoring</b>',
        'Critical EVs served: <b>' + before.urgentServed + ' of ' + before.urgentTotal + '</b>',
        'Deadline violations: <b>' + before.deadlineViolations + '</b>',
        'Average wait: <b>' + before.averageWait + ' min</b>',
        'Power utilisation: <b>' + before.powerUtil + '%</b>'
      ].map(function (line) { return '<li>' + line + '</li>'; }).join('');

      byId('cmpAfterList').innerHTML = [
        'Allocation order: <b>descending greedy priority score</b>',
        'Critical EVs served: <b>' + after.urgentServed + ' of ' + after.urgentTotal + '</b>',
        'Deadline violations: <b>' + after.deadlineViolations + '</b>',
        'Average wait: <b>' + after.averageWait + ' min</b>',
        'Power utilisation: <b>' + after.powerUtil + '%</b>'
      ].map(function (line) { return '<li>' + line + '</li>'; }).join('');
    }

    /* ------------------------------ charts ------------------------------ */
    function renderCharts(result) {
      var allocatedIds = result.allocated.map(function (r) { return r.id; });
      ChartFactory.renderPriorityBars(byId('chartPriority'), result.ranked, allocatedIds);
      ChartFactory.renderBatteryGrid(byId('chartBattery'), result.ranked);
      ChartFactory.renderRing(byId('chartUtilRing'), result.slotsUsed / result.station.chargingSlots * 100,
        result.slotsUsed + '/' + result.station.chargingSlots, 'slots in use', 'var(--green)');

      var counts = { charging: 0, risk: 0, waiting: 0, deferred: 0 };
      result.ranked.forEach(function (record) {
        if (record.status === STATUS.CHARGING) counts.charging += 1;
        else if (record.status === STATUS.AT_RISK) counts.risk += 1;
        else if (record.status === STATUS.WAITING) counts.waiting += 1;
        else counts.deferred += 1;
      });
      var segments = [
        { label: 'Charging', value: counts.charging, color: 'var(--green)' },
        { label: 'Charging (at risk)', value: counts.risk, color: 'var(--amber)' },
        { label: 'Waiting', value: counts.waiting, color: 'var(--cyan)' },
        { label: 'Deferred', value: counts.deferred, color: 'var(--red)' }
      ];
      ChartFactory.renderDonut(byId('chartStatusDonut'), segments);
      byId('statusLegend').innerHTML = segments.map(function (segment) {
        return '<li><span class="lg-name"><i class="dot" style="background:' + segment.color + '"></i>' + segment.label + '</span>'
          + '<span class="lg-val">' + segment.value + '</span></li>';
      }).join('');
    }

    /* ----------------------------- arrivals ----------------------------- */
    function clearArrivals() {
      byId('arrivalLane').innerHTML = '<span class="empty-note">No arrivals yet - press Start Simulation.</span>';
    }

    function pushArrival(record, index) {
      var lane = byId('arrivalLane');
      if (index === 0) lane.innerHTML = '';
      var color = record.vehiclePriority === 'Emergency' ? 'var(--red)'
        : (record.vehiclePriority === 'VIP' ? 'var(--violet)' : 'var(--cyan)');
      var chip = document.createElement('span');
      chip.className = 'arrival-chip';
      chip.style.setProperty('--chip-color', color);
      chip.innerHTML = Utils.escapeHtml(record.vehicleNumber) + ' <small>arrived &middot; ' + record.batteryPercentage + '% &middot; ' + record.requiredPower + ' kW</small>';
      lane.appendChild(chip);
    }

    function markArrivedCharge(record) {
      var chip = byId('arrivalLane').querySelectorAll('.arrival-chip');
      for (var i = 0; i < chip.length; i += 1) {
        if (chip[i].textContent.indexOf(record.vehicleNumber) === 0) {
          chip[i].style.borderLeftColor = 'var(--green)';
          chip[i].style.background = 'rgba(37,245,160,.12)';
        }
      }
    }

    /* ------------------------------- log ------------------------------- */
    function renderLog(lines) {
      var list = byId('logList');
      if (!lines.length) {
        list.innerHTML = '<li class="log-empty">Run the optimizer to generate algorithm output.</li>';
        return;
      }
      state.logCleared = false;
      list.innerHTML = lines.map(function (line) {
        return '<li class="' + (line.level === 'info' ? '' : line.level) + '">'
          + '<span class="ts">[' + line.time + ']</span><span>' + Utils.escapeHtml(line.message) + '</span></li>';
      }).join('');
      list.scrollTop = list.scrollHeight;
      lastLogged = lines.length;
      for (var i = 0; i < list.children.length; i += 1) list.children[i].style.opacity = '1';
    }

    /* Only touches the rows whose visibility actually changes. */
    var lastLogged = 0;
    function highlightLog(upTo) {
      var items = byId('logList').children;
      var count = items.length;
      for (var i = 0; i < count; i += 1) {
        var shouldShow = i < upTo;
        var isShowing = items[i].dataset.shown === '1';
        if (shouldShow === isShowing) continue;
        items[i].style.opacity = shouldShow ? '1' : '.28';
        items[i].dataset.shown = shouldShow ? '1' : '0';
      }
      lastLogged = upTo;
    }

    function setRunStamp(text) {
      byId('runStamp').textContent = text;
    }

    function setSimStatus(text) { byId('simStatus').textContent = text; }

    return {
      renderKPIs: renderKPIs, renderSlots: renderSlots, highlightSlot: highlightSlot,
      renderRanking: renderRanking, renderTimeline: renderTimeline, renderComparison: renderComparison,
      renderCharts: renderCharts, clearArrivals: clearArrivals, pushArrival: pushArrival,
      markArrivedCharge: markArrivedCharge, renderLog: renderLog, highlightLog: highlightLog,
      setRunStamp: setRunStamp, setSimStatus: setSimStatus
    };
  })();

  /* ===========================================================================
   * L10. VISUALIZER
   * Replays the trace produced by the scheduler. Every trace step carries the
   * resource snapshot at that moment, so moving forward or backward is a pure
   * re-render - no algorithm state is re-executed.
   * ======================================================================== */

  var Visualizer = (function () {
    function byId(id) { return document.getElementById(id); }
    var lastHighlighted = 0;

    function buildPhaseStrip() {
      byId('phaseStrip').innerHTML = PHASES.map(function (phase) {
        return '<li class="phase-chip" data-phase="' + phase.id + '" title="' + Utils.escapeHtml(phase.hint) + '">'
          + '<i>' + phase.id + '</i>' + Utils.escapeHtml(phase.title) + '</li>';
      }).join('');
    }

    function renderStep(result, index) {
      var trace = result.trace;
      var total = trace.length;
      var step = trace[index];
      var counter = byId('stepCounter');

      if (!step) {
        counter.textContent = 'Step 0 / 0';
        byId('stepBadge').textContent = 'READY';
        byId('stepTitle').textContent = 'Press "Next Step" or "Auto Run"';
        byId('stepDetail').innerHTML = '<li>Run the optimizer to generate an algorithm trace.</li>';
        byId('stepSlots').textContent = '—';
        byId('stepPower').textContent = '—';
        byId('stepQueue').textContent = '—';
        byId('stepEv').textContent = '—';
        byId('stepProgress').style.width = '0%';
        byId('stepProgressBar').setAttribute('aria-valuenow', '0');
        return;
      }

      counter.textContent = 'Step ' + (index + 1) + ' / ' + total;
      byId('stepBadge').textContent = 'STEP ' + (index + 1) + '  ·  PHASE ' + step.phase + ' OF 8';
      byId('stepTitle').textContent = step.title;
      byId('stepDetail').innerHTML = step.detail.map(function (line, order) {
        return '<li style="animation-delay:' + (order * 60) + 'ms">' + line + '</li>';
      }).join('');

      var res = step.resources || {};
      byId('stepSlots').textContent = res.freeSlots === undefined ? '—' : (res.freeSlots + ' / ' + result.station.chargingSlots);
      byId('stepPower').textContent = res.powerLeft === undefined ? '—' : (Utils.formatNumber(res.powerLeft, 1) + ' kW');
      byId('stepQueue').textContent = step.queuePosition === undefined ? '—' : ((step.queuePosition + 1) + ' / ' + result.ranked.length);
      byId('stepEv').textContent = step.evNumber || '—';

      var percent = ((index + 1) / total) * 100;
      byId('stepProgress').style.width = percent.toFixed(2) + '%';
      byId('stepProgressBar').setAttribute('aria-valuenow', percent.toFixed(0));

      // phase strip state
      var chips = byId('phaseStrip').children;
      for (var i = 0; i < chips.length; i += 1) {
        var id = Number(chips[i].getAttribute('data-phase'));
        chips[i].className = 'phase-chip'
          + (id === step.phase ? ' is-active' : (id < step.phase ? ' is-done' : ''));
      }

      Renderer.highlightLog(step.logUpTo);
      Renderer.renderRanking(result, step.evId);
    }

    function reset() {
      stopAuto();
      App.state.stepIndex = 0;
      if (App.state.result) renderStep(App.state.result, 0);
    }

    function next() {
      if (!App.state.result) { App.toast('info', 'Run the optimizer first', 'Press "Run Greedy Optimization" to build the trace.'); return; }
      var last = App.state.result.trace.length - 1;
      if (App.state.stepIndex >= last) {
        stopAuto();
        App.toast('ok', 'Trace complete', 'Every step of the greedy algorithm has been shown.');
        return;
      }
      App.state.stepIndex += 1;
      renderStep(App.state.result, App.state.stepIndex);
    }

    function prev() {
      if (!App.state.result) return;
      App.state.stepIndex = Math.max(0, App.state.stepIndex - 1);
      renderStep(App.state.result, App.state.stepIndex);
    }

    function stopAuto() {
      if (App.state.autoTimer) {
        clearTimeout(App.state.autoTimer);
        App.state.autoTimer = null;
      }
      byId('btnAutoRun').textContent = 'Auto Run';
    }

    /** Emphasis steps pause longer so the important decisions are readable. */
    function delayFor(step) {
      if (step.isSummary) return 1400;
      if (step.emphasis) return 480;
      if (step.phase === 1) return 120;
      return 150;
    }

    function tick() {
      var result = App.state.result;
      if (!result) return stopAuto();
      if (App.state.stepIndex >= result.trace.length - 1) return stopAuto();
      next();
      App.state.autoTimer = setTimeout(tick, delayFor(result.trace[App.state.stepIndex]));
    }

    function autoRun() {
      if (App.state.autoTimer) return stopAuto();
      if (!App.state.result) { App.toast('info', 'Run the optimizer first', 'The trace is produced by the scheduler.'); return; }
      if (App.state.stepIndex >= App.state.result.trace.length - 1) App.state.stepIndex = 0;
      byId('btnAutoRun').textContent = 'Pause';
      App.state.autoTimer = setTimeout(tick, 60);
    }

    return { buildPhaseStrip: buildPhaseStrip, renderStep: renderStep, next: next, prev: prev, reset: reset, stopAuto: stopAuto, autoRun: autoRun };
  })();

  /* ===========================================================================
   * L11. APP - state, validation, event wiring, boot
   * ======================================================================== */

  var App = (function () {
    var state = {
      vehicles: [],
      station: Object.assign({}, DEFAULT_STATION),
      result: null,
      filter: 'all',
      search: '',
      sortKey: 'priority',
      stepIndex: 0,
      autoTimer: null,
      busy: false
    };
    var token = 0;              // bumped to cancel running animations

    function byId(id) { return document.getElementById(id); }

    /* ------------------------------ toasts ------------------------------ */
    function toast(kind, title, body) {
      var host = byId('toastHost');
      var node = document.createElement('div');
      node.className = 'toast ' + kind;
      var icon = kind === 'ok' ? '&#10003;' : (kind === 'err' ? '&#9888;' : (kind === 'warn' ? '&#9889;' : '&#8505;'));
      node.innerHTML = '<span class="t-icon" aria-hidden="true">' + icon + '</span>'
        + '<span class="t-body"><strong>' + Utils.escapeHtml(title) + '</strong><span>' + Utils.escapeHtml(body || '') + '</span></span>';
      host.appendChild(node);
      setTimeout(function () {
        node.classList.add('out');
        setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 320);
      }, 4200);
    }

    /* --------------------------- config reading --------------------------- */
    function readStation() {
      return {
        chargingSlots: Number(byId('cfgSlots').value),
        electricityCapacity: Number(byId('cfgCapacity').value),
        availablePower: Number(byId('cfgPower').value),
        sessionDuration: Number(byId('cfgSession').value),
        currentTime: byId('cfgTime').value
      };
    }

    function setFieldError(inputId, errorId, message) {
      var input = byId(inputId);
      var box = byId(errorId);
      box.textContent = message || '';
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }

    function validateStation(station) {
      var ok = true;
      if (!Number.isInteger(station.chargingSlots) || station.chargingSlots < 1 || station.chargingSlots > 24) {
        setFieldError('cfgSlots', 'errSlots', 'Charging slots must be a whole number between 1 and 24.');
        ok = false;
      } else setFieldError('cfgSlots', 'errSlots', '');

      if (!(station.electricityCapacity > 0) || station.electricityCapacity > 500) {
        setFieldError('cfgCapacity', 'errCapacity', 'Electricity capacity must be greater than 0 kW (max 500 kW).');
        ok = false;
      } else setFieldError('cfgCapacity', 'errCapacity', '');

      if (station.availablePower < 0) {
        setFieldError('cfgPower', 'errPower', 'Available power cannot be negative.');
        ok = false;
      } else if (station.availablePower > station.electricityCapacity) {
        setFieldError('cfgPower', 'errPower', 'Available power (' + station.availablePower + ' kW) cannot exceed the station capacity ('
          + station.electricityCapacity + ' kW).');
        ok = false;
      } else setFieldError('cfgPower', 'errPower', '');

      if (!(station.sessionDuration >= 5) || station.sessionDuration > 480) {
        setFieldError('cfgSession', 'errSession', 'Session duration must be at least 5 minutes.');
        ok = false;
      } else setFieldError('cfgSession', 'errSession', '');

      if (Utils.timeToMinutes(station.currentTime) === null) {
        setFieldError('cfgTime', 'errTime', 'Enter a valid station time in HH:MM format.');
        ok = false;
      } else setFieldError('cfgTime', 'errTime', '');

      return ok;
    }

    function writeStation(station) {
      byId('cfgSlots').value = station.chargingSlots;
      byId('cfgCapacity').value = station.electricityCapacity;
      byId('cfgPower').value = station.availablePower;
      byId('cfgSession').value = station.sessionDuration;
      byId('cfgTime').value = station.currentTime;
    }

    /* ----------------------------- the run ----------------------------- */
    function runOptimization(options) {
      var opts = options || {};
      if (state.busy) return;
      var station = readStation();
      if (!validateStation(station)) {
        toast('err', 'Invalid station configuration', 'Fix the highlighted fields and run again.');
        return;
      }
      if (!state.vehicles.length) {
        toast('warn', 'No EVs at the station', 'Use "Generate New EVs" to create a fleet.');
        return;
      }

      state.busy = true;
      var button = byId('btnRun');
      button.classList.add('is-busy');
      button.disabled = true;

      // yield one frame so the spinner is painted before the synchronous run
      setTimeout(function () {
        var result = GreedyScheduler.greedySchedule(state.vehicles, station);
        var before = Metrics.baseline(state.vehicles, station);
        var after = Metrics.compute(
          { allocated: result.allocated, waiting: result.waiting, deferred: result.deferred, powerUsed: result.powerUsed, slotsUsed: result.slotsUsed },
          station
        );

        // keep the raw fleet's status field in sync with the live result
        var statusById = {};
        result.ranked.forEach(function (record) { statusById[record.id] = record.status; });
        state.vehicles.forEach(function (vehicle) {
          vehicle.status = statusById[vehicle.id] || 'Waiting';
        });

        result.metrics = after;
        result.baseline = before;
        state.station = station;
        state.result = result;
        state.stepIndex = 0;

        renderAll(result, after);
        Visualizer.renderStep(result, 0);
        Renderer.renderLog(result.log);

        Renderer.setRunStamp('Last run at station time ' + station.currentTime + ' • '
          + result.ranked.length + ' EVs • ' + result.trace.length + ' trace steps • O(N log N)');

        button.classList.remove('is-busy');
        button.disabled = false;
        state.busy = false;

        if (opts.announce !== false) {
          toast('ok', 'Greedy optimization complete',
            result.allocated.length + ' EV(s) charging, ' + result.waiting.length + ' waiting, '
            + result.deferred.length + ' deferred • ' + result.trace.length + ' trace steps.');
        }
        if (opts.after) opts.after(result);
      }, 30);
    }

    function renderAll(result, metrics) {
      Renderer.renderKPIs(result, metrics);
      Renderer.renderSlots(result);
      Renderer.renderRanking(result, null);
      Renderer.renderTimeline(result);
      Renderer.renderComparison(result, result.baseline.metrics, metrics);
      Renderer.renderCharts(result);
    }

    function refreshRankingOnly() {
      if (state.result) Renderer.renderRanking(state.result, null);
    }

    /* ------------------------- EV form handling ------------------------- */
    function validateEvForm() {
      var station = readStation();
      var data = {
        model: byId('evModel').value.trim(),
        batteryPercentage: Number(byId('evBattery').value),
        batteryCapacity: Number(byId('evCapacity').value),
        remainingDistance: Number(byId('evDistance').value),
        chargingTime: Number(byId('evChargingTime').value),
        requiredPower: Number(byId('evPower').value),
        departureTime: byId('evDeparture').value,
        vehiclePriority: byId('evPriority').value
      };
      var ok = true;
      var messages = {};

      if (!data.model) { messages.evModel = 'Enter the EV model.'; ok = false; }
      if (!(data.batteryPercentage >= 0 && data.batteryPercentage <= 100)) {
        messages.evBattery = 'Battery percentage must be between 0 and 100.'; ok = false;
      }
      if (!(data.batteryCapacity > 0)) { messages.evCapacity = 'Battery capacity must be greater than 0 kWh.'; ok = false; }
      if (!(data.remainingDistance > 0)) { messages.evDistance = 'Remaining distance must be greater than 0 km.'; ok = false; }
      if (!(data.chargingTime > 0)) { messages.evChargingTime = 'Charging time must be greater than 0 minutes.'; ok = false; }
      if (!(data.requiredPower > 0)) { messages.evPower = 'Required power must be greater than 0 kW.'; ok = false; }
      else if (data.requiredPower > station.electricityCapacity) {
        messages.evPower = 'Required power (' + data.requiredPower + ' kW) cannot exceed the station capacity ('
          + station.electricityCapacity + ' kW).'; ok = false;
      }
      var departureMin = Utils.timeToMinutes(data.departureTime);
      var nowMin = Utils.timeToMinutes(station.currentTime);
      if (departureMin === null) { messages.evDeparture = 'Enter a valid departure time.'; ok = false; }
      else if (departureMin <= nowMin) {
        messages.evDeparture = 'Departure must be later than the current station time (' + station.currentTime + ').'; ok = false;
      }
      if (!PRIORITY_POINTS[data.vehiclePriority]) { messages.evPriority = 'Pick Emergency, VIP or Normal.'; ok = false; }

      var keys = {
        evModel: ['errEvModel', 'Model'],
        evBattery: ['errEvBattery', 'Battery %'],
        evCapacity: ['errEvCapacity', 'Battery Capacity'],
        evDistance: ['errEvDistance', 'Remaining Distance'],
        evChargingTime: ['errEvChargingTime', 'Charging Time'],
        evPower: ['errEvPower', 'Required Power'],
        evDeparture: ['errEvDeparture', 'Departure Time'],
        evPriority: ['errEvPriority', 'Vehicle Priority']
      };
      Object.keys(keys).forEach(function (key) {
        var message = messages[key] || '';
        byId(keys[key][0]).textContent = message;
        if (message) byId(key).setAttribute('aria-invalid', 'true');
        else byId(key).removeAttribute('aria-invalid');
      });
      return ok ? data : null;
    }

    function addVehicleFromForm() {
      var data = validateEvForm();
      if (!data) {
        toast('err', 'Check the EV details', 'Some fields are invalid - the messages are shown under each input.');
        return;
      }
      var vehicle = DataLayer.createVehicle(data);
      state.vehicles.push(vehicle);
      byId('evModel').value = '';
      byId('evModel').focus();
      toast('ok', vehicle.vehicleNumber + ' added', 'Re-running the greedy optimizer with the new EV in the queue.');
      runOptimization({ announce: true });
    }

    /* ------------------------- simulation flow ------------------------- */
    async function startSimulation() {
      var station = readStation();
      if (!validateStation(station)) {
        toast('err', 'Invalid station configuration', 'Fix the highlighted fields first.');
        return;
      }
      if (!state.vehicles.length) {
        toast('warn', 'No EVs to simulate', 'Generate or add EVs first.');
        return;
      }
      token += 1;
      var myToken = token;
      Visualizer.stopAuto();
      Renderer.clearArrivals();
      Renderer.setSimStatus('Simulating ' + state.vehicles.length + ' arrivals…');
      byId('btnStartSim').disabled = true;

      var ok = await SimulationEngine.playArrivals(state.vehicles, myToken);
      if (!ok) { byId('btnStartSim').disabled = false; return; }

      Renderer.setSimStatus('All EVs arrived — running the greedy scheduler…');
      await Utils.sleep(320);
      if (myToken !== token) return;

      runOptimization({
        announce: false,
        after: async function (result) {
          byId('btnStartSim').disabled = false;
          Renderer.setSimStatus('Allocation complete — ' + result.allocated.length + ' charging, '
            + result.waiting.length + ' waiting, ' + result.deferred.length + ' deferred.');
          result.allocated.forEach(function (record) { Renderer.markArrivedCharge(record); });
          Renderer.setRunStamp('Simulation run at station time ' + result.station.currentTime + ' • '
            + result.trace.length + ' trace steps');
          toast('ok', 'Simulation finished', 'Step through the trace to see how each slot was chosen.');
        }
      });
    }

    /* --------------------------- demo mode --------------------------- */
    async function demoMode() {
      token += 1;
      var myToken = token;
      Visualizer.stopAuto();
      toast('info', 'Demo mode starting', 'Reset → 20 random EVs → greedy selection → results.');
      await Utils.sleep(400);
      if (myToken !== token) return;

      // 1. reset to defaults
      writeStation(DEFAULT_STATION);
      state.vehicles = DataLayer.generateFleet(20, DEFAULT_STATION);
;
      state.filter = 'all';
      state.search = '';
      byId('searchInput').value = '';
      syncFilterButtons();
      state.result = null;
      Visualizer.reset();
      Renderer.clearArrivals();
      Renderer.renderLog([]);
      Renderer.setSimStatus('Demo mode — generating 20 EVs…');
      Renderer.setRunStamp('Demo mode: 20 EVs generated, waiting to run the scheduler…');
      byId('kpiTotal').textContent = state.vehicles.length;
      byId('rankingCount').textContent = state.vehicles.length + ' of ' + state.vehicles.length + ' EVs shown';

      // 2. arrivals
      await Utils.sleep(500);
      if (myToken !== token) return;
      var arrived = await SimulationEngine.playArrivals(state.vehicles, myToken);
      if (!arrived) return;

      // 3. run the greedy algorithm and animate the allocation
      Renderer.setSimStatus('Demo mode — running the greedy scheduler…');
      await Utils.sleep(350);
      if (myToken !== token) return;
      runOptimization({
        announce: false,
        after: async function (result) {
          if (myToken !== token) return;
          Renderer.setSimStatus('Demo mode — filling the charging slots…');
          await SimulationEngine.playAllocation(result, myToken);
          if (myToken !== token) return;
          Renderer.setSimStatus('Demo mode complete — ' + result.allocated.length + ' charging, '
            + result.waiting.length + ' waiting, ' + result.deferred.length + ' deferred.');
          Renderer.setRunStamp('Demo complete • ' + result.trace.length + ' trace steps • O(N log N) time, O(N) space');

          // 4. auto-play the algorithm trace
          Visualizer.reset();
          await Utils.sleep(700);
          if (myToken !== token) return;
          Visualizer.autoRun();
          toast('ok', 'Demo complete', 'Complexity: O(N log N) time, O(N) space. Use the step buttons to review.');
        }
      });
    }

    function resetAll() {
      token += 1;
      Visualizer.stopAuto();
      writeStation(DEFAULT_STATION);
      state.vehicles = DataLayer.curatedFleet();
;
      state.filter = 'all';
      state.search = '';
      state.sortKey = 'priority';
      byId('searchInput').value = '';
      byId('sortSelect').value = 'priority';
      syncFilterButtons();
      Visualizer.reset();
      Renderer.clearArrivals();
      Renderer.setSimStatus('Reset complete — press Start Simulation to replay arrivals.');
      validateStation(DEFAULT_STATION);
      toast('info', 'Simulation reset', 'Default 20-EV fleet, default station configuration.');
      runOptimization({ announce: false, after: function () {
        Renderer.setSimStatus('Idle — press Start Simulation to replay arrivals.');
      } });
    }

    function syncFilterButtons() {
      var buttons = document.querySelectorAll('.filter-btn');
      for (var i = 0; i < buttons.length; i += 1) {
        buttons[i].classList.toggle('is-active', buttons[i].getAttribute('data-filter') === state.filter);
      }
    }

    function generateNewFleet() {
      var station = readStation();
      if (!validateStation(station)) {
        toast('err', 'Invalid station configuration', 'Fix the highlighted fields first.');
        return;
      }
      state.vehicles = DataLayer.generateFleet(20, station);
;
      Renderer.clearArrivals();
      toast('info', '20 random EVs generated', 'Every value is inside the realistic ranges from the brief.');
      runOptimization({});
    }

    /* ----------------------------- events ----------------------------- */
    function bindEvents() {
      byId('configForm').addEventListener('submit', function (event) {
        event.preventDefault();
        runOptimization({});
      });
      byId('btnGenerate').addEventListener('click', generateNewFleet);
      byId('btnStartSim').addEventListener('click', startSimulation);
      byId('btnResetAll').addEventListener('click', resetAll);
      byId('btnDemo').addEventListener('click', demoMode);
      byId('btnDefaults').addEventListener('click', function () {
        writeStation(DEFAULT_STATION);
        validateStation(DEFAULT_STATION);
        toast('info', 'Default configuration loaded', '5 slots • 50 kW capacity • 40 kW available • 09:00.');
      });

      var presets = document.querySelectorAll('[data-preset]');
      for (var i = 0; i < presets.length; i += 1) {
        presets[i].addEventListener('click', function (event) {
          var preset = STATION_PRESETS[event.currentTarget.getAttribute('data-preset')];
          if (!preset) return;
          writeStation(preset);
          validateStation(preset);
          toast('info', 'Preset loaded', event.currentTarget.textContent + ' — running the optimizer.');
          runOptimization({ announce: false });
        });
      }

      byId('evForm').addEventListener('submit', function (event) {
        event.preventDefault();
        addVehicleFromForm();
      });
      byId('btnClearForm').addEventListener('click', function () {
        byId('evForm').reset();
        var boxes = document.querySelectorAll('.ev-form .field-error');
        for (var i = 0; i < boxes.length; i += 1) boxes[i].textContent = '';
        var inputs = document.querySelectorAll('.ev-form input, .ev-form select');
        for (var j = 0; j < inputs.length; j += 1) inputs[j].removeAttribute('aria-invalid');
        byId('evDeparture').value = Utils.minutesToTime(Utils.timeToMinutes(DEFAULT_STATION.currentTime) + 90);
        byId('evModel').focus();
      });

      byId('searchInput').addEventListener('input', function (event) {
        state.search = event.target.value;
        refreshRankingOnly();
      });
      byId('sortSelect').addEventListener('change', function (event) {
        state.sortKey = event.target.value;
        refreshRankingOnly();
      });
      var filters = document.querySelectorAll('.filter-btn');
      for (var f = 0; f < filters.length; f += 1) {
        filters[f].addEventListener('click', function (event) {
          state.filter = event.currentTarget.getAttribute('data-filter');
          syncFilterButtons();
          refreshRankingOnly();
        });
      }

      byId('btnNextStep').addEventListener('click', function () { Visualizer.stopAuto(); Visualizer.next(); });
      byId('btnPrevStep').addEventListener('click', function () { Visualizer.stopAuto(); Visualizer.prev(); });
      byId('btnAutoRun').addEventListener('click', Visualizer.autoRun);
      byId('btnResetViz').addEventListener('click', function () {
        Visualizer.reset();
        Renderer.renderRanking(state.result, null);
        toast('info', 'Trace restarted', 'The greedy algorithm will be replayed from step 1.');
      });
      byId('btnClearLog').addEventListener('click', function () {
        state.logCleared = true;
        Renderer.renderLog([]);
        byId('logList').innerHTML = '<li class="log-empty">Log cleared. Re-run the optimizer to regenerate the algorithm output.</li>';
        toast('info', 'Log cleared', 'Press "Run Greedy Optimization" to regenerate the algorithm log.');
      });

      document.addEventListener('keydown', function (event) {
        var tag = (event.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
        if (event.key === 'ArrowRight') { Visualizer.stopAuto(); Visualizer.next(); }
        if (event.key === 'ArrowLeft') { Visualizer.stopAuto(); Visualizer.prev(); }
      });
    }

    /* ------------------------------ boot ------------------------------ */
    function boot() {
      Visualizer.buildPhaseStrip();
      state.vehicles = DataLayer.curatedFleet();
;
      byId('evDeparture').value = Utils.minutesToTime(Utils.timeToMinutes(DEFAULT_STATION.currentTime) + 90);
      Renderer.clearArrivals();
      bindEvents();
      validateStation(DEFAULT_STATION);
      // First run so the dashboard is never empty.
      runOptimization({ announce: false, after: function () {
        Renderer.setRunStamp('Demo fleet ready • press Run Greedy Optimization or Start Simulation.');
      } });
    }

    return {
      state: state,
      get token() { return token; },
      toast: toast,
      boot: boot,
      runOptimization: runOptimization,
      readStation: readStation,
      writeStation: writeStation
    };
  })();

  /* Exposed for testing: the algorithm layers have no DOM dependency, so they
   * can be executed directly in Node (see README "Testing the algorithm"). */
  window.EVOptimizer = {
    Utils: Utils,
    DataLayer: DataLayer,
    PriorityEngine: PriorityEngine,
    GreedyScheduler: GreedyScheduler,
    Metrics: Metrics,
    DEFAULT_STATION: DEFAULT_STATION,
    STATION_PRESETS: STATION_PRESETS,
    WEIGHTS: WEIGHTS,
    PRIORITY_POINTS: PRIORITY_POINTS,
    STATUS: STATUS,
    PHASES: PHASES,
    App: App
  };

  if (typeof document !== 'undefined' && document.getElementById) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', App.boot);
    } else {
      App.boot();
    }
  }
})();
