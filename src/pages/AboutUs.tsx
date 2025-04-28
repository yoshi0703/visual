import React from 'react';

const AboutUs: React.FC = () => {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">About Us</h1>
      <p className="mb-4">This is the About Us page. It's currently being edited and will contain information about our company, mission, and team.</p>
      
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Our Mission</h2>
        <p>At クチトル, we're dedicated to helping small businesses collect authentic customer feedback and increase their online presence through meaningful reviews.</p>
      </div>
      
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Our Team</h2>
        <p>Our team consists of dedicated professionals with experience in AI, customer experience, and small business support.</p>
      </div>
    </div>
  );
};

export default AboutUs;