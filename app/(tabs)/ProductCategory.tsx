import api from "@/src/api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
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
import {
  launchCamera,
  launchImageLibrary,
  MediaType,
} from "react-native-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import Icon from "react-native-vector-icons/MaterialIcons";

const ProductCategory = ({ navigation }) => {
  // States for categories
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // States for products
  const [products, setProducts] = useState([]);

  // UI states
  const [currentView, setCurrentView] = useState("categories"); // 'categories' or 'products'
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Semua");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  // Form states
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "category",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    image: "",
    id_category: null,
  });

  // Available icons for categories
  const availableIcons = [
    "smartphone",
    "laptop",
    "tv",
    "sports-esports",
    "cable",
    "home",
    "headphones",
    "camera",
    "watch",
    "tablet",
    "computer",
    "phone-android",
    "videogame-asset",
    "speaker",
    "memory",
    "keyboard",
    "mouse",
    "monitor",
  ];

useFocusEffect(
  useCallback(() => {
    // ambil ulang data kategori
    fetchCategories();

    // kalau lagi di tab produk, ambil ulang produk
    if (currentView === "products") {
      fetchProducts();
    }
  }, [currentView])
);


  // Category Icon Management
  const saveCategoryIcon = async (categoryId, iconName) => {
    try {
      const storedIcons =
        JSON.parse(await AsyncStorage.getItem("categoryIcons")) || {};
      storedIcons[categoryId] = iconName;
      await AsyncStorage.setItem("categoryIcons", JSON.stringify(storedIcons));
    } catch (error) {
      console.error("Error saving icon:", error);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.get("/api/product/category", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const storedIcons =
        JSON.parse(await AsyncStorage.getItem("categoryIcons")) || {};

      const data = response.data.data.map((cat) => ({
        ...cat,
        count: cat.products_count ?? 0,
        icon: storedIcons[cat.id] || cat.icon || "category",
      }));

      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Gagal mengambil data kategori");
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    try {
      const res = await api.get("api/product/items");
      console.log("Raw API Response:", res.data);

      const productsArray = Array.isArray(res.data.data) ? res.data.data : [];

      const updatedProducts = productsArray.map((product) => {
        let imageUrl = product.photo;

        if (imageUrl && !imageUrl.startsWith("http")) {
          const cleanImagePath = imageUrl.startsWith("/")
            ? imageUrl.substring(1)
            : imageUrl;
          imageUrl = `${api.defaults.baseURL}/storage/${cleanImagePath}`;
        } else if (!imageUrl) {
          imageUrl = "https://via.placeholder.com/300x300.png?text=No+Image";
        }

        return {
          ...product,
          image: imageUrl,
          name: product.name || "",
          category: product.category?.name || product.category || "",
          price: Number(product.price) || 0,
          stock: Number(product.stock) || 0,
        };
      });

      setProducts(updatedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    }
  };

  // Category CRUD Operations
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      Alert.alert("Error", "Nama kategori harus diisi!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.post(
        "/api/product/category/store",
        {
          name: newCategory.name.trim(),
          icon: newCategory.icon,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const addedCategory = response.data.data;
      const completeCategory = {
        ...addedCategory,
        name: newCategory.name.trim(),
        icon: newCategory.icon,
        count: 0,
        products_count: 0,
      };

      await saveCategoryIcon(completeCategory.id, completeCategory.icon);

      setCategories((prev) => [...prev, completeCategory]);
      setFilteredCategories((prev) => [...prev, completeCategory]);
      setSearchQuery("");
      setNewCategory({ name: "", icon: "category" });
      setModalVisible(false);

      Alert.alert("Sukses", "Kategori berhasil ditambahkan!");
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", "Gagal menambahkan kategori");
    }
  };

  const handleEditCategory = async () => {
    if (!newCategory.name.trim()) {
      Alert.alert("Error", "Nama kategori harus diisi!");
      return;
    }

    const existingCategory = categories.find(
      (cat) =>
        cat.name.toLowerCase() === newCategory.name.toLowerCase() &&
        cat.id !== editingCategory.id
    );

    if (existingCategory) {
      Alert.alert("Error", "Kategori dengan nama ini sudah ada!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");

      await api.put(
        `/api/product/category/${editingCategory.id}`,
        {
          name: newCategory.name.trim(),
          icon: newCategory.icon,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await saveCategoryIcon(editingCategory.id, newCategory.icon);

      const updatedCategories = categories.map((category) =>
        category.id === editingCategory.id
          ? {
              ...category,
              name: newCategory.name.trim(),
              icon: newCategory.icon,
            }
          : category
      );

      setCategories(updatedCategories);
      setFilteredCategories(updatedCategories);
      setNewCategory({ name: "", icon: "category" });
      setEditModalVisible(false);
      setEditingCategory(null);
      Alert.alert("Sukses", "Kategori berhasil diperbarui!");
    } catch (error) {
      console.error("Error editing category:", error);
      Alert.alert("Error", "Gagal memperbarui kategori");
    }
  };

  const handleDeleteCategory = async (id) => {
    const categoryToDelete = categories.find((cat) => cat.id === id);

    if (categoryToDelete.count > 0) {
      Alert.alert(
        "Tidak dapat menghapus",
        `Kategori "${categoryToDelete.name}" masih memiliki ${categoryToDelete.count} produk. Hapus semua produk terlebih dahulu.`,
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus kategori "${categoryToDelete.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await api.delete(`/api/product/category/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              setCategories((prev) => prev.filter((cat) => cat.id !== id));
              setFilteredCategories((prev) =>
                prev.filter((cat) => cat.id !== id)
              );

              Alert.alert("Sukses", "Kategori berhasil dihapus");
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert("Error", "Gagal menghapus kategori");
            }
          },
        },
      ]
    );
  };

  // Product CRUD Operations
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

  const imagePickerOptions = {
    mediaType: "photo" as MediaType,
    includeBase64: false,
    maxHeight: 2000,
    maxWidth: 2000,
    quality: 0.8,
  };

  const pickImage = () => {
    launchImageLibrary(imagePickerOptions, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        setNewProduct({ ...newProduct, image: imageUri });
      }
    });
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        "Permission Denied",
        "Camera permission is required to take photos"
      );
      return;
    }

    launchCamera(imagePickerOptions, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        setNewProduct({ ...newProduct, image: imageUri });
      }
    });
  };

  const showImagePicker = () => {
    Alert.alert("Pilih Foto Produk", "Pilih sumber foto untuk produk", [
      { text: "Kamera", onPress: takePhoto },
      { text: "Galeri", onPress: pickImage },
      { text: "Batal", style: "cancel" },
    ]);
  };

  const handleAddProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.price ||
      !newProduct.stock ||
      !newProduct.id_category
    ) {
      Alert.alert("Error", "Semua field termasuk kategori harus diisi!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newProduct.name);
      formData.append("price", newProduct.price.toString());
      formData.append("stock", newProduct.stock.toString());
      formData.append("id_category", newProduct.id_category.toString());

      if (newProduct.image) {
        const filename = newProduct.image.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("photo", {
          uri: newProduct.image,
          name: filename,
          type,
        });
      }

      const response = await api.post("api/product/items/store", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        await fetchProducts();
        setNewProduct({
          name: "",
          price: "",
          stock: "",
          image: "",
          id_category: null,
        });
        setModalVisible(false);
        Alert.alert("Sukses", "Produk berhasil ditambahkan!");
      } else {
        Alert.alert("Error", "Gagal menambahkan produk.");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert("Error", "Terjadi kesalahan saat menambahkan produk.");
    }
  };

  const handleEditProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.id_category) {
      Alert.alert("Error", "Nama, harga, dan kategori harus diisi!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();

      formData.append("name", newProduct.name);
      formData.append("id_category", newProduct.id_category.toString());
      formData.append("price", newProduct.price.toString());
      formData.append("stock", newProduct.stock.toString());

      const isNewImage =
        newProduct.image &&
        newProduct.image !== editingProduct.image &&
        (newProduct.image.startsWith("file://") ||
          newProduct.image.startsWith("content://") ||
          newProduct.image.startsWith("/data/") ||
          newProduct.image.includes("ReactNative"));

      if (isNewImage) {
        const filename = newProduct.image.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("photo", {
          uri: newProduct.image,
          type: type,
          name: filename || `photo_${Date.now()}.jpg`,
        });
      }

      const response = await api.post(
        `/api/product/product/${editingProduct.id}?_method=PUT`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const updatedProducts = products.map((product) =>
          product.id === editingProduct.id
            ? {
                ...product,
                name: newProduct.name,
                price: parseFloat(newProduct.price),
                stock: parseInt(newProduct.stock),
                id_category: newProduct.id_category,
                category:
                  categories.find((cat) => cat.id === newProduct.id_category)
                    ?.name || product.category,
                image: newProduct.image || product.image,
              }
            : product
        );

        setProducts(updatedProducts);
        setNewProduct({
          name: "",
          price: "",
          stock: "",
          image: "",
          id_category: null,
        });
        setEditModalVisible(false);
        setEditingProduct(null);

        Alert.alert("Sukses", "Produk berhasil diperbarui!");
      } else {
        Alert.alert(
          "Error",
          response.data.message || "Gagal memperbarui produk"
        );
      }
    } catch (error) {
      console.error("Error editing product:", error);
      Alert.alert("Error", "Terjadi kesalahan saat memperbarui produk.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus produk ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await api.delete(
                `/api/product/product/${productId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.data.success) {
                const updatedProducts = products.filter(
                  (product) => product.id !== productId
                );
                setProducts(updatedProducts);
                Alert.alert("Sukses", "Produk berhasil dihapus!");
              } else {
                Alert.alert("Error", "Gagal menghapus produk");
              }
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Terjadi kesalahan saat menghapus produk");
            }
          },
        },
      ]
    );
  };

  // Helper Functions
  const openEditCategoryModal = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      icon: category.icon,
    });
    setEditModalVisible(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);

    let categoryId = null;
    if (product.category) {
      const foundCategory = categories.find(
        (cat) =>
          cat.name ===
          (typeof product.category === "string"
            ? product.category
            : product.category.name)
      );
      categoryId = foundCategory ? foundCategory.id : null;
    }

    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image: product.image,
      id_category: categoryId,
    });
    setEditModalVisible(true);
  };

  const openImagePreview = (imageUri) => {
    setSelectedImage(imageUri);
    setImagePreviewVisible(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryProducts = (categoryName) => {
    return products.filter((product) => product.category === categoryName);
  };

  const getFilteredProducts = () => {
    let filtered = products;

    if (selectedCategoryFilter !== "Semua") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategoryFilter
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getFilteredCategories = () => {
    if (!searchQuery.trim()) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getAllCategories = () => {
    return ["Semua", ...categories.map((cat) => cat.name)];
  };

  const getSelectedCategoryName = () => {
    if (!newProduct.id_category) return "Pilih Kategori";
    const category = categories.find(
      (cat) => cat.id === newProduct.id_category
    );
    return category ? category.name : "Pilih Kategori";
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const filteredProducts = getFilteredProducts();
  const filteredCategoriesData = getFilteredCategories();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentView === "categories" ? "Kelola Kategori" : "Kategori Produk"}
        </Text>
        <TouchableOpacity
          style={styles.addHeaderButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === "categories" && styles.toggleButtonActive,
          ]}
          onPress={() => setCurrentView("categories")}
        >
          <Icon
            name="category"
            size={20}
            color={currentView === "categories" ? "#fff" : "#3b82f6"}
          />
          <Text
            style={[
              styles.toggleButtonText,
              currentView === "categories" && styles.toggleButtonTextActive,
            ]}
          >
            Kategori
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === "products" && styles.toggleButtonActive,
          ]}
          onPress={() => setCurrentView("products")}
        >
          <Icon
            name="inventory"
            size={20}
            color={currentView === "products" ? "#fff" : "#3b82f6"}
          />
          <Text
            style={[
              styles.toggleButtonText,
              currentView === "products" && styles.toggleButtonTextActive,
            ]}
          >
            Produk
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon
            name="search"
            size={20}
            color="#6b7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={
              currentView === "categories"
                ? "Cari kategori..."
                : "Cari produk..."
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories View */}
      {currentView === "categories" && (
        <>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{categories.length}</Text>
              <Text style={styles.summaryLabel}>Total Kategori</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {categories.reduce((sum, category) => sum + category.count, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Produk</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {categories.filter((cat) => cat.count > 0).length}
              </Text>
              <Text style={styles.summaryLabel}>Kategori Aktif</Text>
            </View>
          </View>

          {/* Add Category Button */}
          {!searchQuery.trim() && (
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={() => setModalVisible(true)}
            >
              <Icon name="add" size={24} color="#3b82f6" />
              <Text style={styles.addCategoryText}>Tambah Kategori Baru</Text>
            </TouchableOpacity>
          )}

          {/* Categories List */}
          {filteredCategoriesData.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Icon name="search-off" size={48} color="#9ca3af" />
              <Text style={styles.noResultsTitle}>
                {searchQuery.trim()
                  ? "Kategori tidak ditemukan"
                  : "Belum ada kategori"}
              </Text>
              <Text style={styles.noResultsText}>
                {searchQuery.trim()
                  ? `Tidak ada kategori yang cocok dengan "${searchQuery}"`
                  : "Tambahkan kategori baru untuk mengorganisir produk Anda"}
              </Text>
            </View>
          ) : (
            <View style={styles.categoriesContainer}>
              {filteredCategoriesData.map((category) => (
                <View key={category.id} style={styles.categoryCard}>
                  <View style={styles.categoryIconContainer}>
                    <Icon name={category.icon} size={32} color="#3b82f6" />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryProductCount}>
                      {category.products_count ?? 0} Produk
                    </Text>
                  </View>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditCategoryModal(category)}
                    >
                      <Icon name="edit" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        category.count > 0 && styles.deleteButtonDisabled,
                      ]}
                      onPress={() => handleDeleteCategory(category.id)}
                      disabled={category.count > 0}
                    >
                      <Icon
                        name="delete"
                        size={16}
                        color={category.count > 0 ? "#9ca3af" : "#fff"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Products View */}
      {currentView === "products" && (
        <>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{categories.length}</Text>
              <Text style={styles.summaryLabel}>Kategori</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{products.length}</Text>
              <Text style={styles.summaryLabel}>Total Produk</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {products.reduce((sum, product) => sum + product.stock, 0)}
              </Text>
              <Text style={styles.summaryLabel}>Total Stok</Text>
            </View>
          </View>

          {/* Categories Grid - Hide when searching */}
          {!searchQuery.trim() && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Icon name="inventory" size={20} color="#111827" />
                  <Text style={styles.sectionTitle}>Kategori</Text>
                </View>
              </View>

              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => {
                      setSelectedCategory(category);
                      setNewProduct({
                        ...newProduct,
                        id_category: category.id,
                      });
                      setModalVisible(true);
                    }}
                  >
                    <Icon
                      name={category.icon}
                      size={32}
                      color="#3b82f6"
                      style={styles.categoryIcon}
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryCount}>
                      {getCategoryProducts(category.name).length} produk
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Filter */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Icon name="filter-list" size={20} color="#111827" />
                  <Text style={styles.sectionTitle}>Filter Produk</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryFilterContainer}
                contentContainerStyle={styles.categoryFilterContent}
              >
                {getAllCategories().map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterButton,
                      selectedCategoryFilter === category &&
                        styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedCategoryFilter(category)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedCategoryFilter === category &&
                          styles.filterButtonTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Products List */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Icon name="list" size={20} color="#111827" />
              <Text style={styles.sectionTitle}>
                {searchQuery.trim() ? "Hasil Pencarian" : "Produk"}
                {!searchQuery.trim() && selectedCategoryFilter !== "Semua"
                  ? ` - ${selectedCategoryFilter}`
                  : ""}
              </Text>
            </View>
            <Text style={styles.productCount}>
              {filteredProducts.length} produk ditemukan
              {searchQuery.trim() && ` untuk "${searchQuery}"`}
            </Text>
          </View>

          {/* Show message when no products found */}
          {filteredProducts.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Icon name="search-off" size={48} color="#9ca3af" />
              <Text style={styles.noResultsTitle}>
                {searchQuery.trim()
                  ? "Produk tidak ditemukan"
                  : "Belum ada produk"}
              </Text>
              <Text style={styles.noResultsText}>
                {searchQuery.trim()
                  ? `Tidak ada produk yang cocok dengan "${searchQuery}"`
                  : "Tambahkan produk baru dengan memilih kategori"}
              </Text>
              {searchQuery.trim() && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={clearSearch}
                >
                  <Text style={styles.clearSearchText}>Hapus Pencarian</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.productsContainer}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <TouchableOpacity
                    style={styles.productImageContainer}
                    onPress={() => openImagePreview(product.image)}
                  >
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCategory}>
                      {typeof product.category === "string"
                        ? product.category
                        : product.category?.name || ""}
                    </Text>
                    <Text style={styles.productPrice}>
                      {formatPrice(product.price)}
                    </Text>
                  </View>
                  <View style={styles.productActions}>
                    <View style={styles.productStock}>
                      <Text style={styles.stockLabel}>Stok</Text>
                      <Text
                        style={[
                          styles.stockNumber,
                          { color: product.stock < 5 ? "#ef4444" : "#10b981" },
                        ]}
                      >
                        {product.stock}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openEditProductModal(product)}
                      >
                        <Icon name="edit" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteProduct(product.id)}
                      >
                        <Icon name="delete" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Add Category Modal */}
      {currentView === "categories" && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tambah Kategori Baru</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setModalVisible(false);
                    setNewCategory({ name: "", icon: "category" });
                  }}
                >
                  <Icon name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formContainer}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>Nama Kategori</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan nama kategori"
                  value={newCategory.name}
                  onChangeText={(text) =>
                    setNewCategory({ ...newCategory, name: text })
                  }
                />

                <Text style={styles.inputLabel}>Pilih Icon</Text>
                <ScrollView
                  style={styles.iconSelector}
                  contentContainerStyle={styles.iconGrid}
                  showsVerticalScrollIndicator={false}
                >
                  {availableIcons.map((iconName) => (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconOption,
                        newCategory.icon === iconName &&
                          styles.iconOptionSelected,
                      ]}
                      onPress={() =>
                        setNewCategory({ ...newCategory, icon: iconName })
                      }
                    >
                      <Icon
                        name={iconName}
                        size={24}
                        color={
                          newCategory.icon === iconName ? "#fff" : "#3b82f6"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddCategory}
                >
                  <Text style={styles.addButtonText}>Tambah Kategori</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Product Modal */}
      {currentView === "products" && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Tambah Produk{" "}
                  {selectedCategory ? `ke ${selectedCategory.name}` : ""}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setModalVisible(false);
                    setNewProduct({
                      name: "",
                      price: "",
                      stock: "",
                      image: "",
                      id_category: null,
                    });
                  }}
                >
                  <Icon name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Category Dropdown */}
                <Text style={styles.inputLabel}>Kategori *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() =>
                    setCategoryDropdownVisible(!categoryDropdownVisible)
                  }
                >
                  <Text
                    style={[
                      styles.dropdownButtonText,
                      !newProduct.id_category && styles.dropdownPlaceholder,
                    ]}
                  >
                    {getSelectedCategoryName()}
                  </Text>
                  <Icon
                    name={
                      categoryDropdownVisible
                        ? "keyboard-arrow-up"
                        : "keyboard-arrow-down"
                    }
                    size={24}
                    color="#6b7280"
                  />
                </TouchableOpacity>

                {categoryDropdownVisible && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled={true}
                    >
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.dropdownItem,
                            newProduct.id_category === category.id &&
                              styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setNewProduct({
                              ...newProduct,
                              id_category: category.id,
                            });
                            setCategoryDropdownVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              newProduct.id_category === category.id &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {category.name}
                          </Text>
                          {newProduct.id_category === category.id && (
                            <Icon name="check" size={16} color="#3b82f6" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Image Upload Section */}
                <Text style={styles.inputLabel}>Foto Produk</Text>
                <TouchableOpacity
                  style={styles.imageUploadContainer}
                  onPress={showImagePicker}
                >
                  {newProduct.image ? (
                    <Image
                      source={{ uri: newProduct.image }}
                      style={styles.uploadedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Icon name="camera-alt" size={40} color="#6b7280" />
                      <Text style={styles.imagePlaceholderText}>
                        Tap untuk tambah foto
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {newProduct.image && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setNewProduct({ ...newProduct, image: "" })}
                  >
                    <Text style={styles.removeImageText}>Hapus Foto</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.inputLabel}>Nama Produk *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan nama produk"
                  value={newProduct.name}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, name: text })
                  }
                />

                <Text style={styles.inputLabel}>Harga *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan harga"
                  keyboardType="numeric"
                  value={newProduct.price}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, price: text })
                  }
                />

                <Text style={styles.inputLabel}>Stok *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan jumlah stok"
                  keyboardType="numeric"
                  value={newProduct.stock}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, stock: text })
                  }
                />

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddProduct}
                >
                  <Text style={styles.addButtonText}>Tambah Produk</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Category Modal */}
      {currentView === "categories" && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Edit Kategori: {editingCategory?.name}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setEditModalVisible(false);
                    setEditingCategory(null);
                    setNewCategory({ name: "", icon: "category" });
                  }}
                >
                  <Icon name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formContainer}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.inputLabel}>Nama Kategori</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan nama kategori"
                  value={newCategory.name}
                  onChangeText={(text) =>
                    setNewCategory({ ...newCategory, name: text })
                  }
                />

                <Text style={styles.inputLabel}>Pilih Icon</Text>
                <ScrollView
                  style={styles.iconSelector}
                  contentContainerStyle={styles.iconGrid}
                  showsVerticalScrollIndicator={false}
                >
                  {availableIcons.map((iconName) => (
                    <TouchableOpacity
                      key={iconName}
                      style={[
                        styles.iconOption,
                        newCategory.icon === iconName &&
                          styles.iconOptionSelected,
                      ]}
                      onPress={() =>
                        setNewCategory({ ...newCategory, icon: iconName })
                      }
                    >
                      <Icon
                        name={iconName}
                        size={24}
                        color={
                          newCategory.icon === iconName ? "#fff" : "#3b82f6"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleEditCategory}
                >
                  <Text style={styles.addButtonText}>Perbarui Kategori</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Product Modal */}
      {currentView === "products" && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Edit Produk: {editingProduct?.name}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setEditModalVisible(false);
                    setEditingProduct(null);
                    setNewProduct({
                      name: "",
                      price: "",
                      stock: "",
                      image: "",
                      id_category: null,
                    });
                  }}
                >
                  <Icon name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* Category Dropdown */}
                <Text style={styles.inputLabel}>Kategori *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() =>
                    setCategoryDropdownVisible(!categoryDropdownVisible)
                  }
                >
                  <Text
                    style={[
                      styles.dropdownButtonText,
                      !newProduct.id_category && styles.dropdownPlaceholder,
                    ]}
                  >
                    {getSelectedCategoryName()}
                  </Text>
                  <Icon
                    name={
                      categoryDropdownVisible
                        ? "keyboard-arrow-up"
                        : "keyboard-arrow-down"
                    }
                    size={24}
                    color="#6b7280"
                  />
                </TouchableOpacity>

                {categoryDropdownVisible && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView
                      style={styles.dropdownScroll}
                      nestedScrollEnabled={true}
                    >
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.dropdownItem,
                            newProduct.id_category === category.id &&
                              styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setNewProduct({
                              ...newProduct,
                              id_category: category.id,
                            });
                            setCategoryDropdownVisible(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              newProduct.id_category === category.id &&
                                styles.dropdownItemTextSelected,
                            ]}
                          >
                            {category.name}
                          </Text>
                          {newProduct.id_category === category.id && (
                            <Icon name="check" size={16} color="#3b82f6" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Image Upload Section */}
                <Text style={styles.inputLabel}>Foto Produk</Text>
                <TouchableOpacity
                  style={styles.imageUploadContainer}
                  onPress={showImagePicker}
                >
                  {newProduct.image ? (
                    <Image
                      source={{ uri: newProduct.image }}
                      style={styles.uploadedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Icon name="camera-alt" size={40} color="#6b7280" />
                      <Text style={styles.imagePlaceholderText}>
                        Tap untuk tambah foto
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {newProduct.image && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setNewProduct({ ...newProduct, image: "" })}
                  >
                    <Text style={styles.removeImageText}>Hapus Foto</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.inputLabel}>Nama Produk *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan nama produk"
                  value={newProduct.name}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, name: text })
                  }
                />

                <Text style={styles.inputLabel}>Harga *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan harga"
                  keyboardType="numeric"
                  value={newProduct.price}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, price: text })
                  }
                />

                <Text style={styles.inputLabel}>Stok *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan jumlah stok"
                  keyboardType="numeric"
                  value={newProduct.stock}
                  onChangeText={(text) =>
                    setNewProduct({ ...newProduct, stock: text })
                  }
                />

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleEditProduct}
                >
                  <Text style={styles.addButtonText}>Perbarui Produk</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Image Preview Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imagePreviewVisible}
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewCloseArea}
            onPress={() => setImagePreviewVisible(false)}
          >
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              style={styles.imagePreviewCloseButton}
              onPress={() => setImagePreviewVisible(false)}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  addHeaderButton: {
    padding: 8,
  },
  // View Toggle Styles
  viewToggle: {
    backgroundColor: "#fff",
    flexDirection: "row",
    margin: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#3b82f6",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  toggleButtonTextActive: {
    color: "#fff",
  },
  // Search Bar Styles
  searchContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    elevation: 2,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
  // Section Headers
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  categoryCount: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  productCount: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  // Categories Grid
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  categoryCard: {
    backgroundColor: "#fff",
    width: "45%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryIconContainer: {
    marginRight: 16,
    width: 48,
    height: 48,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  // Add Category Button
  addCategoryButton: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderStyle: "dashed",
  },
  addCategoryText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Categories List
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryProductCount: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  // Category Filter
  categoryFilterContainer: {
    marginBottom: 8,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  // Products List
  productsContainer: {
    paddingHorizontal: 16,
  },
  productCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  productCategory: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
    marginTop: 4,
  },
  productActions: {
    alignItems: "center",
  },
  productStock: {
    alignItems: "center",
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  stockNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#f59e0b",
    padding: 8,
    borderRadius: 8,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    padding: 8,
    borderRadius: 8,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  // No Results
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  clearSearchButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  clearSearchText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    maxHeight: "85%",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  // Icon Selector
  iconSelector: {
    maxHeight: 200,
    marginBottom: 16,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconOptionSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#1d4ed8",
  },
  // Category Dropdown
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  dropdownPlaceholder: {
    color: "#9ca3af",
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginTop: -16,
    marginBottom: 16,
    maxHeight: 150,
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemSelected: {
    backgroundColor: "#eff6ff",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  // Image Upload
  imageUploadContainer: {
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    borderRadius: 12,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 8,
  },
  removeImageButton: {
    alignSelf: "center",
    marginBottom: 16,
  },
  removeImageText: {
    color: "#ef4444",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  // Buttons
  addButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Image Preview Modal
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewCloseArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewContainer: {
    width: "90%",
    height: "70%",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  imagePreviewCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
});

export default ProductCategory;
