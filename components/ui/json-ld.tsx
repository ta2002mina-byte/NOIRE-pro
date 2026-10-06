/** Renders a JSON-LD <script> tag. `<` is escaped so admin-entered text
 * (a dish description, say) can never prematurely close the script tag. */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  // eslint-disable-next-line react/no-danger -- structured data has no other way to render.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
