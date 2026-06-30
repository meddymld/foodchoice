import { Pressable, View } from "react-native";

import { Restaurant } from "../types";
import { styles } from "../styles/appStyles";
import { InstagramLogo, TikTokLogo } from "./SocialLogos";

type RestaurantSocialLinksProps = {
  restaurant: Pick<Restaurant, "instagram" | "tikTok">;
  onOpenUrl: (url: string) => void;
};

// Affiche uniquement les reseaux vraiment renseignes dans les donnees restaurant.
export function RestaurantSocialLinks({
  restaurant,
  onOpenUrl
}: RestaurantSocialLinksProps) {
  if (!restaurant.instagram && !restaurant.tikTok) {
    return null;
  }

  return (
    <View style={styles.detailSocialLinks}>
      {restaurant.instagram && (
        <Pressable
          style={styles.detailSocialButton}
          onPress={() => onOpenUrl(restaurant.instagram!)}
          accessibilityRole="link"
          accessibilityLabel="Ouvrir Instagram"
        >
          <InstagramLogo />
        </Pressable>
      )}
      {restaurant.tikTok && (
        <Pressable
          style={styles.detailSocialButton}
          onPress={() => onOpenUrl(restaurant.tikTok!)}
          accessibilityRole="link"
          accessibilityLabel="Ouvrir TikTok"
        >
          <TikTokLogo />
        </Pressable>
      )}
    </View>
  );
}
