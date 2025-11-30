'use client';
import { useState, useRef, useEffect } from 'react';
import { Download, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

interface Image {
  id: string;
  url: string;
  x2Url: string;
}

interface Album {
  id: string;
  x2Id: string;
  name: string;
  images: Image[];
}

interface Meme {
  id: number;
  imageUrl: string;
  topText: string;
  bottomText: string;
  fontSize: number;
}

type View = 'albums' | 'images' | 'editor';

const ALBUM_CONFIG: { id: string; x2Id: string; name: string; imageCount: number }[] = [
  { id: 'menherachan', x2Id: 'menherachanX2', name: 'Menhera-Chan', imageCount: 920 },
  { id: 'menherakun', x2Id: 'menherakunX2', name: 'Menhera-Kun', imageCount: 512 },
  { id: 'yurundarachan', x2Id: 'yurundarachanX2', name: 'Yurundara-Chan', imageCount: 304 },
  { id: 'yurundarakun', x2Id: 'yurundarakunX2', name: 'Yurundara-Kun', imageCount: 304 },
  { id: 'oniichanisdonefor', x2Id: 'oniichanisdonefor', name: 'Onii-Chan is Done For', imageCount: 102 },
];

const loadAlbumImages = (albumId: string): Image[] => {
  const images: Image[] = [];
  const albumConfig = ALBUM_CONFIG.find(a => a.id === albumId);
  if (!albumConfig) return images;

  for (let i = 1; i <= albumConfig.imageCount; i++) {
    images.push({
      id: `${albumId}-${i}`,
      url: `/images/${albumId}/${i}.png`,
      x2Url: `/images/${albumConfig.x2Id}/${i}.png`
    });
  }

  return images;
};

export default function EggyMemeMaker() {
  const [view, setView] = useState<View>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [currentMemeIndex, setCurrentMemeIndex] = useState<number>(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const previewCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const selectAlbum = (albumId: string, albumX2Id: string, albumName: string) => {
    const images = loadAlbumImages(albumId);
    setSelectedAlbum({
      id: albumId,
      x2Id: albumX2Id,
      name: albumName,
      images
    });
    setView('images');
  };

  const selectImage = (imageUrl: string) => {
    const newMeme: Meme = {
      id: Date.now(),
      imageUrl,
      topText: '',
      bottomText: '',
      fontSize: 40
    };
    setMemes([...memes, newMeme]);
    setCurrentMemeIndex(memes.length);
    setView('editor');
  };

  const updateMemeText = (index: number, field: keyof Meme, value: string | number) => {
    const updated = [...memes];
    updated[index] = { ...updated[index], [field]: value };
    setMemes(updated);
  };

  const removeMeme = (index: number) => {
    const updated = memes.filter((_, i) => i !== index);
    setMemes(updated);
    if (currentMemeIndex >= updated.length && updated.length > 0) {
      setCurrentMemeIndex(updated.length - 1);
    }
  };

  const drawMeme = (canvas: HTMLCanvasElement, meme: Meme): Promise<void> => {
    return new Promise((resolve) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(2, meme.fontSize / 20);
        ctx.font = `bold ${meme.fontSize}px Impact, sans-serif`;
        ctx.textAlign = 'center';
        
        if (meme.topText) {
          const topY = meme.fontSize + 10;
          ctx.strokeText(meme.topText.toUpperCase(), canvas.width / 2, topY);
          ctx.fillText(meme.topText.toUpperCase(), canvas.width / 2, topY);
        }
        
        if (meme.bottomText) {
          const bottomY = canvas.height - 20;
          ctx.strokeText(meme.bottomText.toUpperCase(), canvas.width / 2, bottomY);
          ctx.fillText(meme.bottomText.toUpperCase(), canvas.width / 2, bottomY);
        }
        
        resolve();
      };

      img.onerror = () => {
        console.error('Failed to load image:', meme.imageUrl);
        resolve();
      };
      
      img.src = meme.imageUrl;
    });
  };

  const downloadMeme = async (index: number) => {
    const canvas = canvasRefs.current[index];
    if (!canvas) return;
    
    const meme = memes[index];
    
    await drawMeme(canvas, meme);
    const link = document.createElement('a');
    link.download = `${index + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadAll = async () => {
    for (let i = 0; i < memes.length; i++) {
      await downloadMeme(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  useEffect(() => {
    if (memes[currentMemeIndex] && previewCanvasRefs.current[currentMemeIndex]) {
      drawMeme(previewCanvasRefs.current[currentMemeIndex]!, memes[currentMemeIndex]);
    }
  }, [memes, currentMemeIndex]);

  return (
    <div className="min-h-screen bg-[#121212] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold inline-block mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#F5A9B8] via-white to-[#5BCEFA]">
            Eggy Meme Maker
          </h1>
        </div>


        {view === 'albums' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
              {ALBUM_CONFIG.map(album => (
                <button
                  key={album.id}
                  onClick={() => selectAlbum(album.id, album.x2Id, album.name)}
                  className="bg-[#1e1e1e] rounded-md shadow hover:shadow-xl hover:bg-[#252525] transition overflow-hidden group"
                >
                  <div className="aspect-square w-full overflow-hidden">
                    <img 
                      src={`/images/${album.x2Id}/1.png`}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-white text-center">{album.name}</h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'images' && selectedAlbum && (
          <div>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1 max-w-5xl mx-auto">
              {selectedAlbum.images.map(image => (
                <button
                  key={image.id}
                  onClick={() => selectImage(image.x2Url)}
                  className="bg-[#1e1e1e] shadow hover:shadow-xl hover:bg-[#252525] transition overflow-hidden group"
                >
                  <div className="aspect-square w-full overflow-hidden">
                    <img 
                      src={image.url} 
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'editor' && memes.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#1e1e1e] rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMemeIndex(Math.max(0, currentMemeIndex - 1))}
                  disabled={currentMemeIndex === 0}
                  className="p-2 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:opacity-50 text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="text-center">
                  <span className="text-sm text-gray-400">
                    Image {currentMemeIndex + 1} of {memes.length}
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentMemeIndex(Math.min(memes.length - 1, currentMemeIndex + 1))}
                  disabled={currentMemeIndex === memes.length - 1}
                  className="p-2 rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:opacity-50 text-white"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {memes[currentMemeIndex] && (
                <div>
                  <div className="relative mb-6">
                    <canvas
                      ref={el => {
                        previewCanvasRefs.current[currentMemeIndex] = el;
                      }}
                      className="w-full border border-gray-700 rounded"
                    />
                    <button
                      onClick={() => removeMeme(currentMemeIndex)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <input
                      type="text"
                      placeholder="Top text"
                      value={memes[currentMemeIndex].topText}
                      onChange={(e) => updateMemeText(currentMemeIndex, 'topText', e.target.value)}
                      className="w-full p-3 border border-gray-700 rounded bg-[#2a2a2a] text-white placeholder-gray-500"
                    />
                    <input
                      type="text"
                      placeholder="Bottom text"
                      value={memes[currentMemeIndex].bottomText}
                      onChange={(e) => updateMemeText(currentMemeIndex, 'bottomText', e.target.value)}
                      className="w-full p-3 border border-gray-700 rounded bg-[#2a2a2a] text-white placeholder-gray-500"
                    />
                    <div className="flex items-center gap-3">
                      <label className="text-white text-sm min-w-fit">Font Size:</label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={memes[currentMemeIndex].fontSize}
                        onChange={(e) => updateMemeText(currentMemeIndex, 'fontSize', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-white text-sm w-12">{memes[currentMemeIndex].fontSize}px</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadMeme(currentMemeIndex)}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Download This
                    </button>
                    <button
                      onClick={downloadAll}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Download All ({memes.length})
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setView('albums')}
                className="w-full mt-4 bg-[#2a2a2a] text-white py-3 px-4 rounded hover:bg-[#3a3a3a] flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Another Image
              </button>
            </div>
          </div>
        )}

        {view === 'editor' && memes.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#1e1e1e] rounded-lg shadow-xl p-12 text-center">
              <p className="text-gray-400 mb-6">No image selected</p>
              <button
                onClick={() => setView('albums')}
                className="bg-blue-600 text-white py-3 px-8 rounded hover:bg-blue-700"
              >
                Select Image
              </button>
            </div>
          </div>
        )}
      </div>

      {memes.map((meme, i) => (
        <canvas
          key={meme.id}
          ref={el => {
            canvasRefs.current[i] = el;
          }}
          style={{ display: 'none' }}
        />
      ))}
    </div>
  );
}