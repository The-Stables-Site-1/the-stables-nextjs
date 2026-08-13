import Image from "next/image";
import { brandStampLogo } from "@/lib/partners";

type AddressBoxProps = {
  showContent?: boolean;
  opaque?: boolean;
};

export function AddressBox({
  showContent = true,
  opaque = false,
}: AddressBoxProps) {
  return (
    <div
      className={`relative h-[138px] w-[335px] overflow-hidden border-[0.75px] border-ink ${
        opaque || showContent ? "bg-cream" : "bg-transparent"
      }`}
    >
      {showContent && (
        <div className="pointer-events-none absolute left-[15px] top-[-18px] h-[173px] w-[227px] mix-blend-multiply">
          <div className="relative h-full w-full -rotate-[1.6deg]">
            <Image
              src={brandStampLogo}
              alt="The Stables"
              fill
              className="object-contain"
              sizes="227px"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
