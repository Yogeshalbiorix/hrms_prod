export const GOOGLE_MAPS_API_KEY = 'AIzaSyAONdWlvzm8Jc8elwxfe4_hQwcjZDnAH38';

export interface LocationData {
    lat: number;
    lng: number;
    address: string;
}

interface GeocodingResult {
    formatted_address: string;
}

interface GeocodingResponse {
    status: string;
    results: GeocodingResult[];
}

declare global {
    interface Window {
        google: any;
    }
}

/**
 * Get address from latitude and longitude using Google Maps Geocoding API
 */
export async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json() as GeocodingResponse;

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            return data.results[0].formatted_address;
        } else {
            console.warn('Geocoding failed:', data.status);
            return 'Address not found';
        }
    } catch (error) {
        console.error('Error fetching address:', error);
        return 'Error fetching address';
    }
}

/**
 * Load Google Maps script dynamically
 */
export function loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (error) => reject(error);
        document.head.appendChild(script);
    });
}
