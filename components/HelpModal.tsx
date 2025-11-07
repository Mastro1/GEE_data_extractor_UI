import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CloseIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-12 pb-12 overflow-y-auto" 
        onClick={onClose} 
        aria-modal="true" 
        role="dialog"
    >
      <div 
        className="bg-white dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-2xl m-4 transform transition-all"
        onClick={e => e.stopPropagation()} // Prevent clicks inside modal from closing it
       >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary">About & How to Use</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close help modal">
              <CloseIcon />
            </button>
          </div>
          <div className="mt-6 prose dark:prose-invert max-w-none text-gray-700 dark:text-dark-text-secondary leading-relaxed">
            
            <section>
              <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">What is this tool?</h4>
              <p>
                The GEE Data Extractor is a visual tool that simplifies extracting data from Google Earth Engine (GEE). Instead of writing code from scratch, you can configure your request through this UI to generate a ready-to-use Python script.
              </p>
            </section>
            
            <hr className="!my-6 border-gray-200 dark:border-gray-700" />

            <section>
              <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">How does it work?</h4>
              <p>
                Follow the steps on the left panel to configure your data extraction:
              </p>
              <ul className="!my-4">
                <li><strong>Configure Settings:</strong> Click the <strong>Settings</strong> button in the top-right to enter your Google Earth Engine project ID. This is required for the script to authenticate correctly.</li>
                <li><strong>Select Satellite:</strong> Choose a GEE dataset. Key metadata will be displayed.</li>
                <li><strong>WHERE:</strong> Define your Area of Interest (AOI)—a single point, a file of points, a GADM boundary, or your own shapefile.</li>
                <li><strong>WHEN:</strong> Specify the time range, including start/end years and the Day-of-Year (DOY) interval.</li>
                <li><strong>WHAT:</strong> Select the specific data bands (e.g., precipitation, NDVI) you need.</li>
                <li><strong>HOW:</strong> Choose your export method. Google Drive is the most common choice.</li>
              </ul>
              <p>
                As you change the settings, the Python code on the right updates instantly.
              </p>
            </section>

            <hr className="!my-6 border-gray-200 dark:border-gray-700" />
            
            <section>
              <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">How to Use the Generated Code</h4>
              <p>
                The tool generates two essential pieces of code: the <strong>Run Script</strong> and the <strong>Class Code</strong>. You'll need both to run the extraction.
              </p>
              
              <div className="not-prose space-y-3 mt-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <h5 className="font-semibold text-gray-800 dark:text-dark-text-primary">Option 1: Copy & Paste</h5>
                    <ol className="list-decimal list-inside space-y-1.5 mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                      <li>In the code output panel, switch to the <strong>Class Code</strong> tab. Copy the content and save it into a new file named <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded font-mono">gee_classes.py</code>.</li>
                      <li>Switch to the <strong>Run Script</strong> tab. Copy its content and save it to another file (e.g., <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded font-mono">main.py</code>) in the <strong>same directory</strong>.</li>
                      <li>Open your terminal, navigate to that directory, and run the script: <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded font-mono">python main.py</code>.</li>
                    </ol>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <h5 className="font-semibold text-gray-800 dark:text-dark-text-primary">Option 2: Use GitHub</h5>
                    <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                      For convenience, you can download the class definitions and required libraries directly from the project's repository.
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 mt-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                        <li>Clone or download project files from: <a href="#" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium">[GitHub Link Placeholder]</a>.</li>
                        <li>This gives you the <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded font-mono">gee_classes.py</code> file and a <code className="text-xs bg-gray-200 dark:bg-gray-700 p-1 rounded font-mono">requirements.txt</code> file.</li>
                        <li>Copy the generated <strong>Run Script</strong> from the UI, save it in the cloned directory, and run it.</li>
                    </ul>
                </div>
              </div>
            </section>
            
            <hr className="!my-6 border-gray-200 dark:border-gray-700" />

            <section>
              <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary">Required Libraries</h4>
              <p>
                Ensure you have the necessary Python libraries installed. You can install them using pip:
              </p>
              <pre className="!bg-gray-100 dark:!bg-gray-800 !p-3 !rounded-md !text-sm"><code>pip install earthengine-api pandas pygadm geopandas</code></pre>
            </section>

          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}