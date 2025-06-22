import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../../styles/feed.styles";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { STORIES } from "@/constants/mock-data";
import Story from "@/components/Story";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { Loader } from "@/components/Loader"
import Post from "@/components/Post";

export default function Index() {
  const { signOut } = useAuth();

  const posts = useQuery(api.posts.getFeedPosts);

  if (posts === undefined) return <Loader />;

  if (posts.length === 0) return <NoPostsFound />
  
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

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* STORIES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.storiesContainer}
        >
          {STORIES.map((story) => (
            <Story
              key={story.id}
              story={story}
            />
          ))}
        </ScrollView>

        {posts.map((post) => (
          <Post 
            key={post._id}
            post={post}
          />
        ))}
      </ScrollView>
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


