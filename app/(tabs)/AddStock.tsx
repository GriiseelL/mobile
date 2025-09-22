import React, { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../src/api/api";
// Import vector icons
import IconAntDesign from "react-native-vector-icons/AntDesign";
import IconFeather from "react-native-vector-icons/Feather";
import IconCommunity from "react-native-vector-icons/MaterialCommunityIcons";
import Icon from "react-native-vector-icons/MaterialIcons";

const AddStock = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);

  // Form state
  const [stockInData, setStockInData] = useState({
    product_id: "",
    quantity: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/product/items");
      const productsData = response.data.data || [];
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error("Gagal ambil produk:", error);
      Alert.alert("Error", "Gagal mengambil data produk");
    }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setStockInData({
      ...stockInData,
      product_id: product.id.toString(),
    });
    setProductModalVisible(false);
    setSearchQuery("");
  };

  const handleStockIn = async () => {
    const { product_id, quantity } = stockInData;

    if (!product_id || !quantity) {
      Alert.alert("Error", "Semua field wajib harus diisi!");
      return;
    }

    if (parseInt(quantity) <= 0) {
      Alert.alert("Error", "Jumlah stok harus lebih dari 0!");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Token tidak ditemukan");

      // Payload sesuai dengan Laravel RestockRequest
      const payload = {
        id_product: parseInt(product_id),
        tipe: "masuk", // sesuai dengan controller Laravel
        quantity: parseInt(quantity),
      };

      const response = await api.post("/api/riwayat_stock", payload);

      Alert.alert(
        "Sukses",
        `Stok berhasil ditambahkan!\n\nProduk: ${selectedProduct?.name}\nJumlah: ${quantity}`,
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setStockInData({
                product_id: "",
                quantity: "",
              });
              setSelectedProduct(null);
              navigation?.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Gagal tambah stok:", error?.response?.data || error);
      Alert.alert(
        "Gagal",
        error?.response?.data?.message ||
          error?.message ||
          "Terjadi kesalahan saat menambah stok"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => selectProduct(item)}
    >
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{item.stock} pcs</Text>
          </View>
        </View>

        <View style={styles.productMeta}>
          <View style={styles.metaItem}>
            <IconCommunity name="tag" size={12} color="#6b7280" />
            <Text style={styles.metaText}>
              {item.category?.name || "Tidak ada kategori"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <IconCommunity name="currency-usd" size={12} color="#6b7280" />
            <Text style={styles.metaText}>
              Rp {parseInt(item.price || 0).toLocaleString("id-ID")}
            </Text>
          </View>
        </View>
      </View>
      <IconFeather name="chevron-right" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <IconAntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Tambah Stok Masuk</Text>
            <Text style={styles.headerSubtitle}>
              Catat penerimaan barang baru
            </Text>
          </View>
        </View>
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        {/* Product Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pilih Produk *</Text>
          <TouchableOpacity
            style={[
              styles.productSelector,
              selectedProduct && styles.productSelectorSelected,
            ]}
            onPress={() => setProductModalVisible(true)}
          >
            {selectedProduct ? (
              <View style={styles.selectedProductInfo}>
                <View style={styles.selectedProductMain}>
                  <Text style={styles.selectedProductName}>
                    {selectedProduct.name}
                  </Text>
                  <Text style={styles.selectedProductMeta}>
                    Stok saat ini: {selectedProduct.stock} pcs
                  </Text>
                </View>
                <View style={styles.selectedProductPrice}>
                  <Text style={styles.selectedProductPriceText}>
                    Rp{" "}
                    {parseInt(selectedProduct.price || 0).toLocaleString(
                      "id-ID"
                    )}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.productPlaceholder}>
                <IconCommunity
                  name="package-variant-closed"
                  size={20}
                  color="#9ca3af"
                />
                <Text style={styles.productPlaceholderText}>
                  Tap untuk pilih produk
                </Text>
              </View>
            )}
            <IconFeather name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Quantity Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Jumlah Stok Masuk *</Text>
          <View style={styles.quantityContainer}>
            <TextInput
              style={styles.quantityInput}
              placeholder="0"
              keyboardType="numeric"
              value={stockInData.quantity}
              onChangeText={(text) =>
                setStockInData({ ...stockInData, quantity: text })
              }
            />
            <View style={styles.unitBadge}>
              <Text style={styles.unitText}>pcs</Text>
            </View>
          </View>
        </View>

        {/* Supplier Input */}

        {/* Purchase Price Input */}

        {/* Notes Input */}

        {/* Summary Card */}
        {selectedProduct &&
          stockInData.quantity &&
          stockInData.purchase_price && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <IconCommunity name="calculator" size={20} color="#3b82f6" />
                <Text style={styles.summaryTitle}>Ringkasan</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Biaya:</Text>
                <Text style={styles.summaryValue}>
                  Rp{" "}
                  {(
                    parseInt(stockInData.quantity || 0) *
                    parseFloat(stockInData.purchase_price || 0)
                  ).toLocaleString("id-ID")}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Stok Setelah Penambahan:
                </Text>
                <Text style={styles.summaryValue}>
                  {selectedProduct.stock + parseInt(stockInData.quantity || 0)}{" "}
                  pcs
                </Text>
              </View>
            </View>
          )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleStockIn}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.submitButtonText}>Memproses...</Text>
          ) : (
            <>
              <IconCommunity name="package-up" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Tambah Stok</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={productModalVisible}
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <IconCommunity
                  name="package-variant"
                  size={20}
                  color="#3b82f6"
                />
                <Text style={styles.modalTitle}>Pilih Produk</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setProductModalVisible(false)}
              >
                <IconAntDesign name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <IconFeather name="search" size={16} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari nama produk atau kategori..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Product List */}
            <View style={styles.productListContainer}>
              <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <IconCommunity
                      name="package-variant-closed"
                      size={48}
                      color="#d1d5db"
                    />
                    <Text style={styles.emptyText}>
                      {searchQuery
                        ? "Produk tidak ditemukan"
                        : "Tidak ada produk"}
                    </Text>
                  </View>
                }
              />
            </View>
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
    backgroundColor: "#3b82f6",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#c7d2fe",
    fontSize: 14,
    marginTop: 2,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#111827",
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },

  // Product Selector
  productSelector: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productSelectorSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#f0f9ff",
  },
  selectedProductInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedProductMain: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  selectedProductMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  selectedProductPrice: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  selectedProductPriceText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  productPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  productPlaceholderText: {
    color: "#9ca3af",
    fontSize: 16,
    marginLeft: 8,
  },

  // Quantity Input
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    textAlign: "center",
    fontWeight: "600",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  unitBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderLeftWidth: 0,
  },
  unitText: {
    color: "#6b7280",
    fontWeight: "600",
  },

  // Price Input
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyPrefix: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRightWidth: 0,
  },
  currencyText: {
    color: "#6b7280",
    fontWeight: "600",
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    fontWeight: "600",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#374151",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
  },

  // Submit Button
  submitButton: {
    backgroundColor: "#10b981",
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
  },

  // Search
  searchContainer: {
    padding: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: "#111827",
  },

  // Product List
  productListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  stockBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: "600",
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 12,
  },
});

export default AddStock;
