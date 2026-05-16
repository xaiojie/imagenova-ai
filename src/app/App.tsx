import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { GeneratePanel } from './components/GeneratePanel';
import { Gallery, GalleryItem } from './components/Gallery';
import { PromptPresets } from './components/PromptPresets';
import { UpgradeBanner } from './components/UpgradeBanner';
import { MobilePreview } from './components/MobilePreview';
import { Footer } from './components/Footer';
import { ImageDetailDrawer } from './components/ImageDetailDrawer';
import { MyWorksPage } from './components/MyWorks';
import { StoreProvider, useStore } from './lib/store';

function Shell() {
  const { view, theme } = useStore();
  const [active, setActive] = useState<GalleryItem | null>(null);

  const bg = theme === 'dark'
    ? 'radial-gradient(ellipse at top, #1a0f3d 0%, #0a0816 40%, #050410 100%)'
    : 'radial-gradient(ellipse at top, #efe4ff 0%, #f6f3ff 40%, #ffffff 100%)';

  return (
    <div className="min-h-screen relative noise-bg" style={{ background: bg }}>
      <Navbar />
      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
            <Hero />
            <GeneratePanel />
            <Gallery onOpen={setActive} />
            <PromptPresets />
            <UpgradeBanner />
            <MobilePreview />
          </motion.div>
        ) : (
          <motion.div key="works" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
            <MyWorksPage />
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
      <ImageDetailDrawer item={active} onClose={() => setActive(null)} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
