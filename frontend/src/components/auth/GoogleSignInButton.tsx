import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { loginWithGoogle } from "../../api/auth";
import { apiErrorMessage } from "../../api/axios";
import { GOOGLE_CLIENT_ID, loadGoogleIdentity, type GoogleCredentialResponse } from "./googleIdentity";

type GoogleSession = Awaited<ReturnType<typeof loginWithGoogle>>;

type Props = {
  /** Called with the API session after /auth/google accepted the credential. */
  onSuccess: (session: GoogleSession) => void;
  onError?: (message: string) => void;
};

// Google caps the rendered button between these widths (px).
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

/** Google's official "Continuar com Google" button. Renders nothing when
 * VITE_GOOGLE_CLIENT_ID is unset, so environments without Google keep the
 * e-mail form only. */
export function GoogleSignInButton(props: Props) {
  if (!GOOGLE_CLIENT_ID) return null;
  return <GoogleButton clientId={GOOGLE_CLIENT_ID} {...props} />;
}

function GoogleButton({ clientId, onSuccess, onError }: Props & { clientId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // GIS keeps the callback from initialize(); route it through a ref so it
  // always reaches the latest props.
  const handlersRef = useRef({ onSuccess, onError });
  useLayoutEffect(() => {
    handlersRef.current = { onSuccess, onError };
  });

  useEffect(() => {
    let cancelled = false;

    async function handleCredential(response: GoogleCredentialResponse) {
      setPending(true);
      try {
        const session = await loginWithGoogle(response.credential);
        handlersRef.current.onSuccess(session);
      } catch (error) {
        handlersRef.current.onError?.(apiErrorMessage(error, "Não foi possível entrar com o Google"));
      } finally {
        if (!cancelled) setPending(false);
      }
    }

    loadGoogleIdentity()
      .then((gsi) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        gsi.initialize({ client_id: clientId, callback: handleCredential, ux_mode: "popup", cancel_on_tap_outside: true });
        const width = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, container.clientWidth)));
        container.replaceChildren();
        gsi.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          locale: "pt-BR",
          width,
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Login com Google indisponível");
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div
        ref={containerRef}
        className={"flex min-h-11 w-full justify-center" + (pending ? " pointer-events-none opacity-60" : "")}
        aria-busy={pending}
      />
      {pending && <p className="text-sm text-fg-muted">Entrando com o Google...</p>}
      {loadError && <p className="text-sm text-fg-muted">{loadError}</p>}
    </div>
  );
}
