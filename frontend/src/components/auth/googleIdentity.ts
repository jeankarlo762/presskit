// Minimal typing + loader for Google Identity Services (the "Sign in with
// Google" button). Only what GoogleSignInButton uses is declared.

export type GoogleCredentialResponse = { credential: string; select_by?: string };

export type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_button?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
  cancel: () => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

/** OAuth Web client ID; without it the Google button simply isn't shown. */
export const GOOGLE_CLIENT_ID: string | undefined = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || undefined;

const GSI_SRC = "https://accounts.google.com/gsi/client";
let gsiPromise: Promise<GoogleAccountsId> | null = null;

/** Injects the GIS script once per page load; later calls share the same
 * promise. A failed load is forgotten so the next mount can retry. */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);

  gsiPromise ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google.accounts.id);
      else reject(new Error("Google Identity Services indisponível"));
    };
    script.onerror = () => reject(new Error("Não foi possível carregar o login do Google"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    gsiPromise = null;
    throw error;
  });

  return gsiPromise;
}
