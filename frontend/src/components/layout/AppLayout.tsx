import { useRef } from "react";
import { Outlet } from "react-router-dom";
import { BackgroundAtmosphere } from "../sections/BackgroundAtmosphere";
import { Footer } from "./Footer";
import { Navbar } from "../navigation/Navbar";
import { WhatsAppButton } from "../whatsapp/WhatsAppButton";
import { configurationApi } from "../../services/api/configuration-api";
import { useApi } from "../../hooks/use-api";
import { useScrollExperience } from "../../hooks/use-scroll-experience";

export function AppLayout() {
  const { data } = useApi(configurationApi.getPublic, []);
  const configuration = data?.data ?? null;
  const motionScope = useRef<HTMLElement | null>(null);

  useScrollExperience(motionScope);

  return (
    <>
      <BackgroundAtmosphere />
      <Navbar configuration={configuration} />
      <main className="site-main" ref={motionScope}>
        <Outlet context={{ configuration }} />
      </main>
      <Footer configuration={configuration} />
      <WhatsAppButton configuration={configuration} />
    </>
  );
}
