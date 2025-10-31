import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="DashboardPOS"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CategoryPos"
        options={{
          title: "Category",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="tag.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProductCategory"
        options={{
          title: "Product",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="box.fill" size={28} color="#333" />
          ),
        }}
      />
      <Tabs.Screen
        name="CashierScreen"
        options={{
          title: "Cashier",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="point-of-sale" color={color} />
          ),
        }}
      />
        <Tabs.Screen
          name="AddStock"
          options={{
            title: "Stock",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="plus.box.fill" color={color} />
            ),
          }}
        />
      <Tabs.Screen
        name="AccountScreen"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
