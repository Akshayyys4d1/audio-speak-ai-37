import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const apps = [
  {
    id: 1,
    name: "Netflix",
    icon: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
    color: "bg-red-600"
  },
  {
    id: 2,
    name: "Plex",
    icon: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop",
    color: "bg-yellow-500"
  },
  {
    id: 3,
    name: "YouTube",
    icon: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=100&h=100&fit=crop",
    color: "bg-red-500"
  },
  {
    id: 4,
    name: "Disney+",
    icon: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop",
    color: "bg-blue-600"
  },
  {
    id: 5,
    name: "Tubi",
    icon: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=100&h=100&fit=crop",
    color: "bg-purple-600"
  },
  {
    id: 6,
    name: "Prime Video",
    icon: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop",
    color: "bg-blue-800"
  },
  {
    id: 7,
    name: "Hulu",
    icon: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100&h=100&fit=crop",
    color: "bg-green-600"
  },
  {
    id: 8,
    name: "HBO Max",
    icon: "https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=100&h=100&fit=crop",
    color: "bg-purple-800"
  }
];

export const AppGrid = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground px-2">Apps</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 p-2">
          {apps.map((app) => (
            <Card
              key={app.id}
              className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 cursor-pointer hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-card to-card/80 border-border/50"
            >
              <CardContent className="p-0 flex flex-col items-center justify-center h-full space-y-2">
                <div
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-lg ${app.color} flex items-center justify-center`}
                >
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="w-8 h-8 md:w-10 md:h-10 rounded object-cover"
                  />
                </div>
                <span className="text-xs font-medium text-foreground text-center">{app.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};