export type MapBusinessPin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  verified: boolean;
  district: string | null;
  /** İlan pinlerinde görev detayına yönlendirme */
  listingId?: string;
  businessId?: string;
};
