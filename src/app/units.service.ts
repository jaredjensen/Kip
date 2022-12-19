import { Injectable } from '@angular/core';
import * as Qty from 'js-quantities';

import { AppSettingsService } from './app-settings.service';
import { Subscription } from 'rxjs';

/**
 *  Group of Kip units array
 */
export interface IUnitGroup {
  group: string;
  units: IUnit[];
}[]

/**
 * Individual Kip units system measures definition
 */
export interface IUnit {
  measure: string;
  description: string;
}

/**
 * Interface for defaults Units per unit Groups to be applied
 */
export interface IUnitDefaults {
  [key: string]: string;
}

/**
 * Interface for supported path value units provided by Signal K (schema v 1.5.1)
 * See: https://github.com/SignalK/specification/schemas/definitions.json
 */
export interface ISkBaseUnit {
  unit: string;
  properties: ISkUnitProperties;
}

/**
 * Interface describing units properties
 */
export interface ISkUnitProperties {
  display: string,
  quantity: string,
  quantityDisplay: string,
  description: string
}


@Injectable()

export class UnitsService {

  defaultUnits: IUnitDefaults;
  defaultUnitsSub: Subscription;

  /**
   * Definition of available Kip unit group and measures that are available for conversion.
   * Measure property has to match one Unit Conversion Function for proper operation.
   *
   * Description field is used in the UI. Care should be taken to offer a short self
   * explanatory text.
   */
  // TODO: Look at using js-quantities 'Well-knonw kinds' and 'Available Units of a kind' instead of recreating a system https://github.com/gentooboontoo/js-quantities
  conversionList: IUnitGroup[] = [
    { group: 'Unitless', units: [
      { measure: 'unitless', description: "As-Is numeric value" }
    ] },
    { group: 'Length', units: [
      { measure: 'm', description: "Metres (default)"},
      { measure: 'fathom', description: "Fathoms"},
      { measure: 'feet', description: "Feets"},
      { measure: 'km', description: "Kilometers"},
      { measure: 'nm', description: "Nautical Miles"},
      { measure: 'mi', description: "Miles"},
    ] },
    { group: 'Speed', units: [
      { measure: 'knots', description: "Knots - Nautical miles per hour"},
      { measure: 'kph', description: "kph - Kilometers per hour"},
      { measure: 'mph', description: "mph - Miles per hour"},
      { measure: 'm/s', description: "m/s - Meters per second (default)"}
    ] },
    { group: 'Acceleration', units: [
      { measure: 'm/s2', description: "Meters per second squared (default)"},
      { measure: 'gee', description: "g-force"}
    ] },
    { group: 'Force', units: [
      { measure: 'N', description: "Newton (default)"},
      { measure: 'lbf', description: "Pound force"}
    ] },
    { group: 'Torque', units: [
      { measure: 'Nm', description: "Newton meter (default)"}
    ] },
    { group: 'Volume', units: [
      { measure: 'liter', description: "Liters (default)"},
      { measure: 'm3', description: "Cubic Meters"},
      { measure: 'gallon', description: "Gallons"},
     ] },
    { group: 'Density', units: [
      { measure: 'kg/m3', description: "kg/cubic meter (default)"}
    ] },
    { group: 'Viscosity', units: [
      { measure: 'Pa.s', description: "Pascal per seconds (default)"}
    ] },
    { group: 'Flow', units: [
      { measure: 'm3/s', description: "Cubic meters per second (default)"},
      { measure: 'l/min', description: "Litters per minute"},
      { measure: 'l/h', description: "Litters per hour"},
      { measure: 'g/min', description: "Gallons per minute"},
      { measure: 'g/h', description: "Gallons per hour"}
    ] },
    { group: 'Pressure', units: [
      { measure: 'Pa', description: "Pascal (default)" },
      { measure: 'bar', description: "Bars" },
      { measure: 'psi', description: "psi" },
      { measure: 'mmHg', description: "mmHg" },
      { measure: 'inHg', description: "inHg" },
      { measure: 'hPa', description: "hPa" },
      { measure: 'mbar', description: "mbar" },
    ] },
    { group: 'Pressure Rate', units: [
      { measure: 'Pa/s', description: "Pascal per second (default)" }
    ] },
    { group: 'Angle', units: [
      { measure: 'rad', description: "Radians (default)" },
      { measure: 'deg', description: "Degrees" },
      { measure: 'grad', description: "Gradians" },
    ] },
    { group: 'Angular Acceleration', units: [
      { measure: 'rad/s2', description: "Radians per second squared (default)" }
    ] },
    { group: 'Angular Velocity', units: [
      { measure: 'rad/s', description: "Radians per second (default)" },
      { measure: 'deg/s', description: "Degrees per second" },
      { measure: 'deg/min', description: "Degrees per minute" },
    ] },
    { group: 'Temperature', units: [
      { measure: 'K', description: "Kelvin (default)"},
      { measure: 'celsius', description: "Celsius"},
      { measure: 'fahrenheit', description: "Fahrenheit"}
     ] },
    { group: 'Frequency', units: [
      { measure: 'rpm', description: "RPM - Rotations per minute" },
      { measure: 'Hz', description: "Hz - Hertz (default)" },
      { measure: 'KHz', description: "KHz - KiloHertz" },
      { measure: 'MHz', description: "MHz - MegaHertz" },
      { measure: 'GHz', description: "GHz - GigaHertz" },
    ] },
    { group: 'Current', units: [
      { measure: 'A', description: "Amperes (default)"},
      { measure: 'mA', description: "Milliamperes"}
    ] },
    { group: 'Potential', units: [
      { measure: 'V', description: "Volts (default)"},
      { measure: 'mV', description: "Millivolts"}
    ] },
    { group: 'Charge', units: [
      { measure: 'C', description: "Coulomb (default)"},
      { measure: 'Ah', description: "Ampere Hours"},
    ] },
    { group: 'Power', units: [
      { measure: 'W', description: "Watts (default)"},
      { measure: 'mW', description: "Milliwatts"},
    ] },
    { group: 'Energy', units: [
      { measure: 'J', description: "Joules (default)"},
      { measure: 'kWh', description: "Kilo-Watt Hours"},
    ] },
    { group: 'Resistance', units: [
      { measure: 'ohm', description: "Ohm \u2126 (default)"}
    ] },
    { group: 'Magnetism', units: [
      { measure: 'T', description: "Tesla intensity (default)"}
    ] },
    { group: 'Illuminance', units: [
      { measure: 'Lux', description: "Lux - Lumen per square meter (default)"}
    ] },
    { group: 'Ratio', units: [
      { measure: 'percent', description: "As percentage value" },
      { measure: 'percentraw', description: "As ratio 0-1 with % sign" },
      { measure: 'ratio', description: "Ratio 0-1 (default)" }
    ] },
    { group: 'Time', units: [
      { measure: 's', description: "Seconds (default)" },
      { measure: 'Minutes', description: "Minutes" },
      { measure: 'Hours', description: "Hours" },
      { measure: 'Days', description: "Days" },
      { measure: 'HH:MM:SS', description: "Hours:Minute:seconds"}
    ] },
    { group: 'Position', units: [
      { measure: 'latitudeMin', description: "Latitude in minutes" },
      { measure: 'latitudeSec', description: "Latitude in seconds" },
      { measure: 'longitudeMin', description: "Longitude in minutes" },
      { measure: 'longitudeSec', description: "Longitude in seconds" },
    ] },
  ];

  skBaseUnits: ISkBaseUnit[] =
    [
      { unit: "s", properties: {
          display: "s",
          quantity: "Time",
          quantityDisplay: "t",
          description: "Elapsed time (interval) in seconds"
        }
      },
      { unit: "Hz", properties: {
          display: "Hz",
          quantity: "Frequency",
          quantityDisplay: "f",
          description: "Frequency in Hertz"
        }
      },
      { unit: "m3", properties: {
          display: "m\u00b3",
          quantity: "Volume",
          quantityDisplay: "V",
          description: "Volume in cubic meters"
        }
      },
      { unit: "m3/s", properties: {
          display: "m\u00b3/s",
          quantity: "Flow",
          quantityDisplay: "Q",
          description: "Liquid or gas flow in cubic meters per second"
        }
      },
      { unit: "kg/s", properties: {
          display: "kg/s",
          quantity: "Mass flow rate",
          quantityDisplay: "\u1e41",
          description: "Liquid or gas flow in kilograms per second"
        }
      },
      { unit: "kg/m3", properties: {
          display: "kg/m\u00b3",
          quantity: "Density",
          quantityDisplay: "\u03c1",
          description: "Density in kg per cubic meter"
        }
      },
      { unit: "deg", properties: {
          display: "\u00b0",
          quantity: "Angle",
          quantityDisplay: "\u2220",
          description: "Latitude or longitude in decimal degrees"
        }
      },
      { unit: "rad", properties: {
          display: "\u33ad",
          quantity: "Angle",
          quantityDisplay: "\u2220",
          description: "Angular arc in radians"
        }
      },
      { unit: "rad/s", properties: {
          display: "\u33ad/s",
          quantity: "Rotation",
          quantityDisplay: "\u03c9",
          description: "Angular rate in radians per second"
        }
      },
      { unit: "A", properties: {
          display: "A",
          quantity: "Current",
          quantityDisplay: "I",
          description: "Electrical current in ampere"
        }
      },
      { unit: "C", properties: {
          display: "C",
          quantity: "Charge",
          quantityDisplay: "Q",
          description: "Electrical charge in Coulomb"
        }
      },
      { unit: "V", properties: {
          display: "V",
          quantity: "Voltage",
          quantityDisplay: "V",
          description: "Electrical potential in volt"
        }
      },
      { unit: "W", properties: {
          display: "W",
          quantity: "Power",
          quantityDisplay: "P",
          description: "Power in watt"
        }
      },
      { unit: "Nm", properties: {
          display: "Nm",
          quantity: "Torque",
          quantityDisplay: "\u03c4",
          description: "Torque in Newton meter"
        }
      },
      { unit: "J", properties: {
          display: "J",
          quantity: "Energy",
          quantityDisplay: "E",
          description: "Electrical energy in joule"
        }
      },
      { unit: "ohm", properties: {
          display: "\u2126",
          quantity: "Resistance",
          quantityDisplay: "R",
          description: "Electrical resistance in ohm"
        }
      },
      { unit: "m", properties: {
          display: "m",
          quantity: "Distance",
          quantityDisplay: "d",
          description: "Distance in meters"
        }
      },
      { unit: "m/s", properties: {
          display: "m/s",
          quantity: "Speed",
          quantityDisplay: "v",
          description: "Speed in meters per second"
        }
      },
      { unit: "m2", properties: {
          display: "\u33a1",
          quantity: "Area",
          quantityDisplay: "A",
          description: "(Surface) area in square meters"
        }
      },
      { unit: "K", properties: {
          display: "K",
          quantity: "Temperature",
          quantityDisplay: "T",
          description: "Temperature in kelvin"
        }
      },
      { unit: "Pa", properties: {
          display: "Pa",
          quantity: "Pressure",
          quantityDisplay: "P",
          description: "Pressure in pascal"
        }
      },
      { unit: "kg", properties: {
          display: "kg",
          quantity: "Mass",
          quantityDisplay: "m",
          description: "Mass in kilogram"
        }
      },
      { unit: "ratio", properties: {
          display: "",
          quantity: "Ratio",
          quantityDisplay: "\u03c6",
          description: "Relative value compared to reference or normal value. 0 = 0%, 1 = 100%, 1e-3 = 1 ppt"
        }
      },
      { unit: "m/s2", properties: {
          display: "m/s\u00b2",
          quantity: "Acceleration",
          quantityDisplay: "a",
          description: "Acceleration in meters per second squared"
        }
      },
      { unit: "rad/s2", properties: {
          display: "rad/s\u00b2",
          quantity: "Angular acceleration",
          quantityDisplay: "a",
          description: "Angular acceleration in radians per second squared"
        }
      },
      { unit: "N", properties: {
          display: "N",
          quantity: "Force",
          quantityDisplay: "F",
          description: "Force in newton"
        }
      },
      { unit: "T", properties: {
          display: "T",
          quantity: "Magnetic field",
          quantityDisplay: "B",
          description: "Magnetic field strength in tesla"
        }
      },
      { unit: "Lux", properties: {
          display: "lx",
          quantity: "Light Intensity",
          quantityDisplay: "Ev",
          description: "Light Intensity in lux"
        }
      },
      { unit: "Pa/s", properties: {
          display: "Pa/s",
          quantity: "Pressure rate",
          quantityDisplay: "R",
          description: "Pressure change rate in pascal per second"
        }
      },
      { unit: "Pa.s", properties: {
          display: "Pa s",
          quantity: "Viscosity",
          quantityDisplay: "\u03bc",
          description: "Viscosity in pascal seconds"
        }
      }
    ];


  constructor(  private AppSettingsService: AppSettingsService,
    ) {
      this.defaultUnitsSub = this.AppSettingsService.getDefaultUnitsAsO().subscribe(
        newDefaults => {
          this.defaultUnits = newDefaults;
        }
      );
  }

  unitConversionFunctions = {
    // see https://github.com/SignalK/specification/blob/master/schemas/definitions.json
    'unitless': function(v) { return v; },
// Speed
    'knots': Qty.swiftConverter("m/s", "kn"),
    'kph': Qty.swiftConverter("m/s", "kph"),
    'm/s': function(v) { return v; },
    'mph': Qty.swiftConverter("m/s", "mph"),
// Acceleration
    "m/s2": function(v) { return v; },
    "gee": Qty.swiftConverter('m/s^2', 'gee'),
// Volume
    "liter": Qty.swiftConverter('m^3', 'liter'),
    "gallon": Qty.swiftConverter('m^3', 'gallon'),
    "m3": function(v) { return v; },
// Flow
    //TODO: Missing base as kg/s. Is it a problem to have 2 base measure in sk spec?
    'm3/s': function(v) { return v; },
    'l/min': Qty.swiftConverter("m^3/s", "liter/minute"),
    'l/h': Qty.swiftConverter("m^3/s", "liter/hour"),
    'g/min': Qty.swiftConverter("m^3/s", "gallon/minute"),
    'g/h': Qty.swiftConverter("m^3/s", "gallon/hour"),
// temp
    "K": function(v) { return v; },
    "celsius": Qty.swiftConverter("tempK", "tempC"),
    "fahrenheit": Qty.swiftConverter("tempK", "tempF"),
// length
    "m": function(v) { return v; },
    "fathom": Qty.swiftConverter('m', 'fathom'),
    "feet": Qty.swiftConverter('m', 'foot'),
    "km": Qty.swiftConverter('m', 'km'),
    "nm": Qty.swiftConverter('m', 'nmi'),
    "mi": Qty.swiftConverter('m', 'mi'),
// Potential
    "V": function(v) { return v; },
    "mV": function(v) { return v*1000; },
// Current
    "A": function(v) { return v; },
    "mA": function(v) { return v*1000; },
// charge
    "C": function(v) { return v; },
    "Ah": Qty.swiftConverter('C', 'Ah'),
// Power
    "W": function(v) { return v; },
    "mW": function(v) { return v*1000; },
// Energy
    "J": function(v) { return v; },
    "kWh": Qty.swiftConverter('J', 'kWh'),
// Luminosity
    "Lux": function(v) { return v; },
// Resistance
    "ohm": function(v) { return v; },
// Magnetic field
    "T": function(v) { return v; },
// pressure
    "Pa": function(v) { return v; },
    "bar": Qty.swiftConverter('Pa', 'bar'),
    "psi": Qty.swiftConverter('Pa', 'psi'),
    "mmHg": Qty.swiftConverter('Pa', 'mmHg'),
    "inHg": Qty.swiftConverter('Pa', 'inHg'),
    "hPa": Qty.swiftConverter('Pa', 'hPa'),
    "mbar": Qty.swiftConverter('Pa', 'millibar'),
// pressure rate
    "Pa/s": function(v) { return v; },
// Viscosity
    "Pa.s": function(v) { return v; },
// Density - Description: Current outside air density
    "kg/m3": function(v) { return v; },
// Time
    "s": function(v) { return v; },
    "Minutes": Qty.swiftConverter('s', 'minutes'),
    "Hours": Qty.swiftConverter('s', 'hours'),
    "Days": Qty.swiftConverter('s', 'days'),
    "HH:MM:SS": function(v) {
      v = parseInt(v, 10);
      if (v < 0) { v = v *-1} // always positive

      var h = Math.floor(v / 3600);
      var m = Math.floor(v % 3600 / 60);
      var s = Math.floor(v % 3600 % 60);
      return ('0' + h).slice(-2) + ":" + ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    },
// angularVelocity
    "rad/s": function(v) { return v; },
    "deg/s": Qty.swiftConverter('rad/s', 'deg/s'),
    "deg/min": Qty.swiftConverter('rad/s', 'deg/min'),
// angular acceleration
    "rad/s2": function(v) { return v; },
// frequency
    "rpm": function(v) { return v*60; },
    "Hz": function(v) { return v; },
    "KHz": function(v) { return v/1000; },
    "MHz": function(v) { return v/1000000; },
    "GHz": function(v) { return v/1000000000; },
// angle
    //TODO: missing base as deg. Is it a problem to have 2 base measure in sk spec?
    "rad": function(v) { return v; },
    "deg": Qty.swiftConverter('rad', 'deg'),
    "grad": Qty.swiftConverter('rad', 'grad'),
// Force
    "N": function(v) { return v; },
    "lbf": Qty.swiftConverter('N', 'lbf'),
// Torque
    "Nm": function(v) { return v; },
// ratio
    'percent': function(v) { return v * 100 },
    'percentraw': function(v) { return v },
    'ratio': function(v) { return v },
// lat/lon
    // TODO: This should be fixed at some point to support deg as base value to align with SK. Also add to conveerstion unit groups and Units defaults and demo defaults
    'latitudeMin': function(v) {
        v = Qty(v, 'rad').to('deg').scalar ;
        let degree = Math.trunc(v);
        let s = 'N';
        if (v < 0) { s = 'S'; degree = degree * -1 }
        let r = (v % 1) * 60; // decimal part of input, * 60 to get minutes
        return degree + '° ' + r.toFixed(2).padStart(5, '0') + '\' ' + s;
      },
    'latitudeSec': function(v) {
      v = Qty(v, 'rad').to('deg').scalar ;
      let degree = Math.trunc(v);
      let s = 'N';
      if (v < 0) { s = 'S'; degree = degree * -1 }
      let r = (v % 1) * 60; // decimal part of input, * 60 to get minutes
      let minutes = Math.trunc(r);
      let seconds = (r % 1) * 60;

      return degree + '° ' + minutes + '\' ' + seconds.toFixed(2).padStart(5, '0') + '" ' + s;
    },
    'longitudeMin': function(v) {
      v = Qty(v, 'rad').to('deg').scalar ;
      let degree = Math.trunc(v);
      let s = 'E';
      if (v < 0) { s = 'W'; degree = degree * -1 }
      let r = (v % 1) * 60; // decimal part of input, * 60 to get minutes
      return degree + '° ' + r.toFixed(2).padStart(5, '0') + '\' ' + s;
    },
    'longitudeSec': function(v) {
      v = Qty(v, 'rad').to('deg').scalar ;
      let degree = Math.trunc(v);
      let s = 'E';
      if (v < 0) { s = 'W'; degree = degree * -1 }
      let r = (v % 1) * 60; // decimal part of input, * 60 to get minutes
      let minutes = Math.trunc(r);
      let seconds = (r % 1) * 60;

      return degree + '° ' + minutes + '\' ' + seconds.toFixed(2).padStart(5, '0') + '" ' + s;
    },
  }

  /**
   * Get the list of Kip's default units per unit groups. This list determine if/how Kip
   * should convert Signal K source values for display. This list comes from Kip config settings.
   *
   * @return {*}  {IUnitDefaults}
   * @memberof UnitsService
   */
  public getDefaults(): IUnitDefaults {
    return this.defaultUnits;
  }

  /**
   * Returns the available Kip unit groups and measures that are available for
   * value conversion operations.
   *
   * @return {*}  {IUnitGroup[]}
   * @memberof UnitsService
   */
  public getConversions(): IUnitGroup[] {
    return this.conversionList;
  }

  /**
   * Returns array of Signal K supported units a Source (Sk path) values can be publish. Use
   * this method to obtain a valid list of possible units that can be assigned to a path's
   * meta.units.
   *
   * @return {*}  {ISkBaseUnit[ unit: string, properties: ISkUnitProperties]}
   * @memberof UnitsService
   */
  public getDefaultSkUnits(): ISkBaseUnit[] {
    return this.skBaseUnits;
  }

  public convertUnit(unit: string, value: number): number {
    if (!(unit in this.unitConversionFunctions)) { return null; }
    if (value === null) { return null; }
    return this.unitConversionFunctions[unit](value);
  }

  /**
   * Obtain a list of possible Kip value type conversions for a given path. e.g. Speed
   * conversion group (kph, Knots, etc.). The conversion list will be trimmed to only
   * the conversions for the group in question. If a default value type (as supplied by Sk)
   * for a path cannot be found, the full list is returned and with 'unitless' as the
   * default. Same goes if the value type exists, but Kip does not yet handle it.
   *
   * @param path the path you want conversions for
   * @return object containing the default format and an array of possible conversion group(s)
   */
   public getConversionsForUnits(units: string): { default: string, conversions: IUnitGroup[] } {
    let groupList = [];
    let isUnitInList: boolean = false;
    let defaultUnit: string = "unitless";
    // if Units type, set to unitless
    if (units === null || units === "" || units === undefined) {
      return { default: 'unitless', conversions: this.conversionList };
    } else {
      // only return all Units of matching conversion group.
      for (let index = 0; index < this.conversionList.length; index++) {
        const unitGroup:IUnitGroup = this.conversionList[index];

        unitGroup.units.forEach(unit => {
          if (unit.measure == units) {
            isUnitInList = true;
            defaultUnit = this.defaultUnits[unitGroup.group];
            groupList.push(unitGroup);
          }
        });
      }
    }

    if (isUnitInList) {
      return { default: defaultUnit, conversions: groupList };
    }
    // default if we have an unknown unit
    console.warn("[Units Service] Unsupported Unit type found: " + units + ". Please copy this message and create a git issue to request additionnal unit type support.");
    return { default: 'unitless', conversions: this.conversionList };
  }
}
