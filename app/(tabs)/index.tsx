import { Loader } from "@/components/Loader";
import Post from "@/components/Post";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../../styles/feed.styles";
import StoriesSection from "@/components/Stories";
import { useState } from "react";

export default function Index() {
  const { signOut } = useAuth();
  const [reFreshing, setRefreshing] = useState(false);

  const posts = useQuery(api.posts.getFeedPosts);

  if (posts === undefined) return <Loader />;
  if (posts.length === 0) return <NoPostsFound />

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };
  
  return (
    <View
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connect</Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <Post post={item} />
        )}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={<StoriesSection />}
        refreshControl={
          <RefreshControl
            refreshing={reFreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      />

    </View>
  );
}


const NoPostsFound = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: COLORS.background,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Text style={{ color: COLORS.primary, fontSize: 20 }}>No posts found</Text>
  </View>
);


