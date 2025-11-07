import React, { Fragment } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    geeProject: string;
    driveFolder: string;
  };
  setSettings: (settings: { geeProject: string; driveFolder: string }) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, setSettings }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">Settings</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close settings">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="geeProject" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Google Earth Engine Project</label>
              <input
                type="text"
                id="geeProject"
                value={settings.geeProject}
                onChange={e => setSettings({ ...settings, geeProject: e.target.value })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                placeholder="your-gcp-project-id"
              />
            </div>
            <div>
              <label htmlFor="driveFolder" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Default Google Drive Folder</label>
              <input
                type="text"
                id="driveFolder"
                value={settings.driveFolder}
                onChange={e => setSettings({ ...settings, driveFolder: e.target.value })}
                className="mt-1 block w-full border-gray-300 dark:border-dark-border bg-white dark:bg-gray-700 text-gray-900 dark:text-dark-text-primary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                placeholder="GEE_EXTRACTIONS"
              />
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}