import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { imageAspect } from './imageAspect';
import type { Media } from './posts';
import type { Theme } from './theme';

// All of a post's photos and videos, stacked, each at its own shape.
export function PostMedia({ media, theme }: { media: Media[]; theme: Theme }) {
  if (media.length === 0) return null;
  return (
    <View style={styles.list}>
      {media.map((m, i) =>
        m.type === 'photo' ? (
          <PostImage key={i} item={m} theme={theme} />
        ) : (
          <PostVideo key={i} item={m} theme={theme} />
        ),
      )}
    </View>
  );
}

function PostImage({ item, theme }: { item: Extract<Media, { type: 'photo' }>; theme: Theme }) {
  const [aspect, setAspect] = useState(imageAspect(item.width, item.height));
  return (
    <Image
      source={{ uri: item.url }}
      style={[styles.box, { aspectRatio: aspect, backgroundColor: theme.line }]}
      contentFit="contain"
      onLoad={(e) => setAspect(imageAspect(e.source.width, e.source.height))}
      accessible={false}
    />
  );
}

// Shows the thumbnail until tapped, so no video player exists for rows nobody plays.
function PostVideo({ item, theme }: { item: Extract<Media, { type: 'video' }>; theme: Theme }) {
  const [playing, setPlaying] = useState(false);
  const aspect = imageAspect(item.width, item.height);
  if (playing) return <InlineVideo url={item.url} loop={item.loop} aspect={aspect} />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Play video"
      onPress={() => setPlaying(true)}
      style={[styles.box, { aspectRatio: aspect, backgroundColor: theme.line }]}
    >
      {item.thumb ? <Image source={{ uri: item.thumb }} style={StyleSheet.absoluteFill} contentFit="contain" /> : null}
      <View style={styles.playWrap}>
        <View style={styles.play}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>
    </Pressable>
  );
}

function InlineVideo({ url, loop, aspect }: { url: string; loop: boolean; aspect: number }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = loop;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={[styles.box, styles.video, { aspectRatio: aspect }]}
      contentFit="contain"
      nativeControls
      fullscreenOptions={{ enable: true }}
    />
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 10, gap: 6 },
  box: { width: '100%', borderRadius: 10, overflow: 'hidden' },
  video: { backgroundColor: '#000' },
  playWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  play: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: 22, marginLeft: 4 },
});
