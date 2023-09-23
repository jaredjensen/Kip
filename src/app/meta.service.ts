import { SignalkRequestsService } from './signalk-requests.service';
import { SignalKService } from './signalk.service';
import { SignalKDeltaService } from './signalk-delta.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { IMetaPathType, IPathMetadata, IPathZoneDef } from "./app.interfaces";
import { ISignalKMetadata } from "./signalk-interfaces";
import { AppSettingsService } from './app-settings.service';


// Used by service for zone state computing
export interface IPathZone extends IPathZoneDef {
  dataState?: number;
}

export interface IMetaRegistration {
  path: string;
  meta?: ISignalKMetadata;
}

@Injectable({
  providedIn: 'root'
})
export class MetaService {

  private metas: Array<IMetaRegistration> = [];
  private metas$: BehaviorSubject<Array<IMetaRegistration>> = new BehaviorSubject<Array<IMetaRegistration>>([]);

  constructor(
    private settings: AppSettingsService,
    private delta: SignalKDeltaService,
    private signalk: SignalKService,
    private Requests: SignalkRequestsService
  ) {
    // Load zones from config
    //TODO: Remove once zone are fully handled by SK server
    const zonesConfig = this.settings.getZones();
    zonesConfig.forEach(item => {
      const zones = {zones: item.zonesDef};
      this.metas.push({
        path: item.path,
        meta: zones
      });
    });

    this.metas$.next(this.metas);

    // Observer of Delta service Metadata updates
    this.delta.subscribeMetadataUpdates().subscribe((deltaMeta: IPathMetadata) => {
      this.processMetaUpdate(deltaMeta);
    })

    //TODO: add flush/reload on delta service restart

    // Observer of signal K service new unknown path updates
    this.signalk.getNewPathsAsO().subscribe((path: IMetaPathType) => {
      this.addMetaPath(path);
    })
  }

  private addMetaPath(newPath: IMetaPathType) {
    let metaIndex = this.metas.findIndex(item => item.path == newPath.path);
    if (metaIndex == -1) {
      this.metas.push({
        path: newPath.path,
        meta: {
          type: newPath.meta.type
        }
      });
    } else {
      this.metas[metaIndex].meta.type = newPath.meta.type;
    }
    this.metas$.next(this.metas);
  }

  private processMetaUpdate(meta: IPathMetadata): void {
    let metaIndex = this.metas.findIndex(pathObject => pathObject.path == meta.path);

    // TODO: Remove test logging
    // if (meta.path == 'self.electrical.batteries') {
    //   console.log(meta);
    // }



    if (metaIndex >= 0) {
      //TODO: Bug - does not remove properties. if received meta = {}  FULL EMPTY. It should replace with blank obj
      this.metas[metaIndex].meta = {...this.metas[metaIndex].meta, ...meta.meta};
    } else { // not in our list yet. We add a new path
      this.metas.push({
        path: meta.path,
        meta: meta.meta,
      });
    }
    this.metas$.next(this.metas);
  }

  public getMetaPaths(valueType?: string, selfOnly?: boolean): IMetaRegistration[] {
    let metaPaths: IMetaRegistration[] = JSON.parse(JSON.stringify(this.metas)); // copy values - loose reference

    if (selfOnly) {
      metaPaths = metaPaths.filter( item => item.path.startsWith("self") );
    }

    if (valueType) {
      metaPaths = metaPaths.filter( item => item.meta.type !== undefined && item.meta.type == valueType );
    }

    return metaPaths;
  }

  public getMeta(path: string): ISignalKMetadata | false {
    let index = this.metas.findIndex( item => item.path === path);
    if (index >= 0) {
      if (this.metas[index].meta !== undefined) {
        return this.metas[index].meta;
      }
    }
    return false;
  }

  public setMeta(metaUpdate: IMetaRegistration) {
    // IMPORTANT: Until SK supports Zones definition using deltas and partial JSON updates,
    // great care must be taken not to update with blank Zones as this method only deals
    // with meta that are not zones. See addZones() for this purpose.

    // pad meta path
    let metaPath = metaUpdate.path + ".meta.";

    // parse keys that are not undefined
    Object.keys(metaUpdate.meta).forEach(key => {
      if (metaUpdate.meta[key] !== undefined) {
        this.Requests.putRequest(metaPath + key, metaUpdate.meta[key]);
      }
    });
  }

  public getPathUnitType(path: string): string | null {
    let index = this.metas.findIndex(item => item.path == path);
    if (index < 0) { return null; }
    if ('units' in this.metas[index].meta) {
      return this.metas[index].meta.units;
    } else {
      return null;
    }
  }

  public addZones(newPathZoneDef: IPathZoneDef) {
    // *** Zones definitions can be published and they are processed by Signal K
    // *** and appropriate zone state notifications are sent back
    // *** BUT the Zones definitions are not published back as meta.zones
    // *** Until this feature is added to SK, we need to keep a duplicate local
    // *** copy of Zones definitions in Config. This far from ideal and can create
    // *** out of sync zone def problems.

    // because zones are not sen
    // check if exists
    let metaIndex = this.metas.findIndex(item => item.path == newPathZoneDef.path);
    if (metaIndex >= 0) {
      this.metas[metaIndex].meta.zones = newPathZoneDef.zonesDef;
    } else {
      this.metas.push(newPathZoneDef);
    }

    this.metas$.next(this.metas);

    // pad path with meta zones
    let zonesPath = newPathZoneDef.path + ".meta.zones";
    this.Requests.putRequest(zonesPath, newPathZoneDef.zonesDef);

    // Get Zone configuration settings
    let zonesConfig = this.settings.getZones();
    // check if path exists in zone configuration
    let zoneConfigIndex = zonesConfig.findIndex(pathZonesDef => pathZonesDef.path == newPathZoneDef.path);
    if (zoneConfigIndex >= 0) {
      zonesConfig[zoneConfigIndex].zonesDef = newPathZoneDef.zonesDef;
    } else {
      zonesConfig.push(newPathZoneDef);
    }

    // save updated Zone configuration settings
    this.settings.saveZones(zonesConfig);
  }

  public deleteZones(path: string): boolean {
    // check if exists
    let metaIndex = this.metas.findIndex(item => item.path == path);
    if (metaIndex >= 0) {
      this.metas[metaIndex].meta.zones = [];
      this.metas$.next(this.metas);

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

  /**
   * Return's obervable of Metas.
   *
   * @param {boolean} [allMeta] Optionnal. If true, returns all metas, else (default)
   * return only self metas
   * @return {*}  {Observable<Array'<IMetaRegistration'>>}
   * @memberof MetaService
   */
  public getMetasObservable(allMeta?: boolean): Observable<Array<IMetaRegistration>> {
    if (allMeta) {
      return this.metas$.asObservable();
    }

    const selfMetas$ = this.metas$.pipe(
      map( items => items.filter( item => item.path.startsWith("self.")))
    );

    return selfMetas$;
  }
}
