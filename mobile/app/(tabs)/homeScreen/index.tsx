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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated"; // For animations

const { width, height } = Dimensions.get("window");

export default (): JSX.Element => {
  const email = useAtomValue(emailAtom);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allProfilesSwiped, setAllProfilesSwiped] = useState(false);
  const heartOpacity = useSharedValue(0); // To control the heart's visibility

  useEffect(() => {
    (async (): Promise<void> => {
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

        const likesRes = await fetch(
          `${process.env.EXPO_PUBLIC_API}/get-likes-received`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }), // Assuming you send the user's email to get their received likes
          },
        );

        if (!likesRes.ok) {
          console.log(`\x1b[31m[Error] HTTP error! status: ${likesRes.status}`);
          throw new Error(`HTTP error! status: ${likesRes.status}`);
        }

        const likesData = await likesRes.json();
        const likedEmails = likesData.likedBy || []; // Get the emails of users who liked the current user

        // Prioritize recommendations: those who liked you first
        const prioritizedRecommendations = [
          ...recommendations.filter((rec: any) =>
            likedEmails.includes(rec.email),
          ), // Show who liked you first
          ...recommendations.filter(
            (rec: any) => !likedEmails.includes(rec.email),
          ), // Then show others
        ];

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
    })();
  }, [email]);

  // Trigger heart animation on right swipe
  const handleSwipeRight = async (likedEmail: string) => {
    heartOpacity.value = 1; // Show heart
    heartOpacity.value = withTiming(0, { duration: 500 }); // Fade out heart after 500ms
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API}/add-like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          likerEmail: email,
          likedEmail,
        }),
      });

      // Check if the response is successful
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("Like added successfully:", data);
    } catch (error) {
      console.error("Error adding like:", error);
    }
  };

  // Animated heart style
  const heartStyle = useAnimatedStyle(
    (): { opacity: number; transform: { scale: 1 | 1.5 }[] } => {
      return {
        opacity: heartOpacity.value,
        transform: [{ scale: withTiming(heartOpacity.value === 1 ? 1.5 : 1) }],
      };
    },
  );

  const renderCard = (card: any): JSX.Element | null => {
    if (!card) return null;

    // Use real place text instead of coordinates, if available
    const parsedLocation = JSON.parse(card.location || "{}").coords || {};
    const locationText = "Unknown location"; // Placeholder for real location text

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
          {card.occupationField && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color="#34D399" />
              <Text style={styles.infoText}>
                {card.occupationField} - {card.occupationArea}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#F87171" />
            <Text style={styles.infoText}>
              {locationText} {/* Display geocoded location here */}
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
          <Text style={styles.bio} numberOfLines={4} ellipsizeMode="tail">
            {card.bio}
          </Text>
        </ScrollView>
      </Animated.View>
    );
  };

  const renderNoMoreCards = (): JSX.Element => {
    return (
      <View style={styles.noMoreCardsContainer}>
        <Text style={styles.noMoreCardsText}>
          🎉 All profiles are swiped! 🎉
        </Text>
        <Text style={styles.noMoreCardsSubText}>
          Come back later for more recommendations.
        </Text>
        <Ionicons name="happy-outline" size={50} color="#8B5CF6" />
      </View>
    );
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );

  if (error)
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );

  const onSwipedRight = (cardIndex: any) => {
    //@ts-expect-error: W T F
    const likedEmail = recommendations[cardIndex].email; // Get the liked user's email from the recommendations array
    handleSwipeRight(likedEmail); // Call handleSwipeRight with the liked email
  };

  return (
    <View style={styles.container}>
      <Swiper
        cards={recommendations}
        renderCard={renderCard}
        onSwipedRight={onSwipedRight} // Handle swipe right
        onSwiped={(cardIndex: number) => console.log(cardIndex)}
        onSwipedAll={() => {
          console.log("onSwipedAll");
          setAllProfilesSwiped(true);
        }}
        cardIndex={0}
        backgroundColor={"#F3E8FF"}
        stackSize={3}
        verticalSwipe={false}
        showSecondCard={true}
      />
      {allProfilesSwiped && renderNoMoreCards()}

      {/* Animated heart */}
      <Animated.View style={[styles.heart, heartStyle]}>
        <Ionicons name="heart" size={100} color="#F472B6" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#8B5CF6", // Purple background
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: width * 0.9,
    height: height * 0.87,
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
    borderColor: "#8B5CF6", // Purple border
    borderWidth: 1,
  },
  image: {
    width: "100%",
    height: "65%", // Increased from 50% to 55%
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "white", // White background inside card
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
  },
  noMoreCardsContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  noMoreCardsText: {
    fontSize: 20,
    color: "#374151", // Gray
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  noMoreCardsSubText: {
    fontSize: 16,
    color: "#6B7280", // Lighter gray
    textAlign: "center",
  },
  heart: {
    position: "absolute",
    top: height / 2 - 100, // Center the heart vertically
    left: width / 2 - 50, // Center the heart horizontally
  },
});
