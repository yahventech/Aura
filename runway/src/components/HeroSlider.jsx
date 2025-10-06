import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  PauseIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function HeroSlider({ slides, currentSlide, setCurrentSlide, autoPlay, setAutoPlay }) {
  const autoRef = useRef(null);

  useEffect(() => {
    if (!autoPlay) return;
    autoRef.current = setInterval(() => {
      setCurrentSlide(s => (s + 1) % slides.length);
    }, 5000);
    return () => clearInterval(autoRef.current);
  }, [autoPlay, slides.length, setCurrentSlide]);

  const goTo = idx => {
    setCurrentSlide(idx);
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = setInterval(() => setCurrentSlide(s => (s + 1) % slides.length), 5000);
    }
  };

  return (
    <section className="relative h-96 lg:h-[500px] overflow-hidden">
      {slides.map((slide, idx) => {
        const visible = idx === currentSlide;
        return (
          <div key={slide.id} aria-hidden={!visible} className={`absolute inset-0 transition-transform duration-700 ${visible ? 'translate-x-0 z-10' : 'translate-x-full z-0 pointer-events-none'}`}>
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 ${slide.theme === 'dark' ? 'bg-black/50' : 'bg-white/30'}`} />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                <div className={`max-w-2xl ${slide.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <h2 className="text-3xl lg:text-5xl font-extrabold">{slide.title}</h2>
                  <p className="mt-3 text-lg">{slide.subtitle}</p>
                  <div className="mt-6 flex gap-3">
                    <Link to={slide.buttonLink} className={`inline-flex items-center gap-2 px-5 py-3 rounded-md font-semibold ${slide.theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
                      {slide.buttonText} <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                    <button onClick={() => setAutoPlay(v => !v)} className="inline-flex items-center px-4 py-3 rounded-md bg-white/80">
                      {autoPlay ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button key={idx} onClick={() => goTo(idx)} aria-label={`Go to slide ${idx + 1}`} className={`w-3 h-3 rounded-full ${idx === currentSlide ? 'bg-gray-900' : 'bg-white/80'}`} />
          ))}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button onClick={() => goTo((currentSlide - 1 + slides.length) % slides.length)} className="p-2 rounded-md bg-white/90" aria-label="Previous slide">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
          </button>
          <button onClick={() => goTo((currentSlide + 1) % slides.length)} className="p-2 rounded-md bg-white/90" aria-label="Next slide">
            <ChevronRightIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
}
