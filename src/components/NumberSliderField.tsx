import React, { useEffect, useRef, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Text,
  TextInput,
  View
} from "react-native";

import { styles } from "../styles/appStyles";
import { clamp, formatDecimal, roundToStep } from "../utils/restaurants";
// Hybrid number control: users can either drag the slider or type a value.
export function NumberSliderField({
  icon,
  label,
  value,
  min,
  max,
  step,
  suffix,
  isDarkMode,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  isDarkMode: boolean;
  onChange: (value: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(1);
  const [draftValue, setDraftValue] = useState(formatDecimal(value));
  const onChangeRef = useRef(onChange);
  const trackWidthRef = useRef(trackWidth);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const dragStartValue = useRef(value);
  const percent = ((value - min) / (max - min)) * 100;

  useEffect(() => {
    setDraftValue(formatDecimal(value));
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
    trackWidthRef.current = trackWidth;
    minRef.current = min;
    maxRef.current = max;
    stepRef.current = step;
  }, [onChange, trackWidth, min, max, step]);

  // Validates typed values and applies the same min/max rules as the slider.
  function commitValue(rawValue: string) {
    const parsed = Number(rawValue.replace(",", "."));
    if (!Number.isFinite(parsed)) {
      setDraftValue(formatDecimal(value));
      return;
    }

    const nextValue = roundToStep(clamp(parsed, min, max), step);
    onChangeRef.current(Number(nextValue.toFixed(1)));
  }

  // Centralizes slider clamping and rounding so drag and text input behave alike.
  function normalizeValue(rawValue: number) {
    return Number(
      roundToStep(
        clamp(rawValue, minRef.current, maxRef.current),
        stepRef.current
      ).toFixed(1)
    );
  }

  // Converts the initial touch position on the track into a filter value.
  function valueFromPosition(event: GestureResponderEvent) {
    const width = trackWidthRef.current;
    const x = clamp(event.nativeEvent.locationX, 0, width);
    return normalizeValue(
      minRef.current + (x / width) * (maxRef.current - minRef.current)
    );
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const nextValue = valueFromPosition(event);
        dragStartValue.current = nextValue;
        onChangeRef.current(nextValue);
      },
      onPanResponderMove: (_event, gestureState) => {
        const width = trackWidthRef.current;
        const deltaValue =
          (gestureState.dx / width) * (maxRef.current - minRef.current);
        const nextValue = normalizeValue(dragStartValue.current + deltaValue);

        onChangeRef.current(nextValue);
      }
    })
  ).current;

  return (
    <View style={styles.numberField}>
      <View style={styles.numberFieldHeader}>
        <View style={styles.iconLabel}>
          {icon}
          <Text style={[styles.filterLabel, isDarkMode && styles.darkText]}>{label}</Text>
        </View>
        <View style={[styles.numberInputWrap, isDarkMode && styles.darkNumberInputWrap]}>
          <TextInput
            value={draftValue}
            onChangeText={(text) => {
              setDraftValue(text);
            }}
            onBlur={() => commitValue(draftValue)}
            onSubmitEditing={() => commitValue(draftValue)}
            keyboardType="decimal-pad"
            inputMode="decimal"
            style={[styles.numberInput, isDarkMode && styles.darkText]}
          />
          <Text style={[styles.numberSuffix, isDarkMode && styles.darkMutedText]}>
            {suffix}
          </Text>
        </View>
      </View>
      <View
        style={styles.sliderTrack}
        onLayout={(event: LayoutChangeEvent) => {
          const nextTrackWidth = Math.max(1, event.nativeEvent.layout.width);
          trackWidthRef.current = nextTrackWidth;
          setTrackWidth(nextTrackWidth);
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.sliderBase, isDarkMode && styles.darkSliderBase]} />
        <View style={[styles.sliderFill, { width: `${clamp(percent, 0, 100)}%` }]} />
        <View
          style={[
            styles.sliderThumb,
            isDarkMode && styles.darkSliderThumb,
            { left: `${clamp(percent, 0, 100)}%` }
          ]}
        />
      </View>
      <View style={styles.sliderBounds}>
        <Text style={[styles.sliderBoundText, isDarkMode && styles.darkMutedText]}>
          {formatDecimal(min)}
          {suffix}
        </Text>
        <Text style={[styles.sliderBoundText, isDarkMode && styles.darkMutedText]}>
          {formatDecimal(max)}
          {suffix}
        </Text>
      </View>
    </View>
  );
}


