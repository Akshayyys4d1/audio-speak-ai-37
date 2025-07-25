import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const heroContent = [
  {
    id: 1,
    title: "The Last of Us",
    description: "A gripping post-apocalyptic drama series",
    image: "/lovable-uploads/c9bb5f22-f461-48d3-92d0-377bc6e49aa1.png",
    category: "Series"
  },
  {
    id: 2,
    title: "Featured Movie",
    description: "Discover amazing content with AI assistance",
    image: "https://images.unsplash.com/photo-1489599083698-2aa49c3b3100?w=1200&h=400&fit=crop",
    category: "Movie"
  },
  {
    id: 3,
    title: "Popular Shows",
    description: "Trending content you might enjoy",
    image: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=1200&h=400&fit=crop",
    category: "Collection"
  }
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroContent.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroContent.length) % heroContent.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-80 md:h-96 rounded-xl overflow-hidden bg-gradient-to-r from-background to-muted">
      {heroContent.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center relative"
            style={{ backgroundImage: `url(${item.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute bottom-8 left-8 text-white">
              <div className="space-y-2">
                <p className="text-sm opacity-80">{item.category}</p>
                <h2 className="text-4xl md:text-6xl font-bold">{item.title}</h2>
                <p className="text-lg md:text-xl max-w-md opacity-90">{item.description}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={prevSlide}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={nextSlide}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {heroContent.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white" : "bg-white/50"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};