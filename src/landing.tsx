import { type JSX } from "react";

type PositionedImageProps = {
  id?: string;
  src: string;
  alt: string;
  className: string;
};

const PositionedImage = ({
  id,
  src,
  alt,
  className,
}: PositionedImageProps): JSX.Element => {
  // Use cover for the background, but contain for transparent flowers to prevent cropping
  const isBg = id?.startsWith("bg-");
  const fitClass = isBg ? "object-cover" : "object-contain";
  
  return (
    <img 
      id={id} 
      className={`absolute pointer-events-none ${fitClass} ${className}`} 
      src={src} 
      alt={alt} 
    />
  );
};

// Mapped exactly to Anima's source-of-truth coordinates, omitting strict heights to prevent cropping
const landingImages: PositionedImageProps[] = [
  {
    id: "bg-watercolour",
    src: "/assets/watercolour bg.jpg",
    alt: "Background",
    className: "top-0 left-0 w-full h-full",
  },
  {
    // Not yet confirmed: kept from previous attempt
    id: "leaf-5",
    src: "/assets/leaf.png",
    alt: "Leaf",
    className: "top-[640px] left-[-10px] w-[258px] animate-sway-1 origin-bottom-left",
  },
  {
    // Not yet confirmed: kept from previous attempt
    id: "leaf-31",
    src: "/assets/leaf 3.png",
    alt: "Leaf",
    className: "top-[-48px] left-[0px] w-[303px] animate-sway-2 origin-top-right",
  },
  {
    // confirmed: top-left magenta orchid (src swapped vs Anima name)
    id: "flower-41",
    src: "/assets/pink flower 1.png",
    alt: "Pink Orchid",
    className: "top-[-124px] left-[-84px] w-[370px] h-[371px] animate-sway-3 origin-center",
  },
  {
    // inferred from Anima top 92 + left clip: please confirm (src swapped vs Anima name)
    id: "flower-31",
    src: "/assets/yellow flower.png",
    alt: "Yellow Flower",
    className: "top-[92px] left-[-84px] w-[370px] h-[370px] animate-sway-1 origin-center",
  },
   {
    // confirmed: left purple hibiscus
    id: "flower-21",
    src: "/assets/purple flower.png",
    alt: "Purple Hibiscus",
    className: "top-[312px] left-[-112px] w-[370px] h-[370px] animate-sway-2 origin-center",
  },
  {
    // confirmed: bottom-left lotus
    id: "flower-5",
    src: "/assets/pink flower 2.png",
    alt: "Pink Lotus",
    className: "top-[606px] left-[-84px] w-[370px] h-[370px] animate-sway-3 origin-center",
  },
  {
    // confirmed: top leaf
    id: "leaf-6",
    src: "/assets/leaf.png",
    alt: "Leaf",
    className: "top-[-7px] left-[98.9px] w-[258px] h-[259px] rotate-180 animate-sway-1 origin-top-left",
  },
  {
    // confirmed: bottom leaf (Figma 93.96° → CSS -93.96°)
    id: "leaf-32",
    src: "/assets/leaf 3.png",
    alt: "Leaf",
    className: "top-[572.18px] left-[63.65px] w-[283.71px] h-[283.71px] rotate-[-93.96deg] animate-sway-2 origin-bottom-right",
  },
  {
    // confirmed: bottom-right magenta orchid (src swapped vs Anima name)
    id: "flower-42",
    src: "/assets/pink flower 1.png",
    alt: "Pink Orchid",
    className: "top-[605px] left-[126.9px] w-[370px] h-[371px] rotate-180 animate-sway-3 origin-center",
  },
  {
    // confirmed: right-middle yellow flower (src swapped vs Anima name)
    id: "flower-32",
    src: "/assets/yellow flower.png",
    alt: "Yellow Flower",
    className: "top-[391px] left-[126.9px] w-[370px] h-[369px] rotate-180 animate-sway-1 origin-center",
  },
    {
    // confirmed: right purple hibiscus
    id: "flower-22",
    src: "/assets/purple flower.png",
    alt: "Purple Hibiscus",
    className: "top-[161px] left-[129px] w-[370px] h-[370px] rotate-180 animate-sway-2 origin-center",
  },
  {
    // confirmed: top-right lotus
    id: "flower-6",
    src: "/assets/pink flower 2.png",
    alt: "Pink Lotus",
    className: "top-[-124px] left-[126.9px] w-[370px] h-[370px] rotate-180 animate-sway-3 origin-center",
  },
];

export const Landing = (): JSX.Element => {
  return (
    <main className="relative h-[852px] w-[393px] overflow-hidden bg-[#ffeef1] shadow-2xl shrink-0">
      {landingImages.map((image) => (
        <PositionedImage key={image.id} {...image} />
      ))}
    </main>
  );
};