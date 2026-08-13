import { HomeExperience } from "@/components/HomeExperience";
import { partners } from "@/lib/partners";

export default function Home() {
  return <HomeExperience partners={partners} />;
}
