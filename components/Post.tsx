import { View, Text, TouchableOpacity } from 'react-native'
import { styles } from '@/styles/feed.styles'
import { Link } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'

// todo: fix the type of post
export default function Post({post}: { post: any }) {
  return (
    <View style={styles.post}>
      {/* POST HEADER */}

      <View style={styles.postHeader}>
        <Link href={"/(tabs)/notifications"}>
          <TouchableOpacity style={styles.postHeaderLeft}>
            <Image
              source={post.author.image}
              style={styles.postAvatar}
              contentFit="cover" 
              transition={200}
              cachePolicy="memory-disk"
            />
            <Text style={styles.postUsername}>
              {post.author.username}
            </Text>
          </TouchableOpacity>
        </Link>

        {/* todo: fix it later */}
        {/* <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.white} />
        </TouchableOpacity> */}

        <TouchableOpacity>
          <Ionicons name="trash-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* POST IMAGE */}
      <Image
        source={post.image}
        style={styles.postImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />

      {/* POST ACTIONS */}

      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
        <TouchableOpacity>
          <Ionicons name="heart-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* POST INFO */}
      <View style={styles.postInfo}>
        <Text style={styles.likesText}>
          Be first to like this post
        </Text>
        { post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>
              {post.author.username}
            </Text>
              <Text style={styles.captionText}>{post.caption}</Text>
          </View>
        )}
      </View>
    </View>
  )
}