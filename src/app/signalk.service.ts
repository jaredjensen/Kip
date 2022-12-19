import { Injectable } from '@angular/core';
import { Observable , BehaviorSubject } from 'rxjs';
import { IPathData, IPathValueData, IDefaultSource, IPathType, IMetaPathType} from "./app.interfaces";
import { SignalKDeltaService } from './signalk-delta.service';
import * as Qty from 'js-quantities';


interface pathRegistrationValue {
  value: any;
};

interface pathRegistration {
  uuid: string;
  path: string;
  source: string; // if this is set, updates to observable are the direct value of this source...
  observable: BehaviorSubject<pathRegistrationValue>;
}

export interface updateStatistics {
  currentSecond: number; // number up updates in the last second
  secondsUpdates: number[]; // number of updates receieved for each of the last 60 seconds
  minutesUpdates: number[]; // number of updates receieved for each of the last 60 minutes
}

@Injectable({
  providedIn: 'root'
})
export class SignalKService {

  private degToRad = Qty.swiftConverter('deg', 'rad');
  private selfurn: string;

  // Local array of paths containing received SignalK Data and used to source Observers
  private paths: IPathData[] = [];
  // List of paths used by Kip (Widgets or App (Notifications and such))
  private pathRegister: pathRegistration[] = [];

  // path Observable to monitor data (sources and values) changes
  private pathsObservale: BehaviorSubject<IPathData[]> = new BehaviorSubject<IPathData[]>([]);

  // path Observable of new unknown paths
  private newPath$: BehaviorSubject<IMetaPathType> = new BehaviorSubject<IMetaPathType>({path: 'self.name', meta: {type: 'string'}});

  // Performance stats
  updateStatistics: updateStatistics = {
    currentSecond: 0,
    secondsUpdates: [],
    minutesUpdates:  [],
  }
  secondsUpdatesBehaviorSubject: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
  minutesUpdatesBehaviorSubject: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);

  constructor(
    private delta: SignalKDeltaService,
  )
  {
    //every second update the stats for seconds array
    setInterval(() => {

      // if seconds is more than 60 long, remove item
      if (this.updateStatistics.secondsUpdates.length >= 60) {
        this.updateStatistics.secondsUpdates.shift() //removes first item
      }
      this.updateStatistics.secondsUpdates.push(this.updateStatistics.currentSecond);
      this.updateStatistics.currentSecond = 0;
      this.secondsUpdatesBehaviorSubject.next(this.updateStatistics.secondsUpdates);
    }, 1000);

    // every minute update status for minute array
    setInterval(() => {

      // if seconds is more than 60 long, remove item
      if (this.updateStatistics.minutesUpdates.length >= 60) {
        this.updateStatistics.minutesUpdates.shift() //removes first item
      }
      this.updateStatistics.minutesUpdates.push(this.updateStatistics.secondsUpdates.reduce((a, b) => a + b, 0)); //sums the second array
      this.minutesUpdatesBehaviorSubject.next(this.updateStatistics.minutesUpdates)

    }, 60000);

    // Observer of Delta service data path updates
    this.delta.subscribeDataPathsUpdates().subscribe((dataPath: IPathValueData) => {
      this.updatePathData(dataPath);
    });

    // Observer of vessel Self URN
    this.delta.subscribeSelfUpdates().subscribe(self => {
      this.selfurn = self;
    });
  }

  getupdateStatsSecond() {
    return this.secondsUpdatesBehaviorSubject.asObservable();
  }

  getupdateStatMinute() {
    return this.minutesUpdatesBehaviorSubject.asObservable();
  }

  public resetSignalKData() {
    this.paths = [];
    this.selfurn = null;
  }

  public unsubscribePath(uuid, path) {
    let registerIndex = this.pathRegister.findIndex(registration => (registration.path == path) && (registration.uuid == uuid));
    if (registerIndex >= 0) {
      this.pathRegister.splice(registerIndex,1);
    }
  }

  public subscribePath(uuid: string, path: string, source: string) {
    //see if already subscribed, if yes return that...
    let registerIndex = this.pathRegister.findIndex(registration => (registration.path == path) && (registration.uuid == uuid));
    if (registerIndex >= 0) { // exists
      return this.pathRegister[registerIndex].observable.asObservable();
    }

    // find if we already have a value for this path to return.
    let currentValue = null;
    let pathIndex = this.paths.findIndex(pathObject => pathObject.path == path);
    if (pathIndex >= 0) { // exists
      if (source === null) {
        currentValue = this.paths[pathIndex]; //  return the entire pathObject
      } else if (source == 'default') {
        currentValue = this.paths[pathIndex].sources[this.paths[pathIndex].defaultSource].value;
      } else if (source in this.paths[pathIndex].sources) {
        currentValue = this.paths[pathIndex].sources[source].value;
      }
    }

    let newRegister = {
      uuid: uuid,
      path: path,
      source: source,
      observable: new BehaviorSubject<pathRegistrationValue>({ value: currentValue})
    };

    //register
    this.pathRegister.push(newRegister);
    // should be subscribed now, use search now as maybe someone else adds something and it's no longer last in array :P
    pathIndex = this.pathRegister.findIndex(registration => (registration.path == path) && (registration.uuid == uuid));
    return this.pathRegister[pathIndex].observable.asObservable();
  }

  /**
   * Resonsible for processing all data updates.
   *
   * @private
   * @param {IPathValueData} dataPath
   * @memberof SignalKService
   */
  private updatePathData(dataPath: IPathValueData): void {
    // Update connection msg stats
    this.updateStatistics.currentSecond++;

    // Convert position data to match Kip's default position format - could be removed from here and handled in Units service for performance
    // TODO: future performance improvement
    if (dataPath.path.includes('position.latitude') || dataPath.path.includes('position.longitude')) {
      dataPath.value = this.degToRad(dataPath.value);
    }

    // PROCESS DATA
    // See if path key exists
    let pathIndex = this.paths.findIndex(pathObject => pathObject.path == dataPath.path);

    // EXIST
    if (pathIndex >= 0) {
      // Update data
      this.paths[pathIndex].sources[dataPath.source] = {
        timestamp: dataPath.timestamp,
        value: dataPath.value,
      };

    // NOT EXIST
    } else { // doesn't exist. update...
      let dataType = typeof(dataPath.value);

      this.paths.push({
        path: dataPath.path,
        defaultSource: dataPath.source, // default source
        sources: {
          [dataPath.source]: {
            timestamp: dataPath.timestamp,
            value: dataPath.value
          }
        },
        type: dataType,
      });

      // push new path meta type
      this.newPath$.next({
        path: dataPath.path,
        meta: {
          type: dataType
        }
      });

      // get new object index for further processing
      pathIndex = this.paths.findIndex(pathObject => pathObject.path == dataPath.path);
    }

    // push it to any subscriptions of that data
    this.pathRegister.filter(pathRegister => pathRegister.path == dataPath.path).forEach(
      pathRegister => {

        let source: string = null;
        if (pathRegister.source == 'default') {
          source = this.paths[pathIndex].defaultSource;
        } else if (pathRegister.source in this.paths[pathIndex].sources) {
          source = pathRegister.source;
        } else {
          //we're looking for a source we don't know of... do nothing I guess?
          console.warn(`[SignalK Service] Failure updating source data. Source unknown or not defined for path: ${pathRegister.source}`);
        }
        if (source !== null) {
          pathRegister.observable.next({
            value: this.paths[pathIndex].sources[source].value
          });
        }
      }
    );

    // push it to paths observer
    this.pathsObservale.next(this.paths);
  }

    //TODO: do we still need this?
  private setDefaultSource(source: IDefaultSource): void {
    let pathIndex = this.paths.findIndex(pathObject => pathObject.path == source.path);
    if (pathIndex >= 0) {
      this.paths[pathIndex].defaultSource = source.source;
    }
  }

  /**
   * Returns a list of known paths.
   *
   * @param dataType Optionnal. Filter paths on data type (as per typeof: string, number,
   * boolean, object). If not specified, returns paths of all types.
   * @param selfOnly Optionnal. If true, filter paths for context of the current vessel
   * (that begins with "self"). If false or not specified, returns all context (self,
   * AIS, Atoms and such other sources if present)
   *
   * @return array of path string
   */
  public getPaths(dataType?: string, selfOnly?: boolean): string[] {
    let pathsType: IPathType[] = [...this.paths]; // copy values - loose reference

    if (selfOnly) {
      pathsType = pathsType.filter( item => item.path.startsWith("self") );
    }

    if (dataType) {
      pathsType = pathsType.filter( item => item.type == dataType );
    }

    let stringPaths: string[] = [];
    pathsType.forEach(item => stringPaths.push(item.path))

    return stringPaths;
  }

  public getPathObject(path): IPathData {
    let pathIndex = this.paths.findIndex(pathObject => pathObject.path == path);
    if (pathIndex < 0) { return null; }
    return {...this.paths[pathIndex]} // unpack object to loose reference
  }

  public getPathsObservable(): Observable<IPathData[]> {
    return this.pathsObservale.asObservable();
  }

  public getNewPathsAsO(): Observable<IMetaPathType> {
    return this.newPath$.asObservable();
  }
 }
