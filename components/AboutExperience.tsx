"use client";

import { useEffect } from "react";
import { AddressBox } from "@/components/AddressBox";
import { ContactLinks } from "@/components/ContactLinks";
import { InfoBox } from "@/components/InfoBox";
import { markAppBooted } from "@/lib/boot";
import { site } from "@/lib/site";

export function AboutExperience() {
  useEffect(() => {
    markAppBooted();
  }, []);

  return (
    <div className="relative min-h-screen bg-cream">
      <div className="relative z-10 flex min-h-screen justify-center">
        <aside className="flex w-full max-w-[375px] flex-col space-y-[-1px] px-5 py-5 max-[599px]:max-w-none">
          <div>
            <AddressBox href="/" opaque />
          </div>

          {site.about.map((section) => (
            <div key={section.title}>
              <InfoBox
                title={section.title}
                body={section.body}
                opaque
                fit
                indent
              />
            </div>
          ))}

          <div>
            <ContactLinks opaque />
          </div>
        </aside>
      </div>
    </div>
  );
}
