import { icons, type IconName } from '@civia/ui';
import Svg, { Path } from 'react-native-svg';

/** Mismo set de iconos que la web (packages/ui), renderizado con react-native-svg. */
export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 1.5,
}: {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[name].map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
