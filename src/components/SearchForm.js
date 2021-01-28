import React, { useState, useRef, useEffect } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import collegeData from '../locations';
import turf from '@turf/distance';

function SearchForm() {
  mapboxgl.accessToken = "pk.eyJ1Ijoib3A2NDMxIiwiYSI6ImNrazdwemdxcDBnZmMyb3AydjhlYW9ocjEifQ.8vTAJu0wLzLe1m6JoIk8IQ";

  const [map, setMap] = useState(null);
  const mapContainer = useRef(null);
  const [resultCoord, setResultCoord] = useState(null);
  const [selectedDist, setSelectedDist] = useState(null);
  const sortedDist = useRef(null);

  //add coordinates property to location.json file
  collegeData.forEach(college => {
    Object.defineProperty(college, 'coordinates', {
      value: [college.address__longitude, college.address__latitude],
      writable: true,
      enumerable: true,
      configurable: true
    });
  });

  useEffect(() => {
    //add input for locations
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      countries: 'us',
      mapboxgl: mapboxgl
    });
    const initializeMap = ({ setMap, mapContainer }) => {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [-95.7129, 37.092],
        zoom: 3
      });
      geocoder.onAdd(map);
      geocoder.addTo('.geocoder');
      map.on("load", () => {
        setMap(map);
        map.resize();
      });
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        })
      );
    };
    //set resultCoord once input has been given
    geocoder.on('results', function(results) {
      setResultCoord(results.features[0].geometry.coordinates);
    });
    if (!map) initializeMap({ setMap, mapContainer });
  }, [map, resultCoord, sortedDist]);

  //if resultCoord exists append distance from input to colleges
  if (resultCoord) {
    collegeData.forEach(college => (
      Object.defineProperty(college, 'distance', {
        value: turf(resultCoord, college.coordinates, { units: 'miles' }),
        writable: true,
        enumerable: true,
        configurable: true
      })
    ));

    //sort distance and filter on distances that are less than selectedDist (by user)
    sortedDist.current = collegeData.sort((a, b) => a.distance - b.distance).filter(college => college.distance < selectedDist);
  }

  return(
    <div>
      <div className="geocoder"></div>

      <nav className="main-nav">
          <button onClick={() => setSelectedDist(50)}>50 Miles</button>
          <button onClick={() => setSelectedDist(100)}>100 Miles</button>
          <button onClick={() => setSelectedDist(150)}>150 Miles</button>
          <input placeholder="Custom Distance" onChange={(e) => setSelectedDist(e.target.value)}></input>
      </nav>

      <div ref={el => mapContainer.current = el} />

      <div className="college-container">
        {!resultCoord ? collegeData.map(college => (
          <div className="college-card">
            <h2>{college.name}</h2>
            <img src={college.image_url} alt={college.name}/>
            <p>{college.address__city}, {college.address__state}</p>
          </div>
        ))
        :
        sortedDist.current.map(college => (
          <div className="college-card">
            <h2>{college.name}</h2>
            <p>Approximately {Math.ceil(college.distance)} Mile(s) Away</p>
            <img src={college.image_url} alt={college.name}/>
            <p>{college.address__city}, {college.address__state}</p>
          </div>
        ))
      }
      </div>
    </div>
  );
}

export default SearchForm;