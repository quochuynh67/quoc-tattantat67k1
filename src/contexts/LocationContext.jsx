import React, { createContext, useEffect, useState } from 'react';
import { getUrlParams, fetchLocationFromTokens } from '../utils/urlParams';

export const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const { accessToken, locationToken } = getUrlParams();

    if (accessToken && locationToken) {
      setLoading(true);
      setError(null);

      fetchLocationFromTokens(accessToken, locationToken)
        .then(data => {
          setLocationData(data);
          console.log('Location data fetched:', data);
        })
        .catch(err => {
          setError(err.message);
          console.error('Failed to fetch location:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  return (
    <LocationContext.Provider value={{ locationData, loading, error }}>
      {children}
    </LocationContext.Provider>
  );
}
