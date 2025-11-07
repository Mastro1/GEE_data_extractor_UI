import React from 'react';
import { Configuration, HowType } from '../types';

interface HowSelectorProps {
  config: Configuration['how'];
  setConfig: (config: Configuration['how']) => void;
}

export default function HowSelector({ config, setConfig }: HowSelectorProps) {
  return (
    <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md border border-gray-200 dark:border-dark-border">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary mb-4">HOW - Export Method</h3>
      <div className="space-y-4">
        <fieldset>
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <input
                id="drive"
                name="how-type"
                type="radio"
                value={HowType.DRIVE}
                checked={config.type === HowType.DRIVE}
                onChange={e => setConfig({ ...config, type: e.target.value as HowType })}
                className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 dark:bg-gray-700 dark:border-dark-border"
              />
              <label htmlFor="drive" className="ml-3 block text-sm font-medium text-gray-700 dark:text-dark-text-primary">{HowType.DRIVE}</label>
            </div>
            <div className="flex items-center">
              <input
                id="local"
                name="how-type"
                type="radio"
                value={HowType.LOCAL}
                checked={config.type === HowType.LOCAL}
                onChange={e => setConfig({ ...config, type: e.target.value as HowType })}
                className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 dark:bg-gray-700 dark:border-dark-border"
              />
              <label htmlFor="local" className="ml-3 block text-sm font-medium text-gray-700 dark:text-dark-text-primary">{HowType.LOCAL}</label>
            </div>
          </div>
        </fieldset>

        <div>
          <label htmlFor="outputFilename" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Output Filename Prefix</label>
          <p className="text-xs text-brand-text dark:text-dark-text-secondary mb-1">Used as the base name for exported files (e.g., in Drive).</p>
          <input
            type="text"
            id="outputFilename"
            value={config.outputFilename}
            onChange={e => setConfig({ ...config, outputFilename: e.target.value })}
            className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
            placeholder="e.g., my_export_file"
          />
        </div>

        {config.type === HowType.LOCAL && (
          <div>
            <label htmlFor="localPath" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Local Folder Path</label>
            <p className="text-xs text-brand-text dark:text-dark-text-secondary mb-1">Enter the absolute path where the script should save files.</p>
            <input
              type="text"
              id="localPath"
              value={config.localPath}
              onChange={e => setConfig({ ...config, localPath: e.target.value })}
              className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="/path/to/your/folder"
            />
          </div>
        )}
      </div>
    </div>
  );
}