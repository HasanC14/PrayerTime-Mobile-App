import Svg, { Path, Rect } from "react-native-svg";

export function KaabaIcon({size = 36}: {size?: number}) {
  return <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
    <Path d="M7 13 24 6l17 7v25l-17 7-17-7Z" fill="#272429" />
    <Path d="m24 20 17-7v25l-17 7Z" fill="#121215" />
    <Path d="M7 13 24 6l17 7-17 7Z" fill="#454049" />
    <Path d="m7 19 17 7 17-7v5l-17 7-17-7Z" fill="#D5AE63" />
    <Path d="m24 26 17-7v5l-17 7Z" fill="#B98B42" />
    <Rect x="12" y="27" width="7" height="12" rx="1" fill="#D5AE63" transform="skewY(21) translate(0 -6)" />
  </Svg>;
}
