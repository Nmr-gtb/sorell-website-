/**
 * Hôte canonique du site.
 *
 * Toute déclaration SEO (sitemap, robots, canonical, données structurées) doit
 * en dériver. Il doit correspondre EXACTEMENT à l'hôte qui répond 200 sur
 * Vercel : si l'apex redirige vers www (ou l'inverse), Google découvre des URLs
 * qui redirigent et ne les indexe pas.
 */
export const SITE_URL = "https://sorell.fr";
