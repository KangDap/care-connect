'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import img1 from './images/carousel1.png';
import img2 from './images/carousel2.png';
import img3 from './images/carousel3.png';
import img4 from './images/carousel4.png';

const images = [
  { src: img1, alt: 'Online Consultation' },
  { src: img2, alt: 'Emotional Wellness' },
  { src: img3, alt: 'Support Communities' },
  { src: img4, alt: 'Empathetic Counseling' },
];

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[240px] w-full max-w-[600px] overflow-hidden rounded-3xl shadow-lg sm:h-[320px] lg:h-[400px] lg:w-[600px]">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 600px"
          />
        </div>
      ))}
      {/* Navigation Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-[#f7f3ed] scale-125'
                : 'bg-[#d0d5cb]/80 hover:bg-[#f7f3ed]'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
