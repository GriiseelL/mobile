import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import React from "react";

const PaymentScreen = () => {
  const router = useRouter();
  const { url, transaction_code } = useLocalSearchParams();

  const handleDone = () => {
    router.replace({
      pathname: "/CashierScreen",
      params: { transaction_code },
    });
  };

  if (!url) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <WebView
      source={{ uri: url }}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url.includes("/payment/success")) {
          handleDone();
          return false; // cegah buka halaman
        }
        return true;
      }}
      onError={handleDone}
    />
  );
};

export default PaymentScreen;
