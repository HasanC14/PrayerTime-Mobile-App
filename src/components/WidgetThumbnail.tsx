import {useState} from "react";
import {StyleSheet, View} from "react-native";
import {TextScaleProvider} from "../typography";
import type {HomeWidgetKind, PrayerWidgetProps} from "../services/widgetTimeline";
import {WidgetPreview} from "./WidgetPreview";

const dimensions: Record<HomeWidgetKind, [number, number]> = {
  hero: [320, 170], next: [160, 160], summary: [320, 200], times: [320, 300]
};

export function WidgetThumbnail({kind, preview, now}: {kind: HomeWidgetKind; preview: PrayerWidgetProps | null; now: number}) {
  const [width, setWidth] = useState(0);
  const [canvasWidth, canvasHeight] = dimensions[kind];
  const scale = Math.min(Math.max(0, width - 12) / canvasWidth, 144 / canvasHeight);
  return <View style={styles.stage} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    {width > 0 ? <View pointerEvents="none" style={{position: "absolute", left: (width - canvasWidth * scale) / 2,
      top: (156 - canvasHeight * scale) / 2, width: canvasWidth, height: canvasHeight,
      transform: [{scale}], transformOrigin: "top left"}}>
      <TextScaleProvider value={1}><WidgetPreview kind={kind} preview={preview} now={now} miniature /></TextScaleProvider>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({stage: {height: 156, width: "100%", overflow: "hidden"}});
