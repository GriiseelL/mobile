import api from "@/src/api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ToastAndroid } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ThermalPrinterModule from "react-native-thermal-printer";
import Icon from "react-native-vector-icons/MaterialIcons";
import { WebView } from "react-native-webview";

const CashierScreen = ({ navigation }) => {
  const router = useRouter();
  const [user, setUser] = useState(null); // ✅ state user
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const { url, transaction_code } = useLocalSearchParams();

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      fetchCategories();

      const loadUser = async () => {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      };
      loadUser();
    }, [])
  );

  // ✅ Ambil detail transaksi by transaction_code
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transaction_code) return;

      try {
        const token = await AsyncStorage.getItem("token");
        const res = await api.get(`/transactions/${transaction_code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const trx = res.data.transaction;

        if (trx.status === "PAID") {
          // 🔹 ambil struk dari backend
          const receiptRes = await api.post(
            "/api/xendit/struk/cash",
            { transaction_code: trx.transaction_code },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          setReceiptHtml(receiptRes.data.data);
          setShowReceipt(true);
        } else if (trx.status === "EXPIRED") {
          Alert.alert("Info", "Transaksi sudah kadaluarsa.");
        }
      } catch (err) {
        console.log("Fetch error:", err.response?.data || err);
      }
    };

    fetchTransaction();
  }, [transaction_code]);

  const fetchProducts = async () => {
    try {
      const res = await api.get("api/product/items");
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
          price: Number(product.price) || 0,
          stock: Number(product.stock) || 0,
        };
      });

      setProducts(updatedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Gagal memuat produk");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("api/product/category");
      const categoriesArray = Array.isArray(res.data.data) ? res.data.data : [];
      setCategories([{ id: 0, name: "Semua" }, ...categoriesArray]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getFilteredProducts = () => {
    let filtered = products.filter((product) => product.stock > 0); // Only show products in stock

    if (selectedCategory !== "Semua") {
      filtered = filtered.filter(
        (product) =>
          product.category?.name === selectedCategory ||
          product.category === selectedCategory
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        ToastAndroid.showWithGravity(
          `Stok tidak cukup, tersisa: ${product.stock}`,
          ToastAndroid.SHORT,
          ToastAndroid.CENTER // bisa diganti TOP / BOTTOM
        );
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    ToastAndroid.showWithGravity(
      `${product.name} berhasil ditambahkan ke keranjang 🛒`,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM // muncul di bawah tengah layar
    );
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (newQuantity > product.stock) {
      Alert.alert("Stok Tidak Cukup", `Stok tersisa: ${product.stock}`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // const processTransaction = async () => {
  //   if (cart.length === 0) {
  //     Alert.alert(
  //       "Keranjang Kosong",
  //       "Tambahkan produk ke keranjang terlebih dahulu"
  //     );
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const token = await AsyncStorage.getItem("token");

  //     const transactionData = {
  //       metode_pembayaran: paymentMethod,
  //       items: cart.map((item) => ({
  //         id_product: item.id,
  //         quantity: item.quantity,
  //         price: item.price,
  //       })),
  //     };

  //     const response = await api.post("/api/transaction/store", transactionData, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     if (response.data.success) {
  //       Alert.alert(
  //         "Transaksi Berhasil",
  //         `Total: ${formatPrice(getTotalAmount())}`,
  //         [
  //           {
  //             text: "OK",
  //             onPress: () => {
  //               setCart([]);
  //               setPaymentMethod("cash");
  //               setShowCart(false);
  //               fetchProducts(); // Refresh products to update stock
  //             },
  //           },
  //         ]
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Transaction error:", error);
  //     console.error("Error response:", error.response?.data);

  //     if (error.response?.data?.errors) {
  //       const errorMessages = Object.values(error.response.data.errors)
  //         .flat()
  //         .join("\n");
  //       Alert.alert("Validation Error", errorMessages);
  //     } else if (error.response?.data?.message) {
  //       Alert.alert("Error", error.response.data.message);
  //     } else {
  //       Alert.alert("Error", "Gagal memproses transaksi");
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const processTransaction = async () => {
  //   if (cart.length === 0) {
  //     Alert.alert(
  //       "Keranjang Kosong",
  //       "Tambahkan produk ke keranjang terlebih dahulu"
  //     );
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const token = await AsyncStorage.getItem("token");

  //     const transactionData = {
  //       metode_pembayaran: paymentMethod,
  //       items: cart.map((item) => ({
  //         id_product: item.id,
  //         quantity: item.quantity,
  //         price: item.price,
  //         name: item.name,
  //       })),
  //     };

  //     if (paymentMethod === "cash") {
  //       // langsung proses seperti sekarang
  //       const response = await api.post(
  //         "/api/transaction/store",
  //         transactionData,
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       );

  //       if (response.data.success) {
  //         Alert.alert("Sukses", "Transaksi tunai berhasil");
  //         setCart([]);
  //         setShowCart(false);
  //         fetchProducts();
  //       }
  //     } else {
  //       // 🔹 kalau non-cash → pakai Xendit
  //       const response = await api.post("/api/xendit/store", transactionData, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });

  //       if (response.data.success) {
  //         // arahkan ke WebView untuk bayar
  //         router.push({
  //           pathname: "/PaymentScreen",
  //           params: {
  //             url: response.data.payment_url,
  //             transaction_code: response.data.transaction_code,
  //           },
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Transaction error:", error);
  //     Alert.alert("Error", "Gagal memproses transaksi");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // ✅ Proses transaksi baru
  // ✅ Updated processTransaction function
  const processTransaction = async () => {
    if (cart.length === 0) {
      Alert.alert(
        "Keranjang Kosong",
        "Tambahkan produk ke keranjang terlebih dahulu"
      );
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      const transactionData = {
        metode_pembayaran: paymentMethod,
        items: cart.map((item) => ({
          id_product: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
      };

      if (paymentMethod === "cash") {
        // 🔹 Simpan transaksi cash
        const response = await api.post(
          "/api/transaction/store",
          transactionData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          const trxCode = response.data.transaction_code;

          // 🔹 Hitung total dengan pajak
          const subtotal = getTotalAmount();
          const tax = subtotal * 0.12;
          const total = subtotal + tax;

          // 🔹 Kirim data lengkap ke backend untuk generate struk
          const receiptResponse = await api.post(
            "/api/xendit/struk/cash",
            {
              transaction_code: trxCode,
              items: cart.map((item) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              })),
              subtotal: subtotal,
              tax: tax,
              total: total,
              seller: user?.name || "Kasir", // ambil dari state user
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // ✅ ambil dari 'data'
          const htmlStruk = receiptResponse.data.data;

          if (htmlStruk) {
            setReceiptHtml(htmlStruk);
            setShowReceipt(true);
          } else {
            Alert.alert("Error", "Struk tidak ditemukan");
          }

          Alert.alert("Sukses", "Transaksi tunai berhasil");
          setCart([]);
          setShowCart(false);
          fetchProducts();
        }
      } else {
        // 🔹 transaksi non-cash → redirect ke WebView
        const response = await api.post("/api/xendit/store", transactionData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          router.push({
            pathname: "/PaymentScreen",
            params: {
              url: response.data.payment_url,
              transaction_code: response.data.transaction_code,
            },
          });
        }
      }
    } catch (error) {
      console.error("Transaction error:", error.response?.data || error);
      Alert.alert("Error", "Gagal memproses transaksi");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Updated useEffect untuk handle struk dari payment
  // ✅ Debug dan perbaikan useEffect
  // ✅ Debug dan perbaikan useEffect
  // ✅ Perbaikan useEffect dengan endpoint yang benar
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transaction_code) return;

      try {
        const token = await AsyncStorage.getItem("token");
        console.log("🔍 Fetching transaction with code:", transaction_code);

        // ✅ Gunakan endpoint yang sesuai dengan route Laravel
        const res = await api.get(
          `/api/detail-transaction/${transaction_code}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("📥 API Response:", res.data);
        console.log("📄 Response status:", res.status);

        // ✅ Check berbagai kemungkinan struktur response
        let trx = null;

        // Kemungkinan 1: res.data.transaction
        if (res.data && res.data.transaction) {
          trx = res.data.transaction;
        }
        // Kemungkinan 2: res.data.data
        else if (res.data && res.data.data) {
          trx = res.data.data;
        }
        // Kemungkinan 3: res.data langsung
        else if (res.data && res.data.transaction_code) {
          trx = res.data;
        }

        console.log("💰 Transaction object:", trx);

        if (!trx) {
          console.log("❌ Transaction object not found in response");
          Alert.alert("Error", "Data transaksi tidak ditemukan");
          return;
        }

        console.log("📊 Transaction status:", trx.status);

        if (
          trx.status === "PAID" ||
          trx.status === "paid" ||
          trx.status === "COMPLETED"
        ) {
          console.log("✅ Transaction is PAID, generating receipt...");

          // Ambil items dari berbagai kemungkinan struktur
          const transactionItems =
            trx.items ||
            trx.transaction_items ||
            trx.transactionItems ||
            trx.details ||
            [];

          console.log("📦 Transaction items:", transactionItems);

          if (transactionItems.length === 0) {
            Alert.alert("Error", "Detail item transaksi tidak ditemukan");
            return;
          }

          // Hitung total
          const subtotal = transactionItems.reduce((sum, item) => {
            const price = item.price || item.product?.price || 0;
            const quantity = item.quantity || item.qty || 0;
            return sum + price * quantity;
          }, 0);

          const tax = subtotal * 0.12;
          const total = subtotal + tax;

          console.log("💵 Calculated totals:", { subtotal, tax, total });

          // Generate receipt
          const receiptRes = await api.post(
            "/api/xendit/struk/cash",
            {
              transaction_code: trx.transaction_code,
              items: transactionItems.map((item) => ({
                name:
                  item.product?.name ||
                  item.name ||
                  item.product_name ||
                  "Unknown Product",
                price: item.price || item.product?.price || 0,
                quantity: item.quantity || item.qty || 0,
              })),
              subtotal: subtotal,
              tax: tax,
              total: total,
              seller: user?.name || "Kasir",
              payment_method:
                trx.metode_pembayaran || trx.payment_method || "xendit",
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log("🧾 Receipt response:", receiptRes.data);

          if (receiptRes.data && receiptRes.data.data) {
            setReceiptHtml(receiptRes.data.data);
            setShowReceipt(true);

            // Bersihkan cart jika ada
            setCart([]);
            setShowCart(false);
            fetchProducts();

            Alert.alert("Sukses", "Pembayaran berhasil!");
          } else {
            Alert.alert("Error", "Gagal generate struk");
          }
        } else if (trx.status === "EXPIRED" || trx.status === "expired") {
          Alert.alert("Info", "Transaksi sudah kadaluarsa.");
        } else if (trx.status === "PENDING" || trx.status === "pending") {
          Alert.alert("Info", "Pembayaran masih dalam proses.");
        } else {
          console.log("ℹ️ Transaction status:", trx.status);
          Alert.alert("Info", `Status transaksi: ${trx.status}`);
        }
      } catch (err) {
        console.error("❌ Fetch transaction error details:", err);
        console.error("❌ Error response:", err.response?.data);
        console.error("❌ Error status:", err.response?.status);
        console.error("❌ Error message:", err.message);

        if (err.response?.status === 404) {
          Alert.alert("Error", "Transaksi tidak ditemukan");
        } else if (err.response?.data?.message) {
          Alert.alert("Error", err.response.data.message);
        } else {
          Alert.alert("Error", "Gagal mengambil data transaksi");
        }
      }
    };

    fetchTransaction();
  }, [transaction_code]);

  // ✅ Function untuk debugging API endpoint yang sudah diperbai

  const [devices, setDevices] = useState([]);
  const [connected, setConnected] = useState(false);

  const scanDevices = async () => {
    try {
      const list = await ThermalPrinterModule.getDeviceList(); // ✅ benar
      console.log("Printer ditemukan:", list);
      setDevices(list);
      if (list.length === 0) {
        Alert.alert("Info", "Tidak ada printer ditemukan");
      }
    } catch (err) {
      console.error("❌ Scan error:", err);
      Alert.alert("Error", "Gagal scan printer");
    }
  };
  // console.log("ThermalPrinterModule:", ThermalPrinterModule);

  const connectToPrinter = async (address) => {
    try {
      await ThermalPrinterModule.connectBluetooth(address);
      setConnected(true);
      Alert.alert("Sukses", "Printer terhubung");
    } catch (err) {
      Alert.alert("Error", "Tidak bisa connect ke printer");
    }
  };

  const scanPrinters = async () => {
    try {
      const devices = await ThermalPrinterModule.getBluetoothDeviceList();
      console.log("📍 Found devices:", devices);
    } catch (err) {
      console.error("❌ Scan error:", err);
    }
  };

  // Print ke printer bluetooth
  const printReceipt = async (macAddress: string) => {
    try {
      await ThermalPrinterModule.printBluetooth({
        macAddress, // alamat printer yang dipilih dari hasil scan
        payload: `
        *** TELAVA POS ***
        ==================
        Item A     Rp10.000
        Item B     Rp15.000
        ------------------
        Total      Rp25.000
        ==================
        Terima Kasih!
      `,
      });
      console.log("✅ Print success!");
    } catch (err) {
      console.error("❌ Print error:", err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const ProductCard = ({ product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => addToCart(product)}
      disabled={product.stock <= 0}
    >
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
        <Text
          style={[
            styles.productStock,
            { color: product.stock < 5 ? "#ef4444" : "#10b981" },
          ]}
        >
          Stok: {product.stock}
        </Text>
      </View>
      {product.stock <= 0 && (
        <View style={styles.outOfStockOverlay}>
          <Text style={styles.outOfStockText}>Habis</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const CartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.cartItemImage} />
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cartItemPrice}>{formatPrice(item.price)}</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateCartQuantity(item.id, item.quantity - 1)}
          >
            <Icon name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateCartQuantity(item.id, item.quantity + 1)}
          >
            <Icon name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Icon name="delete" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kasir</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setShowCart(true)}
        >
          <Icon name="shopping-cart" size={24} color="#fff" />
          {getTotalItems() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.name &&
                  styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.name &&
                    styles.categoryButtonTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <FlatList
        data={getFilteredProducts()}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.productsContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Cart Modal */}
      <Modal
        visible={showCart}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCart(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cartModal}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Keranjang Belanja</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Icon name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Icon name="shopping-cart" size={48} color="#9ca3af" />
                <Text style={styles.emptyCartText}>Keranjang kosong</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.cartItems}>
                  {cart.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </ScrollView>

                <View style={styles.cartSummary}>
                  <Text style={styles.sectionLabel}>Metode Pembayaran</Text>
                  <View style={styles.paymentMethods}>
                    <TouchableOpacity
                      style={[
                        styles.paymentButton,
                        paymentMethod === "cash" && styles.paymentButtonActive,
                      ]}
                      onPress={() => setPaymentMethod("cash")}
                    >
                      <Icon
                        name="money"
                        size={20}
                        color={paymentMethod === "cash" ? "#fff" : "#6b7280"}
                      />
                      <Text
                        style={[
                          styles.paymentButtonText,
                          paymentMethod === "cash" &&
                            styles.paymentButtonTextActive,
                        ]}
                      >
                        Tunai
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentButton,
                        paymentMethod === "transfer" &&
                          styles.paymentButtonActive,
                      ]}
                      onPress={() => setPaymentMethod("transfer")}
                    >
                      <Icon
                        name="account-balance"
                        size={20}
                        color={
                          paymentMethod === "transfer" ? "#fff" : "#6b7280"
                        }
                      />
                      <Text
                        style={[
                          styles.paymentButtonText,
                          paymentMethod === "transfer" &&
                            styles.paymentButtonTextActive,
                        ]}
                      >
                        Transfer
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentButton,
                        paymentMethod === "qris" && styles.paymentButtonActive,
                      ]}
                      onPress={() => setPaymentMethod("qris")}
                    >
                      <Icon
                        name="qr-code"
                        size={20}
                        color={paymentMethod === "qris" ? "#fff" : "#6b7280"}
                      />
                      <Text
                        style={[
                          styles.paymentButtonText,
                          paymentMethod === "qris" &&
                            styles.paymentButtonTextActive,
                        ]}
                      >
                        QRIS
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.totalBreakdown}>
                    <View style={styles.subtotalRow}>
                      <Text style={styles.subtotalLabel}>Subtotal:</Text>
                      <Text style={styles.subtotalAmount}>
                        {formatPrice(getTotalAmount())}
                      </Text>
                    </View>
                    <View style={styles.taxRow}>
                      <Text style={styles.taxLabel}>Pajak (12%):</Text>
                      <Text style={styles.taxAmount}>
                        {formatPrice(getTotalAmount() * 0.12)}
                      </Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalAmount}>
                        {formatPrice(getTotalAmount() * 1.12)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={processTransaction}
                    disabled={loading}
                  >
                    <Text style={styles.checkoutButtonText}>
                      {loading ? "Memproses..." : "Bayar Sekarang"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReceipt}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowReceipt(false)}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 10,
              backgroundColor: "#3b82f6",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              Struk
            </Text>
            <TouchableOpacity onPress={() => setShowReceipt(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <WebView source={{ html: receiptHtml }} style={{ flex: 1 }} />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            padding: 10,
          }}
        >
          <TouchableOpacity
            style={{ backgroundColor: "#3b82f6", padding: 12, borderRadius: 8 }}
            onPress={scanPrinters}
          >
            <Text style={{ color: "#fff" }}>Scan Printer</Text>
          </TouchableOpacity>

          {connected ? (
            <TouchableOpacity
              style={{
                backgroundColor: "#10b981",
                padding: 12,
                borderRadius: 8,
              }}
              onPress={printReceipt}
            >
              <Text style={{ color: "#fff" }}>Print Struk</Text>
            </TouchableOpacity>
          ) : (
            devices.map((dev, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  backgroundColor: "#f59e0b",
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 5,
                }}
                onPress={() => connectToPrinter(dev.address)}
              >
                <Text style={{ color: "#fff" }}>{dev.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </Modal>
    </View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  cartButton: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  searchContainer: {
    backgroundColor: "#fff",
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  categoriesContent: {
    paddingHorizontal: 16,
    flexGrow: 0, // This prevents the content from growing to fill available space
  },
  categoryButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    alignSelf: "flex-start", // This ensures the button only takes the space it needs
    minWidth: 80, // Minimum width for better touch target
  },
  categoryButtonActive: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryButtonText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  categoryButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  productsContainer: {
    padding: 8,
    flexGrow: 1,
  },
  productCard: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 8,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: "cover",
  },
  productInfo: {
    alignItems: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#111827",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    fontWeight: "500",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  cartModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyCartText: {
    color: "#6b7280",
    fontSize: 16,
    marginTop: 8,
  },
  cartItems: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 12,
    color: "#10b981",
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantityButton: {
    backgroundColor: "#3b82f6",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    padding: 4,
  },
  cartSummary: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#111827",
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  paymentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    gap: 4,
  },
  paymentButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  paymentButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  paymentButtonTextActive: {
    color: "#fff",
  },
  totalBreakdown: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    marginBottom: 20,
  },
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  subtotalLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  subtotalAmount: {
    fontSize: 14,
    color: "#6b7280",
  },
  taxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  taxLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  taxAmount: {
    fontSize: 14,
    color: "#6b7280",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  checkoutButton: {
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CashierScreen;
