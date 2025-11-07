import React, { useState, useMemo } from 'react';
import { Configuration, Band } from '../types';

interface WhatSelectorProps {
  config: Configuration['what'];
  setConfig: (config: Configuration['what']) => void;
  availableBands: Band[];
}

export default function WhatSelector({ config, setConfig, availableBands }: WhatSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBands = useMemo(() => {
    if (!searchTerm) {
      return availableBands;
    }
    return availableBands.filter(band =>
      band.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      band.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableBands]);

  const handleBandChange = (bandName: string) => {
    const newBands = config.bands.includes(bandName)
      ? config.bands.filter(b => b !== bandName)
      : [...config.bands, bandName];
    setConfig({ ...config, bands: newBands });
  };

  const selectAllFiltered = () => {
    const filteredBandNames = filteredBands.map(b => b.name);
    // Add all visible (filtered) bands to the current selection, avoiding duplicates.
    const newBands = [...new Set([...config.bands, ...filteredBandNames])];
    setConfig({ ...config, bands: newBands });
  };

  const deselectAllFiltered = () => {
    const filteredBandNamesSet = new Set(filteredBands.map(b => b.name));
    // Remove all visible (filtered) bands from the current selection.
    const newBands = config.bands.filter(b => !filteredBandNamesSet.has(b));
    setConfig({ ...config, bands: newBands });
  };

  return (
    <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md border border-gray-200 dark:border-dark-border">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">WHAT - Bands to Extract</h3>
      
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="search"
            id="band-search"
            placeholder="Search bands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
          />
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={selectAllFiltered}
            className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-brand-primary dark:text-blue-400 border border-brand-primary dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={deselectAllFiltered}
            className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-400 dark:border-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      {availableBands.length > 0 ? (
        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
          {filteredBands.map(band => (
            <div key={band.name} className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={band.name}
                  aria-describedby={`${band.name}-description`}
                  type="checkbox"
                  checked={config.bands.includes(band.name)}
                  onChange={() => handleBandChange(band.name)}
                  className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 dark:bg-gray-700 dark:border-dark-border rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={band.name} className="font-medium text-gray-700 dark:text-dark-text-primary">{band.name}</label>
                <p id={`${band.name}-description`} className="text-gray-500 dark:text-dark-text-secondary">{band.description} ({band.units})</p>
              </div>
            </div>
          ))}
          {filteredBands.length === 0 && searchTerm && (
             <p className="text-center text-sm text-gray-500 dark:text-dark-text-secondary py-4">No bands match "{searchTerm}"</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-brand-text dark:text-dark-text-secondary">No bands available for this satellite.</p>
      )}
    </div>
  );
}