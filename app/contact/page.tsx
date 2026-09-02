"use client";

import { FormEvent, useEffect, useState } from "react";
import { CloseButton } from "@/components/CloseButton";
import { markAppBooted } from "@/lib/boot";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  useEffect(() => {
    markAppBooted();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.get("fullName"),
          email: data.get("email"),
          phone: data.get("phone"),
          subject: data.get("subject"),
          message: data.get("message"),
        }),
      });

      if (!response.ok) throw new Error("Request failed");

      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  const buttonLabel =
    status === "sending"
      ? "Sending..."
      : status === "sent"
        ? "Sent"
        : status === "error"
          ? "Try Again"
          : "Send Message";

  return (
    <div className="relative min-h-screen bg-cream">
      <CloseButton />

      <div className="flex min-h-screen items-center justify-center px-5 py-5">
        <form onSubmit={onSubmit} className="w-[335px] max-[599px]:w-full">
          <div className="flex flex-col">
            <div className="relative -mb-px flex h-[36px] items-center justify-center border-[0.75px] border-ink bg-cream">
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
                required
                className="h-full w-full bg-transparent px-4 text-[12px] uppercase text-black outline-none placeholder:text-black/10"
                autoComplete="name"
              />
            </label>

            <label className="relative -mb-px block h-10 border-[0.75px] border-ink bg-cream">
              <span className="sr-only">Email address</span>
              <input
                name="email"
                type="email"
                placeholder="EMAIL"
                required
                className="h-full w-full bg-transparent px-4 text-[12px] uppercase text-black outline-none placeholder:text-black"
                autoComplete="email"
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
                required
                className="h-full w-full resize-none bg-transparent px-4 py-4 text-[12px] uppercase text-black outline-none placeholder:text-black"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-5 flex h-10 w-full items-center justify-center border-[0.75px] border-ink bg-cream text-[12px] uppercase tracking-[0.02em] disabled:opacity-50"
          >
            {buttonLabel}
          </button>

          {status === "error" ? (
            <p className="mt-3 text-center text-[11px] uppercase text-black">
              Something went wrong. Please try again.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
