import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SATELLITES, MASKS } from './constants';
import { Configuration, HowType, Satellite, WhereType, Mask } from './types';
import WhereSelector from './components/WhereSelector';
import WhenSelector from './components/WhenSelector';
import WhatSelector from './components/WhatSelector';
import HowSelector from './components/HowSelector';
import CodeOutput from './components/CodeOutput';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import MaskSelector from './components/MaskSelector';
import { generatePythonScripts } from './services/scriptGenerator';

type Theme = 'light' | 'dark';

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const [config, setConfig] = useState<Configuration>({
    satelliteId: SATELLITES[0].id,
    where: {
      type: WhereType.POINT,
      point: { lat: '40.7128', lon: '-74.0060' },
      pointsFile: null,
      gadm: { country: '', region: '', subregion: '' },
      personalShapeFile: null,
    },
    when: {
      startYear: 2020,
      endYear: 2022,
      startDoy: 1,
      endDoy: 365,
    },
    what: {
      bands: SATELLITES[0].bands.map(b => b.name),
    },
    how: {
      type: HowType.DRIVE,
      localPath: 'C:/Users/Default/Downloads/GEE_Exports',
      outputFilename: '',
    },
    settings: {
      geeProject: 'your-gcp-project-id',
      driveFolder: 'GEE_EXTRACTIONS',
    },
    mask: {
      enabled: false,
      maskId: null,
      filters: {},
    },
  });

  const selectedSatellite = useMemo(
    () => SATELLITES.find(s => s.id === config.satelliteId) || SATELLITES[0],
    [config.satelliteId]
  );

  const selectedMask = useMemo(
    () => MASKS.find(m => m.id === config.mask.maskId),
    [config.mask.maskId]
  );

  const defaultFilename = useMemo(() => {
    const satName = selectedSatellite.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase();
    const startYear = config.when.startYear;
    const endYear = config.when.endYear;
    const masked = config.mask.enabled ? '_masked' : '';

    let location = 'aoi';
    switch (config.where.type) {
      case WhereType.POINT:
        location = `${config.where.point.lat}_${config.where.point.lon}`.replace(/\./g, 'p').replace(/-/g, 'n');
        break;
      case WhereType.POINTS:
        location = config.where.pointsFile?.split('.')[0] || 'points_file';
        break;
      case WhereType.SHAPE_GADM:
        location = [config.where.gadm.country, config.where.gadm.region, config.where.gadm.subregion]
          .filter(Boolean).join('_').replace(/\s+/g, '_');
        break;
      case WhereType.SHAPE_PERSONAL:
        location = config.where.personalShapeFile?.split('.')[0] || 'shape_file';
        break;
    }
    location = location.replace(/[^a-zA-Z0-9_]/g, '').replace(/_+/g, '_').toLowerCase() || 'aoi';

    return `${satName}_${startYear}_${endYear}${masked}_${location}`;
  }, [selectedSatellite.name, config.when, config.mask.enabled, config.where]);

  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      how: { ...prev.how, outputFilename: defaultFilename }
    }));
  }, [defaultFilename]);
  
  const handleSatelliteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSatId = e.target.value;
    const newSat = SATELLITES.find(s => s.id === newSatId) || SATELLITES[0];
    setConfig(prev => ({
      ...prev,
      satelliteId: newSatId,
      what: {
        bands: newSat.bands.map(b => b.name), // Reset bands to new satellite's defaults
      }
    }))
  };

  const handleMaskIdChange = (newMaskId: string | null) => {
    const { mask } = config;

    if (!newMaskId) {
        setConfig(prev => ({ ...prev, mask: { ...mask, maskId: null, filters: {} } }));
        return;
    }

    const newMask = MASKS.find(m => m.id === newMaskId);
    if (newMask) {
        const initialFilters = newMask.filters.reduce((acc, filter) => {
            acc[filter.key] = filter.options[0];
            return acc;
        }, {} as Record<string, string>);

        setConfig(prev => ({
            ...prev,
            mask: {
                ...mask,
                maskId: newMaskId,
                filters: initialFilters,
            }
        }));
    }
};

  const updateConfig = useCallback(<K extends keyof Configuration>(key: K, value: Configuration[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const pythonScripts = useMemo(() => generatePythonScripts(config, selectedSatellite, selectedMask), [config, selectedSatellite, selectedMask]);

  const InfoCard = ({ satellite }: { satellite: Satellite }) => (
    <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md border border-gray-200 dark:border-dark-border">
      <h3 className="text-xl font-bold text-brand-dark dark:text-dark-text-primary">{satellite.name}</h3>
      <p className="text-sm text-brand-text dark:text-dark-text-secondary mt-1">{satellite.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="dark:text-dark-text-secondary"><span className="font-semibold dark:text-dark-text-primary">Start Date:</span> {satellite.startDate}</div>
        <div className="dark:text-dark-text-secondary"><span className="font-semibold dark:text-dark-text-primary">Pixel Size:</span> {satellite.pixelSize}m</div>
        <div className="dark:text-dark-text-secondary"><span className="font-semibold dark:text-dark-text-primary">EE Collection:</span> <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">{satellite.ee_collection_name}</code></div>
        <div><a href={satellite.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary hover:underline">Official Website ↗</a></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-brand-dark dark:text-dark-text-primary flex flex-col">
      <header className="bg-white dark:bg-dark-surface shadow-sm dark:border-b dark:border-dark-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-dark-text-primary">GEE Data Extractor</h1>
          <div className="flex items-center gap-2">
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-surface focus:ring-brand-primary"
                aria-label="Toggle theme"
            >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
             <button 
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-secondary bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-surface focus:ring-brand-primary"
              aria-label="Open help"
              >
              <HelpIcon />
              Help
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-text-secondary bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-surface focus:ring-brand-primary"
              aria-label="Open settings"
              >
              <SettingsIcon />
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Configuration */}
          <div className="space-y-6">
            <div>
              <label htmlFor="satellite" className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Select Satellite</label>
              <select
                id="satellite"
                value={config.satelliteId}
                onChange={handleSatelliteChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md shadow-sm"
              >
                {SATELLITES.map(sat => (
                  <option key={sat.id} value={sat.id}>{sat.name}</option>
                ))}
              </select>
            </div>

            <InfoCard satellite={selectedSatellite} />

            <WhereSelector 
              config={config.where} 
              setConfig={(value) => updateConfig('where', value)}
            />
            <WhenSelector 
              config={config.when} 
              setConfig={(value) => updateConfig('when', value)}
              satelliteStartDate={selectedSatellite.startDate}
            />
            <WhatSelector 
              config={config.what}
              setConfig={(value) => updateConfig('what', value)}
              availableBands={selectedSatellite.bands}
            />
            <MaskSelector
                config={config.mask}
                setConfig={(value) => updateConfig('mask', value)}
                availableMasks={MASKS}
                selectedMask={selectedMask}
                onMaskIdChange={handleMaskIdChange}
            />
            <HowSelector 
              config={config.how}
              setConfig={(value) => updateConfig('how', value)}
            />
          </div>

          {/* Right Column: Code Output */}
          <div className="sticky top-24 z-5">
            <CodeOutput scripts={pythonScripts} />
          </div>
        </div>
      </main>
      
      <footer className="w-full text-center py-4 mt-8 border-t border-gray-200 dark:border-dark-border">
        <p className="text-sm text-brand-text dark:text-dark-text-secondary">
          Developed by <a href="https://github.com/Mastro1" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-primary hover:underline">Mastro1</a>
        </p>
      </footer>


      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={config.settings}
        setSettings={(value) => updateConfig('settings', value)}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}