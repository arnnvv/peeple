import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAtomValue } from "jotai";
import { emailAtom } from "@/lib/atom";
import Swiper from "react-native-deck-swiper";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient"; // Importing LinearGradient from expo

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
      <Animated.View
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(500)}
        style={styles.card}
      >
        <Image source={{ uri: card.photo }} style={styles.image} />
        <ScrollView contentContainerStyle={styles.cardContent}>
          <Text style={styles.name}>
            {card.name}, {new Date().getFullYear() - card.year}
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#F87171" />
            <Text style={styles.infoText}>
              {parsedLocation.latitude?.toFixed(2)},{" "}
              {parsedLocation.longitude?.toFixed(2)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={16} color="#34D399" />
            <Text style={styles.infoText}>
              {card.occupationField} - {card.occupationArea}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="heart-outline" size={16} color="#F472B6" />
            <Text style={styles.infoText}>
              Relationship: {card.relationshiptype || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="beer-outline" size={16} color="#FBBF24" />
            <Text style={styles.infoText}>Drinks: {card.drink || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="logo-no-smoking" size={16} color="#60A5FA" />
            <Text style={styles.infoText}>Smokes: {card.smoke || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#A78BFA" />
            <Text style={styles.infoText}>
              {card.month}/{card.date}/{card.year}
            </Text>
          </View>
          <Text style={styles.bio} numberOfLines={4} ellipsizeMode="tail">
            {card.bio}
          </Text>
        </ScrollView>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#8B5CF6", "#6D28D9"]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={["#8B5CF6", "#6D28D9"]} style={styles.gradient}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#8B5CF6", "#6D28D9"]} // Deeper purple gradient
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Swiper
          cards={recommendations}
          renderCard={renderCard}
          onSwiped={(cardIndex: number) => console.log(cardIndex)}
          onSwipedAll={() => console.log("onSwipedAll")}
          cardIndex={0}
          backgroundColor={"transparent"} // Background transparent to show gradient
          stackSize={3}
          verticalSwipe={false}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    flex: 1,
  },
  card: {
    width: width * 0.9,
    height: height * 0.75,
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
    overflow: "hidden",
    borderColor: "#A78BFA", // More vibrant purple border
    borderWidth: 1,
  },
  image: {
    width: "100%",
    height: "50%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "white",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4B5563", // Dark gray text
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
    color: "#6B7280", // Medium gray text
  },
  bio: {
    fontSize: 16,
    marginTop: 10,
    color: "#4B5563",
    flexShrink: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#F87171", // Red error text
    fontSize: 18,
  },
});
