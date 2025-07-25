import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Play } from "lucide-react";

interface ContentItem {
  id: number;
  title: string;
  image: string;
  year?: string;
  genre?: string;
}

interface ContentRowProps {
  title: string;
  items?: ContentItem[];
}

const defaultMovies: ContentItem[] = [
  {
    id: 1,
    title: "Friends",
    image: "https://images.unsplash.com/photo-1489599083698-2aa49c3b3100?w=300&h=400&fit=crop",
    year: "1994",
    genre: "Comedy"
  },
  {
    id: 2,
    title: "Iron Man",
    image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=400&fit=crop",
    year: "2008",
    genre: "Action"
  },
  {
    id: 3,
    title: "Spider-Man",
    image: "https://images.unsplash.com/photo-1626278664285-f796b9ee7806?w=300&h=400&fit=crop",
    year: "2002",
    genre: "Action"
  },
  {
    id: 4,
    title: "The Dark Knight",
    image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=300&h=400&fit=crop",
    year: "2008",
    genre: "Drama"
  },
  {
    id: 5,
    title: "Avengers",
    image: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=400&fit=crop",
    year: "2012",
    genre: "Action"
  },
  {
    id: 6,
    title: "Inception",
    image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=400&fit=crop",
    year: "2010",
    genre: "Sci-Fi"
  },
  {
    id: 7,
    title: "Interstellar",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop",
    year: "2014",
    genre: "Sci-Fi"
  },
  {
    id: 8,
    title: "The Matrix",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=400&fit=crop",
    year: "1999",
    genre: "Sci-Fi"
  }
];

export const ContentRow = ({ title, items = defaultMovies }: ContentRowProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground px-2">{title}</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 p-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className="flex-shrink-0 w-40 md:w-48 group cursor-pointer transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 border-border/50 overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-56 md:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-medium text-sm truncate">{item.title}</h3>
                    {item.year && item.genre && (
                      <p className="text-xs opacity-80">{item.year} • {item.genre}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};