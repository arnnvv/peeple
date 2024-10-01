import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { useAtomValue } from "jotai";
import { emailAtom } from "@/lib/atom";
import Swiper from "react-native-deck-swiper";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default (): JSX.Element => {
  const email = useAtomValue(emailAtom);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      console.log("\x1b[34m[Fetching] Requesting recommendations for:", email);
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API}/get-recommendations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          },
        );

        if (!res.ok) {
          console.log(`\x1b[31m[Error] HTTP error! status: ${res.status}`);
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setRecommendations(data.recommendations);
        console.log(
          `\x1b[36m[Debug] Recommendations fetched:`,
          data.recommendations,
        );
      } catch (error: any) {
        console.log(`\x1b[31m[Error] Fetch failed:`, error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [email]);

  const renderCard = (card: any) => {
    if (!card) return null;

    const parsedLocation = JSON.parse(card.location || "{}").coords || {};

    return (
      <View style={styles.card}>
        <Image source={{ uri: card.photo }} style={styles.image} />
        <ScrollView contentContainerStyle={styles.cardContent}>
          <Text style={styles.name}>
            {card.name}, {new Date().getFullYear() - card.year}
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {parsedLocation.latitude?.toFixed(2)},{" "}
              {parsedLocation.longitude?.toFixed(2)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {card.occupationField} - {card.occupationArea}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="heart-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Relationship: {card.relationshiptype || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="beer-outline" size={16} color="#666" />
            <Text style={styles.infoText}>Drinks: {card.drink || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="logo-no-smoking" size={16} color="#666" />
            <Text style={styles.infoText}>Smokes: {card.smoke || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {card.month}/{card.date}/{card.year}
            </Text>
          </View>
          <Text style={styles.bio} numberOfLines={4} ellipsizeMode="tail">
            {card.bio}
          </Text>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        cards={recommendations}
        renderCard={renderCard}
        onSwiped={(cardIndex: number) => console.log(cardIndex)}
        onSwipedAll={() => console.log("onSwipedAll")}
        cardIndex={0}
        backgroundColor={"#f2f2f2"}
        stackSize={3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  card: {
    width: width * 0.9,
    height: height * 0.75, // Adjusted to fit iPhone 12 screen better
    borderRadius: 20,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden", // Prevent content overflow
  },
  image: {
    width: "100%",
    height: "50%", // Reduce image height for more content space
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    flexGrow: 1,
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#666",
  },
  bio: {
    fontSize: 16,
    marginTop: 10,
    color: "#444",
    flexShrink: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
