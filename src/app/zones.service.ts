import { Injectable } from '@angular/core';
import { IZone, IZoneState, IPathZoneDef } from "./app.interfaces";
import { AppSettingsService } from './app-settings.service';
import { BehaviorSubject, Observable } from 'rxjs';

// Used by service for zone state computing
export interface IPathZone extends IPathZoneDef {
  dataState?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ZonesService {

  private pathZoneState: IPathZone[];
  private zones$: BehaviorSubject<Array<IPathZone>> = new BehaviorSubject<Array<IPathZone>>([]);

  constructor(
    private settings: AppSettingsService
  ) {
    this.pathZoneState = this.settings.getZones();
    this.setZoneState();
    this.zones$.next(this.pathZoneState);

    // const zonesData: IPathZone[] =
    // [
    //   {
    //     path: "self.propulsion.port.revolutions",
    //     dataState: 0,
    //     zonesDef: [
    //       {
    //         "lower": 0,
    //         "upper": 2500,
    //         "state": 0
    //       },
    //       {
    //         "lower": 2500,
    //         "upper": 2800,
    //         "state": 1
    //       },
    //       {
    //         "lower": 2800,
    //         "upper": 3000,
    //         "state": 2
    //       },
    //       {
    //         "lower": 3000,
    //         "upper": 3100,
    //         "state": 3
    //       },
    //       {
    //         "lower": 3100,
    //         "state": 4,
    //         "message": "Engine will blow up!!!"
    //       }
    //     ]
    //   },
    //   {
    //     path: "self.electrical.switches.bank.0.1.state",
    //     dataState: 2,
    //     zonesDef: [
    //       {
    //         "upper": 5,
    //         "lower": 0,
    //         "state": 0
    //       },
    //       {
    //         "upper": 10,
    //         "lower": 6,
    //         "state": 1
    //       }
    //     ]
    //   },
    //   {
    //     path: "self.electrical.chargers.victron.yieldYesterday",
    //     dataState: 4,
    //     zonesDef: [
    //       {
    //       "lower": 0,
    //       "upper": 50,
    //       "state": 0
    //       }
    //     ]
    //   }
    // ];
  }

  public addPathZones(newPathZoneDef: IPathZoneDef) {
    // check if exists
    let zoneIndex = this.pathZoneState.findIndex(item => item.path == newPathZoneDef.path);
    if (zoneIndex >= 0) {
      this.pathZoneState[zoneIndex].zonesDef = newPathZoneDef.zonesDef;
    } else {
      this.pathZoneState.push(newPathZoneDef);
    }
    // Compute zone state and push to observers
    this.setZoneState(newPathZoneDef.path);
    this.zones$.next(this.pathZoneState);

    // Save Zone configuration
    let zonesConfig = this.settings.getZones();
    // check if exists in zone config
    let zoneConfigIndex = zonesConfig.findIndex(pathZonesDef => pathZonesDef.path == newPathZoneDef.path);
    if (zoneConfigIndex >= 0) {
      zonesConfig[zoneConfigIndex].zonesDef = newPathZoneDef.zonesDef;
    } else {
      zonesConfig.push(newPathZoneDef);
    }
    this.settings.saveZones(zonesConfig);
  }

  public deletePathZones(path: string): boolean {
    // check if exists
    let zoneIndex = this.pathZoneState.findIndex(item => item.path == path);
    if (zoneIndex >= 0) {
      this.pathZoneState.splice(zoneIndex, 1);
      this.zones$.next(this.pathZoneState);

      // check if exists in zone config
      let zonesConfig = this.settings.getZones();
      let zoneConfigIndex = zonesConfig.findIndex(item => item.path == path);
      if (zoneConfigIndex >= 0) {
        zonesConfig.splice(zoneConfigIndex,1);
        this.settings.saveZones(zonesConfig);
      }
      return true;
    } else {
      return false;
    }
  }

  setZoneState(path?: string){
  // //TODO: fix
  // // Check for any zones to set state
  // let state: IZoneState = IZoneState.normal;
  // this.zones.forEach(zone => {
  //   if (zone.path != pathSelf) { return; }
  //   let lower = zone.lower || -Infinity;
  //   let upper = zone.upper || Infinity;
  //   let convertedValue = this.unitService.convertUnit(zone.unit, dataPath.value);
  //   if (convertedValue >= lower && convertedValue <= upper) {
  //     //in zone
  //     state = Math.max(state, zone.state);
  //   }
  // });
  // // if we're not in alarm, and new state is alarm, sound the alarm!
  // // @ts-ignore
  // if (state != IZoneState.normal && state != this.paths[pathIndex].state) {
  //   let stateString; // notif service needs string....
  //   let methods;
  //   switch (state) {
  //     // @ts-ignore
  //     case IZoneState.nominal:
  //       stateString = "nominal"
  //       methods = [ 'visual', 'sound' ];
  //       break;

  //     case IZoneState.emergency:
  //       stateString = "emergency"
  //       methods = [ 'visual', 'sound' ];
  //       break;

  //     // @ts-ignore
  //     case IZoneState.alarm:
  //         stateString = "alarm"
  //         methods = [ 'visual','sound' ];
  //         break;

  //     case IZoneState.warn:
  //       stateString = "warn"
  //       methods = [ 'visual', 'sound' ];
  //       break;

  //     // @ts-ignore
  //     case IZoneState.alert:
  //         stateString = "alert"
  //         methods = [ 'visual','sound' ];
  //         break;
  //   }


  //   // Send Notification
  //   this.notificationsService.addAlarm(pathSelf, {
  //     method: methods,
  //     state: stateString,
  //     message: pathSelf + ' value in ' + stateString,
  //     timestamp: Date.now().toString(),
  //   })
  // }

  // // if we're in alarm, and new state is not alarm, stop the alarm
  // // @ts-ignore
  // if (this.paths[pathIndex].state != IZoneState.normal && state == IZoneState.normal) {
  //   this.notificationsService.deleteAlarm(pathSelf);
  // }

  // this.paths[pathIndex].state = state;

  }

  public getZonesObservable(): Observable<IPathZone[]> {
    return this.zones$.asObservable();
  }
}
