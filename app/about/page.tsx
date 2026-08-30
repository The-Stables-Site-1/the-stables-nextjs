import { AboutExperience } from "@/components/AboutExperience";
import { site } from "@/lib/site";

export const metadata = {
  title: "About | The Stables",
  description: site.information,
};

export default function AboutPage() {
  return <AboutExperience />;
}
