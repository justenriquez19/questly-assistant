export interface Slot {
  id: number;
  startDateTime: string;
  endDateTime: string;
  available: boolean;
}

export interface SlotsEndpointResponse {
  minimum: string;
  maximum: string;
  slots: Array<Slot>;
  occupied: Array<Slot>;
  busyness: Array<Slot>;
}
