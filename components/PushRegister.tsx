"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Mendaftarkan token FCM saat aplikasi dijalankan di dalam APK (Capacitor).
 * Tidak melakukan apa-apa saat dibuka di browser biasa.
 */
export default function PushRegister() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor?.isNativePlatform?.()) return;

        const { PushNotifications } = await import("@capacitor/push-notifications");

        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== "granted") return;

        await PushNotifications.register();

        const reg = await PushNotifications.addListener("registration", async (token) => {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          await supabase
            .from("device_tokens")
            .upsert(
              { user_id: user.id, token: token.value, platform: Capacitor.getPlatform() },
              { onConflict: "token" }
            );
        });

        cleanup = () => {
          reg.remove();
        };
      } catch {
        // modul Capacitor tidak tersedia (browser) — abaikan.
      }
    })();
    return () => cleanup?.();
  }, []);

  return null;
}
