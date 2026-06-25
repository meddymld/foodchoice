import React, { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, Text, View } from "react-native";
import { Heart, Map, Search, UserRound } from "lucide-react-native";

import { colors } from "../theme";
import { styles } from "../styles/appStyles";
import { clamp } from "../utils/restaurants";

export type MainTab = "search" | "map" | "favorites" | "profile";
// Bottom navigation between the four main app areas.
export function BottomTabs({
  activeTab,
  isDarkMode,
  onTabChange
}: {
  activeTab: MainTab;
  isDarkMode: boolean;
  onTabChange: (tab: MainTab) => void;
}) {
  const activeNavigationColor = isDarkMode ? "#7BE495" : colors.brand;
  const inactiveNavigationColor = isDarkMode ? "#DDEDE3" : colors.muted;
  const tabs: Array<{
    id: MainTab;
    label: string;
    icon: (active: boolean) => React.ReactNode;
  }> = [
    {
      id: "search",
      label: "Recherche",
      icon: (active) => (
        <Search
          size={21}
          color={active ? activeNavigationColor : inactiveNavigationColor}
        />
      )
    },
    {
      id: "map",
      label: "Carte",
      icon: (active) => (
        <Map
          size={21}
          color={active ? activeNavigationColor : inactiveNavigationColor}
        />
      )
    },
    {
      id: "favorites",
      label: "Favoris",
      icon: (active) => (
        <Heart
          size={21}
          color={active ? activeNavigationColor : inactiveNavigationColor}
          fill={active ? activeNavigationColor : "transparent"}
        />
      )
    },
    {
      id: "profile",
      label: "Profil",
      icon: (active) => (
        <UserRound
          size={21}
          color={active ? activeNavigationColor : inactiveNavigationColor}
        />
      )
    }
  ];
  const [barWidth, setBarWidth] = useState(0);
  const activeIndicatorX = useRef(new Animated.Value(0)).current;
  const activeIndicatorScale = useRef(new Animated.Value(1)).current;
  const magnifierX = useRef(new Animated.Value(0)).current;
  const magnifierOpacity = useRef(new Animated.Value(0)).current;
  const magnifierScale = useRef(new Animated.Value(0.82)).current;
  const tabWidth = Math.max(0, (barWidth - 16) / tabs.length);
  const tabWidthRef = useRef(0);
  const activeIndexRef = useRef(0);
  const onTabChangeRef = useRef(onTabChange);
  const dragStartX = useRef(0);
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  useEffect(() => {
    tabWidthRef.current = tabWidth;
  }, [tabWidth]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    onTabChangeRef.current = onTabChange;

    if (tabWidth <= 0) return;
    Animated.spring(activeIndicatorX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      stiffness: 220,
      damping: 24,
      mass: 0.7
    }).start();
    magnifierX.setValue(activeIndex * tabWidth);
  }, [activeIndex, activeIndicatorX, magnifierX, onTabChange, tabWidth]);

  function showMagnifier() {
    Animated.parallel([
      Animated.timing(magnifierOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true
      }),
      Animated.spring(magnifierScale, {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 280,
        damping: 19
      })
    ]).start();
  }

  function hideMagnifier() {
    Animated.parallel([
      Animated.timing(magnifierOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }),
      Animated.spring(magnifierScale, {
        toValue: 0.82,
        useNativeDriver: true,
        stiffness: 240,
        damping: 20
      })
    ]).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        dragStartX.current = activeIndexRef.current * tabWidthRef.current;
        magnifierX.setValue(dragStartX.current);
        showMagnifier();
        Animated.spring(activeIndicatorScale, {
          toValue: 1.04,
          useNativeDriver: true,
          stiffness: 240,
          damping: 20
        }).start();
      },
      onPanResponderMove: (_event, gesture) => {
        const maxX = Math.max(0, (tabs.length - 1) * tabWidthRef.current);
        const nextX = clamp(dragStartX.current + gesture.dx, 0, maxX);
        activeIndicatorX.setValue(nextX);
        magnifierX.setValue(nextX);
      },
      onPanResponderRelease: (_event, gesture) => {
        const width = tabWidthRef.current;
        if (width <= 0) return;

        const maxIndex = tabs.length - 1;
        const nextIndex = clamp(
          Math.round((dragStartX.current + gesture.dx) / width),
          0,
          maxIndex
        );
        Animated.spring(activeIndicatorX, {
          toValue: nextIndex * width,
          useNativeDriver: true,
          stiffness: 220,
          damping: 24,
          mass: 0.7
        }).start();
        Animated.spring(magnifierX, {
          toValue: nextIndex * width,
          useNativeDriver: true,
          stiffness: 220,
          damping: 24,
          mass: 0.7
        }).start();
        onTabChangeRef.current(tabs[nextIndex].id);
        Animated.spring(activeIndicatorScale, {
          toValue: 1,
          useNativeDriver: true,
          stiffness: 240,
          damping: 20
        }).start();
        hideMagnifier();
      },
      onPanResponderTerminate: () => {
        Animated.spring(activeIndicatorX, {
          toValue: activeIndexRef.current * tabWidthRef.current,
          useNativeDriver: true,
          stiffness: 220,
          damping: 24,
          mass: 0.7
        }).start();
        Animated.spring(magnifierX, {
          toValue: activeIndexRef.current * tabWidthRef.current,
          useNativeDriver: true,
          stiffness: 220,
          damping: 24,
          mass: 0.7
        }).start();
        Animated.spring(activeIndicatorScale, {
          toValue: 1,
          useNativeDriver: true,
          stiffness: 240,
          damping: 20
        }).start();
        hideMagnifier();
      }
    })
  ).current;

  return (
    <View
      style={[styles.bottomTabs, isDarkMode && styles.darkBottomTabs]}
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bottomTabIndicator,
            isDarkMode && styles.darkBottomTabIndicator,
            {
              width: tabWidth,
              transform: [
                { translateX: activeIndicatorX },
                { scale: activeIndicatorScale }
              ]
            }
          ]}
        />
      )}
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bottomTabMagnifier,
            isDarkMode && styles.darkBottomTabMagnifier,
            {
              left: 8 + (tabWidth - 76) / 2,
              opacity: magnifierOpacity,
              transform: [
                { translateX: magnifierX },
                { scale: magnifierScale }
              ]
            }
          ]}
        />
      )}
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={styles.bottomTab}
            onPress={() => onTabChange(tab.id)}
            onPressIn={() => {
              magnifierX.setValue(tabs.indexOf(tab) * tabWidth);
              showMagnifier();
            }}
            onPressOut={hideMagnifier}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            {tab.icon(active)}
            <Text
              style={[
                styles.bottomTabText,
                active && styles.bottomTabTextActive
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}


