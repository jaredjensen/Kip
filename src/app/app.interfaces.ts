/*********************************************************************************
 * This file contains App (Kip) internal data interfaces.
 *
 * Those interfaces describe most (only is reuse is needed) shared app data types
 * and data structures used in the application. They are use by various services,
 * componenets and widgets.
 *
 * For Signal K data interfaces (external data), see signalk-interfaces file.
 *********************************************************************************/

import { ISignalKMetadata, IZone, State, Method } from "./signalk-interfaces";


export interface IPathMetadata {
  path: string;
  meta: ISignalKMetadata;
}

/**
 * An App data structure that represents a simple data path's
 * value type. Used to filter types of path.
 *
 * Use by: modal-path-selector component and provided by Signal K service
 *
 * @memberof app-interfaces
 */
export interface IPathType {
  path: string;
  type: string;
}

/**
 * An App data structure that represents a meta path's
 * corresponding data path value type.
 *
 * Use by: Signal K service and meta service
 *
 * @memberof app-interfaces
 */
 export interface IMetaPathType {
  path: string;
  meta: {
    type: string;
  }
}

/**
 * An App data structure that represents a simple data path's most recent
 * value regardless of the source that updated it.
 *
 * Use by: Zones service and SignalK service
 *
 * @memberof app-interfaces
 */
export interface IPathValue {
  path: string;
  value: any;
}

/**
 * An App data structure that represents a data path's zones definitions
 * (ie. the different state the data can be in). Used for gauges and notification menu.
 *
 * Ex: to vusually display the different state an engine RPM is at: normal, alarn,
 * emergency, etc. on a radial gauge subcribed to self.propulsion.engines.port
 *
 * Use by: zones service and AppSettings service
 *
 * @memberof app-interfaces
 */
export interface IPathZoneDef {
  path: string;
  zonesDef: IZone[];
}

/**
 * An App data structure that represents the values (ie. sensor data)
 * of a path. Used as a Read/Write interface on internal App paths data source.

 * Use by: signalk-delta services (parser) and
 * signalk services (internal app datasource)
 *
 * @memberof app-interfaces
 */
 export interface IPathValueData {
  path: string;
  source: string;
  timestamp: number;
  value: any;
}

/**
 * An App data structure that represents a path's rich/complet data structure;
 * all possible signal K data sources and their values, default source, data type description,
 * data zone state, all meta data, etc.
 *
 * Use by: data-browser (consumer) and signalk services (internal datasource)
 *
 * @memberof app-interfaces
 */
 export interface IPathData {
  path: string;
  defaultSource?: string; // default source
  sources: {
    [sourceName: string]: { // per source data
      timestamp: number;
      value: any;
    }
  }
  //TODO: Delete once cleaned up
  meta?: any;
  type: string;
}

/**
 * An App data structure that represents a resquest/response "ie. a notification"
 * message.
 *
 * Use by: Notification service (consumer), signalk-delta (parser)
 *
 * Follow URL for full SignalK specification and description of fields:
 * @url https://signalk.org/specification/1.7.0/doc/request_response.html
 *
 * @memberof app-interfaces
 */
 export interface INotification {
  method: Method[],
  state: State,
  message: string
  timestamp: string,
}

export interface IDefaultSource {
  path: string;
  source: string;
}
