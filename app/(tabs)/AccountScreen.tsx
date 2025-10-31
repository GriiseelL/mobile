import api from "@/src/api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router"; // ⬅️ tambahin ini
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

const AccountScreen = ({ userId = null, navigation }) => {
  const [user, setUser] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    photo: null,
    bio: "",
    location: "",
    role_id: null,
  });

  const [originalUser, setOriginalUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Load user data on component mount
  useEffect(() => {
    loadUserProfile();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadUserProfile = async () => {
    try {
      setIsLoadingProfile(true);

      // Ambil data user dari AsyncStorage
      const authUser = await AsyncStorage.getItem("user");
      if (!authUser) {
        Alert.alert("Error", "User tidak ditemukan");
        return;
      }

      const parsedUser = JSON.parse(authUser);
      const userUuid = parsedUser.uuid; // pakai UUID, bukan ID

      console.log("🔎 Load profile UUID:", userUuid);

      // Request profile dari backend
      const response = await api.get(`/api/master/users/${userUuid}`);

      if (response.data && response.data.user) {
        const userData = response.data.user;

        const transformedUser = {
          id: userData.uuid, // simpan UUID di sini
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          photo: userData.photo
            ? `${api.defaults.baseURL}/storage/${userData.photo}`
            : "https://i.pravatar.cc/300",
          role_id: userData.role_id,
        };

        setUser(transformedUser);
        setOriginalUser({ ...transformedUser });
      }
    } catch (error) {
      console.error("Error loading profile:", error?.response || error);
      Alert.alert("Error", "Gagal memuat profil pengguna");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar dari aplikasi?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Ya, Logout",
          style: "destructive",
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Optional: panggil API logout
      try {
        await api.post("/api/auth/logout");
      } catch (apiError) {
        console.log("Logout API error (ignored):", apiError);
      }

      // Hapus semua data dari storage
      await AsyncStorage.multiRemove([
        "user",
        "token",
        "userToken",
        "authToken",
        "isLoggedIn",
      ]);

      // Reset state user
      setUser({
        id: null,
        name: "",
        email: "",
        phone: "",
        photo: null,
        bio: "",
        location: "",
        role_id: null,
      });

      // Redirect ke halaman login
      router.replace("/Login");

      Alert.alert("Berhasil", "Anda telah logout dari aplikasi");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Terjadi kesalahan saat logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!user.name.trim()) {
      errors.name = "Nama lengkap wajib diisi";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      errors.email = "Format email tidak valid";
    }

    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    if (!phoneRegex.test(user.phone.replace(/[-\s]/g, ""))) {
      errors.phone = "Format nomor telepon tidak valid";
    } 

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const formData = new FormData();

      // selalu kirim data wajib
      formData.append("name", user.name || "");
      formData.append("email", user.email || "");
      formData.append("phone", user.phone || "");
      if (user.role_id) {
        formData.append("role_id", user.role_id.toString());
      }

      // kalau ada foto baru (hasil dari kamera/galeri), kirim
      if (user.photo && user.photo.startsWith("file://")) {
        formData.append("photo", {
          uri: user.photo,
          type: "image/jpeg",
          name: `photo_${Date.now()}.jpg`,
        });
      }

      const response = await api.post(
        `/api/master/users/${user.id}?_method=PUT`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.success) {
        const updatedUser = response.data.user;
        setUser({
          ...user,
          photo: updatedUser.photo
            ? `${api.defaults.baseURL}/storage/${updatedUser.photo}`
            : user.photo,
        });
        setOriginalUser({ ...user });
        setIsEditing(false);
        setValidationErrors({});
        Alert.alert("Berhasil 🎉", "Profil berhasil diperbarui");
      }
    } catch (error) {
      console.error("Error updating profile:", error?.response || error);
      let msg = "Gagal memperbarui profil";
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        msg = "Mohon periksa kembali data yang diisi";
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelection = (source) => {
    setShowPhotoModal(false);

    const options = {
      mediaType: "photo",
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    const callback = (response) => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        setUser({ ...user, photo: response.assets[0].uri });
      }
    };

    if (source === "camera") {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    if (originalUser) {
      setUser({ ...originalUser });
    }
    setIsEditing(false);
    setValidationErrors({});
  };

  const PhotoModal = () => (
    <Modal
      visible={showPhotoModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPhotoModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Pilih Foto Profil</Text>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => handlePhotoSelection("camera")}
          >
            <Icon name="photo-camera" size={24} color="#4f46e5" />
            <Text style={styles.modalOptionText}>Ambil Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => handlePhotoSelection("gallery")}
          >
            <Icon name="photo-library" size={24} color="#4f46e5" />
            <Text style={styles.modalOptionText}>Pilih dari Galeri</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalOption, styles.modalCancel]}
            onPress={() => setShowPhotoModal(false)}
          >
            <Icon name="close" size={24} color="#ef4444" />
            <Text style={[styles.modalOptionText, { color: "#ef4444" }]}>
              Batal
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const InputField = ({
    label,
    value,
    onChangeText,
    keyboardType,
    icon,
    error,
  }) => (
    <Animated.View
      style={[
        styles.field,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.labelContainer}>
        <Icon name={icon} size={18} color="#6b7280" />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          !isEditing && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={isEditing}
        selectTextOnFocus={isEditing}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </Animated.View>
  );

  // Show loading indicator while fetching profile
  if (isLoadingProfile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Header dengan Background */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="logout" size={20} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Icon name={isEditing ? "close" : "edit"} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto Profil dengan Animasi */}
        <Animated.View
          style={[
            styles.avatarWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.photo }} style={styles.avatar} />
            <View style={styles.avatarOverlay} />
            {isEditing && (
              <TouchableOpacity
                style={styles.editPhoto}
                onPress={() => setShowPhotoModal(true)}
              >
                <Icon name="photo-camera" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.userName}>{user.name}</Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>

          <InputField
            label="Nama Lengkap"
            value={user.name}
            onChangeText={(text) => setUser({ ...user, name: text })}
            icon="person"
            error={validationErrors.name}
          />

          <InputField
            label="Email"
            value={user.email}
            onChangeText={(text) => setUser({ ...user, email: text })}
            keyboardType="email-address"
            icon="email"
            error={validationErrors.email}
          />

          <InputField
            label="Nomor Telepon"
            value={user.phone}
            onChangeText={(text) => setUser({ ...user, phone: text })}
            keyboardType="phone-pad"
            icon="phone"
            error={validationErrors.phone}
          />
        </Animated.View>

        {/* Logout Card - Always visible */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Pengaturan Akun</Text>

          <TouchableOpacity
            style={styles.logoutCard}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.logoutCardContent}>
              <View style={styles.logoutIconContainer}>
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Icon name="logout" size={24} color="#ef4444" />
                )}
              </View>
              <View style={styles.logoutTextContainer}>
                <Text style={styles.logoutTitle}>
                  {isLoggingOut ? "Sedang Logout..." : "Keluar dari Akun"}
                </Text>
                <Text style={styles.logoutSubtitle}>
                  Anda akan diarahkan ke halaman login
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Action Buttons */}
        {isEditing && (
          <Animated.View
            style={[
              styles.actionButtons,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              <View style={styles.saveButtonGradient}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="check" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      <PhotoModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },

  header: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    paddingTop: 45,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 6,
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  logoutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  editButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },

  avatarWrapper: {
    alignItems: "center",
    marginTop: -15,
    marginBottom: 25,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: "rgba(79, 70, 229, 0.1)",
  },
  editPhoto: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#4f46e5",
    borderRadius: 20,
    padding: 10,
    elevation: 4,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },

  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 12,
    textAlign: "center",
  },

  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4f46e5",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    height: "100%",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
  },

  // Logout Card Styles
  logoutCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#fee2e2",
    backgroundColor: "#fefefe",
    overflow: "hidden",
  },
  logoutCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  logoutIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  logoutTextContainer: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  logoutSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },

  field: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#f9fafb",
    color: "#111827",
    fontWeight: "400",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  inputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  actionButtons: {
    flexDirection: "row",
    gap: 15,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    borderRadius: 15,
    elevation: 4,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4f46e5",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 300,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalCancel: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 20,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    fontWeight: "500",
  },
});

export default AccountScreen;
