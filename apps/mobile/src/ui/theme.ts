export const colors = {
  background: "#F7F5F0",
  backgroundSoft: "#FBFAF7",
  surface: "#FFFFFF",
  surfaceWarm: "#FFFCF6",
  ink: "#17201D",
  inkSoft: "#2F3A36",
  muted: "#737A75",
  subtle: "#9EA49F",
  line: "#E6E0D6",
  lineStrong: "#D4CDC1",
  sage: "#6D8C72",
  sageSoft: "#E8F0E7",
  coral: "#D66F55",
  coralSoft: "#F8E4DD",
  oat: "#EFE7DA",
  oatSoft: "#F6EFE4",
  blue: "#496F9B",
  blueSoft: "#E5EDF6",
  gold: "#B88B3D",
  goldSoft: "#F4EBD8",
  success: "#4F8A64",
  warning: "#B8793A",
  danger: "#C65F4B",
  shadow: "#1D2420"
};

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 40
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 18,
  xl: 24,
  pill: 999
};

export const typography = {
  eyebrow: {
    fontSize: 12,
    fontWeight: "800" as const,
    letterSpacing: 0,
    textTransform: "uppercase" as const
  },
  title: {
    fontSize: 34,
    fontWeight: "800" as const,
    letterSpacing: 0,
    lineHeight: 39
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: 0,
    lineHeight: 34
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800" as const,
    letterSpacing: 0
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800" as const,
    letterSpacing: 0,
    lineHeight: 23
  },
  body: {
    fontSize: 15,
    lineHeight: 21
  },
  caption: {
    fontSize: 12,
    lineHeight: 17
  }
};

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2
  }
};

export const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  color: (opacity = 1) => `rgba(73, 111, 155, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(23, 32, 29, ${opacity})`,
  decimalPlaces: 0,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: colors.blue
  },
  propsForBackgroundLines: {
    stroke: colors.line
  }
};
