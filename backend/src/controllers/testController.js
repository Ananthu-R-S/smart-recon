export const getTest = (req, res) => {
  res.send("✅ Server running on port " + process.env.PORT);
};