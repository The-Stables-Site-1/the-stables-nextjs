type InfoBoxProps = {
  title?: string;
  body?: string;
  showTitle?: boolean;
  showBody?: boolean;
  opaque?: boolean;
};

export function InfoBox({
  title = "INFORMATION",
  body,
  showTitle = true,
  showBody = true,
  opaque = false,
}: InfoBoxProps) {
  return (
    <div
      className={`relative flex h-[138px] w-[335px] flex-col border-[0.75px] border-ink ${
        opaque ? "bg-cream" : "bg-cream"
      }`}
    >
      <div className="flex h-10 shrink-0 items-center justify-center border-b-[0.75px] border-ink">
        <p
          className={`text-[12px] uppercase tracking-[0.02em] ${
            showTitle ? "opacity-100" : "opacity-0"
          }`}
        >
          {title}
        </p>
      </div>
      {body ? (
        <p
          className={`px-4 py-3 text-[12px] leading-normal ${
            showBody ? "opacity-100" : "opacity-0"
          }`}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}
