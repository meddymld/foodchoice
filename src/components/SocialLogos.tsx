import InstagramSvg from "../../assets/social/instagram.svg";
import LinkSvg from "../../assets/social/link.svg";
import TikTokSvg from "../../assets/social/tiktok.svg";

type SocialLogoProps = {
  size?: number;
};

const socialLogoDefaults = {
  size: 25
};

// Logos sociaux servis depuis assets/social/*.svg pour rester faciles a remplacer.
export function InstagramLogo({ size = socialLogoDefaults.size }: SocialLogoProps) {
  return <InstagramSvg width={size} height={size} />;
}

export function TikTokLogo({ size = socialLogoDefaults.size }: SocialLogoProps) {
  return <TikTokSvg width={size} height={size} />;
}

export function LinkLogo({ size = 17 }: SocialLogoProps) {
  return <LinkSvg width={size} height={size} />;
}
