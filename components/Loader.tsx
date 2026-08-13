"use client";

import Image from "next/image";

type LoaderProps = {
  visible: boolean;
};

export function Loader({ visible }: LoaderProps) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-cream transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="relative size-[50px] border border-[#2c2c2c]">
        <div className="absolute left-1/2 top-1/2 h-[23px] w-[33px] -translate-x-1/2 -translate-y-1/2 mix-blend-multiply">
          <Image
            src="/horse-loader.png"
            alt="The Stables"
            width={33}
            height={23}
            className="size-full object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
