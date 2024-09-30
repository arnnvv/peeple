import {
  AddressComponent,
  Client,
  GeocodingAddressComponentType,
} from "@googlemaps/google-maps-services-js";

const client = new Client();

export const getCityFromCoordinates = async (
  lat: number,
  lng: number,
): Promise<string | null> => {
  try {
    const response = await client.reverseGeocode({
      params: {
        latlng: [lat, lng],
        key: "YOUR_GOOGLE_MAPS_API_KEY",
      },
    });

    const addressComponents = response.data.results[0].address_components;

    const cityComponent = addressComponents.find(
      (component: AddressComponent): boolean =>
        component.types.includes(
          GeocodingAddressComponentType.point_of_interest,
        ),
    );

    return cityComponent ? cityComponent.long_name : null;
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return null;
  }
};
