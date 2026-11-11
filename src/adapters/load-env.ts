// Loads ./.env into process.env before anything else reads configuration.
// Variables that are already set in the environment win over the file.
try {
  process.loadEnvFile(".env");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
