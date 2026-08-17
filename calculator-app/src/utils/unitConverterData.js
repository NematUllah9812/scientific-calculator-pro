/* =====================================================================
 * unitConverterData.js — 12 categories of unit conversion factors
 * All linear units are expressed relative to a base SI unit.
 * Temperature uses explicit to/from functions.
 * ===================================================================== */

export const UNIT_CATEGORIES = {
  length: {
    id: 'length',
    name: 'Length',
    icon: 'Ruler',
    base: 'm',
    units: {
      nm: { name: 'Nanometer', symbol: 'nm', factor: 1e-9 },
      µm: { name: 'Micrometer', symbol: 'µm', factor: 1e-6 },
      mm: { name: 'Millimeter', symbol: 'mm', factor: 0.001 },
      cm: { name: 'Centimeter', symbol: 'cm', factor: 0.01 },
      m: { name: 'Meter', symbol: 'm', factor: 1 },
      km: { name: 'Kilometer', symbol: 'km', factor: 1000 },
      in: { name: 'Inch', symbol: 'in', factor: 0.0254 },
      ft: { name: 'Foot', symbol: 'ft', factor: 0.3048 },
      yd: { name: 'Yard', symbol: 'yd', factor: 0.9144 },
      mi: { name: 'Mile', symbol: 'mi', factor: 1609.344 },
      nmi: { name: 'Nautical Mile', symbol: 'nmi', factor: 1852 },
      ly: { name: 'Light Year', symbol: 'ly', factor: 9.4607304725808e15 },
      au: { name: 'Astronomical Unit', symbol: 'AU', factor: 1.495978707e11 },
      pc: { name: 'Parsec', symbol: 'pc', factor: 3.0856775814913673e16 },
    },
  },

  mass: {
    id: 'mass',
    name: 'Mass',
    icon: 'Weight',
    base: 'kg',
    units: {
      µg: { name: 'Microgram', symbol: 'µg', factor: 1e-9 },
      mg: { name: 'Milligram', symbol: 'mg', factor: 1e-6 },
      g: { name: 'Gram', symbol: 'g', factor: 0.001 },
      kg: { name: 'Kilogram', symbol: 'kg', factor: 1 },
      t: { name: 'Metric Ton', symbol: 't', factor: 1000 },
      oz: { name: 'Ounce', symbol: 'oz', factor: 0.028349523125 },
      lb: { name: 'Pound', symbol: 'lb', factor: 0.45359237 },
      st: { name: 'Stone', symbol: 'st', factor: 6.35029318 },
      ton_us: { name: 'US Ton (short)', symbol: 'ton', factor: 907.18474 },
      ton_uk: { name: 'UK Ton (long)', symbol: 'ton', factor: 1016.0469088 },
      ct: { name: 'Carat', symbol: 'ct', factor: 0.0002 },
      gr: { name: 'Grain', symbol: 'gr', factor: 0.00006479891 },
    },
  },

  temperature: {
    id: 'temperature',
    name: 'Temperature',
    icon: 'Thermometer',
    base: 'C',
    special: true,
    units: {
      C: {
        name: 'Celsius',
        symbol: '°C',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      F: {
        name: 'Fahrenheit',
        symbol: '°F',
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      K: {
        name: 'Kelvin',
        symbol: 'K',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
      R: {
        name: 'Rankine',
        symbol: '°R',
        toBase: (v) => ((v - 491.67) * 5) / 9,
        fromBase: (v) => ((v + 273.15) * 9) / 5,
      },
      De: {
        name: 'Delisle',
        symbol: '°De',
        toBase: (v) => 100 - (v * 2) / 3,
        fromBase: (v) => ((100 - v) * 3) / 2,
      },
    },
  },

  area: {
    id: 'area',
    name: 'Area',
    icon: 'Square',
    base: 'm2',
    units: {
      mm2: { name: 'Square Millimeter', symbol: 'mm²', factor: 1e-6 },
      cm2: { name: 'Square Centimeter', symbol: 'cm²', factor: 1e-4 },
      m2: { name: 'Square Meter', symbol: 'm²', factor: 1 },
      ha: { name: 'Hectare', symbol: 'ha', factor: 10000 },
      km2: { name: 'Square Kilometer', symbol: 'km²', factor: 1e6 },
      in2: { name: 'Square Inch', symbol: 'in²', factor: 0.00064516 },
      ft2: { name: 'Square Foot', symbol: 'ft²', factor: 0.09290304 },
      yd2: { name: 'Square Yard', symbol: 'yd²', factor: 0.83612736 },
      ac: { name: 'Acre', symbol: 'ac', factor: 4046.8564224 },
      mi2: { name: 'Square Mile', symbol: 'mi²', factor: 2589988.110336 },
    },
  },

  volume: {
    id: 'volume',
    name: 'Volume',
    icon: 'Box',
    base: 'L',
    units: {
      mL: { name: 'Milliliter', symbol: 'mL', factor: 0.001 },
      cL: { name: 'Centiliter', symbol: 'cL', factor: 0.01 },
      L: { name: 'Liter', symbol: 'L', factor: 1 },
      m3: { name: 'Cubic Meter', symbol: 'm³', factor: 1000 },
      cm3: { name: 'Cubic Centimeter', symbol: 'cm³', factor: 0.001 },
      in3: { name: 'Cubic Inch', symbol: 'in³', factor: 0.016387064 },
      ft3: { name: 'Cubic Foot', symbol: 'ft³', factor: 28.316846592 },
      tsp: { name: 'Teaspoon (US)', symbol: 'tsp', factor: 0.00492892159375 },
      tbsp: { name: 'Tablespoon (US)', symbol: 'tbsp', factor: 0.01478676478125 },
      floz: { name: 'Fluid Ounce (US)', symbol: 'fl oz', factor: 0.0295735295625 },
      cup: { name: 'Cup (US)', symbol: 'cup', factor: 0.2365882365 },
      pt: { name: 'Pint (US)', symbol: 'pt', factor: 0.473176473 },
      qt: { name: 'Quart (US)', symbol: 'qt', factor: 0.946352946 },
      gal: { name: 'Gallon (US)', symbol: 'gal', factor: 3.785411784 },
      gal_uk: { name: 'Gallon (UK)', symbol: 'gal UK', factor: 4.54609 },
    },
  },

  speed: {
    id: 'speed',
    name: 'Speed',
    icon: 'Gauge',
    base: 'mps',
    units: {
      mps: { name: 'Meter / second', symbol: 'm/s', factor: 1 },
      kph: { name: 'Kilometer / hour', symbol: 'km/h', factor: 1 / 3.6 },
      mph: { name: 'Mile / hour', symbol: 'mph', factor: 0.44704 },
      fps: { name: 'Foot / second', symbol: 'ft/s', factor: 0.3048 },
      knot: { name: 'Knot', symbol: 'kn', factor: 0.5144444444444445 },
      mach: { name: 'Mach (sea level)', symbol: 'Ma', factor: 340.29 },
      c: { name: 'Speed of Light', symbol: 'c', factor: 299792458 },
    },
  },

  time: {
    id: 'time',
    name: 'Time',
    icon: 'Clock',
    base: 's',
    units: {
      ns: { name: 'Nanosecond', symbol: 'ns', factor: 1e-9 },
      µs: { name: 'Microsecond', symbol: 'µs', factor: 1e-6 },
      ms: { name: 'Millisecond', symbol: 'ms', factor: 0.001 },
      s: { name: 'Second', symbol: 's', factor: 1 },
      min: { name: 'Minute', symbol: 'min', factor: 60 },
      h: { name: 'Hour', symbol: 'h', factor: 3600 },
      d: { name: 'Day', symbol: 'd', factor: 86400 },
      wk: { name: 'Week', symbol: 'wk', factor: 604800 },
      mo: { name: 'Month (30d)', symbol: 'mo', factor: 2592000 },
      yr: { name: 'Year (365d)', symbol: 'yr', factor: 31536000 },
      decade: { name: 'Decade', symbol: 'dec', factor: 315360000 },
      century: { name: 'Century', symbol: 'c', factor: 3153600000 },
    },
  },

  data: {
    id: 'data',
    name: 'Data Storage',
    icon: 'HardDrive',
    base: 'B',
    units: {
      bit: { name: 'Bit', symbol: 'bit', factor: 0.125 },
      B: { name: 'Byte', symbol: 'B', factor: 1 },
      KB: { name: 'Kilobyte (1000)', symbol: 'KB', factor: 1e3 },
      KiB: { name: 'Kibibyte (1024)', symbol: 'KiB', factor: 1024 },
      MB: { name: 'Megabyte', symbol: 'MB', factor: 1e6 },
      MiB: { name: 'Mebibyte', symbol: 'MiB', factor: 1048576 },
      GB: { name: 'Gigabyte', symbol: 'GB', factor: 1e9 },
      GiB: { name: 'Gibibyte', symbol: 'GiB', factor: 1073741824 },
      TB: { name: 'Terabyte', symbol: 'TB', factor: 1e12 },
      TiB: { name: 'Tebibyte', symbol: 'TiB', factor: 1099511627776 },
      PB: { name: 'Petabyte', symbol: 'PB', factor: 1e15 },
    },
  },

  pressure: {
    id: 'pressure',
    name: 'Pressure',
    icon: 'Wind',
    base: 'Pa',
    units: {
      Pa: { name: 'Pascal', symbol: 'Pa', factor: 1 },
      hPa: { name: 'Hectopascal', symbol: 'hPa', factor: 100 },
      kPa: { name: 'Kilopascal', symbol: 'kPa', factor: 1000 },
      MPa: { name: 'Megapascal', symbol: 'MPa', factor: 1e6 },
      bar: { name: 'Bar', symbol: 'bar', factor: 100000 },
      mbar: { name: 'Millibar', symbol: 'mbar', factor: 100 },
      atm: { name: 'Atmosphere', symbol: 'atm', factor: 101325 },
      torr: { name: 'Torr', symbol: 'Torr', factor: 133.32236842105263 },
      mmHg: { name: 'mm Mercury', symbol: 'mmHg', factor: 133.322387415 },
      psi: { name: 'PSI', symbol: 'psi', factor: 6894.757293168361 },
    },
  },

  energy: {
    id: 'energy',
    name: 'Energy',
    icon: 'Zap',
    base: 'J',
    units: {
      J: { name: 'Joule', symbol: 'J', factor: 1 },
      kJ: { name: 'Kilojoule', symbol: 'kJ', factor: 1000 },
      MJ: { name: 'Megajoule', symbol: 'MJ', factor: 1e6 },
      cal: { name: 'Calorie', symbol: 'cal', factor: 4.184 },
      kcal: { name: 'Kilocalorie', symbol: 'kcal', factor: 4184 },
      Wh: { name: 'Watt-hour', symbol: 'Wh', factor: 3600 },
      kWh: { name: 'Kilowatt-hour', symbol: 'kWh', factor: 3.6e6 },
      eV: { name: 'Electronvolt', symbol: 'eV', factor: 1.602176634e-19 },
      BTU: { name: 'British Thermal Unit', symbol: 'BTU', factor: 1055.05585262 },
      ftlb: { name: 'Foot-pound', symbol: 'ft·lb', factor: 1.3558179483314004 },
    },
  },

  power: {
    id: 'power',
    name: 'Power',
    icon: 'Activity',
    base: 'W',
    units: {
      mW: { name: 'Milliwatt', symbol: 'mW', factor: 0.001 },
      W: { name: 'Watt', symbol: 'W', factor: 1 },
      kW: { name: 'Kilowatt', symbol: 'kW', factor: 1000 },
      MW: { name: 'Megawatt', symbol: 'MW', factor: 1e6 },
      GW: { name: 'Gigawatt', symbol: 'GW', factor: 1e9 },
      hp: { name: 'Horsepower (mech)', symbol: 'hp', factor: 745.6998715822702 },
      hp_m: { name: 'Horsepower (metric)', symbol: 'PS', factor: 735.49875 },
      BTUh: { name: 'BTU / hour', symbol: 'BTU/h', factor: 0.29307107017222 },
    },
  },

  angle: {
    id: 'angle',
    name: 'Angle',
    icon: 'Compass',
    base: 'rad',
    units: {
      rad: { name: 'Radian', symbol: 'rad', factor: 1 },
      deg: { name: 'Degree', symbol: '°', factor: Math.PI / 180 },
      grad: { name: 'Gradian', symbol: 'grad', factor: Math.PI / 200 },
      turn: { name: 'Turn', symbol: 'turn', factor: 2 * Math.PI },
      arcmin: { name: 'Arcminute', symbol: "'", factor: Math.PI / 10800 },
      arcsec: { name: 'Arcsecond', symbol: '"', factor: Math.PI / 648000 },
      mil: { name: 'Mil (NATO)', symbol: 'mil', factor: Math.PI / 3200 },
    },
  },
};

export function convert(categoryId, fromUnit, toUnit, value) {
  const cat = UNIT_CATEGORIES[categoryId];
  if (!cat) return NaN;
  const from = cat.units[fromUnit];
  const to = cat.units[toUnit];
  if (!from || !to) return NaN;
  const v = Number(value);
  if (!isFinite(v)) return NaN;

  if (cat.special) {
    const base = from.toBase(v);
    return to.fromBase(base);
  }
  return (v * from.factor) / to.factor;
}

export function getUnitList(categoryId) {
  const cat = UNIT_CATEGORIES[categoryId];
  if (!cat) return [];
  return Object.entries(cat.units)
    .filter(([, u]) => u && u.name)
    .map(([key, u]) => ({ key, ...u }));
}

export const CATEGORY_LIST = Object.values(UNIT_CATEGORIES).map((c) => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
}));

export const DEFAULT_UNITS = {
  length: ['m', 'ft'],
  mass: ['kg', 'lb'],
  temperature: ['C', 'F'],
  area: ['m2', 'ft2'],
  volume: ['L', 'gal'],
  speed: ['kph', 'mph'],
  time: ['h', 'min'],
  data: ['MB', 'GB'],
  pressure: ['Pa', 'psi'],
  energy: ['J', 'cal'],
  power: ['kW', 'hp'],
  angle: ['deg', 'rad'],
};
