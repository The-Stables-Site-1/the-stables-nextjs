import Image from "next/image";

type StampBoxProps = {
  src: string;
  alt: string;
  visible?: boolean;
  blend?: boolean;
};

/** The rotated partner stamp, centred in a 138px module. */
export function StampBox({
  src,
  alt,
  visible = true,
  blend = true,
}: StampBoxProps) {
  return (
    <div
      className={`pointer-events-none absolute top-1/2 left-1/2 h-[88px] w-[215px] -translate-x-1/2 -translate-y-1/2 ${
        blend ? "mix-blend-multiply" : ""
      } ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="relative h-full w-full rotate-[4.87deg]">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="215px"
          priority
        />
      </div>
    </div>
  );
}
