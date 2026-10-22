import { OVERLAY_CLOSE_DELAY_MS, OVERLAY_EVENT, OVERLAY_FALLBACK_TEXT } from "./overlayConfig";

export const OVERLAY_CLIENT_BOOTSTRAP = `
(() => {
  const closeDelay = ${OVERLAY_CLOSE_DELAY_MS};
  const updateEventName = "${OVERLAY_EVENT.update}";
  const fallbackText = ${JSON.stringify(OVERLAY_FALLBACK_TEXT)};

  window.__WORDVEIL_OVERLAY_SETTINGS = {
    closeDelay,
    updateEventName,
    fallbackText,
  };
})();
`;
