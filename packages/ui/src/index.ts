export function SectionTitle(props: { title: string; subtitle?: string }): string {
  return `${props.title}${props.subtitle ? ` - ${props.subtitle}` : ""}`;
}
