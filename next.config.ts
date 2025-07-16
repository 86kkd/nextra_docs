import nextra from "nextra";

// Set up Nextra with its configuration
const withNextra = nextra({
  defaultShowCopyCode: true,
  unstable_shouldAddLocaleToLinks: true,
});

// Export the final Next.js config with Nextra included
export default withNextra({
  reactStrictMode: true,
});
