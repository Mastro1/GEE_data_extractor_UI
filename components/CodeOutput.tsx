import React, { useState, useEffect } from 'react';

type CodeView = 'script' | 'class';

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

interface RunState {
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  artifacts?: {
    config_path: string;
    runner_path: string;
    class_path: string;
    output_path: string;
    log_path: string;
  };
}

interface CodeOutputProps {
  scripts: {
    fullScript: string;
    classCode: string;
  };
  onRun: () => Promise<void>;
  runState: RunState;
}

export default function CodeOutput({ scripts, onRun, runState }: CodeOutputProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<CodeView>('script');

  const contentToDisplay = activeTab === 'script' ? scripts.fullScript : scripts.classCode;

  // Reset copied state when tab changes
  useEffect(() => {
    setCopied(false);
  }, [activeTab]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(contentToDisplay);
    setCopied(true);
  };

  const TabButton = ({ view, children }: { view: CodeView, children: React.ReactNode }) => {
    const isActive = activeTab === view;
    return (
      <button
        onClick={() => setActiveTab(view)}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-brand-primary ${
          isActive ? 'bg-gray-600 text-white' : 'text-gray-300 hover:bg-gray-800'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-700 rounded-t-lg">
        <div className="flex items-center gap-2 p-0.5 bg-gray-900/50 rounded-lg">
          <TabButton view="script">Run Script</TabButton>
          <TabButton view="class">Class Code</TabButton>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (runState.status === 'running') return;
              await onRun();
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
              runState.status === 'running'
                ? 'bg-blue-500 text-white opacity-70 cursor-not-allowed'
                : 'bg-brand-primary text-white hover:bg-brand-primary/80'
            }`}
          >
            {runState.status === 'running' ? 'Running…' : 'Run Extraction'}
          </button>
          <button
            onClick={copyToClipboard}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors duration-200 ${copied ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className="p-4 text-sm text-white overflow-x-auto max-h-[70vh]">
        <code className="language-python">{contentToDisplay}</code>
      </pre>
      {runState.status !== 'idle' && (
        <div
          className={`px-4 py-3 text-sm border-t border-gray-700 ${
            runState.status === 'error' ? 'text-red-300' : 'text-green-300'
          }`}
        >
          <p>{runState.message}</p>
          {runState.artifacts && runState.status === 'success' && (
            <div className="mt-2 text-xs text-gray-300 space-y-1">
              <p className="font-semibold text-gray-200">Generated files:</p>
              <ul className="space-y-1">
                <li><span className="text-gray-400">Runner:</span> <code className="break-all">{runState.artifacts.runner_path}</code></li>
                <li><span className="text-gray-400">Classes:</span> <code className="break-all">{runState.artifacts.class_path}</code></li>
                <li><span className="text-gray-400">Config:</span> <code className="break-all">{runState.artifacts.config_path}</code></li>
                <li><span className="text-gray-400">Output:</span> <code className="break-all">{runState.artifacts.output_path}</code></li>
                <li><span className="text-gray-400">Log:</span> <code className="break-all">{runState.artifacts.log_path}</code></li>
              </ul>
            </div>
          )}
          {runState.artifacts && runState.status === 'error' && (
            <div className="mt-2 text-xs text-red-200">
              <p>Review the log file for more details:</p>
              <code className="break-all">{runState.artifacts.log_path}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
