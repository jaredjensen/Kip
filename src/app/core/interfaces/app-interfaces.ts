/*********************************************************************************
 * This file contains the most, but not all, common KIP App internal data types and
 * structure interfaces. They are used by various services, components and widgets.
 *
 * For external data interfaces, such as Signal K, see signalk-interfaces file.
 *********************************************************************************/

import { ISkMetadata, TState } from "./signalk-interfaces";

/**
 * An App data structure that represents the values (ie. sensor data)
 * of a path. Used as a Read/Write interface on internal App paths data source.

 * Use by: signalk-full services (parser), signalk-delta services (parser) and
 * Signal K services (internal app dataSource)
 *
 * @memberof app-interfaces
 */
 export interface IPathValueData {
  context: string;
  path: string;
  source: string;
  timestamp: string;
  value: any;
}

/**
 * An App data structure that represents a path's complete data structure:
 * Path properties, value, value data type, data sources,
 * data zone state, meta data, etc.
 *
 * In latest SK implementation with support for Source priority, we
 * should always have one unique value per path. Without Priority each sources
 * will, inturn, update the path value, and it's own source value, causing
 * erratic path value updates. This is by design.
 * To prevent this, users need to set Priority rules or select a specific source.
 *
 * Use by: data-browser (consumer) and Signal K services (internal data source)
 *
 * @memberof app-interfaces
 */
 export interface ISkPathData {
  path: string;
  pathValue: any;
  pathTimestamp: string;
  type: string;
  state: TState;
  defaultSource?: string; // default source
  sources: {
    [sourceName: string]: { // per source data
      sourceTimestamp: string;
      sourceValue: any;
    }
  };
  meta?: ISkMetadata;
}


/**
 * Interface that defines a path's meta data object.
 *
 * @memberof app-interfaces
 */
 export interface IPathMetaData {
  path: string;
  meta?: ISkMetadata;
}

/**
 * Interface that defines path meta data object augmented with meta.type for improved
 * filtering and searching.
 *
 * @memberof app-interfaces
 */
export interface IMetaServicePathMeta {
  path: string;
  meta: IMetadata;
}

/**
 * Interface that extends Signal K ISkMetadata to adds path data Type
 * used to enhance filtering and identification.
 *
 * @memberof app-interfaces
 */
export interface IMetadata extends ISkMetadata {
  /** TS type of the path's data value */
  type?: string;
}

export interface IDefaultSource {
  path: string;
  source: string;
}

export interface IMeta {
  /** Optional SK context representing the root node emitting the value. Empty context should assume the message is from Self. Other contexts can be from AIS, DCS and other types of remote emitting sources configured */
  context: string,
  path: string;
  meta: ISkMetadata;
}
