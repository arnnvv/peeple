import { useState, useRef } from "react";
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
  id: number;
  name: string;
  age: number;
  location: string;
  bio: string;
  photos: string[];
  workplace: string;
  college: string;
  drink: string;
  smoke: string;
  religion: string;
  relationshipType: string;
}

const fakeProfiles: Profile[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    age: 28,
    location: "New York, NY",
    bio: "Adventure seeker and coffee enthusiast. Let's explore the city together!",
    photos: [
      "https://images.unsplash.com/photo-1515202913167-d9a698095ebf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjN8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvPjv1lHEIpzgDk_e3Sm-e4EVOzggYdb5aHA&s",
    ],
    workplace: "Creative Agency",
    college: "NYU",
    drink: "Socially",
    smoke: "No",
    religion: "Spiritual",
    relationshipType: "Looking for relationship",
  },
  {
    id: 2,
    name: "Mike Chen",
    age: 32,
    location: "San Francisco, CA",
    bio: "Tech geek by day, foodie by night. Always up for trying new restaurants!",
    photos: [
      "https://plus.unsplash.com/premium_photo-1679750867619-6f6e57fc8762?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjV8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D",
      "/api/placeholder/400/600?text=Mike2",
    ],
    workplace: "Tech Startup",
    college: "Stanford",
    drink: "Occasionally",
    smoke: "No",
    religion: "Agnostic",
    relationshipType: "Casual dating",
  },
  {
    id: 3,
    name: "Emma Thompson",
    age: 25,
    location: "Austin, TX",
    bio: "Music lover and outdoor enthusiast. Let's jam and hike together!",
    photos: [
      "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjJ8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc4OF5kmXwED6vNEFhNx6INslf8KxsFQ2LrA&s",
    ],
    workplace: "Music Venue",
    college: "UT Austin",
    drink: "Yes",
    smoke: "No",
    religion: "Christian",
    relationshipType: "Looking for adventure",
  },
  {
    id: 4,
    name: "David Kim",
    age: 29,
    location: "Seattle, WA",
    bio: "Coffee connoisseur and board game aficionado. Let's brew some coffee and play!",
    photos: [
      "https://plus.unsplash.com/premium_photo-1673866484792-c5a36a6c025e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSH30Lu5Wavq9g5qFkFeh3FhxH9YdJ4PZb6ww&s",
    ],
    workplace: "Board Game Café",
    college: "UW",
    drink: "Moderately",
    smoke: "No",
    religion: "Buddhist",
    relationshipType: "Serious relationship",
  },
  {
    id: 5,
    name: "Olivia Martinez",
    age: 27,
    location: "Chicago, IL",
    bio: "Foodie and art lover. Let's discover new restaurants and galleries!",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTR8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxiYtu7-oGNy_DZIKWXV0G9Y43N9EY1t68Og&s",
    ],
    workplace: "Art Gallery",
    college: "DePaul University",
    drink: "Yes",
    smoke: "No",
    religion: "Spiritual",
    relationshipType: "Looking for fun",
  },
  {
    id: 6,
    name: "Liam Smith",
    age: 30,
    location: "Miami, FL",
    bio: "Beach lover and fitness enthusiast. Let's hit the gym and the waves!",
    photos: [
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTV8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeA5s85L7z5Ra0FSQs8V66D15Wm0ptzPhgLg&s",
    ],
    workplace: "Gym",
    college: "FIU",
    drink: "Occasionally",
    smoke: "No",
    religion: "Agnostic",
    relationshipType: "Looking for fitness partner",
  },
];

const SWIPE_THRESHOLD = 120;
const TOP_MARGIN = 100;

export default (): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profiles, setProfiles] = useState(fakeProfiles);
  const [likedProfiles, setLikedProfiles] = useState<number[]>([1]);
  const [noMoreProfiles, setNoMoreProfiles] = useState(false); // New state for no profiles
  const position = useRef(
    new Animated.ValueXY({ x: 0, y: TOP_MARGIN }),
  ).current;

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

  const handleLike = (profileId: number) => {
    setLikedProfiles((prev: number[]): number[] => [...prev, profileId]);
  };

  const renderCard = (profile: any, index: any): JSX.Element | null => {
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
      { icon: "💑", label: "Looking for", value: profile.relationshipType },
    ];

    return (
      <Animated.View
        key={profile.id}
        style={[styles.card, cardStyle]}
        {...panHandlers}
      >
        <ScrollView>
          <Image source={{ uri: profile.photos[0] }} style={styles.image} />
          <View style={styles.cardContent}>
            <Text style={styles.name}>
              {profile.name}, {profile.age}
            </Text>
            <Text style={styles.location}>{profile.location}</Text>
            <Text style={styles.bio}>{profile.bio}</Text>

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
