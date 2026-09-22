import type { ReactNode } from 'react';
import { CommunityAuthProvider } from './features/community/auth-context';
import LegacySlugStorageMigration from './components/common/LegacySlugStorageMigration';
import {
  BannerProvider,
  CharacterOwnershipProvider,
  CharacterSkinProvider,
  FavoriteIllustrationsProvider,
  GradientThemeProvider,
  LocaleProvider,
  NavLayoutProvider,
  ResourcesProvider,
  TierListReferenceProvider,
  UiOpacityProvider,
} from './contexts';

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CommunityAuthProvider>
      <LocaleProvider>
        <LegacySlugStorageMigration />
        <ResourcesProvider>
          <TierListReferenceProvider>
            <GradientThemeProvider>
              <UiOpacityProvider>
                <FavoriteIllustrationsProvider>
                  <BannerProvider>
                    <CharacterSkinProvider>
                      <CharacterOwnershipProvider>
                        <NavLayoutProvider>{children}</NavLayoutProvider>
                      </CharacterOwnershipProvider>
                    </CharacterSkinProvider>
                  </BannerProvider>
                </FavoriteIllustrationsProvider>
              </UiOpacityProvider>
            </GradientThemeProvider>
          </TierListReferenceProvider>
        </ResourcesProvider>
      </LocaleProvider>
    </CommunityAuthProvider>
  );
}
