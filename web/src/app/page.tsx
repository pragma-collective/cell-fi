import Image from "next/image";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="h-full">
      <div className="bg-white overflow-hidden relative after:content-[''] after:absolute after:inset-0 after:bg-[var(--color-secondary)] after:opacity-50 after:mix-blend-lightenn after:z-10 flex items-center justify-center aspect-[3/2] md:aspect-auto h-full">
        <Image src="/bg-login.jpg" width={6000} height={4000} className="d-block absolute inset-0 z-0 h-full w-full object-cover" alt="background" />
        <div className="absolute bottom-5 left-5 right-5 z-30 text-[20px] md:text-[30px] text-right leading-tight font-extralight">SMS-based peer-to-peer payments using <br />
        USDC digital currency - no internet required.</div>
        <div className="text-white relative z-40 w-[150px]">
        <Image src="/logo.svg" width={250} height={55} className="w-[250px] h-auto mb-2" alt="logo" />
        <h3 className="font-bold mb-10 text-center tracking-[5px]">CellFi</h3>
        <Link href="/login" className="button button--primary whitespace-nowrap !px-10">Login &nbsp;→</Link>
        </div>
      </div>
    </div>
  );
}
