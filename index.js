const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(
  cors({
    origin: "https://mentalhealthnetwork.netlify.app",
    methods: "GET,POST,PUT,DELETE",
  })
);
app.use(bodyParser.json());

// Helper function to read and write data
const getData = () => JSON.parse(fs.readFileSync("data.json", "utf-8"));
const saveData = (data) =>
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
// Routes
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const data = getData();
  if (data.users.some((user) => user.email === email)) {
    return res.status(400).json({ message: "Email already registered!" });
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    role: "user", // Default role for all new users
  };
  data.users.push(newUser);
  saveData(data);

  res.status(201).json({ message: "User registered successfully!" });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const data = getData();
  const user = data.users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password!" });
  }

  res.status(200).json({ message: "Login successful!", user });
});

// Initialize admin user if not exists
function initializeAdmin() {
  const data = getData();
  if (!data.users.some((user) => user.role === "admin")) {
    const adminUser = {
      id: Date.now(),
      name: "Admin",
      email: "admin@example.com",
      password: "admin123", // In a real app, this should be hashed
      role: "admin",
    };
    data.users.push(adminUser);
    saveData(data);
    console.log("Admin user initialized");
  }
}

// Get all users
app.get("/users", (req, res) => {
  const data = getData();
  res.json(data.users);
});

// Get all blog posts
app.get("/blog-posts", (req, res) => {
  const data = getData();
  res.json(data.blogPosts || []);
});
app.delete("/users/:id", (req, res) => {
  const data = getData();
  const updatedUsers = data.users.filter(
    (user) => user.id !== parseInt(req.params.id)
  );
  data.users = updatedUsers;
  saveData(data);
  res.status(204).send();
});

// Add a new blog post
app.post("/blog-posts", (req, res) => {
  const { title, content, author, date } = req.body;

  if (!title || !content || !author || !date) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const data = getData();
  const newPost = {
    id: Date.now(),
    title,
    content,
    author,
    date,
  };

  // Ensure blogPosts array exists
  if (!data.blogPosts) {
    data.blogPosts = [];
  }

  data.blogPosts.push(newPost);
  saveData(data);

  res.status(201).json({ message: "Blog post created successfully!" });
});
// Delete a blog post
app.delete("/blog-posts/:id", (req, res) => {
  const data = getData();
  const postId = parseInt(req.params.id);

  if (!data.blogPosts) {
    return res.status(404).json({ message: "No blog posts found!" });
  }

  const updatedPosts = data.blogPosts.filter((post) => post.id !== postId);

  if (updatedPosts.length === data.blogPosts.length) {
    return res.status(404).json({ message: "Blog post not found!" });
  }

  data.blogPosts = updatedPosts;
  saveData(data);

  res.status(200).json({ message: "Blog post deleted successfully!" });
});

initializeAdmin();

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
