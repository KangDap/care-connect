'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import img1 from './images/carousel1.jpg';
import img2 from './images/carousel2.jpg';
import img3 from './images/carousel3.jpg';
import img4 from './images/carousel4.jpg';

const images = [
  { src: img1, alt: 'Therapy Context' },
  { src: img2, alt: 'Community Support' },
  { src: img3, alt: 'Care and Connection' },
  { src: img4, alt: 'Empathy and Understanding' },
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
    <div className="w-[600px] h-[400px] rounded-3xl overflow-hidden relative shadow-lg">
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
            sizes="600px"
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
                ? 'bg-[#F7F3ED] scale-125'
                : 'bg-[#D0D5CB]/80 hover:bg-[#F7F3ED]'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
