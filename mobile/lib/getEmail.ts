import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@clerk/clerk-expo";

export const getEmail = async (): Promise<string> => {
  const { user } = useUser();
  if (Platform.OS === "ios") {
    const token = AsyncStorage.getItem("token");
    const res = await fetch("http://10.61.39.212:3000/verify-token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const email = data.email.email as string;
      return email;
    } else {
      const error = await res.json();
      throw new Error(error);
    }
  } else if (Platform.OS === "android") {
    const email = user?.emailAddresses[0].emailAddress;
    if (email) return email;
    else throw new Error("Clerk dosen't return token");
  } else {
    throw new Error("OS not Supported");
  }
};
