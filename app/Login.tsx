import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import IconFeather from "react-native-vector-icons/Feather";
import IconCommunity from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../src/api/api";

const { width, height } = Dimensions.get("window");

const Login = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Error", "Email dan password harus diisi!");
      return false;
    }
    if (!validateEmail(formData.email)) {
      Alert.alert("Error", "Format email tidak valid!");
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert("Error", "Password minimal 6 karakter!");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const url = "https://ef3e95d1c545.ngrok-free.app/api/auth/login";
      const payload = {
        email: formData.email,
        password: formData.password,
      };

      const response = await api.post("/api/auth/login", payload);
      const { status, user, token, message } = response.data;

      if (status && token && user) {
        // simpan token
        await AsyncStorage.setItem("token", token);

        // simpan user (supaya bisa dipakai di AccountScreen)
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            uuid: user.uuid,
            name: user.name,
            email: user.email,
          })
        );

        router.replace("/DashboardPOS");
      } else {
        Alert.alert("Gagal", message || "Terjadi kesalahan.");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Terjadi kesalahan server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <IconCommunity name="cash-register" size={40} color="#fff" />
            </View>
            <Text style={styles.appTitle}>POS System</Text>
            <Text style={styles.appSubtitle}>Toko Elektronik Maju</Text>
          </View>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Selamat Datang Kembali!</Text>
            <Text style={styles.welcomeSubtitle}>
              Masuk ke akun Anda untuk melanjutkan
            </Text>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <IconFeather name="mail" size={20} color="#9ca3af" />
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: admin@toko.com"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <IconFeather name="lock" size={20} color="#9ca3af" />
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan password"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <IconFeather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Lupa Password */}
          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
          </TouchableOpacity>

          {/* Tombol Login */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <IconFeather name="loader" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Masuk...</Text>
              </View>
            ) : (
              <View style={styles.submitContainer}>
                <IconFeather name="log-in" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Masuk</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Fitur Preview */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Fitur Unggulan</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <View
                style={[styles.featureIcon, { backgroundColor: "#dbeafe" }]}
              >
                <IconCommunity name="cash-multiple" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.featureText}>Kelola Transaksi</Text>
            </View>
            <View style={styles.featureItem}>
              <View
                style={[styles.featureIcon, { backgroundColor: "#bbf7d0" }]}
              >
                <IconCommunity
                  name="package-variant"
                  size={24}
                  color="#10b981"
                />
              </View>
              <Text style={styles.featureText}>Manajemen Stok</Text>
            </View>
            <View style={styles.featureItem}>
              <View
                style={[styles.featureIcon, { backgroundColor: "#ede9fe" }]}
              >
                <IconCommunity name="chart-line" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.featureText}>Laporan Real-time</Text>
            </View>
            <View style={styles.featureItem}>
              <View
                style={[styles.featureIcon, { backgroundColor: "#fed7d7" }]}
              >
                <IconFeather name="users" size={24} color="#f56565" />
              </View>
              <Text style={styles.featureText}>Multi User</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Toko Elektronik Maju. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  appSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "500",
  },
  authCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 24,
    elevation: 6,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    height: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    marginLeft: 12,
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  featuresContainer: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureItem: {
    width: "47%",
    alignItems: "center",
    marginBottom: 16,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default Login;
