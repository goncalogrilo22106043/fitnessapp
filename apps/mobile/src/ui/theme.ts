export const colors = {
  background: "#F7F3EA",
  surface: "#FFFFFF",
  ink: "#23302E",
  muted: "#6E746F",
  line: "#DED8CC",
  sage: "#6F8F72",
  coral: "#D9745B",
  oat: "#ECE1CF",
  blue: "#547AA5"
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
};

export const radius = {
  sm: 6,
  md: 8
};

export const typography = {
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    letterSpacing: 0,
    lineHeight: 38
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 0
  },
  body: {
    fontSize: 15,
    lineHeight: 21
  }
};

export const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  color: (opacity = 1) => `rgba(84, 122, 165, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(35, 48, 46, ${opacity})`,
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
