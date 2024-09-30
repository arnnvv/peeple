import { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAtom } from "jotai";
import { bioAtom, nameAtom } from "@/lib/atom";
import { router } from "expo-router";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Colored console logging function
const logWithColor = (message: string, color: string = "\x1b[37m") => {
  console.log(`${color}%s\x1b[0m`, message);
};

const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});

const uploadImageToS3 = async (username: string, imageUri: string, imageNumber: number) => {
  const filename = `${username}-${imageNumber}.jpeg`;
  logWithColor(`Uploading image: ${filename}`, "\x1b[34m"); // Blue

  async function getObjectURL(key: any) {
    const command = new GetObjectCommand({
      Bucket: "peeple",
      Key: key
    });

    const url = await getSignedUrl(s3, command);
    return url;
  }


  const command = new PutObjectCommand({
    Bucket: "peeple",
    Key: `uploads/${filename}`,
    ContentType: "image/jpeg",
  });

  // Generate a signed URL for uploading
  const uploadUrl = await getSignedUrl(s3, command);
  logWithColor(`Signed URL for uploading: ${uploadUrl}`, "\x1b[35m"); // Magenta

  // Fetch image as blob
  const response = await fetch(imageUri);
  const blob = await response.blob();

  // Make the PUT request to upload the image using the signed URL
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: {
      "Content-Type": "image/jpeg",
    },
  });

  if (uploadResponse.ok) {
    logWithColor(`Image uploaded successfully: ${filename}`, "\x1b[32m"); // Green
  } else {
    logWithColor(`Failed to upload image: ${filename}`, "\x1b[31m"); // Red
    throw new Error("Image upload failed");
  }

  // Once the upload is successful, return the S3 file URL for viewing
  const url = await getObjectURL(`uploads/${filename}`);
  logWithColor(`Uploaded image URL: ${url}`, "\x1b[35m"); // Magenta
  return { filename, url };
};


export default (): JSX.Element => {
  const [name, setName] = useAtom<string>(nameAtom);
  const [bio, setBio] = useAtom<string>(bioAtom);
  const [images, setImages] = useState<string[]>([]);

  // Validation states
  const [nameError, setNameError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserEmail = async () => {
      const token = await AsyncStorage.getItem("token");
      logWithColor(`Token: ${token}`, "\x1b[33m"); // Yellow
      const response = await fetch(`${process.env.EXPO_PUBLIC_API}/verify-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        logWithColor(`User email: ${data.email}`, "\x1b[32m"); // Green
      } else {
        logWithColor(`Error: ${data.error}`, "\x1b[31m"); // Red
      }
    };

    fetchUserEmail();
  }, []);

  const handleImageUpload = async () => {
    logWithColor("Opening image picker", "\x1b[36m"); // Cyan
    if (images.length >= 4) {
      logWithColor("Max 4 images reached", "\x1b[33m"); // Yellow
      return;
    }

    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const newImageUri = result.assets[0].uri;
      logWithColor(`Image URI: ${newImageUri}`, "\x1b[34m"); // Blue
      setImages([...images, newImageUri]);
    }
  };

  const handleDeleteImage = (index: number) => {
    logWithColor(`Deleting image at index: ${index}`, "\x1b[31m"); // Red
    setImages(images.filter((_, i) => i !== index));
  };

  const validateFields = (): boolean => {
    let valid = true;

    logWithColor("Validating fields...", "\x1b[36m"); // Cyan

    if (!name || name.trim() === "") {
      setNameError("Name is required.");
      logWithColor("Name validation failed", "\x1b[31m"); // Red
      valid = false;
    } else {
      setNameError(null);
    }

    if (!bio || bio.trim().length < 20) {
      setBioError("Bio must be at least 20 characters.");
      logWithColor("Bio validation failed", "\x1b[31m"); // Red
      valid = false;
    } else {
      setBioError(null);
    }

    if (images.length === 0) {
      setImageError("Please upload at least one image.");
      logWithColor("Image validation failed", "\x1b[31m"); // Red
      valid = false;
    } else {
      setImageError(null);
    }

    logWithColor(`Validation result: ${valid}`, "\x1b[36m"); // Cyan
    return valid;
  };

  const handleSubmit = async () => {
    if (validateFields()) {
      logWithColor("Validation passed. Proceeding with submission.", "\x1b[32m"); // Green
      for (let i = 0; i < images.length; i++) {
        const { filename, url } = await uploadImageToS3(name, images[i], i + 1);

        logWithColor(`Posting image ${filename} to server`, "\x1b[34m"); // Blue

        await fetch(`${process.env.EXPO_PUBLIC_API}/profile-images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "user@example.com", // Replace with actual user email
            url,
            imageName: filename,
            imageNo: i + 1,
          }),
        });
      }

      router.replace("/(onboarding)/gender");
    } else {
      logWithColor("Validation failed. Not submitting.", "\x1b[31m"); // Red
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
        {images.map((image: string, index: number): JSX.Element => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.uploadedImage} />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteImage(index)}
            >
              <Text style={styles.deleteText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 4 && (
          <TouchableOpacity style={styles.imageUpload} onPress={handleImageUpload}>
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
