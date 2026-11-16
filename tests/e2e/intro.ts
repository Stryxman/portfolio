import type { Page } from "@playwright/test";

// Termine la chorégraphie d'ouverture. On ne touche ni à la rotation de la spirale (infinie),
// ni à l'animation liée au défilement (sa chronologie n'est pas celle du document : la terminer la figerait à la fin).
// À appeler avant une mesure de contraste ou d'opacité, qui sinon tombe au milieu du fondu du texte.
export const finishIntro = (page: Page) =>
  page.evaluate(() => {
    for (const a of document.getAnimations()) {
      if (a.timeline === document.timeline && a.effect?.getComputedTiming().endTime !== Infinity)
        a.finish();
    }
  });
