import { COLORS } from "@/constants/theme";
import { styles } from "@/styles/auth.styles";
import { useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function Login() {

  const {startSSOFlow} = useSSO();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const {createdSessionId, setActive} = await startSSOFlow({
        strategy: "oauth_google"
      });

      if (setActive && createdSessionId) {
        // Set the active session with the created session ID
        setActive({session:createdSessionId});
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Google Sign In Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* BRAND SECTION */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.appName}>connect</Text>
        <Text style={styles.tagline}>don't miss anything</Text>
      </View>

      {/* ILLUSTRATION */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require("@/assets/images/authimg1.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* LOGIN SECTION */}
      <View style={styles.loginSection}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          activeOpacity={0.9}
        >
          <View style={styles.googleIconContainer}>
            <Ionicons name="logo-google" size={20} color={COLORS.surface} />
          </View>
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By signing in, you agree to our Terms of Service Privacy Policy
        </Text>
      </View>
    </View>
  );
}
