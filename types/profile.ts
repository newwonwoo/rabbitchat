export type ChildProfile = {
  name: string;
  ageMonths?: number;
  preferredStoryIds: string[];
  // First-launch onboarding completion
  onboardedAt: string | null;
};
