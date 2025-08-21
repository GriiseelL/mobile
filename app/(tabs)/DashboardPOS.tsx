import React, { useState } from "react";
import { router } from "expo-router";
import {
  Alert,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../src/api/api";
// Import vector icons - pilih salah satu sesuai library yang digunakan
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect } from "react";
import IconAntDesign from "react-native-vector-icons/AntDesign";
import IconFeather from "react-native-vector-icons/Feather";
import IconCommunity from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/MaterialIcons";
// Import image picker
import {
  launchCamera,
  launchImageLibrary,
  MediaType,
} from "react-native-image-picker";

const DashboardPOS = ({ navigation }) => {
  const [addProductVisible, setAddProductVisible] = useState(false);
  const [imageSelectVisible, setImageSelectVisible] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    image: "",
  });

  // Predefined categories dengan vector icons
  // const categories = [
  //   {
  //     id: 1,
  //     name: "Smartphone",
  //     iconFamily: "IconCommunity",
  //     iconName: "cellphone",
  //   },
  //   { id: 2, name: "Laptop", iconFamily: "Icon", iconName: "laptop" },
  //   {
  //     id: 3,
  //     name: "TV & Audio",
  //     iconFamily: "IconCommunity",
  //     iconName: "television",
  //   },
  //   {
  //     id: 4,
  //     name: "Gaming",
  //     iconFamily: "IconCommunity",
  //     iconName: "gamepad-variant",
  //   },
  //   {
  //     id: 5,
  //     name: "Aksesori",
  //     iconFamily: "IconCommunity",
  //     iconName: "power-plug",
  //   },
  //   { id: 6, name: "Smart Home", iconFamily: "Icon", iconName: "home" },
  // ];

  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchTransactions();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Token tidak ditemukan");

      // const response = await axios.get(
      //   "https://8ad6031945f5.ngrok-free.app/api/product/category",
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   }
      // );
      const response = await api.get("/api/product/category");

      const data = response.data.data.map((item) => ({
        id: item.id,
        name: item.name,
        iconFamily: item.icon_family || "IconCommunity",
        iconName: item.icon_name || "tag",
      }));

      setCategories(data);
    } catch (error) {
      console.error("Gagal ambil kategori:", error);
      Alert.alert("Error", "Gagal mengambil data kategori");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/product/items");

      // Asumsi response.data.data adalah array produk
      setTotalProducts(response.data.data.length);
    } catch (error) {
      console.error("Gagal ambil produk:", error);
      Alert.alert("Error", "Gagal mengambil data produk");
    }
  };

  const [totalTransactions, setTotalTransactions] = useState(0);
  const [todayTransactionCount, setTodayTransactionCount] = useState(0);
  const [monthlyTransactionCount, setMonthlyTransactionCount] = useState(0);

  // const fetchTransactions = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem("token");
  //     if (!token) throw new Error("Token tidak ditemukan");

  //     // const response = await api.get("/api/transaction")({
  //     //   headers: {
  //     //     Authorization: `Bearer ${token}`,
  //     //   },
  //     // });

  //     const response = await api.get("/api/transaction");

  //     const transactions = response.data.data;
  //     const today = new Date().toISOString().slice(0, 10); // format: yyyy-mm-dd

  //     let todayRevenue = 0;
  //     let todayTransactionCount = 0;

  //     transactions.forEach((trx) => {
  //       const trxDate = trx.created_at?.slice(0, 10);
  //       if (trxDate === today) {
  //         todayRevenue += parseInt(trx.total_price || 0);
  //         todayTransactionCount++;
  //       }
  //     });

  //     setTotalRevenue(todayRevenue);
  //     setTotalTransactions(todayTransactionCount); // ← tambahkan ini
  //   } catch (error) {
  //     console.error("Gagal ambil transaksi:", error);
  //     Alert.alert("Error", "Gagal mengambil data transaksi");
  //   }
  // };

  // Demo images for products

  const fetchTransactions = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log(token);

      if (!token) throw new Error("Token tidak ditemukan");

      // Ambil transaksi dan detail sekaligus
      const response = await api.get("/api/transaction");
      const transactions = response.data.data || [];
      // console.log(transactions);

      var tmp_total = 0;

      // transactions.forEach((trx) => {
      //     tmp_total = tmp_total + trx.total;

      //   });
      //   console.log(tmp_total);
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-11
      const currentYear = now.getFullYear();
      const today = new Date().toISOString().split("T")[0];

       let todayTransactionCount = 0;
      let monthlyTransactionCount = 0;

      transactions.forEach((trx) => {
        tmp_total = tmp_total + trx.total;

        const trxDate = new Date(trx.created_at);
        const trxDateOnly = trxDate.toISOString().split("T")[0];

        // Hitung transaksi hari ini
        if (trxDateOnly === today) {
          todayTransactionCount++;
        }

        // Hitung transaksi bulan ini
        const trxMonth = trxDate.getMonth();
        const trxYear = trxDate.getFullYear();

        if (trxMonth === currentMonth && trxYear === currentYear) {
          monthlyTransactionCount++;
        }
      });

      console.log("Jumlah transaksi hari ini:", todayTransactionCount);
      console.log("Jumlah transaksi bulan ini:", monthlyTransactionCount);

      setTotalTransactions(tmp_total);
      setTodayTransactionCount(todayTransactionCount);
      setMonthlyTransactionCount(monthlyTransactionCount);
      // setTotalTransactions(todayTransactionCount);
      // setGrandTotalRevenue(grandTotal);
    } catch (error) {
      console.error("Gagal ambil transaksi:", error);
      Alert.alert("Error", "Gagal ambil data transaksi");
    }
  };

  const demoImages = [
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop",
  ];

  // Helper function untuk render icon
  const renderIcon = (iconFamily, iconName, size = 20, color = "#666") => {
    switch (iconFamily) {
      case "Icon":
        return <Icon name={iconName} size={size} color={color} />;
      case "IconCommunity":
        return <IconCommunity name={iconName} size={size} color={color} />;
      case "IconFeather":
        return <IconFeather name={iconName} size={size} color={color} />;
      case "IconAntDesign":
        return <IconAntDesign name={iconName} size={size} color={color} />;
      default:
        return <Icon name="help" size={size} color={color} />;
    }
  };

  const openAddProductModal = () => {
    setAddProductVisible(true);
  };

  const closeAddProductModal = () => {
    setAddProductVisible(false);
    setNewProduct({
      name: "",
      category: "",
      price: "",
      stock: "",
      image: "",
    });
  };

  const selectCategory = (categoryName) => {
    setNewProduct({ ...newProduct, category: categoryName });
  };

  const selectImage = (imageUrl) => {
    setNewProduct({ ...newProduct, image: imageUrl });
    setImageSelectVisible(false);
  };

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs camera permission to take photos",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Open image picker options
  const openImagePicker = () => {
    Alert.alert(
      "Pilih Foto",
      "Pilih sumber foto untuk produk",
      [
        { text: "Galeri", onPress: openGallery },
        { text: "Kamera", onPress: openCamera },
        // { text: "Demo Images", onPress: () => setImageSelectVisible(true) },
        { text: "Batal", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  // Open gallery
  const openGallery = () => {
    const options = {
      mediaType: "photo" as MediaType,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setNewProduct({ ...newProduct, image: imageUri });
        }
      }
    });
  };

  // Open camera
  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert("Error", "Camera permission denied");
      return;
    }

    const options = {
      mediaType: "photo" as MediaType,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    launchCamera(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setNewProduct({ ...newProduct, image: imageUri });
        }
      }
    });
  };

  const handleAddProduct = async () => {
    const { name, category, price, stock, image } = newProduct;

    if (!name || !category || !price || !stock || !image) {
      Alert.alert("Error", "Semua kolom dan foto harus diisi!");
      return;
    }

    // Cari ID dari nama kategori
    const selectedCategory = categories.find((cat) => cat.name === category);
    if (!selectedCategory) {
      Alert.alert("Error", "Kategori tidak valid!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Token tidak ditemukan");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("id_category", selectedCategory.id); // ← pakai ID
      formData.append("price", price.toString());
      formData.append("stock", stock.toString());

      // Cek apakah image adalah file lokal
      if (image.startsWith("http")) {
        Alert.alert("Error", "Gambar harus dipilih dari galeri atau kamera!");
        return;
      } else {
        const fileName = image.split("/").pop();
        const fileExt = fileName?.split(".").pop().toLowerCase();

        const mimeType =
          fileExt === "jpg" || fileExt === "jpeg"
            ? "image/jpeg"
            : fileExt === "png"
            ? "image/png"
            : "application/octet-stream";

        formData.append("photo", {
          uri: image,
          name: fileName || "photo.jpg",
          type: mimeType,
        });
      }

      const response = await axios.post(
        "https://ef3e95d1c545.ngrok-free.app/api/product/items/store",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Produk berhasil ditambahkan:", response.data);

      Alert.alert("Sukses", "Produk berhasil ditambahkan!", [
        {
          text: "OK",
          onPress: () => {
            closeAddProductModal?.();
            navigation?.navigate("ProductManagement");
          },
        },
      ]);
    } catch (error) {
      console.error("Gagal tambah produk:", error?.response?.data || error);

      Alert.alert(
        "Gagal tambah produk",
        error?.response?.data?.message ||
          error?.message ||
          "Terjadi kesalahan saat menambahkan produk"
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <Text style={styles.title}>POS System</Text>
          <Text style={styles.subtitle}>Toko Elektronik Maju</Text>
        </View>
      </View>

      {/* Welcome */}
      <View style={styles.welcomeCard}>
        <View>
          <View style={styles.welcomeTitleRow}>
            <IconFeather name="user" size={20} color="#3b82f6" />
            <Text style={styles.welcomeTitle}>Selamat Datang!</Text>
          </View>
          <Text style={styles.welcomeSub}>
            Admin, hari ini tanggal 24 Januari 2025
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsIconBox}>
          <Icon name="settings" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Statistik Kartu */}
      <View style={styles.grid}>
        <View style={[styles.card, { backgroundColor: "#3b82f6" }]}>
          <View style={styles.cardHeader}>
            <IconCommunity name="cash-multiple" size={24} color="#fff" />
            <Text style={styles.cardTitle}>Pendapatan</Text>
          </View>
          <Text style={styles.cardSub}>Semua</Text>
          <Text style={styles.cardValue}>
            Rp {totalTransactions.toLocaleString("id-ID")}
          </Text>
          <View style={styles.cardFooterRow}>
            <IconFeather name="trending-up" size={12} color="#d1fae5" />
            <Text style={styles.cardFooter}>+12%</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: "#10b981" }]}>
          <View style={styles.cardHeader}>
            <IconCommunity name="receipt" size={24} color="#fff" />
            <Text style={styles.cardTitle}>Transaksi</Text>
          </View>
          <Text style={styles.cardSub}>Hari ini</Text>
          <Text style={styles.cardValue}>{todayTransactionCount}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#8b5cf6" }]}>
          <View style={styles.cardHeader}>
            <IconCommunity name="package-variant" size={24} color="#fff" />
            <Text style={styles.cardTitle}>Total Produk</Text>
          </View>
          <Text style={styles.cardValue}>{totalProducts}</Text>
          <Text style={styles.cardSub}>{categories.length} kategori</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#f97316" }]}>
          <View style={styles.cardHeader}>
            <IconFeather name="users" size={24} color="#fff" />
            <Text style={styles.cardTitle}>Pelanggan</Text>
          </View>
          <Text style={styles.cardValue}>{monthlyTransactionCount}</Text>
          <Text style={styles.cardSub}>Bulan ini</Text>
        </View>
      </View>

      {/* Aksi Cepat */}
      <View style={styles.quickActionContainer}>
        <View style={styles.sectionTitleRow}>
          <IconFeather name="zap" size={20} color="#3b82f6" />
          <Text style={styles.quickActionTitle}>Aksi Cepat</Text>
        </View>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: "#dbeafe" }]}
            onPress={openAddProductModal}
          >
            <IconAntDesign name="plus" size={24} color="#3b82f6" />
            <Text style={styles.quickText}>Tambah{"\n"}Produk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: "#bbf7d0" }]}
            onPress={() => router.push("/CashierScreen")}

          >
            <IconCommunity name="cart-plus" size={24} color="#10b981" />
            <Text style={styles.quickText}>Transaksi{"\n"}Baru</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: "#ede9fe" }]}
            onPress={() => router.push("/TransactionHistory")}
          >
            <IconCommunity name="chart-line" size={24} color="#8b5cf6" />
            <Text style={styles.quickText}>Lihat{"\n"}Laporan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickButton, { backgroundColor: "#fbcfe8" }]}
          >
            <IconFeather name="users" size={24} color="#ec4899" />
            <Text style={styles.quickText}>Kelola{"\n"}Staff</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Navigasi */}
      <View style={styles.menuContainer}>
        <View style={styles.sectionTitleRow}>
          <IconCommunity name="view-grid" size={20} color="#3b82f6" />
          <Text style={styles.menuTitle}>Menu Utama</Text>
        </View>
        <View style={styles.menuGrid}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation?.navigate("ProductManagement")}
          >
            <IconCommunity name="package-variant" size={32} color="#3b82f6" />
            <Text style={styles.menuText}>Kelola Produk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation?.navigate("CategoryManagement")}
          >
            <IconCommunity name="tag-multiple" size={32} color="#10b981" />
            <Text style={styles.menuText}>Kategori</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation?.navigate("Kasir")}
          >
            <IconCommunity name="cash-register" size={32} color="#f97316" />
            <Text style={styles.menuText}>Kasir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation?.navigate("TransactionHistory")}
          >
            <IconFeather name="clipboard" size={32} color="#8b5cf6" />
            <Text style={styles.menuText}>Riwayat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addProductVisible}
        onRequestClose={closeAddProductModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header - Fixed */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <IconAntDesign name="plus" size={20} color="#3b82f6" />
                <Text style={styles.modalTitle}>Tambah Produk Baru</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeAddProductModal}
              >
                <IconAntDesign name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Body - Scrollable */}
            <View style={styles.modalBody}>
              <ScrollView
                style={styles.formScrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContentContainer}
              >
                {/* Product Image */}
                <Text style={styles.inputLabel}>Foto Produk</Text>
                <TouchableOpacity
                  style={styles.imageUploadContainer}
                  onPress={openImagePicker}
                >
                  {newProduct.image ? (
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: newProduct.image }}
                        style={styles.uploadedImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.changeImageButton}
                        onPress={openImagePicker}
                      >
                        <IconFeather name="edit-2" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <IconFeather name="camera" size={32} color="#9ca3af" />
                      <Text style={styles.imagePlaceholderText}>
                        Tap untuk pilih foto
                      </Text>
                      <Text style={styles.imagePlaceholderSubText}>
                        Galeri • Kamera • Demo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Product Name */}
                <Text style={styles.inputLabel}>Nama Produk</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: iPhone 15 Pro Max"
                  value={newProduct.name}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, name: text })
                  }
                />

                {/* Category Selection */}
                <Text style={styles.inputLabel}>Kategori</Text>
                <View style={styles.categoryContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryButton,
                          newProduct.category === category.name &&
                            styles.categoryButtonSelected,
                        ]}
                        onPress={() => selectCategory(category.name)}
                      >
                        {renderIcon(
                          category.iconFamily,
                          category.iconName,
                          16,
                          newProduct.category === category.name
                            ? "#fff"
                            : "#6b7280"
                        )}
                        <Text
                          style={[
                            styles.categoryText,
                            newProduct.category === category.name &&
                              styles.categoryTextSelected,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Price */}
                <Text style={styles.inputLabel}>Harga (Rp)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 15000000"
                  keyboardType="numeric"
                  value={newProduct.price}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, price: text })
                  }
                />

                {/* Stock */}
                <Text style={styles.inputLabel}>Stok</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: 10"
                  keyboardType="numeric"
                  value={newProduct.stock}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, stock: text })
                  }
                />

                {/* Add Button */}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddProduct}
                >
                  <IconAntDesign name="plus" size={16} color="#fff" />
                  <Text style={styles.addButtonText}>Tambah Produk</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageSelectVisible}
        onRequestClose={() => setImageSelectVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imageModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <IconFeather name="image" size={20} color="#3b82f6" />
                <Text style={styles.modalTitle}>Pilih Demo Foto</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageSelectVisible(false)}
              >
                <IconAntDesign name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.imageGridContainer}>
              <View style={styles.demoImageHeader}>
                <Text style={styles.demoImageHeaderText}>
                  Atau pilih foto demo produk:
                </Text>
              </View>

              <View style={styles.imageGrid}>
                {demoImages.map((imageUrl, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageGridItem}
                    onPress={() => selectImage(imageUrl)}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.gridImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom URL Input */}
              <View style={styles.customUrlContainer}>
                <Text style={styles.inputLabel}>Atau masukkan URL gambar:</Text>
                <TextInput
                  style={styles.urlInput}
                  placeholder="https://example.com/image.jpg"
                  value={newProduct.image}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, image: text })
                  }
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.useUrlButton}
                  onPress={() => {
                    if (newProduct.image.trim()) {
                      setImageSelectVisible(false);
                    }
                  }}
                >
                  <Text style={styles.useUrlButtonText}>Gunakan URL</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "transparent",
    paddingTop: 25,
  },
  headerGradient: {
    backgroundColor: "#3b82f6",
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 24,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#c7d2fe",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  welcomeCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  welcomeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 8,
  },
  welcomeSub: {
    color: "#6b7280",
    fontSize: 12,
  },
  settingsIconBox: {
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 50,
    elevation: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginHorizontal: 10,
  },
  card: {
    width: "45%",
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  cardSub: {
    color: "#f3f4f6",
    fontSize: 12,
    marginTop: 2,
  },
  cardValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 8,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardFooter: {
    marginLeft: 4,
    color: "#d1fae5",
    fontSize: 12,
  },
  quickActionContainer: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 8,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickButton: {
    width: "47%",
    height: 90,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  quickText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    color: "#1f2937",
    marginTop: 8,
  },
  menuContainer: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    marginBottom: 30,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 8,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuItem: {
    width: "47%",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginTop: 8,
  },

  // Modal Styles - FIXED
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    height: "85%",
    borderRadius: 20,
    overflow: "hidden",
  },
  imageModalContent: {
    backgroundColor: "#fff",
    width: "100%",
    height: "80%",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fff",
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalBody: {
    flex: 1,
    backgroundColor: "#fff",
  },
  formScrollContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },

  // Image Upload Styles
  imageUploadContainer: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 12,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f9fafb",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  changeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 8,
  },
  imagePlaceholderSubText: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },

  // Category Selection Styles
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryButtonSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  categoryText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginLeft: 6,
  },
  categoryTextSelected: {
    color: "#fff",
  },

  // Add Button
  addButton: {
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  // Image Selection Grid
  imageGridContainer: {
    flex: 1,
    padding: 20,
  },
  demoImageHeader: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  demoImageHeaderText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  imageGridItem: {
    width: "48%",
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },

  // Custom URL Input
  customUrlContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  useUrlButton: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  useUrlButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default DashboardPOS;
