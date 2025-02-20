declare module 'leaflet' {
  import * as L from 'leaflet';

  export interface MapOptions {
    center?: L.LatLngExpression;
    zoom?: number;
  }

  export interface Icon {
    options: IconOptions;
  }

  export interface IconOptions {
    iconUrl: string;
    iconRetinaUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    shadowUrl?: string;
  }

  export interface DivIcon extends Icon {
    html: string;
    className?: string;
  }

  export function icon(options: IconOptions): Icon;
  export function divIcon(options: DivIcon): Icon;

  export interface MarkerOptions {
    icon?: Icon;
  }

  export interface TileLayerOptions {
    attribution?: string;
  }
} 