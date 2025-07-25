//.lighthouserc.js
export default {
  ci: {
    collect: {
      startServerCommand: 'npm run start --prefix frontend',
      url: ['http://localhost:3000/index.html'],
      numberOfRuns: 1, // ✅ This will now work!
      puppeteerScript: './lighthouse-runner.mjs',
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'unused-javascript': ['warn', { maxLength: 0 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
