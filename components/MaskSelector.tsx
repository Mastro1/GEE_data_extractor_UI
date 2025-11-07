import React from 'react';
import { Configuration, Mask } from '../types';

interface MaskSelectorProps {
  config: Configuration['mask'];
  setConfig: (config: Configuration['mask']) => void;
  availableMasks: Mask[];
  selectedMask?: Mask;
  onMaskIdChange: (maskId: string | null) => void;
}

export default function MaskSelector({ config, setConfig, availableMasks, selectedMask, onMaskIdChange }: MaskSelectorProps) {

  const handleToggle = (enabled: boolean) => {
    if (enabled && availableMasks.length > 0) {
      // If enabling and no mask is selected, select the first one
      if (!config.maskId) {
        onMaskIdChange(availableMasks[0].id);
      }
    }
    setConfig({ ...config, enabled });
  };

  const InfoCard = ({ mask }: { mask: Mask }) => (
    <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg mt-3">
      <p className="text-sm text-brand-text dark:text-dark-text-secondary">{mask.description}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="dark:text-dark-text-secondary"><span className="font-semibold dark:text-dark-text-primary">Pixel Size:</span> {mask.pixelSize}m</div>
        <div><a href={mask.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary hover:underline">Official Website ↗</a></div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md border border-gray-200 dark:border-dark-border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">MASK - Apply a Data Mask</h3>
        <label htmlFor="mask-toggle" className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            id="mask-toggle" 
            className="sr-only peer" 
            checked={config.enabled}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary"></div>
        </label>
      </div>

      {config.enabled && (
        <div className="mt-4 space-y-4 pt-4 border-t border-gray-200 dark:border-dark-border">
          <div>
            <label htmlFor="mask" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Select Mask Dataset</label>
            <select
              id="mask"
              value={config.maskId ?? ''}
              onChange={(e) => onMaskIdChange(e.target.value || null)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md shadow-sm"
            >
              <option value="">-- No mask selected --</option>
              {availableMasks.map(mask => (
                <option key={mask.id} value={mask.id}>{mask.name}</option>
              ))}
            </select>
          </div>

          {selectedMask && (
            <>
              <InfoCard mask={selectedMask} />
              <div className="space-y-3">
                {selectedMask.filters.map(filter => (
                  <div key={filter.key}>
                    <label htmlFor={`mask-filter-${filter.key}`} className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">{filter.label}</label>
                    <select
                      id={`mask-filter-${filter.key}`}
                      value={config.filters[filter.key] ?? ''}
                      onChange={(e) => setConfig({ ...config, filters: { ...config.filters, [filter.key]: e.target.value }})}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md shadow-sm"
                    >
                      {filter.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
