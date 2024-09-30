import { emailAtom } from "@/lib/atom";
import { userExists } from "@/lib/checkUser";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useSetAtom } from "jotai";

export default async () => {
  const { isLoaded, user, isSignedIn } = useUser();
  const setEmail = useSetAtom(emailAtom);
  if (!isLoaded) {
    console.log("not loaded");
    return;
  }
  if (!isSignedIn) {
    console.log("not signed In");
    return;
  }
  const email = user?.emailAddresses[0].emailAddress;
  console.log(user);
  if (email) {
    const exists = await userExists(email);
    if (exists === true) {
      router.replace("/(tabs)/homeScreen");
      //chk if name exists
    } else if (exists === false) {
      setEmail(email);
      router.replace("/(onboarding)/moreyoushare");
    }
  }
};
