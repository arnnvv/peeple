import { emailAtom } from "@/lib/atom";
import { useAtomValue } from "jotai";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";

const { width } = Dimensions.get("window");

interface Profile {
  id: string;
  name: string;
  email: string;
  location: string;
  gender: string;
  relationshiptype: string;
  height: number;
  religion: string;
  occupationField: string;
  occupationArea: string;
  drink: string;
  smoke: string;
  bio: string;
  date: number;
  month: number;
  year: number;
  subscription: string;
  instaId: string;
  phone: string;
  image: string;
}

const SWIPE_THRESHOLD = 120;
const TOP_MARGIN = 100;

const calculateAge = (day: number, month: number, year: number): number => {
  const today = new Date();
  const birthDate = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript Date object
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
};

export default (): JSX.Element => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const email = useAtomValue(emailAtom);
  const position = useRef(
    new Animated.ValueXY({ x: 0, y: TOP_MARGIN }),
  ).current;

  useEffect(() => {
    (async () => {
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

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        const recommendations = data.recommendations;
        console.log("Recommendations:", recommendations);
        console.log(recommendations[0].image);
        setProfiles(recommendations);

        return recommendations;
      } catch (error) {
        throw error;
      }
    })();
  }, []);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (): true => true,
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        const newPositionY = gestureState.dx * 0.2;
        position.setValue({ x: gestureState.dx, y: newPositionY + TOP_MARGIN });
      },
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: width + 100, y: TOP_MARGIN },
      duration: 250,
      useNativeDriver: false,
    }).start(() => removeProfile());
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -width - 100, y: TOP_MARGIN },
      duration: 250,
      useNativeDriver: false,
    }).start(() => removeProfile());
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: TOP_MARGIN },
      useNativeDriver: false,
    }).start();
  };

  const removeProfile = () => {
    setProfiles((prevProfiles: Profile[]): Profile[] => {
      if (prevProfiles.length <= 1) {
        return []; // No more profiles to show
      }
      return prevProfiles.slice(1);
    });
    position.setValue({ x: 0, y: TOP_MARGIN });
  };

  const handleLike = (profileId: any) => {
    //@ts-expect-error: W T F
    setLikedProfiles((prev) => [...prev, profileId]);
  };

  const renderCard = (profile: Profile, index: number): JSX.Element | null => {
    if (index >= 2) return null;

    const isFirst = index === 0;
    const panHandlers = isFirst ? panResponder.panHandlers : {};
    const cardStyle = isFirst
      ? {
          ...position.getLayout(),
          transform: [
            {
              rotate: position.x.interpolate({
                inputRange: [-width / 2, width / 2],
                outputRange: ["-10deg", "10deg"],
                extrapolate: "clamp",
              }),
            },
          ],
          zIndex: profiles.length - index,
        }
      : {
          zIndex: profiles.length - index,
        };

    const additionalDetails = [
      { icon: "🍷", label: "Drinks", value: profile.drink },
      { icon: "🚬", label: "Smokes", value: profile.smoke },
      { icon: "🙏", label: "Religion", value: profile.religion },
      { icon: "💑", label: "Looking for", value: profile.relationshiptype },
    ];

    return (
      <Animated.View
        key={profile.id}
        style={[styles.card, cardStyle]}
        {...panHandlers}
      >
        <ScrollView>
          <Image source={{ uri: profile.image }} style={styles.image} />
          <View style={styles.cardContent}>
            <Text style={styles.name}>
              {profile.name},{" "}
              {calculateAge(profile.date, profile.month, profile.year)}
            </Text>
            <Text style={styles.location}>{profile.location}</Text>
            <Text style={styles.bio}>{profile.bio}</Text>

            {/*@ts-expect-error: W T F*/}
            {likedProfiles.includes(profile.id) && (
              <Text style={styles.likedMessage}>
                {profile.name} has liked your profile
              </Text>
            )}

            <View style={styles.additionalDetails}>
              {additionalDetails.map(
                (
                  detail: { icon: string; label: string; value: any },
                  i: number,
                ): JSX.Element | null =>
                  detail.value ? (
                    <View key={i} style={styles.detailItem}>
                      <Text style={styles.detailIcon}>{detail.icon}</Text>
                      <Text style={styles.detailLabel}>{detail.label}:</Text>
                      <Text style={styles.detailValue}>{detail.value}</Text>
                    </View>
                  ) : null,
              )}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Peeple</Text>
      </View>

      {profiles.map((profile: Profile, index: number): JSX.Element | null =>
        renderCard(profile, index),
      )}

      <Animated.View
        style={[
          styles.crossIconContainer,
          {
            left: position.x.interpolate({
              inputRange: [-width, 0],
              outputRange: [20, -100],
              extrapolate: "clamp",
            }),
            opacity: position.x.interpolate({
              inputRange: [-width, -50],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
        <Text style={styles.crossIcon}>X</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.heartIconContainer,
          {
            right: position.x.interpolate({
              inputRange: [0, width],
              outputRange: [-100, 20],
              extrapolate: "clamp",
            }),
            opacity: position.x.interpolate({
              inputRange: [50, width],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
        <TouchableOpacity onPress={() => handleLike(profiles[0].id)}>
          <Text style={styles.heartIcon}>❤</Text>
        </TouchableOpacity>
      </Animated.View>

      {profiles.length === 0 && (
        <View style={styles.noProfilesContainer}>
          <Text style={styles.noProfilesText}>
            That's all folks! No more profiles to explore.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    marginTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  card: {
    position: "absolute",
    top: TOP_MARGIN,
    left: 0,
    right: 0,
    bottom: 5,
    marginHorizontal: "5%",
    borderRadius: 20,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    width: "90%",
    height: "85%",
  },
  image: {
    width: "100%",
    height: 400,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    resizeMode: "cover",
    alignSelf: "flex-start",
  },
  cardContent: {
    padding: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3748",
  },
  location: {
    fontSize: 16,
    color: "#718096",
    marginTop: 3,
  },
  bio: {
    fontSize: 14,
    color: "#4A5568",
    marginTop: 5,
  },
  likedMessage: {
    fontSize: 14,
    color: "red",
    marginTop: 5,
    fontStyle: "italic",
  },
  additionalDetails: {
    marginTop: 10,
  },
  noProfilesContainer: {
    position: "absolute",
    top: "35%",
    left: "20%", // Center horizontally
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 10,
    height: 250, // Increased height for the card
    shadowColor: "#000", // Shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.3, // Shadow opacity
    shadowRadius: 4, // Shadow blur radius
    zIndex: 100,
    width: "60%", // Set width for the card
    maxWidth: 400, // Optional: max width for larger screens, // Center vertically
  },
  noProfilesText: {
    fontSize: 24, // Normal size for visibility
    fontWeight: "normal", // Normal weight for text
    color: "#8B5CF6",
    textAlign: "center",
    fontFamily: "Arial", // Normal font for better readability
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4A5568",
  },
  detailValue: {
    fontSize: 14,
    color: "#2D3748",
    marginLeft: 5,
  },
  crossIconContainer: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -30 }],
    zIndex: 100,
  },
  heartIconContainer: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -30 }],
    zIndex: 100,
  },
  crossIcon: {
    fontSize: 60,
    color: "#FF5252",
  },
  heartIcon: {
    fontSize: 60,
    color: "#4CAF50",
  },
});
