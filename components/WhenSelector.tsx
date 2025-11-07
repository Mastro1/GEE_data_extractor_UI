import React from 'react';
import { Configuration } from '../types';

interface WhenSelectorProps {
  config: Configuration['when'];
  setConfig: (config: Configuration['when']) => void;
  satelliteStartDate: string;
}

export default function WhenSelector({ config, setConfig, satelliteStartDate }: WhenSelectorProps) {
  const minYear = new Date(satelliteStartDate).getFullYear();
  const currentYear = new Date().getFullYear();

  const handleYearChange = (field: 'startYear' | 'endYear', value: string) => {
    const year = parseInt(value, 10);
    if (!isNaN(year)) {
      setConfig({ ...config, [field]: year });
    }
  };

  const handleDoyChange = (field: 'startDoy' | 'endDoy', value: string) => {
    let doy = parseInt(value, 10);
    if (isNaN(doy)) doy = 1;
    if (doy < 1) doy = 1;
    if (doy > 366) doy = 366;
    setConfig({ ...config, [field]: doy });
  };
  
  return (
    <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md border border-gray-200 dark:border-dark-border">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">WHEN - Time Range</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startYear" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Start Year</label>
          <input 
            type="number" 
            id="startYear" 
            value={config.startYear} 
            min={minYear}
            max={currentYear}
            onChange={e => handleYearChange('startYear', e.target.value)} 
            className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
        </div>
        <div>
          <label htmlFor="endYear" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">End Year</label>
          <input 
            type="number" 
            id="endYear" 
            value={config.endYear} 
            min={minYear}
            max={currentYear}
            onChange={e => handleYearChange('endYear', e.target.value)} 
            className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
        </div>
        <div>
          <label htmlFor="startDoy" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Start Day of Year (DOY)</label>
          <input 
            type="number" 
            id="startDoy" 
            value={config.startDoy} 
            min="1" max="366" 
            onChange={e => handleDoyChange('startDoy', e.target.value)} 
            className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
        </div>
        <div>
          <label htmlFor="endDoy" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">End Day of Year (DOY)</label>
          <input 
            type="number" 
            id="endDoy" 
            value={config.endDoy} 
            min="1" max="366" 
            onChange={e => handleDoyChange('endDoy', e.target.value)} 
            className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
        </div>
      </div>
      {config.startDoy > config.endDoy && (
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-3 bg-amber-100 dark:bg-amber-900/50 p-2 rounded-md">
          Note: Since Start DOY is after End DOY, the date range will wrap around the new year (e.g., from Oct 1st of Year N to March 1st of Year N+1).
        </p>
      )}
    </div>
  );
}