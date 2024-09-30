import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MediaTypeOptions, launchImageLibraryAsync } from "expo-image-picker";
import { useAtom } from "jotai";
import { bioAtom, nameAtom } from "@/lib/atom";
import { router } from "expo-router";

export default (): JSX.Element => {
  const [name, setName] = useAtom<string>(nameAtom);
  const [bio, setBio] = useAtom<string>(bioAtom);
  const [images, setImages] = useState<string[]>([]);

  // Validation states
  const [nameError, setNameError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleImageUpload = async () => {
    if (images.length >= 4) return; // Max 4 images

    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleDeleteImage = (index: number) => {
    setImages(images.filter((_: string, i: number): boolean => i !== index));
  };

  const validateFields = (): boolean => {
    let valid = true;

    // Name validation
    if (!name || name.trim() === "") {
      setNameError("Name is required.");
      valid = false;
    } else {
      setNameError(null);
    }

    // Bio validation (must be at least 20 characters)
    if (!bio || bio.trim().length < 20) {
      setBioError("Bio must be at least 20 characters.");
      valid = false;
    } else {
      setBioError(null);
    }

    // Image validation (must upload at least 1 image)
    if (images.length === 0) {
      setImageError("Please upload at least one image.");
      valid = false;
    } else {
      setImageError(null);
    }

    return valid;
  };

  const handleSubmit = () => {
    if (validateFields()) {
      router.replace("/(onboarding)/gender");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Your Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#A78BFA"
      />
      {nameError && <Text style={styles.errorText}>{nameError}</Text>}

      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Tell us about yourself..."
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        placeholderTextColor="#A78BFA"
      />
      {bioError && <Text style={styles.errorText}>{bioError}</Text>}

      {/* Image Upload Section */}
      <View style={styles.imagesContainer}>
        {images.map(
          (image: string, index: number): JSX.Element => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteImage(index)}
              >
                <Text style={styles.deleteText}>X</Text>
              </TouchableOpacity>
            </View>
          ),
        )}
        {images.length < 4 && (
          <TouchableOpacity
            style={styles.imageUpload}
            onPress={handleImageUpload}
          >
            <Text style={styles.uploadText}>Upload Image</Text>
          </TouchableOpacity>
        )}
      </View>
      {imageError && <Text style={styles.errorText}>{imageError}</Text>}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B5CF6",
    textAlign: "center",
    marginTop: 100,
    marginBottom: 60,
  },
  input: {
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: "#8B5CF6",
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  imageWrapper: {
    position: "relative",
    width: "48%",
    height: 150,
    marginBottom: 16,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  deleteButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 4,
    borderRadius: 20,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
  imageUpload: {
    width: "48%",
    height: 150,
    borderWidth: 2,
    borderColor: "#8B5CF6",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    color: "#8B5CF6",
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 40,
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#8B5CF6",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
