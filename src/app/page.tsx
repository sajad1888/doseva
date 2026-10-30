import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative isolate h-svh w-full overflow-hidden text-white flex items-center justify-center">

      {/* Background Image */}
      <Image
        src="/Mountain landscape.webp"
        alt="Background"
        fill
        priority
        className="object-cover -z-20"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-[#041B36]/80 via-[#042342]/30 to-transparent -z-10" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-120 px-6 flex flex-col items-center gap-3 sm:gap-5">

        {/* Logo */}
        <Image
          src="/Capsule.svg"
          alt="Logo"
          width={100}
          height={100}
          className="w-20 h-20 sm:w-25 sm:h-25"
        />

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <h1 className="text-[clamp(3rem,2.3667rem+2.6667vw,4.5rem)] font-bold">
            دوزوا
          </h1>

          <p className="text-[clamp(1.5rem,1.1833rem+1.3333vw,2.25rem)] font-light">
            همراه سلامت شما
          </p>
        </div>

        {/* Description */}
        <p className="text-xl font-extralight text-center w-50">
          یادآوری دارو، نوبت پزشکی و مدیریت بهتر سلامتی
        </p>

        {/* Start Button */}
        <Link
          href="/login"
          className="flex items-center mt-25 bg-[#1683DA] rounded-full w-full py-2 px-4 justify-center gap-1.25"
        >
          شروع کنید
          <ArrowLeft className="size-4.5" />
        </Link>

      </div>
    </div>
  );
}