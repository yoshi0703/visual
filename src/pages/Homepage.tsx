import React from 'react';
import { Link } from 'react-router-dom';

const Homepage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Transform Customer Feedback Into Growth</h1>
            <p className="text-xl text-gray-600 mb-8">Automated customer interviews that turn real feedback into actionable insights for your business</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-3 transition duration-300">
                Get Started Free
              </Link>
              <Link to="/pricing" className="border border-gray-300 hover:border-gray-400 bg-white text-gray-800 font-medium rounded-lg px-6 py-3 transition duration-300">
                View Pricing
              </Link>
            </div>
          </div>
          
          <div className="relative mx-auto max-w-4xl">
            <div className="bg-gray-100 rounded-xl shadow-lg p-2">
              {/* Placeholder for dashboard/app screenshot */}
              <div className="bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                <p className="text-gray-500 font-medium">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-gray-600">Collect valuable customer feedback without the hassle</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Create Your QR Code",
                description: "Generate a custom QR code for your business in minutes"
              },
              {
                title: "Customers Share Feedback",
                description: "Our AI interviews your customers and collects valuable insights"
              },
              {
                title: "Grow Your Business",
                description: "Use the collected feedback to improve and attract more customers"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to collect better customer feedback?</h2>
            <p className="text-xl opacity-90 mb-8">Start for free and upgrade as your business grows</p>
            <Link to="/register" className="bg-white text-blue-600 hover:bg-gray-100 font-medium rounded-lg px-8 py-3 transition duration-300">
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;