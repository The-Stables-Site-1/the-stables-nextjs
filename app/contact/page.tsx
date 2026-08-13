"use client";

import { FormEvent, useState } from "react";
import { CloseButton } from "@/components/CloseButton";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen bg-cream">
      <CloseButton />

      <div className="px-5 py-5">
        <form onSubmit={onSubmit} className="w-[335px]">
          <div className="flex flex-col">
            <div className="relative -mb-px flex h-10 items-center justify-center border-[0.75px] border-ink bg-cream">
              <span className="text-[12px] uppercase tracking-[0.02em]">
                Contact
              </span>
            </div>

            <label className="relative -mb-px block h-10 border-[0.75px] border-ink bg-cream">
              <span className="sr-only">Full name</span>
              <input
                name="fullName"
                type="text"
                placeholder="FULL NAME"
                className="h-full w-full bg-transparent px-4 text-[12px] uppercase text-black outline-none placeholder:text-black/10"
                autoComplete="name"
              />
            </label>

            <label className="relative -mb-px block h-10 border-[0.75px] border-ink bg-cream">
              <span className="sr-only">Phone number</span>
              <input
                name="phone"
                type="tel"
                placeholder="PHONE NUMBER"
                className="h-full w-full bg-transparent px-4 text-[12px] uppercase text-black outline-none placeholder:text-black"
                autoComplete="tel"
              />
            </label>

            <label className="relative -mb-px block h-10 border-[0.75px] border-ink bg-cream">
              <span className="sr-only">Subject</span>
              <input
                name="subject"
                type="text"
                placeholder="SUBJECT"
                className="h-full w-full bg-transparent px-4 text-[12px] uppercase text-black outline-none placeholder:text-black"
              />
            </label>

            <label className="relative block h-[140px] border-[0.75px] border-ink bg-cream">
              <span className="sr-only">Message</span>
              <textarea
                name="message"
                placeholder="MESSAGE"
                className="h-full w-full resize-none bg-transparent px-4 py-4 text-[12px] uppercase text-black outline-none placeholder:text-black"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-5 flex h-10 w-full items-center justify-center border-[0.75px] border-ink bg-cream text-[12px] uppercase tracking-[0.02em]"
          >
            {submitted ? "Sent" : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
