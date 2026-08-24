/**
 * Server identity advertised to MCP clients, and the site the citations point at.
 *
 * Env-overridable so the same image can back more than one docs property without
 * a rebuild — the index already carries the URLs, this only names the server.
 */

// Pear logo (public/pear-1.svg), embedded as a self-contained data: URI so the
// icon needs no external fetch. Spec-compliant MCP clients (Cursor, VS Code,
// Claude, …) show it next to the tool.
const PEAR_LOGO_SVG =
  '<svg width="265" height="358" viewBox="0 0 265 358" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M123.036 0H141.964V35.3525H123.036V0Z" fill="#B0D944"/>' +
  '<path d="M113.572 46.5399V53.6999H94.643V62.6499H170.357V53.6999H151.429V39.8274H132.5V46.5399H113.572Z" fill="#B0D944"/>' +
  '<path d="M189.286 67.1249H132.5V73.8374H75.7144V89.9474H189.286V67.1249Z" fill="#B0D944"/>' +
  '<path d="M208.214 94.4224H132.5V101.135H56.7858V117.245H208.214V94.4224Z" fill="#B0D944"/>' +
  '<path d="M208.214 121.72H132.5V128.433H56.7858V144.543H208.214V121.72Z" fill="#B0D944"/>' +
  '<path d="M227.143 149.018H132.5V155.73H37.8573V171.84H227.143V149.018Z" fill="#B0D944"/>' +
  '<path d="M227.143 176.315H132.5V183.028H37.8573V199.138H227.143V176.315Z" fill="#B0D944"/>' +
  '<path d="M246.071 203.613H132.5V210.325H18.9286V226.435H246.071V203.613Z" fill="#B0D944"/>' +
  '<path d="M265 230.91H132.5V237.623H0V253.733H265V230.91Z" fill="#B0D944"/>' +
  '<path d="M265 258.208H132.5V264.92H0V281.03H265V258.208Z" fill="#B0D944"/>' +
  '<path d="M265 285.505H132.5V292.218H0V308.328H265V285.505Z" fill="#B0D944"/>' +
  '<path d="M227.143 312.803H132.5V319.515H37.8573V335.625H227.143V312.803Z" fill="#B0D944"/>' +
  '<path d="M189.286 340.1H132.5V346.812H75.7144V358H189.286V340.1Z" fill="#B0D944"/>' +
  '</svg>';

export const LOGO_ICON = {
  src: `data:image/svg+xml;base64,${Buffer.from(PEAR_LOGO_SVG).toString('base64')}`,
  mimeType: 'image/svg+xml',
  sizes: ['any'],
};

export const SERVER_NAME = process.env.MCP_SERVER_NAME || 'pear-docs';
export const DOCS_LABEL = process.env.DOCS_LABEL || 'Pear';
/** Absolute origin the relative URLs in the index resolve against, for clients. */
export const DOCS_SITE_URL = (process.env.DOCS_SITE_URL || '').replace(/\/$/, '');

/** Turn an index-relative path into an absolute URL when a site origin is set. */
export function absolute(urlPath: string): string {
  return DOCS_SITE_URL ? `${DOCS_SITE_URL}${urlPath}` : urlPath;
}
