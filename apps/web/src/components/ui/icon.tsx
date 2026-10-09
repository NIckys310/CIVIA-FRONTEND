import { icons, type IconName } from '@civia/ui';

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Si se indica, el icono es significativo y se anuncia a lectores de pantalla. */
  title?: string;
}

export function Icon({ name, size = 20, strokeWidth = 1.5, className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {icons[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
