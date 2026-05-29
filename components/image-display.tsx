"use client";

import { ImageModal } from "@/components/image-modal";
import { useImageUrls } from "@/lib/queries";
import Image from "next/image";
import { useMemo, useState } from "react";

interface ImageDisplayProps {
  imageKeys: string[];
  className?: string;
}

export function ImageDisplay({ imageKeys, className = "" }: ImageDisplayProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const imageQueries = useImageUrls(imageKeys);

  const imageUrls = useMemo(() => {
    const urls: { [key: string]: string } = {};
    imageQueries.forEach((query, index) => {
      if (query.data && imageKeys[index]) {
        urls[imageKeys[index]] = query.data.url;
      }
    });
    return urls;
  }, [imageQueries, imageKeys]);

  if (imageKeys.length === 0) return null;

  return (
    <>
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ${className}`}>
        {imageKeys.map((imageKey, index) => {
          const imageUrl = imageUrls[imageKey];
          return (
            <div key={index} className="relative group">
              {imageUrl ? (
                <div
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage({ url: imageUrl, alt: `Question image ${index + 1}` })}
                >
                  <Image
                    src={imageUrl}
                    alt={`Question image ${index + 1}`}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover w-full h-32"
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
        />
      )}
    </>
  );
}