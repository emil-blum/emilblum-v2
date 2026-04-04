import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';

// Auto-discovers every image in public/images/ at build time.
// To add images: drop files into fragment-collage/public/images/ and rebuild.
// Paths are prefixed with ./fragment-collage/images/ so they resolve correctly
// from Development/about.html → Development/fragment-collage/images/.
const _imageGlob = import.meta.glob('/public/images/*.{jpg,jpeg,png,webp}');
const IMAGES = Object.keys(_imageGlob).map((path) => {
  const filename = path.split('/').pop()!;
  return './fragment-collage/images/' + encodeURIComponent(filename);
});

interface Fragment {
  id: string;
  type: 'crop' | 'color';
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  cropX: number;
  cropY: number;
  zoom: number;
  color?: string;
  delay: number;
}

// Main tile sizes — all kept to max 5 wide / 5 tall so both axes have
// at least 4 possible positions: x∈[0..cols-w], y∈[0..rows-h]
// → cols=12, rows=8: w=5 gives x∈{0..7}, h=5 gives y∈{0..3}
// This lets the tile land anywhere from top-left to bottom-right.
const MAIN_SIZES = [
  { w: 5, h: 5 },
  { w: 5, h: 4 },
  { w: 4, h: 5 },
  { w: 4, h: 4 },
  { w: 6, h: 4 },
  { w: 6, h: 5 },
  { w: 4, h: 6 },
  { w: 5, h: 6 },
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sampleColors = useCallback((img: HTMLImageElement): string[] => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    canvas.width = 50;
    canvas.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);
    const data = ctx.getImageData(0, 0, 50, 50).data;
    const sampled: string[] = [];
    for (let i = 0; i < 20; i++) {
      const idx = Math.floor(Math.random() * (data.length / 4)) * 4;
      sampled.push(`rgb(${data[idx]}, ${data[idx + 1]}, ${data[idx + 2]})`);
    }
    return sampled;
  }, []);

  const generateCollage = useCallback((sampledColors: string[]) => {
    setIsGenerating(true);
    const newFragments: Fragment[] = [];
    const cols = 12;
    const rows = 8;

    // Pick a random size and position for the main tile each time
    const { w: mainW, h: mainH } = MAIN_SIZES[Math.floor(Math.random() * MAIN_SIZES.length)];
    const mainX = Math.floor(Math.random() * (cols - mainW + 1));
    const mainY = Math.floor(Math.random() * (rows - mainH + 1));

    newFragments.push({
      id: 'main',
      type: 'crop',
      gridX: mainX,
      gridY: mainY,
      gridW: mainW,
      gridH: mainH,
      cropX: 50,
      cropY: 35,
      zoom: 1,
      delay: 0,
    });

    const occupied = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (let r = mainY; r < mainY + mainH; r++) {
      for (let c = mainX; c < mainX + mainW; c++) {
        occupied[r][c] = true;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!occupied[r][c]) {
          let w = 1;
          let h = 1;
          const canW = c + 1 < cols && !occupied[r][c + 1];
          const canH = r + 1 < rows && !occupied[r + 1]?.[c];
          const canBoth = canW && canH && !occupied[r + 1]?.[c + 1];
          const rand = Math.random();
          if (rand > 0.8 && canBoth) { w = 2; h = 2; }
          else if (rand > 0.6 && canW) { w = 2; h = 1; }
          else if (rand > 0.4 && canH) { w = 1; h = 2; }

          for (let ir = r; ir < r + h; ir++) {
            for (let ic = c; ic < c + w; ic++) {
              occupied[ir][ic] = true;
            }
          }

          const type = Math.random() > 0.25 ? 'crop' : 'color';
          newFragments.push({
            id: `frag-${r}-${c}`,
            type,
            gridX: c,
            gridY: r,
            gridW: w,
            gridH: h,
            cropX: Math.random() * 100,
            cropY: Math.random() * 100,
            zoom: Math.random() * 2.5 + 1.5,
            color: type === 'color'
              ? sampledColors[Math.floor(Math.random() * sampledColors.length)]
              : undefined,
            delay: Math.random() * 0.5,
          });
        }
      }
    }

    setFragments(newFragments);
    setTimeout(() => setIsGenerating(false), 600);
  }, []);

  const loadImage = useCallback((url: string) => {
    const img = new Image();
    img.onload = () => {
      const sc = sampleColors(img);
      setImage(url);
      generateCollage(sc);
    };
    img.src = url;
  }, [sampleColors, generateCollage]);

  // On mount: pick a random image
  useEffect(() => {
    const idx = Math.floor(Math.random() * IMAGES.length);
    setCurrentIndex(idx);
    loadImage(IMAGES[idx]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(() => {
    if (isGenerating) return;
    let next: number;
    do {
      next = Math.floor(Math.random() * IMAGES.length);
    } while (next === currentIndex && IMAGES.length > 1);
    setCurrentIndex(next);
    loadImage(IMAGES[next]);
  }, [currentIndex, isGenerating, loadImage]);

  return (
    // Outer shell: fills the parent container (height set by the about page section)
    <div className="relative w-full h-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="hidden" />

      {/*
        Inner grid: maintains 3:2 ratio and is sized to COVER the outer shell,
        exactly like background-size: cover. Centered with translate.
        Uses viewport units so the cover calculation works against the full screen
        while the outer container clips to the section height.
        - On landscape: width = 100vw, height = 100vw * 2/3
        - On portrait:  width = 100vh * 1.5 (fills the height), crops sides
      */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 'max(100vw, calc(100vh * 1.5))',
          aspectRatio: '3 / 2',
        }}
      >
        {image && (
          <div className="w-full h-full grid grid-cols-12 grid-rows-8">
            <AnimatePresence mode="popLayout">
              {fragments.map((frag) => (
                <motion.div
                  key={frag.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: frag.delay,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative overflow-hidden"
                  style={{
                    // Explicit start + span so fragments land exactly where the
                    // packing algorithm placed them, regardless of DOM order.
                    gridColumn: `${frag.gridX + 1} / span ${frag.gridW}`,
                    gridRow: `${frag.gridY + 1} / span ${frag.gridH}`,
                    backgroundColor: frag.type === 'color' ? frag.color : undefined,
                  }}
                >
                  {frag.type === 'crop' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url('${image}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: `${frag.cropX}% ${frag.cropY}%`,
                        transform: frag.id === 'main' ? undefined : `scale(${frag.zoom})`,
                        transformOrigin: `${frag.cropX}% ${frag.cropY}%`,
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Refresh button — icon only, anchored to top-right of the section */}
      <motion.button
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: image ? 1 : 0, y: image ? 0 : -8 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        onClick={handleRefresh}
        disabled={isGenerating}
        className="fc-refresh-btn"
      >
        <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
      </motion.button>
    </div>
  );
}
