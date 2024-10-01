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
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default (): JSX.Element => {
  const email = useAtomValue(emailAtom);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getLikedBy = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API}/liked-by`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }), // Sending the email in the request body
      });

      // Check if the response is ok (status in the range 200-299)
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json(); // Parse the response as JSON
      console.log("\x1b[32m[Success] Users who liked:", data.likedByUsers);
      return data.likedByUsers; // Return the list of users who liked
    } catch (error) {
      console.error("\x1b[31m[Error] Failed to fetch liked by users:", error);
    }
  };

  const getMutualLikes = async () => {
    try {
      const response = await fetch("http://your-api-url/mutual-likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      // Check if the response is OK (status code 200-299)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch mutual likes");
      }

      const data = await response.json();
      console.log("Mutual Likes:", data.mutualLikes); // Log the mutual likes data
      return data.mutualLikes; // Return the mutual likes data
    } catch (error) {
      console.error("Error fetching mutual likes:", error);
      throw error; // Re-throw the error for further handling if needed
    }
  };
  useEffect(() => {
    const fetchRecommendations = async () => {
      console.log("[Fetching] Requesting recommendations for:", email);
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
          console.log(`HTTP error! status: ${res.status}`);
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setRecommendations(data.recommendations);
      } catch (error: any) {
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
        {/* Full image background */}
        <Image source={{ uri: card.photo }} style={styles.image} />

        {/* Overlay for texts */}
        <View style={styles.overlayContainer}>
          <ScrollView contentContainerStyle={styles.textContent}>
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

            <Text style={styles.bio}>{card.bio}</Text>
          </ScrollView>
        </View>
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
    <LinearGradient colors={["#8B5CF6", "#6D28D9"]} style={styles.gradient}>
      <View style={styles.container}>
        <Swiper
          cards={recommendations}
          renderCard={renderCard}
          onSwiped={(cardIndex: number) => console.log(cardIndex)}
          onSwipedAll={() => console.log("onSwipedAll")}
          cardIndex={0}
          backgroundColor={"transparent"}
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
    width: width * 0.95, // Make the card larger
    height: height * 0.85, // Increase card height
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
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover", // Ensure the image covers the whole card
  },
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end", // Align the text overlay to the bottom
    backgroundColor: "rgba(0, 0, 0, 0.1)", // Black overlay
  },
  textContent: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff", // White text over the black overlay
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
    color: "#fff", // White text
  },
  bio: {
    fontSize: 16,
    marginTop: 10,
    color: "#fff", // White text
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#F87171",
    fontSize: 18,
  },
});
