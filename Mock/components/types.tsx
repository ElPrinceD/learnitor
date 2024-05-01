export type RootParamList = {
  Verification: {
    email: string;
  };
  TabLayout: {
    user: string;
  };
} & Record<string, any>;
