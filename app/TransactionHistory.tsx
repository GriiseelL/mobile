import api from "@/src/api/api";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Fetch transactions dari Laravel API
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const response = await api("/api/transaction");
      console.log("API Response:", response);

      // Extract data dari response
      let transactionData = [];

      // Karena dari log, response.data berisi object dengan success dan data
      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        transactionData = response.data.data;
      }
      // Jika langsung response.success (response langsung dari api)
      else if (response.success && Array.isArray(response.data)) {
        transactionData = response.data;
      }
      // Jika response langsung array
      else if (Array.isArray(response)) {
        transactionData = response;
      }
      // Jika response.data langsung array
      else if (Array.isArray(response.data)) {
        transactionData = response.data;
      }

      console.log("Processed transaction data:", transactionData);

      // Transform data untuk menambahkan field yang dibutuhkan UI
      const processedTransactions = transactionData.map((transaction) => ({
        ...transaction,
        // Handle status null - ubah jadi default status
        status: transaction.status || "PAID", // Default jika null
        // Pastikan ada nama untuk display
        name: transaction.transaction_code || `Transaksi #${transaction.id}`,
        // Field lainnya yang mungkin dibutuhkan
        quantity: 1,
      }));

      setTransactions(processedTransactions);
      console.log("Final processed transactions:", processedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Alert.alert("Error", `Gagal memuat data: ${error.message}`);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detail transaksi berdasarkan ID
  const fetchTransactionDetail = async (transactionId) => {
    try {
      setLoadingDetail(true);
      console.log("Fetching detail for transaction ID:", transactionId);

      const response = await api(`/api/transaction/${transactionId}`);
      console.log("Transaction detail response:", response);

      // Handle response structure berdasarkan API yang Anda berikan
      let details = null;

      if (response.data && response.data.transactions) {
        details = response.data.transactions;
      } else if (response.transactions) {
        details = response.transactions;
      } else if (response.data) {
        details = response.data;
      } else {
        details = response;
      }

      console.log("Processed transaction details:", details);
      return details;
    } catch (error) {
      console.error("Error fetching transaction detail:", error);
      Alert.alert("Error", `Gagal memuat detail transaksi: ${error.message}`);
      return null;
    } finally {
      setLoadingDetail(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  // Format currency ke Rupiah
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Tanggal tidak tersedia";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Tanggal tidak valid";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    if (!status) return "#9E9E9E"; // Gray untuk null/undefined

    switch (status.toUpperCase()) {
      case "PAID":
      case "SUCCES": // Handle typo dari data
      case "SUCCESS":
        return "#4CAF50"; // Green
      case "PENDING":
        return "#FF9800"; // Orange
      case "EXPIRED":
      case "CANCELLED":
        return "#F44336"; // Red
      default:
        return "#9E9E9E"; // Gray
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    if (!status) return "help-circle";

    switch (status.toUpperCase()) {
      case "PAID":
      case "SUCCES": // Handle typo dari data
      case "SUCCESS":
        return "checkmark-circle";
      case "PENDING":
        return "time";
      case "EXPIRED":
      case "CANCELLED":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  // Get status display text
  const getStatusDisplayText = (status) => {
    if (!status) return "TIDAK DIKETAHUI";

    switch (status.toUpperCase()) {
      case "PAID":
        return "DIBAYAR";
      case "SUCCES": // Handle typo dari data
      case "SUCCESS":
        return "BERHASIL";
      case "PENDING":
        return "MENUNGGU";
      case "EXPIRED":
        return "KADALUARSA";
      case "CANCELLED":
        return "DIBATALKAN";
      default:
        return status.toUpperCase();
    }
  };

  // Show transaction details
  const showTransactionDetails = async (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);

    // Fetch detail produk yang dibeli
    console.log("Fetching details for transaction:", transaction.id);
    const details = await fetchTransactionDetail(transaction.id);

    if (details && Array.isArray(details)) {
      // Update selectedTransaction dengan detail produk
      setSelectedTransaction((prevTransaction) => ({
        ...prevTransaction,
        productDetails: details,
      }));
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      searchQuery === "" ||
      transaction.transaction_code
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.seller?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = (() => {
      if (filter === "all") return true;

      const status = transaction.status?.toLowerCase();

      switch (filter.toLowerCase()) {
        case "pending":
          return status === "pending";
        case "paid":
          return (
            status === "paid" || status === "succes" || status === "success"
          );
        case "expired":
          return status === "expired";
        case "cancelled":
          return status === "cancelled";
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  const downloadPDF = async () => {
    if (!transactions || transactions.length === 0) {
      Alert.alert("Info", "Tidak ada transaksi untuk diunduh");
      return;
    }

    try {
      // Ambil detail tiap transaksi + normalisasi field produk
      const transactionsWithDetails = await Promise.all(
        transactions.map(async (trx) => {
          let details = trx.productDetails;

          if (!details) {
            const fetched = await fetchTransactionDetail(trx.id);
            details = fetched?.transaction_product || fetched || [];
          }

          // ✅ Normalisasi supaya konsisten
          const normalized = (details || []).map((p) => ({
            name: p.product_name || p.name || "-",
            price: parseFloat(p.product_price || p.price || 0),
            quantity: parseInt(p.quantity || 1),
          }));

          return { ...trx, productDetails: normalized };
        })
      );

      // HTML PDF
      const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; text-align: left; vertical-align: top; }
            th { background: #f1f5f9; }
            .subtable { margin: 6px 0 0 10px; width: 95%; border: 1px solid #ccc; }
            .subtable th, .subtable td { font-size: 11px; padding: 4px; }
          </style>
        </head>
        <body>
          <h1>Laporan Semua Transaksi</h1>
          <table>
            <tr>
              <th>Kode</th>
              <th>Kasir</th>
              <th>Metode</th>
              <th>Tanggal</th>
              <th>Total</th>
              <th>Detail Barang</th>
            </tr>
            ${transactionsWithDetails
              .map(
                (trx) => `
              <tr>
                <td>${trx.transaction_code || "-"}</td>
                <td>${trx.seller || "-"}</td>
                <td>${trx.metode_pembayaran || "-"}</td>
                <td>${formatDate(trx.created_at)}</td>
                <td>${formatCurrency(trx.total || 0)}</td>
                <td>
                  <table class="subtable">
                    <tr>
                      <th>Nama</th>
                      <th>Qty</th>
                      <th>Harga</th>
                      <th>Subtotal</th>
                    </tr>
                    ${(trx.productDetails || [])
                      .map(
                        (p) => `
                        <tr>
                          <td>${p.name}</td>
                          <td>${p.quantity}</td>
                          <td>${formatCurrency(p.price)}</td>
                          <td>${formatCurrency(p.price * p.quantity)}</td>
                        </tr>
                      `
                      )
                      .join("")}
                  </table>
                </td>
              </tr>
            `
              )
              .join("")}
          </table>
        </body>
      </html>
    `;

      // Buat file PDF
      const { uri } = await Print.printToFileAsync({ html });

      // Simpan ke folder SAF
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert("Ditolak", "Izin akses penyimpanan ditolak ❌");
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileName = `laporan-transaksi-${Date.now()}.pdf`;
      const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        "application/pdf"
      );

      await FileSystem.writeAsStringAsync(newUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert("Sukses", "PDF berhasil disimpan ✅");
    } catch (err) {
      console.error("Gagal buat PDF:", err);
      Alert.alert("Error", "Gagal membuat PDF ❌");
    }
  };

  const FilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: "all", label: "Semua" },
          { key: "pending", label: "Pending" },
          { key: "paid", label: "Dibayar" },
          { key: "expired", label: "Expired" },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterButton,
              filter === item.key && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(item.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === item.key && styles.filterButtonTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Search bar
  const SearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#666" />
      <TextInput
        style={styles.searchInput}
        placeholder="Cari kode transaksi atau penjual..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {searchQuery !== "" && (
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  // Transaction item component
  const TransactionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => showTransactionDetails(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.leftInfo}>
          <Text style={styles.transactionCode}>{item.transaction_code}</Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={20}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusDisplayText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.infoText}>Penjual: {item.seller || "N/A"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="card" size={16} color="#666" />
          <Text style={styles.infoText}>
            Pembayaran: {item.metode_pembayaran || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>
          {formatCurrency(item.total || 0)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Calculate total dari product details
  const calculateTotalFromDetails = (productDetails) => {
    if (!productDetails || !Array.isArray(productDetails)) return 0;

    return productDetails.reduce((total, item) => {
      const price = parseFloat(item.product_price || 0);
      const quantity = parseInt(item.quantity || 1);
      return total + price * quantity;
    }, 0);
  };

  // Transaction detail modal
  const TransactionDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Transaksi</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {selectedTransaction && (
            <ScrollView style={styles.modalBody}>
              {/* Informasi Dasar Transaksi */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Informasi Transaksi</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kode Transaksi</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.transaction_code}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.statusContainer}>
                    <Ionicons
                      name={getStatusIcon(selectedTransaction.status)}
                      size={20}
                      color={getStatusColor(selectedTransaction.status)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(selectedTransaction.status) },
                      ]}
                    >
                      {getStatusDisplayText(selectedTransaction.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Penjual</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.seller || "N/A"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Metode Pembayaran</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.metode_pembayaran || "N/A"}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tanggal Transaksi</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedTransaction.created_at)}
                  </Text>
                </View>
              </View>

              {/* Detail Produk yang Dibeli */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Produk yang Dibeli</Text>

                {loadingDetail ? (
                  <View style={styles.loadingDetailContainer}>
                    <ActivityIndicator size="small" color="#007bff" />
                    <Text style={styles.loadingDetailText}>
                      Memuat detail produk...
                    </Text>
                  </View>
                ) : selectedTransaction.productDetails &&
                  Array.isArray(selectedTransaction.productDetails) &&
                  selectedTransaction.productDetails.length > 0 ? (
                  <>
                    {selectedTransaction.productDetails.map((item, index) => (
                      <View key={index} style={styles.productCard}>
                        <View style={styles.productHeader}>
                          <Text style={styles.productName}>
                            {item.product_name || "Produk"}
                          </Text>
                          <Text style={styles.productPrice}>
                            {formatCurrency(item.product_price || 0)}
                          </Text>
                        </View>

                        <View style={styles.productDetails}>
                          <View style={styles.productRow}>
                            <Text style={styles.productLabel}>Jumlah:</Text>
                            <Text style={styles.productValue}>
                              {item.quantity || 1} pcs
                            </Text>
                          </View>

                          <View style={styles.productRow}>
                            <Text style={styles.productLabel}>Subtotal:</Text>
                            <Text style={styles.productSubtotal}>
                              {formatCurrency(
                                parseFloat(item.product_price || 0) *
                                  parseInt(item.quantity || 1)
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}

                    {/* Total Keseluruhan */}
                    <View style={styles.totalSection}>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                          Total Keseluruhan:
                        </Text>
                        <Text style={styles.totalValue}>
                          {formatCurrency(
                            selectedTransaction.total ||
                              calculateTotalFromDetails(
                                selectedTransaction.productDetails
                              )
                          )}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.noProductContainer}>
                    <Ionicons name="cube-outline" size={40} color="#ccc" />
                    <Text style={styles.noProductText}>
                      Detail produk tidak tersedia
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <Text style={styles.headerSubtitle}>
          {transactions.length} transaksi ditemukan
        </Text>

        <TouchableOpacity style={styles.downloadButton} onPress={downloadPDF}>
          <Ionicons name="download" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>Download PDF</Text>
        </TouchableOpacity>
      </View>

      <SearchBar />
      <FilterButtons />

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id?.toString() || item.transaction_code}
        renderItem={({ item }) => <TransactionItem item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada transaksi</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? `Tidak ditemukan transaksi dengan pencarian "${searchQuery}"`
                : filter === "all"
                ? "Belum ada transaksi yang tercatat"
                : `Tidak ada transaksi dengan status ${filter}`}
            </Text>
          </View>
        }
      />

      <TransactionDetailModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f1f3f4",
  },
  filterButtonActive: {
    backgroundColor: "#007bff",
  },
  filterButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  leftInfo: {
    flex: 1,
  },
  transactionCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  transactionDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },

  // Detail section styles
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#007bff",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },

  // Product card styles
  loadingDetailContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingDetailText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  productCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007bff",
  },
  productDetails: {
    marginTop: 8,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  productLabel: {
    fontSize: 14,
    color: "#666",
  },
  productValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  productSubtotal: {
    fontSize: 14,
    color: "#007bff",
    fontWeight: "600",
  },

  // Total section styles
  totalSection: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },

  // No product styles
  noProductContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noProductText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    textAlign: "center",
  },
  downloadButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  downloadButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default TransactionHistory;
