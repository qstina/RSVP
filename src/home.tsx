import { useEffect, useLayoutEffect, useState, useRef, type JSX } from "react";
import { Navbar, type PanelType } from "./Navbar";
import { supabase } from "./supabase";
import {
  BOTTOM_FLOWER_LIFT,
  DEFAULT_NAV_H,
  DESIGN_H,
  DESIGN_W,
  LOWER_CONTENT_END,
  getHeroLayout,
} from "./heroLayout";

// ================= SCROLL REVEAL COMPONENT =================
const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  isOpened,
  as: Component = "div",
}: {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  isOpened: boolean;
  as?: React.ElementType;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpened) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isOpened]);

  return (
    <Component
      ref={ref}
      className={`transition-all duration-2000 ease-[cubic-bezier(0.25,1,0.5,1)] transform-gpu ${
        isVisible
          ? "opacity-100 blur-0 translate-y-0 pointer-events-auto"
          : "opacity-0 blur-sm translate-y-6 pointer-events-none"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
};

// ================= FLOATING WISHES COMPONENT =================
type Wish = { id: string; name: string; message: string };

const FloatingWishes = ({ isOpened }: { isOpened: boolean }) => {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [status, setStatus] = useState<"loading" | "empty" | "loaded" | "error">("loading");

  const [copyEl, setCopyEl] = useState<HTMLDivElement | null>(null);
  const [loopH, setLoopH] = useState(0);

  useEffect(() => {
    if (!copyEl) return;
    const ro = new ResizeObserver(() => setLoopH(copyEl.offsetHeight));
    ro.observe(copyEl);
    setLoopH(copyEl.offsetHeight);
    return () => ro.disconnect();
  }, [copyEl]);

  useEffect(() => {
    if (!isOpened) return;

    const fetchWishes = async () => {
      try {
        const { data, error } = await supabase
          .from("rsvp_responses")
          .select("id, guest_name, message")
          .not("message", "is", null)
          .neq("message", "")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setWishes(data.map((d) => ({ id: d.id, name: d.guest_name, message: d.message })));
          setStatus("loaded");
        } else {
          setStatus("empty");
        }
      } catch (err) {
        console.error("Error fetching wishes:", err);
        setStatus("error");
      }
    };

    fetchWishes();

    const channel = supabase
      .channel("public:rsvp_responses")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rsvp_responses" },
        (payload) => {
          const newRow = payload.new;
          if (newRow.message && newRow.message.trim() !== "") {
            setWishes((prev) => [
              { id: newRow.id, name: newRow.guest_name, message: newRow.message },
              ...prev,
            ]);
            setStatus("loaded");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpened]);

  if (status === "loading") {
    return <p className="text-stone-400 font-garamond italic text-center w-full mt-10">Memuatkan ucapan...</p>;
  }
  if (status === "error") {
    return <p className="text-stone-400 font-garamond italic text-center w-full mt-10">Tidak dapat memuatkan ucapan.</p>;
  }
  if (status === "empty") {
    return <p className="text-stone-400 font-garamond italic text-center w-full mt-10">Jadilah yang pertama untuk meninggalkan ucapan!</p>;
  }

  const VIEW_H = 250;   // matches h-62.5 (62.5 × 4px)
  const SPEED = 40;     // px per second
  const duration = loopH / SPEED;

  const unit = wishes.length > 1 && wishes.length % 2 === 1 ? [...wishes, ...wishes] : wishes;
  const copies = loopH ? Math.max(2, Math.ceil(VIEW_H / loopH) + 1) : 2;

  return (
    <>
      <style>{`
        @keyframes scroll-wishes {
          from { transform: translateY(0); }
          to   { transform: translateY(calc(-1 * var(--loop))); }
        }

        .bubble-left {
          background-color: #ffffff;
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          width: fit-content;
          max-width: 85%;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .bubble-left::before {
          content: "";
          position: absolute;
          bottom: 0;
          left: -6px;
          width: 16px;
          height: 16px;
          background-color: #ffffff;
          -webkit-mask-image: radial-gradient(circle at 0 0, transparent 15px, black 15.5px);
          mask-image: radial-gradient(circle at 0 0, transparent 15px, black 15.5px);
        }

        .bubble-right {
          background-color: #fdf2f8;
          border-radius: 18px;
          border-bottom-right-radius: 4px;
          width: fit-content;
          max-width: 85%;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .bubble-right::before {
          content: "";
          position: absolute;
          bottom: 0;
          right: -6px;
          width: 16px;
          height: 16px;
          background-color: #fdf2f8;
          -webkit-mask-image: radial-gradient(circle at 100% 0, transparent 15px, black 15.5px);
          mask-image: radial-gradient(circle at 100% 0, transparent 15px, black 15.5px);
        }
      `}</style>

            <div className="relative w-full h-62.5 overflow-hidden mask-fade-y pointer-events-none">
        <div
          className="absolute top-0 left-0 w-full will-change-transform"
          style={
            {
              "--loop": `${loopH}px`,
              animation: loopH ? `scroll-wishes ${duration}s linear infinite` : "none",
            } as React.CSSProperties
          }
        >
          {Array.from({ length: copies }).map((_, c) => (
            <div
              key={c}
              ref={c === 0 ? setCopyEl : undefined}
              aria-hidden={c > 0}
              className="flex flex-col gap-2 pb-2"
            >
              {unit.map((wish, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <div
                    key={`${c}-${i}-${wish.id}`}
                    className={`relative px-4 py-2.5 pointer-events-auto flex flex-col gap-0.5 ${
                      isLeft ? "self-start ml-2 bubble-left" : "self-end mr-2 bubble-right"
                    }`}
                  >
                    <span className={`font-garamond font-bold text-[15px] leading-tight ${isLeft ? "text-stone-800" : "text-pink-900"}`}>
                      {wish.name}
                    </span>
                    <span className={`font-garamond text-[14px] leading-snug whitespace-pre-wrap wrap-break-word ${isLeft ? "text-stone-700" : "text-pink-800"}`}>
                      {wish.message}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};


// ================= DYNAMIC HERO FLOWERS =================
type FlowerPose = { left: number; w: number; h: number; rot: number; offset: number };
type HeroFlower = {
  id: string;
  src: string;
  alt: string;
  anchor: "top" | "bottom";
  landing: FlowerPose;
  home: FlowerPose;
  swayClass: string;
  delay: string;
};

const heroFlowers: HeroFlower[] = [
  // --- Top flowers ---
  {
    id: "hero-leaf-top-left", src: "/assets/leaf 3.png", alt: "Leaf", anchor: "top",
    landing: { left: 98.9, w: 258, h: 258, rot: 136.53, offset: -7 },
    home: { left: -81.43, w: 159.93, h: 159.93, rot: 136.53, offset: 44.08 },
    swayClass: "animate-sway-1", delay: "delay-[100ms]",
  },
  {
    id: "hero-flower-yellow-top-left", src: "/assets/yellow flower.png", alt: "Yellow Flower", anchor: "top",
    landing: { left: -84, w: 370, h: 370, rot: -9.85, offset: 92 },
    home: { left: -135.66, w: 209, h: 209, rot: -9.85, offset: 36.11 },
    swayClass: "animate-sway-2", delay: "delay-[300ms]",
  },
  {
    id: "hero-flower-pink-orchid-top-left", src: "/assets/pink flower 1.png", alt: "Pink Orchid", anchor: "top",
    landing: { left: -84, w: 370, h: 370, rot: -9.85, offset: -124 },
    home: { left: -59.25, w: 208, h: 209, rot: -9.85, offset: -90.75 },
    swayClass: "animate-sway-3", delay: "delay-[500ms]",
  },
  {
    id: "hero-leaf-top-right", src: "/assets/leaf.png", alt: "Leaf", anchor: "top",
    landing: { left: 0, w: 303, h: 303, rot: 99.38, offset: -48 },
    home: { left: 280.88, w: 145.38, h: 145.38, rot: 99.38, offset: 1.88 },
    swayClass: "animate-sway-2", delay: "delay-[250ms]",
  },
  {
    id: "hero-flower-pink-lotus-top-right", src: "/assets/pink flower 2.png", alt: "Pink Lotus", anchor: "top",
    landing: { left: 127, w: 370, h: 370, rot: 180, offset: -124 },
    home: { left: 253.13, w: 209, h: 209, rot: 180, offset: -107 },
    swayClass: "animate-sway-3", delay: "delay-[450ms]",
  },
  {
    id: "hero-flower-purple-top-right", src: "/assets/purple flower.png", alt: "Purple Hibiscus", anchor: "top",
    landing: { left: 129, w: 370, h: 370, rot: 180, offset: 161 },
    home: { left: 313.13, w: 208, h: 208, rot: 180, offset: 20 },
    swayClass: "animate-sway-1", delay: "delay-[650ms]",
  },

  // --- Bottom flowers ---
  {
    id: "hero-leaf-bottom-left", src: "/assets/leaf.png", alt: "Leaf", anchor: "bottom",
    landing: { left: -10, w: 258, h: 258, rot: -80.62, offset: 212 },
    home: { left: -21.12, w: 145.38, h: 145.38, rot: -80.62, offset: 174.12 },
    swayClass: "animate-sway-1", delay: "delay-[200ms]",
  },
  {
    id: "hero-flower-purple-bottom-left", src: "/assets/purple flower.png", alt: "Purple Hibiscus", anchor: "bottom",
    landing: { left: -112, w: 370, h: 370, rot: 0, offset: 540 },
    home: { left: -115.49, w: 208, h: 208, rot: 0, offset: 248 },
    swayClass: "animate-sway-3", delay: "delay-[400ms]",
  },
  {
    id: "hero-flower-pink-lotus-bottom-left", src: "/assets/pink flower 2.png", alt: "Pink Lotus", anchor: "bottom",
    landing: { left: -84, w: 370, h: 370, rot: 0, offset: 246 },
    home: { left: -56.49, w: 209, h: 209, rot: 0, offset: 122 },
    swayClass: "animate-sway-2", delay: "delay-[600ms]",
  },
  {
    id: "hero-leaf-bottom-right", src: "/assets/leaf 3.png", alt: "Leaf", anchor: "bottom",
    landing: { left: 64, w: 284, h: 284, rot: -43.47, offset: 280 },
    home: { left: 321.08, w: 159.93, h: 159.93, rot: -43.47, offset: 220.92 },
    swayClass: "animate-sway-2", delay: "delay-[150ms]",
  },
  {
    id: "hero-flower-pink-orchid-bottom-right", src: "/assets/pink flower 1.png", alt: "Pink Orchid", anchor: "bottom",
    landing: { left: 127, w: 370, h: 370, rot: 170.15, offset: 247 },
    home: { left: 260.38, w: 208, h: 209, rot: 170.15, offset: 138.25 },
    swayClass: "animate-sway-3", delay: "delay-[350ms]",
  },
  {
    id: "hero-flower-yellow-bottom-right", src: "/assets/yellow flower.png", alt: "Yellow Flower", anchor: "bottom",
    landing: { left: 127, w: 370, h: 370, rot: 170.15, offset: 461 },
    home: { left: 335.8, w: 209, h: 209, rot: 170.15, offset: 265.1 },
    swayClass: "animate-sway-1", delay: "delay-[550ms]",
  },
];

const sectionImages = [
  { id: "divider-flower-yellow", src: "/assets/yellow flower.png", alt: "Yellow Flower", wrapperClass: "top-[890px] left-[35px] w-[115px] -rotate-12", swayClass: "animate-sway-1" },
  { id: "divider-flower-pink-orchid", src: "/assets/pink flower 1.png", alt: "Pink Orchid", wrapperClass: "top-[905px] left-[105px] w-[105px] rotate-[15deg]", swayClass: "animate-sway-3" },
  { id: "divider-flower-purple", src: "/assets/purple flower.png", alt: "Purple Hibiscus", wrapperClass: "top-[895px] left-[175px] w-[110px] rotate-[15deg]", swayClass: "animate-sway-2" },
  { id: "divider-flower-pink-lotus", src: "/assets/pink flower 2.png", alt: "Pink Lotus", wrapperClass: "top-[910px] left-[245px] w-[105px]", swayClass: "animate-sway-1" },
  { id: "parents-flower-yellow-bottom-left", src: "/assets/yellow flower.png", alt: "Yellow Flower", wrapperClass: "top-[1650px] left-[-45px] w-[130px] -rotate-[15deg]", swayClass: "animate-sway-2" },
  { id: "event-flower-pink-orchid-top-right", src: "/assets/pink flower 1.png", alt: "Pink Orchid", wrapperClass: "top-[1820px] right-[-45px] left-auto w-[140px] rotate-[25deg]", swayClass: "animate-sway-3" },
  { id: "event-flower-purple-mid-left", src: "/assets/purple flower.png", alt: "Purple Hibiscus", wrapperClass: "top-[1890px] left-[-55px] w-[160px] -rotate-[10deg]", swayClass: "animate-sway-1" },
  { id: "event-flower-pink-lotus-bottom-right", src: "/assets/pink flower 2.png", alt: "Pink Lotus", wrapperClass: "top-[2030px] right-[-55px] left-auto w-[150px] -rotate-[15deg]", swayClass: "animate-sway-2" },
  { id: "schedule-flower-pink-orchid-top", src: "/assets/pink flower 1.png", alt: "Pink Orchid", wrapperClass: "top-[2280px] left-[calc(50.00%-30px)] w-[60px]", swayClass: "animate-sway-3" },
];

const frameSparkles = [
  { top: "95px", left: "55px", delay: "0s", size: "w-3 h-3" },
  { top: "80px", left: "180px", delay: "1.5s", size: "w-4 h-4" },
  { top: "115px", left: "310px", delay: "0.7s", size: "w-3 h-3" },
  { top: "220px", left: "45px", delay: "2.2s", size: "w-2 h-2" },
  { top: "280px", left: "325px", delay: "1s", size: "w-4 h-4" },
  { top: "390px", left: "50px", delay: "0.5s", size: "w-3 h-3" },
  { top: "415px", left: "200px", delay: "2.5s", size: "w-2 h-2" },
  { top: "400px", left: "315px", delay: "1.2s", size: "w-4 h-4" },
  { top: "300px", left: "30px", delay: "0.8s", size: "w-3 h-3" },
  { top: "180px", left: "340px", delay: "1.8s", size: "w-2 h-2" },
  { top: "125px", left: "140px", delay: "0.3s", size: "w-2 h-2" },
  { top: "145px", left: "260px", delay: "1.9s", size: "w-3 h-3" },
  { top: "250px", left: "85px", delay: "0.6s", size: "w-4 h-4" },
  { top: "350px", left: "280px", delay: "1.4s", size: "w-2 h-2" },
  { top: "375px", left: "150px", delay: "2.8s", size: "w-3 h-3" },
  { top: "195px", left: "210px", delay: "1.1s", size: "w-2 h-2" },
  { top: "165px", left: "95px", delay: "2.1s", size: "w-3 h-3" },
  { top: "320px", left: "110px", delay: "0.9s", size: "w-2 h-2" },
];

const globalSparkles = [
  { top: "950px", left: "80px", delay: "0.2s", size: "w-4 h-4" },
  { top: "1080px", left: "310px", delay: "1.5s", size: "w-3 h-3" },
  { top: "1200px", left: "50px", delay: "0.8s", size: "w-2 h-2" },
  { top: "1350px", left: "320px", delay: "2.1s", size: "w-4 h-4" },
  { top: "1480px", left: "90px", delay: "0.5s", size: "w-3 h-3" },
  { top: "1620px", left: "290px", delay: "1.8s", size: "w-2 h-2" },
  { top: "1750px", left: "60px", delay: "0.9s", size: "w-4 h-4" },
  { top: "1880px", left: "330px", delay: "2.5s", size: "w-3 h-3" },
  { top: "2050px", left: "100px", delay: "1.2s", size: "w-2 h-2" },
  { top: "2200px", left: "300px", delay: "0.4s", size: "w-4 h-4" },
  { top: "2350px", left: "70px", delay: "1.7s", size: "w-3 h-3" },
  { top: "2500px", left: "340px", delay: "2.2s", size: "w-2 h-2" },
  { top: "2650px", left: "50px", delay: "0.6s", size: "w-4 h-4" },
  { top: "2873px", left: "310px", delay: "1.9s", size: "w-3 h-3" },
  { top: "2993px", left: "90px", delay: "0.3s", size: "w-2 h-2" },
  { top: "3143px", left: "320px", delay: "2.4s", size: "w-4 h-4" },
  { top: "3293px", left: "60px", delay: "1.1s", size: "w-3 h-3" },
  { top: "3443px", left: "290px", delay: "0.7s", size: "w-2 h-2" },
  { top: "3593px", left: "80px", delay: "2.0s", size: "w-4 h-4" },
  { top: "3743px", left: "330px", delay: "1.4s", size: "w-3 h-3" },
];

const schedule = [
  ["10:00 am", "Ketibaan Tetamu"],
  ["10:45 am", "Iringan Hadrah & Flower Girl serta Pengapit Pengantin"],
  ["10:45 am", "Pasangan Pengantin Masuk Dewan Majlis"],
  ["10:50 am", "Pasangan Pengantin Bersanding"],
  ["10:55 am", "Persembahan Kebudayaan Tradisi Tarian Zapin & Rampaian Melayu"],
  ["11:15 am", "Bacaan Doa Pengantin"],
  ["11:20 am", "Ucapan Ringkas Buat Pengantin"],
  ["11:30 am", "Tayangan Video Montaj"],
  ["11:45 am", "Sesi Bersalaman & Fotografi bersama ibu bapa pengantin"],
  ["12:00 pm", "Adat Makan Nasi Temuan/ Sesi Memotong Kek/ Makan Beradab"],
  ["12:15 pm", "Tetamu Dijemput Makan"],
  ["12:45 pm", "Sesi Fotografi bersama keluarga"],
  ["1:00 pm", "Sesi Fotografi bersama tetamu"],
  ["2:00 pm", "Majlis selesai"],
];

const formatCountdown = (target: number): string => {
  const remaining = Math.max(0, target - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${days} hari ${hours} jam ${minutes} minit ${seconds} saat`;
};

const TRANSITION_MS = 4800;

export const Home = (): JSX.Element => {
  const [viewport, setViewport] = useState({ w: DESIGN_W, h: DESIGN_H, nav: DEFAULT_NAV_H });
  const [isOpened, setIsOpened] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState("");

  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const probeRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.scrollbarGutter = "stable";

    const measure = () => {
      const probeH = probeRef.current?.offsetHeight ?? 0;
      const navEl = document.getElementById("site-nav");
      const next = {
        w: root.clientWidth,
        h: probeH > 0 ? probeH : window.innerHeight,
        nav: navEl?.offsetHeight || DEFAULT_NAV_H,
      };
      setViewport((prev) =>
        prev.w === next.w && prev.h === next.h && prev.nav === next.nav ? prev : next
      );
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    const navEl = document.getElementById("site-nav");
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (navEl) observer?.observe(navEl);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      observer?.disconnect();
    };
  }, []);

  const L = getHeroLayout(viewport.w, viewport.h, viewport.nav);

  useEffect(() => {
    const target = new Date("2026-12-12T10:00:00+08:00").getTime();
    const update = (): void => setCountdown(formatCountdown(target));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleMusic = () => {
    const audio = document.getElementById("wedding-bg-music") as HTMLAudioElement;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch((e) => console.log("Audio autoplay prevented", e));
        setIsPlaying(true);
      }
    }
  };

  const getHeroRevealClass = (delay: string) =>
    `transition-all duration-[2500ms] ease-out ${
      isOpened
        ? `opacity-100 blur-0 translate-y-0 ${delay} pointer-events-auto`
        : 'opacity-0 blur-[8px] translate-y-6 pointer-events-none'
    }`;

  const getFlowerStyle = (flower: HeroFlower, opened: boolean) => {
    const pose = opened ? flower.home : flower.landing;
    const anchoredRight = pose.left + pose.w / 2 > DESIGN_W / 2;
    const left = pose.left + (anchoredRight ? L.canvasW - DESIGN_W : 0);
    const top =
      flower.anchor === "top"
        ? pose.offset
        : opened
          ? L.heroH - pose.offset - BOTTOM_FLOWER_LIFT
          : L.closedH - pose.offset;
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${pose.w}px`,
      height: `${pose.h}px`,
      transform: `rotate(${pose.rot}deg)`,
    };
  };

    const hasOpenedRef = useRef(false);

  const handleOpen = () => {
    if (hasOpenedRef.current || isOpened) return; // only ever fires once
    hasOpenedRef.current = true;

    setIsOpened(true);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const audio = document.getElementById("wedding-bg-music") as HTMLAudioElement;
    if (audio) {
      audio.play().then(() => setIsPlaying(true)).catch((e) => console.log("Audio autoplay prevented", e));
    }
  };

  const flowersClipped = isOpened && !isTransitioning;

  return (
    <div className="flex w-full min-h-dvh bg-[#fcfcfc] justify-center items-start overflow-x-hidden">
      <div
        ref={probeRef}
        aria-hidden="true"
        className="pointer-events-none invisible fixed left-0 top-0 w-px"
        style={{ height: "100svh" }}
      />

        <main
        className="relative shrink-0 overflow-hidden bg-[#ffeef1] shadow-2xl transition-none"
        style={{
          width: `${L.canvasW}px`,
          height: `${isOpened ? L.totalH : L.closedH}px`,
        }}
        onClick={handleOpen}
      >
        <audio 
          id="wedding-bg-music" 
          src="/assets/bg%20audio.mp3" 
          loop 
          preload="auto" 
          ref={(el) => { if (el) el.volume = 0.2; }} 
        />

        <img
          id="bg-watercolour"
          src="/assets/watercolour bg.jpg"
          alt="Wedding invitation background"
          className={`absolute left-0 top-0 w-full object-cover pointer-events-none z-0 transition-opacity duration-1500 ease-out ${isOpened ? 'opacity-100' : 'opacity-0'}`}
          style={{ height: `${L.heroH}px` }}
        />

        <div
          className={`absolute left-0 top-0 w-full overflow-hidden pointer-events-none ${!isOpened || isTransitioning ? 'z-50' : 'z-10'}`}
          style={{ height: `${flowersClipped ? L.heroH : L.closedH}px` }}
        >
          {heroFlowers.map((flower) => (
            <div
              key={flower.id}
              id={flower.id}
              className={`absolute origin-center transition-all duration-4000 ease-in-out ${flower.delay}`}
              style={getFlowerStyle(flower, isOpened)}
            >
              <img src={flower.src} alt={flower.alt} className={`w-full h-full object-contain ${flower.swayClass}`} />
            </div>
          ))}
        </div>

        <div className="absolute left-0 top-0 w-full pointer-events-none z-20" style={{ height: `${L.heroH}px` }}>
          <div
            className="absolute"
            style={{
              left: "50%",
              marginLeft: `${-DESIGN_W / 2}px`,
              width: `${DESIGN_W}px`,
              top: `${L.stageTop}px`,
            }}
          >
            <div className="absolute left-0 top-0 w-full" style={{ transform: `translateY(${L.frameY}px)` }}>
              <div className={getHeroRevealClass("delay-800")}>
                <img
                  id="hero-frame-photo"
                  src="/assets/illustration.png"
                  alt="Framed wedding photo"
                  className="absolute object-contain top-26.25 left-16.25 w-65.75"
                />
                {frameSparkles.map((s, i) => (
                  <svg
                    key={i}
                    className={`absolute ${s.size} text-white animate-twinkle pointer-events-none`}
                    style={{ top: s.top, left: s.left, animationDelay: s.delay }}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" />
                  </svg>
                ))}
              </div>
            </div>

            <div
              className="absolute top-11.25 left-[140.5px] w-28"
              style={{ transform: `scale(${L.logoScale})`, transformOrigin: "top center" }}
            >
              <img
                id="hero-ah-logo"
                src="/assets/AH logo.png"
                alt="Afif and Husna logo"
                className={`w-full object-contain ${getHeroRevealClass("delay-1200")}`}
              />
            </div>

            <div
              className="absolute left-0 top-126.25 w-full"
              style={{ transform: `translateY(${L.textY}px) scale(${L.textScale})`, transformOrigin: "top center" }}
            >
              <header>
                <h1 className={`absolute left-0 top-8.75 w-full text-center font-gwendolyn font-bold text-[64px] leading-[54.4px] tracking-normal ${getHeroRevealClass("delay-1600")}`}>
                  Afif<br />&amp; Husna
                </h1>
                <p className={`absolute left-0 top-0 w-full whitespace-nowrap text-center font-garamond font-normal text-2xl leading-4.5 ${getHeroRevealClass("delay-1800")}`}>
                  Walimatul Urus
                </p>
                <p className={`absolute left-0 top-43.75 w-full whitespace-nowrap text-center font-garamond font-normal text-2xl leading-4.5 ${getHeroRevealClass("delay-2000")}`}>
                  12.12.2026
                </p>
                <p className={`absolute left-0 top-53.75 w-full text-center font-garamond font-semibold italic text-xl leading-3.75 ${getHeroRevealClass("delay-2200")}`}>
                  #AfiforHusna
                </p>
              </header>
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 w-98.25 pointer-events-none z-10 origin-top-left"
          style={{
            top: `${L.lowerTop}px`,
            height: `${LOWER_CONTENT_END}px`,
            transform: `scale(${L.scale})`,
          }}
        >
          <div className={`transition-opacity duration-2500 ease-out delay-1000 ${isOpened ? 'opacity-100' : 'opacity-0'}`}>
            <img
              id="bg-stamp"
              src="/assets/stamp.png"
              alt="Decorative stamp"
              className="absolute object-cover top-[2191px] left-5 h-180 w-88.25"
            />
          </div>

          {isOpened && globalSparkles.map((s, i) => (
            <svg
              key={`global-${i}`}
              className={`absolute ${s.size} text-white animate-twinkle pointer-events-none`}
              style={{ top: s.top, left: s.left, animationDelay: s.delay }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" />
            </svg>
          ))}

          <div className={`transition-opacity duration-2500 ease-out delay-1000 ${isOpened ? 'opacity-100' : 'opacity-0'}`}>
            {sectionImages.map((image) => (
              <div key={image.id} id={image.id} className={`absolute ${image.wrapperClass} z-10`}>
                <img src={image.src} alt={image.alt} className={`w-full h-full object-contain ${image.swayClass}`} />
              </div>
            ))}
          </div>

          <section aria-labelledby="invitation-heading">
            <h2 id="invitation-heading" className="sr-only">Wedding invitation</h2>

            <ScrollReveal isOpened={isOpened} className="absolute top-237.25 left-[calc(50.00%-162px)] h-147.75 w-81 z-0">
              <div className="w-full h-full rounded-[162px] bg-white shadow-sm" />
            </ScrollReveal>

            <ScrollReveal isOpened={isOpened} delay={200} className="absolute top-252.5 left-[calc(50.00%-100px)] w-50">
              <img src="/assets/bismillah.png" alt="Bismillah" className="w-full h-full object-contain" />
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={0} className="absolute top-275 left-[calc(50.00%-138px)] w-68.75 text-center font-garamond font-normal text-base leading-relaxed">
              Dengan penuh kesyukuran ke hadrat Ilahi, kami
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={200} className="absolute top-286.25 left-[calc(50.00%-116px)] text-center font-garamond font-semibold italic text-[26px] leading-tight">
              Noruden bin Nong<br />Norhayati binti Ahmad
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={0} className="absolute top-305 left-[calc(50.00%-148px)] w-73.25 text-center font-garamond font-normal text-base leading-relaxed">
              serta
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={200} className="absolute top-313.75 left-[calc(50.00%-110px)] text-center font-garamond font-semibold italic text-[26px] leading-tight">
              Zamberi bin Sapi&apos;ee<br />Zaiton binti Jahot
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={0} className="absolute top-333.75 left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-normal text-base leading-snug">
              menjemput dan mempersilakan<br />Dato&apos;/Datin/Tuan/Puan/Encik/Cik<br />ke Majlis Perkahwinan Putera &amp; Puteri kami,
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={200} className="absolute top-[1650px] left-[calc(50.00%-118px)] text-center font-gwendolyn font-bold text-4xl leading-[30.6px]">
              Afif Danial<br /><span className="font-garamond font-normal text-[22px] italic tracking-normal">bin Noruden</span>
              <br />&amp;<br />
              Husna Zulaiqah<br /><span className="font-garamond font-normal text-[22px] italic tracking-normal">binti Zamberi</span>
            </ScrollReveal>

            <ScrollReveal isOpened={isOpened} className="absolute top-353.75 left-13.75 w-33.75">
              <img src="/assets/childhood abg.png" alt="Afif childhood photo" className="w-full object-contain" />
            </ScrollReveal>

            <ScrollReveal isOpened={isOpened} delay={200} className="absolute top-353.75 left-50.75 w-33.75">
              <img src="/assets/childhood kak na.png" alt="Husna childhood photo" className="w-full object-contain" />
            </ScrollReveal>
          </section>

          <section aria-labelledby="event-heading">
            <h2 id="event-heading" className="sr-only">Event details</h2>
            <ScrollReveal as="p" isOpened={isOpened} delay={0} className="absolute top-[1846px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-normal text-base leading-3">
              pada
            </ScrollReveal>
            <ScrollReveal as="p" isOpened={isOpened} delay={200} className="absolute top-[1872px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-semibold italic text-xl leading-3.75">
              Sabtu, 12 Disember 2026
            </ScrollReveal>
            <ScrollReveal as="p" isOpened={isOpened} delay={400} className="absolute top-[1897px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-normal text-base leading-3">
              10:00am — 2:00pm
            </ScrollReveal>
            <ScrollReveal as="p" isOpened={isOpened} delay={0} className="absolute top-[1954px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-normal text-base leading-3">
              bertempat di
            </ScrollReveal>

            <ScrollReveal isOpened={isOpened} delay={200} className="absolute top-[1987px] left-32 h-34.25 w-34.25">
              <img src="/assets/QR location.jpg" alt="QR Code Location" className="w-full h-full object-contain" />
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={0} className="absolute top-[2138px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-semibold italic text-xl leading-3.75">
              Kompleks Sukan, Asajaya
            </ScrollReveal>
            <ScrollReveal as="p" isOpened={isOpened} delay={200} className="absolute top-[2164px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-normal text-base leading-[12.8px]">
              Jalan Kota Samarahan - Sadong Jaya, 94600 Asajaya, Sarawak, Malaysia
            </ScrollReveal>
          </section>

          <section aria-labelledby="schedule-heading">
            <ScrollReveal as="h2" isOpened={isOpened} className="absolute top-[2353px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-semibold italic text-xl leading-3.75">
              Atur Cara Majlis
            </ScrollReveal>
            <div className="absolute top-[2396px] left-[calc(50.00%-150px)] w-75.75 text-sm font-garamond font-normal leading-3.5">
              <ScrollReveal isOpened={isOpened} delay={200} className="absolute left-20 top-0 h-full w-px bg-stone-300 origin-top" />
              <div className="relative z-10 flex flex-col gap-2.5">
                {schedule.map(([time, event], index) => (
                  <ScrollReveal key={index} isOpened={isOpened} delay={index * 150} className="flex w-full items-start">
                    <div className="w-20 pr-3 text-right shrink-0">{time}</div>
                    <div className="w-51 pl-3 whitespace-pre-wrap">{event}</div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="closing-heading">
            <h2 id="closing-heading" className="sr-only">Closing message</h2>

            <ScrollReveal isOpened={isOpened} className="absolute top-[2893px] left-[calc(50%-100px)] w-50 flex items-center justify-center opacity-80">
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-pink-300 to-transparent"></div>
              <img src="/assets/pink flower 1.png" alt="" className="w-4 mx-3 object-contain" />
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-pink-300 to-transparent"></div>
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={150} className="absolute top-[2942px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-normal text-base leading-[12.8px]">
              Ya Allah Ya Rahman Ya Rahim,<br />berkatilah majlis perkahwinan ini.<br />
              Limpahkanlah baraqah dan rahmatMu kepada kedua mempelai ini.<br />
              Kurniakanlah mereka kelak zuriat yang soleh dan solehah. Kekalkanlah jodoh mereka hingga ke jannah.
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={300} className="absolute top-[3044px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-semibold italic text-xl leading-3.75">
              #AfiforHusna
            </ScrollReveal>

            <ScrollReveal isOpened={isOpened} delay={450} className="absolute top-[3093px] left-[calc(50%-100px)] w-50 flex items-center justify-center opacity-80">
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-pink-300 to-transparent"></div>
              <img src="/assets/pink flower 1.png" alt="" className="w-4 mx-3 object-contain scale-x-[-1]" />
              <div className="h-px flex-1 bg-linear-to-r from-transparent via-pink-300 to-transparent"></div>
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={0} className="absolute top-[3139px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-semibold italic text-xl leading-3.75">
               Menghitung Hari
            </ScrollReveal>

            <ScrollReveal as="div" isOpened={isOpened} delay={200} className="absolute top-[3188px] left-[calc(50%-160px)] w-[320px]">
              {(() => {
                const parts = countdown.split(" ");
                const timeData = [
                  { value: parts[0] || "0", label: "Hari" },
                  { value: parts[2] || "0", label: "Jam" },
                  { value: parts[4] || "0", label: "Minit" },
                  { value: parts[6] || "0", label: "Saat" },
                ];
                return (
                  <div className="flex justify-center gap-3">
                    {timeData.map((item, index) => (
                      <div key={index} className="flex flex-col items-center w-15">
                        <div className="w-13.5 h-13.5 rounded-full bg-white flex items-center justify-center mb-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
                          <span className="font-garamond font-medium text-[22px] text-stone-800 leading-none">{item.value}</span>
                        </div>
                        <span className="font-garamond italic text-[13px] text-stone-600">{item.label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={0} className="absolute top-[3302px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-semibold italic text-xl leading-3.75">
               Ucapan
            </ScrollReveal>

            {/* INTEGRATED FLOATING WISHES BUBBLES */}
            <ScrollReveal as="div" isOpened={isOpened} delay={200} className="absolute top-[3340px] left-[calc(50.00%-155px)] w-77.5">
              <FloatingWishes isOpened={isOpened} />
            </ScrollReveal>

            <ScrollReveal as="p" isOpened={isOpened} delay={0} className="absolute top-[3617px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond font-normal text-xl leading-4">
              Sila <span className="font-garamond font-semibold italic">RSVP</span> kehadiran anda sebelum <span className="font-garamond font-semibold">1 Disember 2026</span>
            </ScrollReveal>
          </section>

          <ScrollReveal isOpened={isOpened} delay={200} className="absolute top-[3669px] left-10.25 h-8.5 w-39.5">
            <button
              type="button"
              onClick={() => setActivePanel("rsvp")}
              className="absolute top-0 left-1.75 h-8.5 w-35.25 rounded-[17px] border-[0.5px] border-black bg-white font-garamond font-normal text-base leading-3 hover:bg-stone-50 transition-colors pointer-events-auto"
            >
              Sahkan Kehadiran
            </button>
          </ScrollReveal>

          <ScrollReveal isOpened={isOpened} delay={400} className="absolute top-[3669px] left-49.25 h-8.5 w-39.5">
            <button
              type="button"
              onClick={() => setActivePanel("rsvp")}
              className="absolute top-0 left-1.75 h-8.5 w-35.25 rounded-[17px] border-[0.5px] border-black bg-white font-garamond font-normal text-base leading-3 hover:bg-stone-50 transition-colors pointer-events-auto"
            >
              Tulis Ucapan
            </button>
          </ScrollReveal>

          {/* ================= FOOTER FLOWERS ================= */}
          <ScrollReveal isOpened={isOpened} delay={600} className="absolute top-[3743px] w-full flex justify-center items-center gap-3">
            <img src="/assets/pink flower 1.png" alt="Pink Orchid" className="object-contain h-13.75 animate-sway-2" />
            <img src="/assets/purple flower.png" alt="Purple Hibiscus" className="object-contain h-13.75 animate-sway-1" />
            <img src="/assets/pink flower 2.png" alt="Pink Lotus" className="object-contain h-13.75 animate-sway-3" />
            <img src="/assets/yellow flower.png" alt="Yellow Flower" className="object-contain h-11.25 animate-sway-2" />
          </ScrollReveal>

          <ScrollReveal as="footer" isOpened={isOpened} delay={800} className="absolute top-[3833px] left-[calc(50.00%-150px)] w-74.75 text-center font-garamond italic text-[14px] leading-[7.5px]">
             Direka Oleh:<br />Mizan Qistina binti Noruden
          </ScrollReveal>
        </div>

                {/* ================= TAP INDICATOR (landing only) ================= */}
        <style>{`
          @keyframes tap-bounce {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(-10px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .tap-bounce { animation: none !important; }
          }
        `}</style>

        <div
          className={`fixed left-1/2 -translate-x-1/2 z-60 transition-opacity duration-700 ease-out ${
            isOpened ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ bottom: "max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))" }}
        >
          <button
            type="button"
            disabled={isOpened}
            aria-label="Sentuh skrin untuk membuka jemputan"
            className="tap-bounce flex items-center gap-2 rounded-full bg-white/85 px-5 py-2 font-garamond italic font-regular text-lg text-stone-800 shadow-[0_2px_12px_rgba(0,0,0,0.12)] backdrop-blur-sm whitespace-nowrap"
            style={{ animation: "tap-bounce 1.8s ease-in-out infinite" }}
          >
            <svg className="h-3.5 w-3.5 text-pink-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" />
            </svg>
            Sentuh Skrin
          </button>
        </div>
      </main>

      {/* ================= NAVBAR ================= */}
      <div
        className={`fixed bottom-0 z-100 transition-opacity duration-500 ${isOpened ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ width: `${L.canvasW}px` }}
      >
        <Navbar
          isOpened={isOpened}
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          isPlaying={isPlaying}
          toggleMusic={toggleMusic}
          scale={L.scale}
        />
      </div>
    </div>
  );
};