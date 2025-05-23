import React from 'react';

const BpLocator: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="https://bpretaillocator.geoapp.me/?locale=en_ZA"
        allow="geolocation"
        frameBorder="0"
        style={{ width: '100%', height: '100%', border: 'none' }}
        scrolling="no"
        title="BP Retail Locator"
      >
        <p>Your browser does not support iframes.</p>
      </iframe>
    </div>
  );
};

export default BpLocator;
