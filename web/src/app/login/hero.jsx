import Image from "next/image";

export default function Hero() {
  return (
    <div className="bg-white rounded-[10px] overflow-hidden relative after:content-[''] after:absolute after:inset-0 after:bg-[var(--color-secondary)] after:opacity-50 after:mix-blend-lightenn after:z-10 flex items-center justify-center aspect-[3/2] md:aspect-auto">
        <Image src="/bg-login.jpg" width={6000} height={4000} className="d-block absolute inset-0 z-0 h-full w-full object-cover" alt="background" />
        <div className="absolute bottom-5 left-5 right-5 z-30 text-[20px] md:text-[30px] text-right leading-tight font-extralight">Your Financial Bridge, <br />Always Connected.</div>
        <div className="text-white relative z-40 w-[150px]">
        <Image src="/logo.svg" width={250} height={55} className="w-[250px] h-auto" alt="logo" />
        </div>
      </div>
  );
}