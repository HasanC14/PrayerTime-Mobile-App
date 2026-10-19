import Svg, { Circle, Path } from "react-native-svg";

export function TasbeehIcon({ size = 24, color }: { size?: number; color: string }) {
  return <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" accessible={false}>
    {Array.from({ length: 15 }, (_, index) => {
      const angle = (-150 + index * 300 / 14) * Math.PI / 180;
      return <Circle key={index} cx={16 + Math.sin(angle) * 8} cy={13 - Math.cos(angle) * 10} r={1.55} fill={color} />;
    })}
    <Path d="M12 22l4 3 4-3M16 25v5m-3-2 3-3 3 3" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}
