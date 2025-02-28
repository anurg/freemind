import React from 'react';

export default function Test() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-600">Tailwind CSS Test</h1>
      <p className="mt-4 text-gray-600">This is a test page to verify that Tailwind CSS is working.</p>
      
      <div className="mt-8 w-full max-w-md">
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="testInput">
              Test Input
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              id="testInput" 
              type="text" 
              placeholder="Test input"
            />
          </div>
          <div className="flex items-center justify-between">
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" 
              type="button"
            >
              Test Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
