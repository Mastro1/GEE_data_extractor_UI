import React from 'react';
import { Configuration, WhereType } from '../types';

interface WhereSelectorProps {
  config: Configuration['where'];
  setConfig: (config: Configuration['where']) => void;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

// FIX: Explicitly typing TabButton as a React.FC allows it to accept React's special `key` prop, resolving the type error when used inside a map.
const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${
      active ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);

export default function WhereSelector({ config, setConfig }: WhereSelectorProps) {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'pointsFile' | 'personalShapeFile') => {
    const file = e.target.files?.[0];
    setConfig({ ...config, [field]: file ? file.name : null });
  };
  
  return (
    <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md border border-gray-200 dark:border-dark-border">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">WHERE - Area of Interest</h3>
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {Object.values(WhereType).map(type => (
          <TabButton key={type} active={config.type === type} onClick={() => setConfig({ ...config, type })}>
            {type}
          </TabButton>
        ))}
      </div>
      
      <div className="mt-4 space-y-4">
        {config.type === WhereType.POINT && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lat" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Latitude</label>
              <input type="number" id="lat" value={config.point.lat} onChange={e => setConfig({...config, point: {...config.point, lat: e.target.value}})} className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g., 40.7128" />
            </div>
            <div>
              <label htmlFor="lon" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Longitude</label>
              <input type="number" id="lon" value={config.point.lon} onChange={e => setConfig({...config, point: {...config.point, lon: e.target.value}})} className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g., -74.0060" />
            </div>
          </div>
        )}

        {config.type === WhereType.POINTS && (
          <div>
            <label htmlFor="pointsFile" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Upload CSV/TXT File</label>
            <p className="text-xs text-brand-text dark:text-dark-text-secondary mb-2">A file with 'lat' and 'lon' columns. The script will use the filename provided.</p>
            <input type="file" id="pointsFile" onChange={e => handleFileChange(e, 'pointsFile')} accept=".csv,.txt" className="mt-1 block w-full text-sm text-gray-500 dark:text-dark-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-blue-700" />
            {config.pointsFile && <p className="text-sm mt-2 text-green-600">Selected file: {config.pointsFile}</p>}
          </div>
        )}

        {config.type === WhereType.SHAPE_GADM && (
          <div className="space-y-2">
            <p className="text-sm text-brand-text dark:text-dark-text-secondary">Provide GADM administrative area names. The Python script will look them up.</p>
            <div>
              <label htmlFor="gadmCountry" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Country</label>
              <input type="text" id="gadmCountry" value={config.gadm.country} onChange={e => setConfig({...config, gadm: {...config.gadm, country: e.target.value}})} className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g., Italy" />
            </div>
             <div>
              <label htmlFor="gadmRegion" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Region / State (Optional)</label>
              <input type="text" id="gadmRegion" value={config.gadm.region} onChange={e => setConfig({...config, gadm: {...config.gadm, region: e.target.value}})} className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g., Lombardy" />
            </div>
             <div>
              <label htmlFor="gadmSubregion" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Sub-region / County (Optional)</label>
              <input type="text" id="gadmSubregion" value={config.gadm.subregion} onChange={e => setConfig({...config, gadm: {...config.gadm, subregion: e.target.value}})} className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm" placeholder="e.g., Milan" />
            </div>
          </div>
        )}

        {config.type === WhereType.SHAPE_PERSONAL && (
          <div>
            <label htmlFor="shapeFile" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Upload Shapefile (.zip) or GeoJSON</label>
            <p className="text-xs text-brand-text dark:text-dark-text-secondary mb-2">The script will use the filename provided. Ensure the file is accessible by the script.</p>
            <input type="file" id="shapeFile" onChange={e => handleFileChange(e, 'personalShapeFile')} accept=".zip,.geojson,.json" className="mt-1 block w-full text-sm text-gray-500 dark:text-dark-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-blue-700" />
            {config.personalShapeFile && <p className="text-sm mt-2 text-green-600">Selected file: {config.personalShapeFile}</p>}
          </div>
        )}
      </div>
    </div>
  );
}