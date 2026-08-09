import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlatformBranding,
  getPlatformSettings,
  updatePlatformSettings,
  type GeneralSettings,
  type SecuritySettings,
} from "@/lib/api/settings";

export function usePlatformSettingsQuery() {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: getPlatformSettings,
  });
}

export function useUpdatePlatformSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<{ general: Partial<GeneralSettings>; security: Partial<SecuritySettings> }>) =>
      updatePlatformSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      // The login page's branding read is the same "general" row.
      queryClient.invalidateQueries({ queryKey: ["platform-branding"] });
    },
  });
}

/** No `enabled`/auth gating needed — PlatformBrandingView is a public
 * endpoint the login page calls before anyone is signed in. */
export function usePlatformBrandingQuery() {
  return useQuery({
    queryKey: ["platform-branding"],
    queryFn: getPlatformBranding,
    staleTime: 5 * 60 * 1000,
  });
}
