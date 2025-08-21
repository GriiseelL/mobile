import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";

const { width } = Dimensions.get("window");

const AccountScreen = () => {
  const [user, setUser] = useState({
    name: "Grizelda Agnurindra",
    email: "grizelda@example.com",
    phone: "+62 812-3456-7890",
    photo: "https://i.pravatar.cc/300",
    bio: "Mobile Developer & UI/UX Enthusiast",
    location: "Surabaya, Indonesia",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
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
  }, []);

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
    if (!validateForm()) {
      Alert.alert("Error", "Mohon periksa kembali data yang diisi");
      return;
    }

    setIsLoading(true);

    // Simulasi API call
    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
      Alert.alert("Berhasil! 🎉", "Profil berhasil diperbarui", [
        { text: "OK", style: "default" },
      ]);
    }, 1500);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Header dengan Gradient */}
      <LinearGradient
        colors={["#4f46e5", "#7c3aed", "#3b82f6"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Icon name={isEditing ? "close" : "edit"} size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

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
            <LinearGradient
              colors={["rgba(79, 70, 229, 0.8)", "rgba(59, 130, 246, 0.8)"]}
              style={styles.avatarOverlay}
            />
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
          <Text style={styles.userBio}>{user.bio}</Text>
          <View style={styles.locationContainer}>
            <Icon name="location-on" size={16} color="#6b7280" />
            <Text style={styles.userLocation}>{user.location}</Text>
          </View>
        </Animated.View>

        {/* Stats Card */}
        <Animated.View
          style={[
            styles.statsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Transaksi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Review</Text>
          </View>
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

          <InputField
            label="Bio"
            value={user.bio}
            onChangeText={(text) => setUser({ ...user, bio: text })}
            icon="info"
          />

          <InputField
            label="Lokasi"
            value={user.location}
            onChangeText={(text) => setUser({ ...user, location: text })}
            icon="location-on"
          />
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
              onPress={() => {
                setIsEditing(false);
                setValidationErrors({});
              }}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#4f46e5", "#3b82f6"]}
                style={styles.saveButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="check" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </>
                )}
              </LinearGradient>
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

  header: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    paddingTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 0.5,
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
    paddingBottom: 100,
  },

  avatarWrapper: {
    alignItems: "center",
    marginTop: -60,
    marginBottom: 30,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: "#fff",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 70,
    opacity: 0.1,
  },
  editPhoto: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#4f46e5",
    borderRadius: 25,
    padding: 12,
    elevation: 6,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 15,
    textAlign: "center",
  },
  userBio: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 5,
    textAlign: "center",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  userLocation: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
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
