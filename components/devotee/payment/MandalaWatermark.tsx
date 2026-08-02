import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';

/**
 * Renders a faint, decorative SVG mandala watermark in the background.
 * Uses pointerEvents="none" to ensure it doesn't block touches.
 */
export default function MandalaWatermark(): React.ReactElement {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.centerContainer}>
        <Svg width={300} height={300} viewBox="0 0 100 100" style={styles.svg}>
          <G stroke="#800000" strokeWidth="0.5" fill="none">
            {/* Concentric rings */}
            <Circle cx="50" cy="50" r="10" />
            <Circle cx="50" cy="50" r="20" />
            <Circle cx="50" cy="50" r="30" />
            <Circle cx="50" cy="50" r="40" />
            <Circle cx="50" cy="50" r="48" />

            {/* Geometric radial lines */}
            <Path d="M 50 2 A 48 48 0 0 1 50 98" />
            <Path d="M 50 2 A 48 48 0 0 0 50 98" />
            <Path d="M 2 50 A 48 48 0 0 1 98 50" />
            <Path d="M 2 50 A 48 48 0 0 0 98 50" />

            {/* Diagonal arcs */}
            <Path d="M 16.8 16.8 A 48 48 0 0 1 83.2 83.2" />
            <Path d="M 16.8 16.8 A 48 48 0 0 0 83.2 83.2" />
            <Path d="M 83.2 16.8 A 48 48 0 0 1 16.8 83.2" />
            <Path d="M 83.2 16.8 A 48 48 0 0 0 16.8 83.2" />

            {/* Small circular nodes along rings */}
            <Circle cx="50" cy="20" r="1.5" fill="#800000" />
            <Circle cx="50" cy="80" r="1.5" fill="#800000" />
            <Circle cx="20" cy="50" r="1.5" fill="#800000" />
            <Circle cx="80" cy="50" r="1.5" fill="#800000" />
            <Circle cx="28.8" cy="28.8" r="1.5" fill="#800000" />
            <Circle cx="71.2" cy="71.2" r="1.5" fill="#800000" />
            <Circle cx="71.2" cy="28.8" r="1.5" fill="#800000" />
            <Circle cx="28.8" cy="71.2" r="1.5" fill="#800000" />
          </G>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    opacity: 0.04,
  },
});
