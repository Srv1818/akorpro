/* Payload admin paneli kendi kök layout'unu getirir.
 * Sitenin `app/layout.tsx`'i burada devreye girmez; route grubu sayesinde
 * tema, font ve CSP sarmalayıcıları panele sızmaz. */
import type { ServerFunctionClient } from "payload";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import config from "@payload-config";
import { importMap } from "./admin/importMap";

import "@payloadcms/next/css";

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  "use server";
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

export default function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
