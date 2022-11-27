import { Injectable } from '@angular/core';
import { IZone, IZoneState } from "./app.interfaces";
import { AppSettingsService } from './app-settings.service';

export interface IZonesRegistry {
  path: string;
  pathDataState?: number;
  zones: IZone[];
}

@Injectable({
  providedIn: 'root'
})
export class ZonesService {

  private registry: IZonesRegistry;
  private temp: Array<IZone> = [];

  constructor(
    private settings: AppSettingsService
  ) {
    this.settings.getZonesAsO().subscribe((zoneConfig: Array<IZone>) => {
      this.temp = zoneConfig;


    });
  }


  setZoneState(){
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
}
