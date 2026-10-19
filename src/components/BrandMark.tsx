import { useId } from "react";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import geometry from "../constants/brandMark.json";

export function BrandMark({ height = 48, color = "#CBB3D7", endColor = color === "#CBB3D7" ? "#BFA5D4" : color }: { height?: number; color?: string; endColor?: string }) {
  const id = `brand${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return <Svg width={height * 120 / 188} height={height} viewBox="0 0 120 188" fill="none" accessible={false}>
    <Defs><LinearGradient id={id} x1="20" y1="0" x2="104" y2="188" gradientUnits="userSpaceOnUse">
      <Stop stopColor={color} /><Stop offset="1" stopColor={endColor} />
    </LinearGradient></Defs>
    {geometry.paths.map((d, i) => <Path key={i} d={d} fill={`url(#${id})`} fillRule="evenodd" />)}
  </Svg>;
}
