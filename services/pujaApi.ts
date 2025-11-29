export async function fetchPujaById(id: string) {
  return {
    id,
    name: "Gruha Pravesham",
    image: "https://yourcdn.com/pujas/gruhapravesham.jpg",
    description:
      "A traditional ceremony performed before entering a new home...",
    requirements: [
      "Clean house",
      "Place for Havan",
      "Water availability",
      "Open window or ventilation",
    ],
    duration: "2 to 3 hours",
  };
}

export async function fetchPujarisForPuja(id: string) {
  return [
    {
      id: "p1",
      name: "Sri Ram Sharma",
      rating: 4.8,
      languages: ["Telugu", "Hindi"],
      image: "https://yourcdn.com/pujaris/ram.jpg",
      basePrice: 1500,
      distance: "3.2 km",
    },
    {
      id: "p2",
      name: "Vasudev Dixit",
      rating: 4.6,
      languages: ["Kannada"],
      image: "https://yourcdn.com/pujaris/vasu.jpg",
      basePrice: 1200,
      distance: "5.0 km",
    },
  ];
}
