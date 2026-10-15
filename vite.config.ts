import { defineConfig } from 'vite';
// Living Orbit remains the default entry; Harf is an independent experiment.
export default defineConfig({ build: { rollupOptions: { input: {
  orbit: 'index.html', harfXR: 'harf-studio-xr.html', harfDesktop: 'harf-studio.html', competitionDemo: 'competition-demo.html', showcasePanel:'vr-showcase.html', showcaseOrbit:'showcase-orbit.html', showcaseHarf:'showcase-harf.html',
} } } });
